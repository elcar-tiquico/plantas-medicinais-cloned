# D:\Elcar\Projecto\backend\admin_auth.py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API de Autenticação e Gerenciamento de Usuários - VERSÃO CORRIGIDA
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
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001'])

# Configurações
SECRET_KEY = os.environ.get('SECRET_KEY', 'plantas-medicinais-secret-key-2025')
JWT_EXPIRATION_HOURS = 24

# Configuração do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'database': 'plantas_medicinais',
    'user': 'root',
    'password': '',
    'charset': 'utf8mb4',
    'autocommit': True
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
    if len(password) < 6:
        return False, "Senha deve ter pelo menos 6 caracteres"
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
        'nome': user_data['nome_completo'],
        'perfil': user_data.get('nome_perfil', 'Usuario'),
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

def init_database():
    """Inicializa perfis padrão e usuário admin"""
    connection = get_db_connection()
    if not connection:
        return
    
    try:
        cursor = connection.cursor()
        
        # Verificar se as tabelas existem
        cursor.execute("SHOW TABLES LIKE 'perfil_usuario'")
        if not cursor.fetchone():
            # Criar tabela perfil_usuario se não existir
            cursor.execute("""
                CREATE TABLE perfil_usuario (
                    id_perfil INT AUTO_INCREMENT PRIMARY KEY,
                    nome_perfil VARCHAR(50) NOT NULL UNIQUE,
                    descricao TEXT
                )
            """)
        
        cursor.execute("SHOW TABLES LIKE 'usuario'")
        if not cursor.fetchone():
            # Criar tabela usuario se não existir
            cursor.execute("""
                CREATE TABLE usuario (
                    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                    nome_completo VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    senha_hash VARCHAR(255) NOT NULL,
                    id_perfil INT DEFAULT 4,
                    ativo BOOLEAN DEFAULT TRUE,
                    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ultimo_login TIMESTAMP NULL,
                    FOREIGN KEY (id_perfil) REFERENCES perfil_usuario(id_perfil)
                )
            """)
        
        # Criar perfil Administrador com ID=1 se não existir
        cursor.execute("SELECT id_perfil FROM perfil_usuario WHERE id_perfil = 1")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO perfil_usuario (id_perfil, nome_perfil, descricao) 
                VALUES (1, 'Administrador', 'Administrador do sistema com acesso total')
            """)
        
        # Criar perfil Usuario com ID=4 se não existir
        cursor.execute("SELECT id_perfil FROM perfil_usuario WHERE id_perfil = 4")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO perfil_usuario (id_perfil, nome_perfil, descricao) 
                VALUES (4, 'Usuario', 'Usuário padrão do sistema')
            """)
        
        connection.commit()
        print("Perfis inicializados: 1=Administrador, 4=Usuario")
        
    except Error as e:
        print(f"Erro ao inicializar sistema: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Endpoint de autenticação - CORRIGIDO"""
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
        
        # Buscar usuário - CORRIGIDO: busca sem filtrar por ativo primeiro
        query = """
        SELECT u.id_usuario, u.nome_completo, u.email, u.senha_hash, u.ativo,
               CASE 
                   WHEN u.id_perfil = 1 THEN 'Administrador'
                   WHEN u.id_perfil = 4 THEN 'Usuario'
                   ELSE COALESCE(p.nome_perfil, 'Usuario')
               END as nome_perfil
        FROM usuario u
        LEFT JOIN perfil_usuario p ON u.id_perfil = p.id_perfil
        WHERE u.email = %s
        """
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # CORRIGIDO: Verificar se usuário está ativo ANTES da senha
        if not user['ativo']:
            return jsonify({'error': 'Sua conta está desativada. Entre em contato com o administrador.'}), 401
        
        # Verificar senha
        if not verify_password(password, user['senha_hash']):
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Atualizar último login
        cursor.execute("""
            UPDATE usuario SET ultimo_login = NOW() WHERE id_usuario = %s
        """, (user['id_usuario'],))
        
        # Gerar token
        token = generate_token(user)
        
        # Resposta limpa
        user_response = {
            'id_usuario': user['id_usuario'],
            'nome_completo': user['nome_completo'],
            'email': user['email'],
            'perfil': user['nome_perfil'],
            'ativo': user['ativo']
        }
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'token': token,
            'user': user_response
        }), 200
        
    except Exception as e:
        print(f"Erro no login: {e}")
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
            'nome_completo': request.current_user['nome'],
            'email': request.current_user['email'],
            'perfil': request.current_user['perfil'],
            'ativo': True
        }
    }), 200

@app.route('/api/users', methods=['GET'])
@require_auth
def get_users():
    """Lista usuários - apenas para administradores"""
    try:
        # Verificar se é administrador
        if request.current_user['perfil'] != 'Administrador':
            return jsonify({'error': 'Acesso negado'}), 403
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '').strip()
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Query base
        base_query = """
        SELECT u.id_usuario, u.nome_completo, u.email, u.ativo, u.data_registro, u.ultimo_login,
               CASE 
                   WHEN u.id_perfil = 1 THEN 'Administrador'
                   WHEN u.id_perfil = 4 THEN 'Usuario'
                   ELSE COALESCE(p.nome_perfil, 'Usuario')
               END as perfil
        FROM usuario u
        LEFT JOIN perfil_usuario p ON u.id_perfil = p.id_perfil
        """
        
        # Aplicar filtro de busca
        if search:
            base_query += " WHERE u.nome_completo LIKE %s OR u.email LIKE %s"
            search_param = f"%{search}%"
            search_params = (search_param, search_param)
        else:
            search_params = ()
        
        # Contar total
        count_query = f"SELECT COUNT(*) as total FROM ({base_query}) as counted"
        cursor.execute(count_query, search_params)
        total = cursor.fetchone()['total']
        
        # Aplicar paginação
        offset = (page - 1) * per_page
        paginated_query = f"{base_query} ORDER BY u.data_registro DESC LIMIT {per_page} OFFSET {offset}"
        cursor.execute(paginated_query, search_params)
        
        users = cursor.fetchall()
        
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
def create_user():
    """Cria novo usuário - apenas para administradores"""
    connection = None
    try:
        # Verificar se é administrador
        if request.current_user['perfil'] != 'Administrador':
            return jsonify({'error': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        nome_completo = data.get('nome_completo', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        ativo = data.get('ativo', True)
        perfil = data.get('perfil', 'Usuario')
        
        # Validações
        if not nome_completo or not email or not password:
            return jsonify({'error': 'Nome, email e senha são obrigatórios'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Formato de email inválido'}), 400
        
        password_valid, password_msg = validate_password(password)
        if not password_valid:
            return jsonify({'error': password_msg}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Erro de conexão com banco de dados'}), 500
            
        cursor = connection.cursor()
        
        # Verificar se email já existe
        cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email já está em uso'}), 409
        
        # CORRIGIDO: Mapear perfil para ID correto
        perfil_id_map = {
            'Administrador': 1,
            'Admin': 1,
            'Usuario': 4,
            'User': 4
        }
        
        perfil_id = perfil_id_map.get(perfil, 4)
        
        # Criar usuário
        password_hash = hash_password(password)
        cursor.execute("""
            INSERT INTO usuario (nome_completo, email, senha_hash, id_perfil, ativo) 
            VALUES (%s, %s, %s, %s, %s)
        """, (nome_completo, email, password_hash, perfil_id, ativo))
        
        user_id = cursor.lastrowid
        connection.commit()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Erro ao criar usuário: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@require_auth
def update_user(user_id):
    """Atualiza dados do usuário - CORRIGIDO para suportar alteração de perfil"""
    try:
        data = request.get_json()
        
        # Verificar se é administrador ou o próprio usuário
        if request.current_user['perfil'] != 'Administrador' and request.current_user['user_id'] != user_id:
            return jsonify({'error': 'Acesso negado'}), 403
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Verificar se usuário existe
        cursor.execute("SELECT * FROM usuario WHERE id_usuario = %s", (user_id,))
        existing_user = cursor.fetchone()
        if not existing_user:
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
        
        if 'ativo' in data:
            # Apenas administradores podem alterar status ativo
            if request.current_user['perfil'] != 'Administrador':
                return jsonify({'error': 'Apenas administradores podem alterar status de ativação'}), 403
            
            update_fields.append('ativo = %s')
            update_values.append(data['ativo'])
        
        # CORRIGIDO: Suporte para alteração de perfil
        if 'perfil' in data:
            # Apenas administradores podem alterar perfil
            if request.current_user['perfil'] != 'Administrador':
                return jsonify({'error': 'Apenas administradores podem alterar perfil'}), 403
            
            # Mapear perfil para ID correto
            perfil_id_map = {
                'Administrador': 1,
                'Admin': 1,
                'Usuario': 4,
                'User': 4
            }
            
            perfil_id = perfil_id_map.get(data['perfil'], 4)
            update_fields.append('id_perfil = %s')
            update_values.append(perfil_id)
        
        if 'password' in data and data['password']:
            password_valid, password_msg = validate_password(data['password'])
            if not password_valid:
                return jsonify({'error': password_msg}), 400
            
            password_hash = hash_password(data['password'])
            update_fields.append('senha_hash = %s')
            update_values.append(password_hash)
        
        if not update_fields:
            return jsonify({'error': 'Nenhum campo para atualizar'}), 400
        
        # Atualizar usuário
        update_values.append(user_id)
        update_query = f"UPDATE usuario SET {', '.join(update_fields)} WHERE id_usuario = %s"
        cursor.execute(update_query, update_values)
        connection.commit()
        
        return jsonify({'message': 'Usuário atualizado com sucesso'}), 200
        
    except Exception as e:
        print(f"Erro ao atualizar usuário: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@require_auth
def delete_user(user_id):
    """Remove usuário - apenas para administradores"""
    try:
        # Verificar se é administrador
        if request.current_user['perfil'] != 'Administrador':
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Não permitir deletar o próprio usuário
        if user_id == request.current_user['user_id']:
            return jsonify({'error': 'Não é possível deletar sua própria conta'}), 400
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Verificar se usuário existe
        cursor.execute("SELECT id_usuario FROM usuario WHERE id_usuario = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Deletar usuário
        cursor.execute("DELETE FROM usuario WHERE id_usuario = %s", (user_id,))
        connection.commit()
        
        return jsonify({'message': 'Usuário removido com sucesso'}), 200
        
    except Exception as e:
        print(f"Erro ao deletar usuário: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/dashboard/stats', methods=['GET'])
@require_auth
def get_dashboard_stats():
    """Estatísticas do dashboard"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Contar usuários
        cursor.execute("SELECT COUNT(*) as total FROM usuario WHERE ativo = true")
        users_count = cursor.fetchone()['total']
        
        # Contar plantas (se tabela existir)
        try:
            cursor.execute("SELECT COUNT(*) as total FROM planta")
            plants_count = cursor.fetchone()['total']
        except:
            plants_count = 0
        
        # Contar famílias (se tabela existir)
        try:
            cursor.execute("SELECT COUNT(*) as total FROM familia")
            families_count = cursor.fetchone()['total']
        except:
            families_count = 0
        
        return jsonify({
            'users': users_count,
            'plants': plants_count,
            'families': families_count,
            'status': 'online'
        }), 200
        
    except Exception as e:
        print(f"Erro ao buscar estatísticas: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/init-admin', methods=['POST'])
def init_admin():
    """Endpoint para criar usuário Admin temporário - APENAS PARA TESTES"""
    connection = None
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Erro de conexão com banco de dados'}), 500
            
        cursor = connection.cursor()
        
        # Verificar se já existe um admin (id_perfil = 1)
        cursor.execute("SELECT id_usuario, email FROM usuario WHERE id_perfil = 1")
        existing_admin = cursor.fetchone()
        
        if existing_admin:
            return jsonify({
                'message': 'Já existe um usuário Administrador no sistema',
                'existing_admin': existing_admin[1]
            }), 200
        
        # Criar usuário Admin temporário
        admin_email = 'admin@test.com'
        admin_password = 'admin123'
        admin_name = 'Admin Temporário'
        
        # Verificar se email já existe
        cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s", (admin_email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email admin@test.com já existe'}), 409
        
        # Criar usuário com id_perfil = 1 (Administrador)
        password_hash = hash_password(admin_password)
        cursor.execute("""
            INSERT INTO usuario (nome_completo, email, senha_hash, id_perfil, ativo) 
            VALUES (%s, %s, %s, 1, %s)
        """, (admin_name, admin_email, password_hash, True))
        
        user_id = cursor.lastrowid
        connection.commit()
        
        return jsonify({
            'message': 'Usuário Admin temporário criado com sucesso',
            'credentials': {
                'email': admin_email,
                'password': admin_password,
                'nome': admin_name,
                'perfil': 'Administrador'
            },
            'user_id': user_id,
            'warning': 'Este é um usuário temporário para testes. Exclua após usar!'
        }), 201
        
    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Erro ao criar admin temporário: {e}")
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    print("Inicializando API de Autenticação...")
    init_database()
    print("Servidor rodando na porta 5003")
    print("Endpoints disponíveis:")
    print("- POST /api/auth/login")
    print("- GET /api/auth/verify")
    print("- GET /api/users")
    print("- POST /api/users")
    print("- PUT /api/users/<id>")
    print("- DELETE /api/users/<id>")
    print("- GET /api/dashboard/stats")
    app.run(host='0.0.0.0', port=5003, debug=True)