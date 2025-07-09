#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API de Autenticação e Gerenciamento de Usuários
Sistema de Plantas Medicinais - Porta 5003
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import bcrypt
import jwt
import uuid
from datetime import datetime, timedelta
import re
import os
from functools import wraps
import json

app = Flask(__name__)
CORS(app)

# Configurações
SECRET_KEY = os.environ.get('SECRET_KEY', 'plantas-medicinais-secret-key-2025')
JWT_EXPIRATION_HOURS = 24
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30

# Configuração do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'database': 'plantas_medicinais',
    'user': 'root',
    'password': '',
    'charset': 'utf8mb4'
}

def get_db_connection():
    """Estabelece conexão com o banco de dados"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Erro ao conectar ao MySQL: {e}")
        return None

def validate_email(email):
    """Valida formato do email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valida força da senha"""
    if len(password) < 3:  # Ajustado para desenvolvimento
        return False, "Senha deve ter pelo menos 3 caracteres"
    return True, "Senha válida"

def hash_password(password):
    """Gera hash da senha"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    """Verifica senha contra hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_data):
    """Gera JWT token"""
    payload = {
        'user_id': user_data['id_usuario'],
        'email': user_data['email'],
        'perfil': user_data['nome_perfil'],
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verifica e decodifica JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def log_user_action(user_id, action, description, table_affected=None, record_id=None, 
                   old_data=None, new_data=None, ip_address=None, user_agent=None):
    """Registra ação do usuário no log"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        query = """
        INSERT INTO log_acoes_usuario 
        (id_usuario, acao, descricao, tabela_afetada, id_registro_afetado, 
         dados_anteriores, dados_novos, ip_origem, user_agent)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        old_json = json.dumps(old_data, default=str) if old_data else None
        new_json = json.dumps(new_data, default=str) if new_data else None
        
        cursor.execute(query, (user_id, action, description, table_affected, 
                              record_id, old_json, new_json, ip_address, user_agent))
        connection.commit()
        return True
    except Error as e:
        print(f"Erro ao registrar log: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def require_auth(f):
    """Decorator para rotas que requerem autenticação"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token de acesso requerido'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token inválido ou expirado'}), 401
        
        request.current_user = payload
        return f(*args, **kwargs)
    
    return decorated_function

def require_admin(f):
    """Decorator para rotas que requerem perfil de administrador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.current_user.get('perfil') != 'Administrador':
            return jsonify({'error': 'Acesso negado. Perfil de administrador requerido.'}), 403
        return f(*args, **kwargs)
    
    return decorated_function

# Função para criar usuário admin se não existir
def create_default_admin():
    """Cria usuário administrador padrão se não existir"""
    connection = get_db_connection()
    if not connection:
        return
    
    try:
        cursor = connection.cursor()
        
        # Verificar se admin já existe
        cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s", ('admin@plantasmedicinais.mz',))
        if cursor.fetchone():
            return
        
        # Verificar se perfil Administrador existe
        cursor.execute("SELECT id_perfil FROM perfil_usuario WHERE nome_perfil = %s", ('Administrador',))
        perfil_result = cursor.fetchone()
        
        if not perfil_result:
            # Criar perfil Administrador
            cursor.execute("""
                INSERT INTO perfil_usuario (nome_perfil, descricao) 
                VALUES (%s, %s)
            """, ('Administrador', 'Acesso completo ao sistema'))
            perfil_id = cursor.lastrowid
        else:
            perfil_id = perfil_result[0]
        
        # Criar usuário admin
        password_hash = hash_password('admin123')
        cursor.execute("""
            INSERT INTO usuario (nome_completo, email, senha_hash, id_perfil) 
            VALUES (%s, %s, %s, %s)
        """, ('Administrador do Sistema', 'admin@plantasmedicinais.mz', password_hash, perfil_id))
        
        connection.commit()
        print("Usuário administrador padrão criado com sucesso")
        
    except Error as e:
        print(f"Erro ao criar usuário admin padrão: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Endpoint de autenticação"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Formato de email inválido'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Erro de conexão com banco de dados'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # Buscar usuário completo
        query = """
        SELECT u.*, p.nome_perfil, p.ativo as perfil_ativo,
               CASE 
                   WHEN u.bloqueado_ate IS NOT NULL AND u.bloqueado_ate > NOW() 
                   THEN true 
                   ELSE false 
               END as esta_bloqueado
        FROM usuario u
        INNER JOIN perfil_usuario p ON u.id_perfil = p.id_perfil
        WHERE u.email = %s AND u.ativo = true AND p.ativo = true
        """
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Verificar se usuário está bloqueado
        if user['esta_bloqueado']:
            return jsonify({'error': 'Conta temporariamente bloqueada. Tente novamente mais tarde.'}), 423
        
        # Verificar senha
        if not verify_password(password, user['senha_hash']):
            # Incrementar tentativas de login
            cursor.execute("""
                UPDATE usuario 
                SET tentativas_login = tentativas_login + 1,
                    bloqueado_ate = CASE 
                        WHEN tentativas_login + 1 >= %s 
                        THEN DATE_ADD(NOW(), INTERVAL %s MINUTE)
                        ELSE bloqueado_ate 
                    END
                WHERE id_usuario = %s
            """, (MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES, user['id_usuario']))
            connection.commit()
            
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Login bem-sucedido - resetar tentativas e atualizar último login
        session_id = str(uuid.uuid4())
        token = generate_token(user)
        
        cursor.execute("""
            UPDATE usuario 
            SET ultimo_login = NOW(), tentativas_login = 0, bloqueado_ate = NULL
            WHERE id_usuario = %s
        """, (user['id_usuario'],))
        
        # Salvar sessão
        cursor.execute("""
            INSERT INTO sessao_usuario 
            (id_sessao, id_usuario, token_acesso, ip_origem, user_agent, data_expiracao)
            VALUES (%s, %s, %s, %s, %s, DATE_ADD(NOW(), INTERVAL %s HOUR))
        """, (session_id, user['id_usuario'], token, 
              request.remote_addr, request.headers.get('User-Agent'), JWT_EXPIRATION_HOURS))
        
        connection.commit()
        
        # Log da ação
        log_user_action(
            user['id_usuario'], 'LOGIN', 'Login realizado com sucesso',
            ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent')
        )
        
        # Remover dados sensíveis da resposta
        user_response = {
            'id_usuario': user['id_usuario'],
            'nome_completo': user['nome_completo'],
            'email': user['email'],
            'perfil': user['nome_perfil'],
            'ultimo_login': user['ultimo_login'].isoformat() if user['ultimo_login'] else None
        }
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'token': token,
            'user': user_response,
            'session_id': session_id
        }), 200
        
    except Error as e:
        print(f"Erro no login: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Endpoint de logout"""
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id')
        
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            
            # Desativar sessão
            if session_id:
                cursor.execute("""
                    UPDATE sessao_usuario 
                    SET ativo = false 
                    WHERE id_sessao = %s AND id_usuario = %s
                """, (session_id, request.current_user['user_id']))
            
            connection.commit()
            
            # Log da ação
            log_user_action(
                request.current_user['user_id'], 'LOGOUT', 'Logout realizado',
                ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent')
            )
        
        return jsonify({'message': 'Logout realizado com sucesso'}), 200
        
    except Exception as e:
        print(f"Erro no logout: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/auth/verify', methods=['GET'])
@require_auth
def verify_auth():
    """Verifica se o token ainda é válido"""
    return jsonify({
        'valid': True,
        'user': {
            'id_usuario': request.current_user['user_id'],
            'email': request.current_user['email'],
            'perfil': request.current_user['perfil']
        }
    }), 200

@app.route('/api/users', methods=['GET'])
@require_auth
def get_users():
    """Lista todos os usuários (requer autenticação)"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '').strip()
        
        offset = (page - 1) * per_page
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Query base
        base_query = """
        FROM usuario u
        INNER JOIN perfil_usuario p ON u.id_perfil = p.id_perfil
        WHERE (u.nome_completo LIKE %s OR u.email LIKE %s)
        """
        
        search_param = f"%{search}%"
        
        # Contar total
        count_query = "SELECT COUNT(*) as total " + base_query
        cursor.execute(count_query, (search_param, search_param))
        total = cursor.fetchone()['total']
        
        # Buscar usuários
        users_query = """
        SELECT u.id_usuario, u.nome_completo, u.email, p.nome_perfil as perfil, 
               u.ativo, u.ultimo_login, u.data_registro,
               CASE 
                   WHEN u.bloqueado_ate IS NOT NULL AND u.bloqueado_ate > NOW() 
                   THEN true 
                   ELSE false 
               END as esta_bloqueado
        """ + base_query + " ORDER BY u.data_registro DESC LIMIT %s OFFSET %s"
        
        cursor.execute(users_query, (search_param, search_param, per_page, offset))
        users = cursor.fetchall()
        
        # Converter datetime para string
        for user in users:
            if user['ultimo_login']:
                user['ultimo_login'] = user['ultimo_login'].isoformat()
            if user['data_registro']:
                user['data_registro'] = user['data_registro'].isoformat()
        
        return jsonify({
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        print(f"Erro ao buscar usuários: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/users', methods=['POST'])
@require_auth
@require_admin
def create_user():
    """Cria novo usuário (apenas administradores)"""
    try:
        data = request.get_json()
        
        # Validações
        required_fields = ['nome_completo', 'email', 'password', 'id_perfil']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo obrigatório: {field}'}), 400
        
        email = data['email'].strip().lower()
        if not validate_email(email):
            return jsonify({'error': 'Formato de email inválido'}), 400
        
        password_valid, password_msg = validate_password(data['password'])
        if not password_valid:
            return jsonify({'error': password_msg}), 400
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Verificar se email já existe
        cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email já está em uso'}), 409
        
        # Verificar se perfil existe e está ativo
        cursor.execute("SELECT * FROM perfil_usuario WHERE id_perfil = %s AND ativo = true", 
                      (data['id_perfil'],))
        perfil = cursor.fetchone()
        if not perfil:
            return jsonify({'error': 'Perfil inválido ou inativo'}), 400
        
        # Criar usuário
        password_hash = hash_password(data['password'])
        
        cursor.execute("""
            INSERT INTO usuario 
            (nome_completo, email, senha_hash, id_perfil, ativo, criado_por)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (data['nome_completo'], email, password_hash, data['id_perfil'], 
              data.get('ativo', True), request.current_user['user_id']))
        
        new_user_id = cursor.lastrowid
        connection.commit()
        
        # Log da ação
        log_user_action(
            request.current_user['user_id'], 'CREATE_USER', 
            f'Usuário criado: {data["nome_completo"]} ({email})',
            'usuario', new_user_id, None, {
                'nome_completo': data['nome_completo'],
                'email': email,
                'perfil': perfil['nome_perfil']
            },
            request.remote_addr, request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user_id': new_user_id
        }), 201
        
    except Error as e:
        print(f"Erro ao criar usuário: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/profiles', methods=['GET'])
@require_auth
def get_profiles():
    """Lista perfis de usuário disponíveis"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id_perfil, nome_perfil, descricao, ativo 
            FROM perfil_usuario 
            WHERE ativo = true 
            ORDER BY nome_perfil
        """)
        profiles = cursor.fetchall()
        
        return jsonify({'profiles': profiles}), 200
        
    except Exception as e:
        print(f"Erro ao buscar perfis: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@require_auth
@require_admin
def update_user(user_id):
    """Atualiza dados do usuário"""
    try:
        data = request.get_json()
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Buscar usuário atual
        cursor.execute("""
            SELECT u.*, p.nome_perfil 
            FROM usuario u 
            INNER JOIN perfil_usuario p ON u.id_perfil = p.id_perfil 
            WHERE u.id_usuario = %s
        """, (user_id,))
        current_user = cursor.fetchone()
        if not current_user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Preparar campos para atualização
        update_fields = []
        update_values = []
        
        if 'nome_completo' in data:
            update_fields.append('nome_completo = %s')
            update_values.append(data['nome_completo'])
        
        if 'email' in data:
            email = data['email'].strip().lower()
            if not validate_email(email):
                return jsonify({'error': 'Formato de email inválido'}), 400
            
            # Verificar se email já existe (exceto o próprio usuário)
            cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s AND id_usuario != %s", 
                          (email, user_id))
            if cursor.fetchone():
                return jsonify({'error': 'Email já está em uso'}), 409
            
            update_fields.append('email = %s')
            update_values.append(email)
        
        if 'id_perfil' in data:
            cursor.execute("SELECT * FROM perfil_usuario WHERE id_perfil = %s AND ativo = true", 
                          (data['id_perfil'],))
            if not cursor.fetchone():
                return jsonify({'error': 'Perfil inválido ou inativo'}), 400
            
            update_fields.append('id_perfil = %s')
            update_values.append(data['id_perfil'])
        
        if 'ativo' in data:
            update_fields.append('ativo = %s')
            update_values.append(data['ativo'])
        
        if 'password' in data and data['password']:
            password_valid, password_msg = validate_password(data['password'])
            if not password_valid:
                return jsonify({'error': password_msg}), 400
            
            password_hash = hash_password(data['password'])
            update_fields.append('senha_hash = %s')
            update_values.append(password_hash)
        
        if not update_fields:
            return jsonify({'error': 'Nenhum campo para atualizar'}), 400
        
        # Adicionar campos de auditoria
        update_fields.append('atualizado_por = %s')
        update_values.append(request.current_user['user_id'])
        
        # Atualizar usuário
        update_values.append(user_id)
        update_query = f"UPDATE usuario SET {', '.join(update_fields)} WHERE id_usuario = %s"
        cursor.execute(update_query, update_values)
        connection.commit()
        
        # Log da ação
        log_user_action(
            request.current_user['user_id'], 'UPDATE_USER', 
            f'Usuário atualizado: {current_user["nome_completo"]}',
            'usuario', user_id, None, data,
            request.remote_addr, request.headers.get('User-Agent')
        )
        
        return jsonify({'message': 'Usuário atualizado com sucesso'}), 200
        
    except Exception as e:
        print(f"Erro ao atualizar usuário: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/dashboard/stats', methods=['GET'])
@require_auth
def get_dashboard_stats():
    """Retorna estatísticas para o dashboard"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Estatísticas de plantas
        cursor.execute("SELECT COUNT(*) as total FROM planta")
        total_plantas = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM familia")
        total_familias = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM autor")
        total_autores = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM provincia")
        total_provincias = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM referencia")
        total_referencias = cursor.fetchone()['total']
        
        # Estatísticas de usuários
        cursor.execute("SELECT COUNT(*) as total FROM usuario WHERE ativo = true")
        usuarios_ativos = cursor.fetchone()['total']
        
        cursor.execute("""
            SELECT COUNT(*) as total FROM usuario 
            WHERE bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW()
        """)
        usuarios_bloqueados = cursor.fetchone()['total']
        
        cursor.execute("""
            SELECT COUNT(*) as total FROM sessao_usuario 
            WHERE ativo = true AND data_expiracao > NOW()
        """)
        sessoes_ativas = cursor.fetchone()['total']
        
        stats = {
            'total_plantas': total_plantas,
            'total_familias': total_familias,
            'total_autores': total_autores,
            'total_provincias': total_provincias,
            'total_referencias': total_referencias,
            'usuarios_ativos': usuarios_ativos,
            'usuarios_bloqueados': usuarios_bloqueados,
            'sessoes_ativas': sessoes_ativas
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        print(f"Erro ao buscar estatísticas: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    # Criar usuário admin padrão ao iniciar
    # create_default_admin()
    
    print("=== API de Usuários - Sistema de Plantas Medicinais ===")
    print("Porta: 5001")
    print("Usuário padrão: admin@plantasmedicinais.mz")
    print("Senha padrão: admin123")
    print("===============================================")
    
    app.run(host='0.0.0.0', port=5003, debug=True)