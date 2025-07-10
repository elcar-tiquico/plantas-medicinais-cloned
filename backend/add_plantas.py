#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Flask para Wizard de Criação de Plantas Medicinais
Porta: 5002 (integração com APIs existentes 5000/5001)
"""

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text  # IMPORTANTE: para queries SQL brutas
import os
import uuid
import logging
from datetime import datetime, timedelta
import base64
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads', 'plantas_imagens')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Flask
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

# Configuração da base de dados (usando a mesma BD das outras APIs)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 'mysql+pymysql://root:@localhost/plantas_medicinais'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar extensões
db = SQLAlchemy(app)

# CORS configurado para integrar com Next.js
CORS(app, origins=[
    'http://localhost:3000',  # Next.js dev
    'http://localhost:3001',  # Next.js alternativo
    'http://localhost:5000',  # API principal
    'http://localhost:5001'   # API admin
])

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================================================
# MODELOS SQLALCHEMY (CONFORME SUA BD EXISTENTE)
# =====================================================

class Familia(db.Model):
    __tablename__ = 'familia'
    id_familia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_familia = db.Column(db.String(100), nullable=False)
    
    plantas = db.relationship('Planta', backref='familia', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id_familia,
            'label': self.nome_familia,
            'value': self.id_familia
        }

class Planta(db.Model):
    __tablename__ = 'planta'
    id_planta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_familia = db.Column(db.Integer, db.ForeignKey('familia.id_familia'), nullable=False)
    nome_cientifico = db.Column(db.String(150), nullable=False)
    numero_exsicata = db.Column(db.String(50))
    data_adicao = db.Column(db.DateTime, default=datetime.utcnow)
    
    nomes_comuns = db.relationship('NomeComum', backref='planta', lazy=True, cascade="all, delete-orphan")
    usos_planta = db.relationship('UsoPlanta', backref='planta', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=False):
        data = {
            'id_planta': self.id_planta,
            'nome_cientifico': self.nome_cientifico,
            'numero_exsicata': self.numero_exsicata,
            'id_familia': self.id_familia,
            'familia': self.familia.nome_familia if self.familia else None,
            'nomes_comuns': [nc.nome_comum_planta for nc in self.nomes_comuns],
            'data_adicao': self.data_adicao.isoformat() if self.data_adicao else None
        }
        
        if include_relations:
            data.update({
                'autores': [autor.to_dict() for autor in self.autores],
                'provincias': [provincia.to_dict() for provincia in self.provincias],
                'propriedades': [prop.to_dict() for prop in self.propriedades],
                'compostos': [comp.to_dict() for comp in self.compostos],
                'referencias': [ref.to_dict() for ref in self.referencias],
                'usos': [uso.to_dict_detailed() for uso in self.usos_planta]
            })
        
        return data

class NomeComum(db.Model):
    __tablename__ = 'nome_comum'
    id_nome = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), nullable=False)
    nome_comum_planta = db.Column(db.String(150), nullable=False)

class Provincia(db.Model):
    __tablename__ = 'provincia'
    id_provincia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_provincia = db.Column(db.String(100), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id_provincia,
            'label': self.nome_provincia,
            'value': self.id_provincia
        }

class ParteUsada(db.Model):
    __tablename__ = 'parte_usada'
    id_uso = db.Column(db.Integer, primary_key=True, autoincrement=True)
    parte_usada = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id': self.id_uso,
            'label': self.parte_usada,
            'value': self.id_uso
        }

class Indicacao(db.Model):
    __tablename__ = 'indicacao'
    id_indicacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id_indicacao,
            'label': self.descricao,
            'value': self.id_indicacao
        }

class MetodoPreparacaoTradicional(db.Model):
    __tablename__ = 'metodo_preparacao_tradicional'
    id_preparacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id_preparacao,
            'label': self.descricao,
            'value': self.id_preparacao
        }

class MetodoExtracao(db.Model):
    __tablename__ = 'metodo_extraccao'
    id_extraccao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id_extraccao,
            'label': self.descricao,
            'value': self.id_extraccao
        }

class PropriedadeFarmacologica(db.Model):
    __tablename__ = 'propriedade_farmacologica'
    id_propriedade = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id_propriedade,
            'label': self.descricao,
            'value': self.id_propriedade
        }

class ComposicaoQuimica(db.Model):
    __tablename__ = 'composicao_quimica'
    id_composto = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_composto = db.Column(db.String(150))
    
    def to_dict(self):
        return {
            'id': self.id_composto,
            'label': self.nome_composto,
            'value': self.id_composto
        }

class Autor(db.Model):
    __tablename__ = 'autor'
    id_autor = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_autor = db.Column(db.String(150))
    afiliacao = db.Column(db.String(150))
    sigla_afiliacao = db.Column(db.String(50))
    
    def to_dict(self):
        return {
            'id': self.id_autor,
            'label': f"{self.nome_autor} ({self.afiliacao or 'Sem afiliação'})",
            'value': self.id_autor,
            'nome': self.nome_autor,
            'afiliacao': self.afiliacao,
            'sigla_afiliacao': self.sigla_afiliacao
        }

class Referencia(db.Model):
    __tablename__ = 'referencia'
    id_referencia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    link_referencia = db.Column(db.Text, nullable=False)
    tipo_referencia = db.Column(db.Enum('URL', 'Artigo', 'Livro', 'Tese'), nullable=True)
    titulo_referencia = db.Column(db.Text, nullable=True)
    ano = db.Column(db.String(4), nullable=True)
    
    def to_dict(self):
        # Buscar autores da referência ordenados
        autores_refs = AutorReferencia.query.filter_by(
            id_referencia=self.id_referencia
        ).order_by(AutorReferencia.ordem_autor).all()
        
        autores = []
        for ar in autores_refs:
            autores.append({
                'id_autor': ar.autor.id_autor,
                'nome_autor': ar.autor.nome_autor,
                'afiliacao': ar.autor.afiliacao,
                'sigla_afiliacao': ar.autor.sigla_afiliacao,
                'ordem_autor': ar.ordem_autor,
                'papel': ar.papel
            })
        
        return {
            'id': self.id_referencia,
            'label': self.titulo_referencia or self.link_referencia[:50] + '...' if self.link_referencia else f'Referência {self.id_referencia}',
            'value': self.id_referencia,
            'titulo': self.titulo_referencia,
            'link': self.link_referencia,
            'tipo': self.tipo_referencia,
            'ano': self.ano,
            'autores': autores
        }

class UsoPlanta(db.Model):
    __tablename__ = 'uso_planta'
    id_uso_planta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), nullable=False)
    id_parte = db.Column(db.Integer, db.ForeignKey('parte_usada.id_uso'), nullable=False)
    observacoes = db.Column(db.Text)
    
    parte_usada = db.relationship('ParteUsada', backref='usos', lazy=True)
    
    def to_dict_detailed(self):
        return {
            'id_uso_planta': self.id_uso_planta,
            'id_parte': self.id_parte,
            'parte_usada': self.parte_usada.parte_usada if self.parte_usada else None,
            'observacoes': self.observacoes,
            'indicacoes': [ind.to_dict() for ind in self.indicacoes],
            'metodos_preparacao': [mp.to_dict() for mp in self.metodos_preparacao],
            'metodos_extracao': [me.to_dict() for me in self.metodos_extracao]
        }

# Tabelas de relacionamento many-to-many (conforme sua BD)
class AutorPlanta(db.Model):
    __tablename__ = 'autor_planta'
    id_autor = db.Column(db.Integer, db.ForeignKey('autor.id_autor'), primary_key=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)

class PlantaProvincia(db.Model):
    __tablename__ = 'planta_provincia'
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)
    id_provincia = db.Column(db.Integer, db.ForeignKey('provincia.id_provincia'), primary_key=True)

class PlantaPropriedade(db.Model):
    __tablename__ = 'planta_propriedade'
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)
    id_propriedade = db.Column(db.Integer, db.ForeignKey('propriedade_farmacologica.id_propriedade'), primary_key=True)

class PlantaComposicao(db.Model):
    __tablename__ = 'planta_composicao'
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)
    id_composto = db.Column(db.Integer, db.ForeignKey('composicao_quimica.id_composto'), primary_key=True)

class PlantaReferencia(db.Model):
    __tablename__ = 'planta_referencia'
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)
    id_referencia = db.Column(db.Integer, db.ForeignKey('referencia.id_referencia'), primary_key=True)

class UsoPlantaIndicacao(db.Model):
    __tablename__ = 'uso_planta_indicacao'
    id_uso_planta = db.Column(db.Integer, db.ForeignKey('uso_planta.id_uso_planta'), primary_key=True)
    id_indicacao = db.Column(db.Integer, db.ForeignKey('indicacao.id_indicacao'), primary_key=True)

class UsoPlantaPreparacao(db.Model):
    __tablename__ = 'uso_planta_preparacao'
    id_uso_planta = db.Column(db.Integer, db.ForeignKey('uso_planta.id_uso_planta'), primary_key=True)
    id_preparacao = db.Column(db.Integer, db.ForeignKey('metodo_preparacao_tradicional.id_preparacao'), primary_key=True)

class UsoPlantaExtracao(db.Model):
    __tablename__ = 'uso_planta_extracao'
    id_uso_planta = db.Column(db.Integer, db.ForeignKey('uso_planta.id_uso_planta'), primary_key=True)
    id_extraccao = db.Column(db.Integer, db.ForeignKey('metodo_extraccao.id_extraccao'), primary_key=True)

class PlantaImagem(db.Model):
    __tablename__ = 'planta_imagem'
    
    id_imagem = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), nullable=False)
    nome_arquivo = db.Column(db.String(255), nullable=False)
    ordem = db.Column(db.Integer, nullable=False, default=1)
    legenda = db.Column(db.Text)
    data_upload = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento
    planta = db.relationship('Planta', backref=db.backref('imagens', lazy=True, cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id_imagem': self.id_imagem,
            'id_planta': self.id_planta,
            'nome_arquivo': self.nome_arquivo,
            'ordem': self.ordem,
            'legenda': self.legenda,
            'url': f'/uploads/plantas_imagens/{self.id_planta}/{self.nome_arquivo}',
            'data_upload': self.data_upload.isoformat() if self.data_upload else None
        }

# Relacionamentos many-to-many
Planta.autores = db.relationship('Autor', secondary='autor_planta', backref='plantas', lazy='select')
Planta.provincias = db.relationship('Provincia', secondary='planta_provincia', backref='plantas', lazy='select')
Planta.propriedades = db.relationship('PropriedadeFarmacologica', secondary='planta_propriedade', backref='plantas', lazy='select')
Planta.compostos = db.relationship('ComposicaoQuimica', secondary='planta_composicao', backref='plantas', lazy='select')
Planta.referencias = db.relationship('Referencia', secondary='planta_referencia', backref='plantas', lazy='select')

UsoPlanta.indicacoes = db.relationship('Indicacao', secondary='uso_planta_indicacao', backref='usos_planta', lazy='select')
UsoPlanta.metodos_preparacao = db.relationship('MetodoPreparacaoTradicional', secondary='uso_planta_preparacao', backref='usos_planta', lazy='select')
UsoPlanta.metodos_extracao = db.relationship('MetodoExtracao', secondary='uso_planta_extracao', backref='usos_planta', lazy='select')

# =====================================================
# ARMAZENAMENTO DE RASCUNHOS
# =====================================================

plant_drafts = {}

def clean_expired_drafts():
    """Remove rascunhos expirados"""
    now = datetime.utcnow()
    expired_keys = []
    
    for draft_id, draft_data in plant_drafts.items():
        try:
            expires_at = datetime.fromisoformat(draft_data['expires_at'])
            if now > expires_at:
                expired_keys.append(draft_id)
        except:
            expired_keys.append(draft_id)
    
    for key in expired_keys:
        del plant_drafts[key]

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

def handle_error(e, message="Erro interno do servidor"):
    logger.error(f"Erro: {str(e)}")
    return jsonify({'error': message, 'details': str(e)}), 500

# =====================================================
# ROTAS PARA DADOS DO WIZARD
# =====================================================

@app.route('/api/wizard/data/familias', methods=['GET'])
def get_familias_wizard():
    try:
        familias = Familia.query.order_by(Familia.nome_familia).all()
        return jsonify([familia.to_dict() for familia in familias]), 200
    except Exception as e:
        return handle_error(e)

@app.route('/api/wizard/data/provincias', methods=['GET'])
def get_provincias_wizard():
    try:
        provincias = Provincia.query.order_by(Provincia.nome_provincia).all()
        return jsonify([provincia.to_dict() for provincia in provincias]), 200
    except Exception as e:
        return handle_error(e)

@app.route('/api/wizard/data/partes-usadas', methods=['GET'])
def get_partes_usadas_wizard():
    try:
        partes = ParteUsada.query.order_by(ParteUsada.parte_usada).all()
        return jsonify([parte.to_dict() for parte in partes]), 200
    except Exception as e:
        return handle_error(e)

@app.route('/api/wizard/data/indicacoes', methods=['GET'])
def get_indicacoes_wizard():
    try:
        indicacoes = Indicacao.query.order_by(Indicacao.descricao).all()
        return jsonify([indicacao.to_dict() for indicacao in indicacoes]), 200
    except Exception as e:
        return handle_error(e)

@app.route('/api/wizard/data/metodos-preparacao', methods=['GET'])
def get_metodos_preparacao_wizard():
    try:
        metodos = MetodoPreparacaoTradicional.query.order_by(MetodoPreparacaoTradicional.descricao).all()
        return jsonify([metodo.to_dict() for metodo in metodos]), 200
    except Exception as e:
        return handle_error(e)

@app.route('/api/wizard/data/metodos-extracao', methods=['GET'])
def get_metodos_extracao_wizard():
    try:
        metodos = MetodoExtracao.query.order_by(MetodoExtracao.descricao).all()
        return jsonify([metodo.to_dict() for metodo in metodos]), 200
    except Exception as e:
        return handle_error(e)

@app.route('/api/wizard/data/propriedades', methods=['GET'])
def get_propriedades_wizard():
    try:
        propriedades = PropriedadeFarmacologica.query.order_by(PropriedadeFarmacologica.descricao).all()
        return jsonify([propriedade.to_dict() for propriedade in propriedades]), 200
    except Exception as e:
        return handle_error(e)

@app.route('/api/wizard/data/compostos', methods=['GET'])
def get_compostos_wizard():
    try:
        compostos = ComposicaoQuimica.query.order_by(ComposicaoQuimica.nome_composto).all()
        return jsonify([composto.to_dict() for composto in compostos]), 200
    except Exception as e:
        return handle_error(e)

# =====================================================
# ROTAS DE RASCUNHOS
# =====================================================

@app.route('/api/wizard/plantas/draft', methods=['POST'])
def save_planta_draft():
    try:
        clean_expired_drafts()
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        draft_id = data.get('draft_id') or str(uuid.uuid4())
        
        draft_data = {
            **data,
            'draft_id': draft_id,
            'updated_at': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
        
        plant_drafts[draft_id] = draft_data
        
        return jsonify({
            'success': True,
            'draft_id': draft_id,
            'message': 'Rascunho guardado com sucesso'
        }), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao guardar rascunho")

@app.route('/api/wizard/plantas/draft/<draft_id>', methods=['GET'])
def get_planta_draft(draft_id):
    try:
        clean_expired_drafts()
        
        if draft_id not in plant_drafts:
            return jsonify({'error': 'Rascunho não encontrado'}), 404
        
        draft = plant_drafts[draft_id]
        
        expires_at = datetime.fromisoformat(draft['expires_at'])
        if datetime.utcnow() > expires_at:
            del plant_drafts[draft_id]
            return jsonify({'error': 'Rascunho expirado'}), 410
        
        return jsonify(draft), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao recuperar rascunho")

@app.route('/api/wizard/plantas/draft/<draft_id>', methods=['DELETE'])
def delete_planta_draft(draft_id):
    try:
        if draft_id in plant_drafts:
            del plant_drafts[draft_id]
        
        return jsonify({'message': 'Rascunho eliminado com sucesso'}), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao eliminar rascunho")

# =====================================================
# VALIDAÇÃO
# =====================================================

@app.route('/api/wizard/plantas/validate', methods=['POST'])
def validate_planta_step():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        step = data.get('step')
        form_data = data.get('data', {})
        errors = {}
        warnings = []
        
        if step == 1:  # Informações Básicas
            if not form_data.get('nome_cientifico'):
                errors['nome_cientifico'] = 'Nome científico é obrigatório'
            else:
                existing = Planta.query.filter_by(nome_cientifico=form_data['nome_cientifico']).first()
                if existing:
                    errors['nome_cientifico'] = 'Planta com este nome científico já existe'
            
            if not form_data.get('id_familia'):
                errors['id_familia'] = 'Família é obrigatória'
            else:
                familia = Familia.query.get(form_data['id_familia'])
                if not familia:
                    errors['id_familia'] = 'Família não encontrada'
        
        elif step == 2:  # Identificação
            nomes_comuns = form_data.get('nomes_comuns', [])
            nomes_validos = [nome.strip() for nome in nomes_comuns if nome.strip()]
            if len(nomes_validos) == 0:
                errors['nomes_comuns'] = 'Pelo menos um nome comum é obrigatório'
            
            provincias = form_data.get('provincias', [])
            if len(provincias) == 0:
                errors['provincias'] = 'Pelo menos uma província deve ser selecionada'
        
        elif step == 3:  # Usos Medicinais
            usos = form_data.get('usos', [])
            if len(usos) == 0:
                errors['usos'] = 'Pelo menos um uso medicinal deve ser adicionado'
            else:
                for i, uso in enumerate(usos):
                    if not uso.get('id_parte'):
                        errors[f'usos[{i}].id_parte'] = 'Parte da planta é obrigatória'
                    if not uso.get('indicacoes') or len(uso.get('indicacoes', [])) == 0:
                        errors[f'usos[{i}].indicacoes'] = 'Pelo menos uma indicação é necessária'
        
        elif step == 4:  # Composição Científica (opcional)
            compostos = form_data.get('compostos', [])
            propriedades = form_data.get('propriedades', [])
            if len(compostos) == 0 and len(propriedades) == 0:
                warnings.append('Considere adicionar informações sobre composição química ou propriedades farmacológicas')
        
        elif step == 5:  # Imagens (OBRIGATÓRIO)
            imagens = form_data.get('imagens', [])
            if len(imagens) == 0:
                errors['imagens'] = 'Pelo menos uma imagem da planta é obrigatória'

        elif step == 6:  # Referências (OBRIGATÓRIO) 
            referencias = form_data.get('referencias', [])
            if len(referencias) == 0:
                errors['referencias'] = 'Pelo menos uma referência bibliográfica é obrigatória'
            else:
                # Verificar se as referências existem
                for ref_id in referencias:
                    if not Referencia.query.get(ref_id):
                        errors['referencias'] = f'Referência com ID {ref_id} não encontrada'
                        break
        
        return jsonify({
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }), 200
        
    except Exception as e:
        return handle_error(e, "Erro na validação")

# =====================================================
# CRIAÇÃO DE PLANTAS
# =====================================================
def resize_image(image_path, max_size=(800, 800), quality=85):
    """Redimensiona uma imagem mantendo a proporção"""
    try:
        with Image.open(image_path) as img:
            # Converter para RGB se necessário
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Redimensionar mantendo proporção
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Salvar com qualidade otimizada
            img.save(image_path, 'JPEG', quality=quality, optimize=True)
            
    except Exception as e:
        logger.error(f"Erro ao redimensionar imagem {image_path}: {e}")

@app.route('/api/wizard/plantas/create', methods=['POST'])
def create_planta_from_wizard():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # ✅ VALIDAÇÕES OBRIGATÓRIAS
        if not data.get('nome_cientifico'):
            return jsonify({'error': 'Nome científico é obrigatório'}), 400
        
        if not data.get('id_familia'):
            return jsonify({'error': 'Família é obrigatória'}), 400
        
        # ✅ REFERÊNCIAS AGORA OBRIGATÓRIAS
        if not data.get('referencias') or len(data.get('referencias', [])) == 0:
            return jsonify({'error': 'Pelo menos uma referência bibliográfica é obrigatória'}), 400
        
        existing = Planta.query.filter_by(nome_cientifico=data['nome_cientifico']).first()
        if existing:
            return jsonify({'error': 'Planta com este nome científico já existe'}), 409
        
        # Criar planta
        planta = Planta(
            nome_cientifico=data['nome_cientifico'],
            numero_exsicata=data.get('numero_exsicata'),
            id_familia=data['id_familia']
        )
        
        db.session.add(planta)
        db.session.flush()
        
        # Adicionar nomes comuns
        for nome_comum in data.get('nomes_comuns', []):
            if nome_comum and nome_comum.strip():
                nome = NomeComum(
                    id_planta=planta.id_planta,
                    nome_comum_planta=nome_comum.strip()
                )
                db.session.add(nome)
        
        # Adicionar usos
        for uso_data in data.get('usos', []):
            if uso_data.get('id_parte'):
                uso = UsoPlanta(
                    id_planta=planta.id_planta,
                    id_parte=uso_data['id_parte'],
                    observacoes=uso_data.get('observacoes')
                )
                db.session.add(uso)
                db.session.flush()
                
                # Adicionar indicações, métodos de preparação e extração
                for id_indicacao in uso_data.get('indicacoes', []):
                    indicacao = Indicacao.query.get(id_indicacao)
                    if indicacao:
                        uso.indicacoes.append(indicacao)
                
                for id_preparacao in uso_data.get('metodos_preparacao', []):
                    metodo = MetodoPreparacaoTradicional.query.get(id_preparacao)
                    if metodo:
                        uso.metodos_preparacao.append(metodo)
                
                for id_extraccao in uso_data.get('metodos_extracao', []):
                    metodo = MetodoExtracao.query.get(id_extraccao)
                    if metodo:
                        uso.metodos_extracao.append(metodo)
        
        # Adicionar províncias
        for id_provincia in data.get('provincias', []):
            provincia = Provincia.query.get(id_provincia)
            if provincia:
                planta.provincias.append(provincia)
        
        # Adicionar compostos
        for id_composto in data.get('compostos', []):
            composto = ComposicaoQuimica.query.get(id_composto)
            if composto:
                planta.compostos.append(composto)
        
        # Adicionar propriedades
        for id_propriedade in data.get('propriedades', []):
            propriedade = PropriedadeFarmacologica.query.get(id_propriedade)
            if propriedade:
                planta.propriedades.append(propriedade)
        
        # ✅ NOVA LÓGICA: APENAS AUTORES DAS REFERÊNCIAS
        autores_das_referencias = set()
        
        # 1. Adicionar referências e coletar seus autores automaticamente
        for id_referencia in data.get('referencias', []):
            if isinstance(id_referencia, dict):
                ref_id = id_referencia.get('id')
            else:
                ref_id = id_referencia
                
            if ref_id:
                referencia = Referencia.query.get(ref_id)
                if referencia:
                    # Adicionar referência à planta
                    planta.referencias.append(referencia)
                    
                    # Buscar TODOS os autores desta referência
                    autores_refs = AutorReferencia.query.filter_by(id_referencia=ref_id).all()
                    for ar in autores_refs:
                        autores_das_referencias.add(ar.autor)
        
        # 2. Adicionar TODOS os autores das referências à planta
        for autor in autores_das_referencias:
            if autor not in planta.autores:
                planta.autores.append(autor)

        imagens_data = data.get('imagens', [])
        if imagens_data:
            logger.info(f"🖼️ Processando {len(imagens_data)} imagens...")
            
            try:
                # Criar diretório para as imagens da planta
                planta_folder = os.path.join(UPLOAD_FOLDER, str(planta.id_planta))
                os.makedirs(planta_folder, exist_ok=True)
                
                for ordem, imagem_info in enumerate(imagens_data, 1):
                    try:
                        # Extrair dados da imagem
                        file_data = imagem_info.get('file_data', '')
                        file_extension = imagem_info.get('file_extension', 'jpg')
                        legenda = imagem_info.get('legenda', '')
                        
                        if not file_data:
                            continue
                        
                        # Gerar nome único para o arquivo
                        filename = f"{uuid.uuid4().hex}.{file_extension}"
                        file_path = os.path.join(planta_folder, filename)
                        
                        # Decodificar base64 e salvar
                        if 'data:' in file_data:
                            base64_data = file_data.split(',')[1]
                        else:
                            base64_data = file_data
                        
                        image_binary = base64.b64decode(base64_data)
                        
                        # Salvar arquivo
                        with open(file_path, 'wb') as f:
                            f.write(image_binary)
                        
                        # Redimensionar
                        resize_image(file_path)
                        
                        # Criar registro na BD
                        nova_imagem = PlantaImagem(
                            id_planta=planta.id_planta,
                            nome_arquivo=filename,
                            ordem=ordem,
                            legenda=legenda
                        )
                        db.session.add(nova_imagem)
                        
                        logger.info(f"   ✅ Imagem {ordem} processada: {filename}")
                        
                    except Exception as img_error:
                        logger.error(f"   ❌ Erro ao processar imagem {ordem}: {img_error}")
                        continue
                
            except Exception as e:
                logger.error(f"❌ Erro geral no processamento de imagens: {e}")
                
        db.session.commit()
        
        # Eliminar rascunho
        draft_id = data.get('draft_id')
        if draft_id and draft_id in plant_drafts:
            del plant_drafts[draft_id]
        
        # ✅ LOG DETALHADO
        logger.info(f"✅ Planta criada: {planta.nome_cientifico} (ID: {planta.id_planta})")
        logger.info(f"   • {len(data.get('referencias', []))} referências adicionadas")
        logger.info(f"   • {len(autores_das_referencias)} autores das referências")
        logger.info(f"   • Autores: {[a.nome_autor for a in autores_das_referencias]}")
        
        return jsonify({
            'success': True,
            'planta': planta.to_dict(include_relations=True),
            'autores_info': {
                'total_autores': len(autores_das_referencias),
                'autores_das_referencias': [
                    {
                        'id_autor': a.id_autor,
                        'nome_autor': a.nome_autor,
                        'afiliacao': a.afiliacao
                    } for a in autores_das_referencias
                ],
                'referencias_adicionadas': len(data.get('referencias', []))
            },
            'message': 'Planta criada com sucesso! Autores adicionados automaticamente das referências.'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar planta")


# =====================================================
# ROTAS PARA CRIAR NOVAS ENTIDADES E GERENCIAR AUTORES DE REFERÊNCIAS
# =====================================================

class AutorReferencia(db.Model):
    __tablename__ = 'autor_referencia'
    id_autor = db.Column(db.Integer, db.ForeignKey('autor.id_autor'), primary_key=True)
    id_referencia = db.Column(db.Integer, db.ForeignKey('referencia.id_referencia'), primary_key=True)
    ordem_autor = db.Column(db.Integer, default=1)
    papel = db.Column(db.Enum('primeiro', 'correspondente', 'coautor'), default='coautor')
    
    # Relacionamentos
    autor = db.relationship('Autor', backref='autor_referencias')
    referencia = db.relationship('Referencia', backref='referencia_autores')

@app.route('/api/referencias', methods=['POST'])
def create_referencia_from_wizard():
    """Criar nova referência com autores associados - VERSÃO MELHORADA"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Validações baseadas no tipo
        tipo = data.get('tipo_referencia', 'Artigo')
        titulo = data.get('titulo_referencia', '').strip()
        link = data.get('link_referencia', '').strip()
        ano = data.get('ano', '').strip()
        
        # ✅ VALIDAÇÕES RIGOROSAS
        if not titulo:
            return jsonify({'error': 'Título é obrigatório'}), 400
        
        # Validação de link baseada no tipo
        if tipo in ['URL', 'Artigo']:
            if not link:
                return jsonify({'error': f'Link é obrigatório para {tipo.lower()}s'}), 400
            # Validação de URL simples
            if not (link.startswith('http://') or link.startswith('https://')):
                return jsonify({'error': 'Link deve começar com http:// ou https://'}), 400
        
        # Para livros e teses, link é opcional mas se fornecido deve ser válido
        if link and tipo in ['Livro', 'Tese']:
            if not (link.startswith('http://') or link.startswith('https://')):
                return jsonify({'error': 'Link deve começar com http:// ou https://'}), 400
        
        # Validar ano
        if ano:
            try:
                ano_int = int(ano)
                if ano_int < 1900 or ano_int > 2030:
                    return jsonify({'error': 'Ano deve estar entre 1900 e 2030'}), 400
            except ValueError:
                return jsonify({'error': 'Ano deve ser um número válido'}), 400
        
        # ✅ VALIDAR AUTORES OBRIGATÓRIOS
        autores_data = data.get('autores', [])
        if len(autores_data) == 0:
            return jsonify({'error': 'Pelo menos um autor deve ser fornecido'}), 400
        
        # Validar cada autor
        for i, autor_info in enumerate(autores_data):
            if not autor_info.get('nome_autor', '').strip():
                return jsonify({'error': f'Nome do autor {i+1} é obrigatório'}), 400
        
        # ✅ VERIFICAR SE REFERÊNCIA JÁ EXISTE (mesmo título + mesmo tipo)
        referencia_existente = Referencia.query.filter_by(
            titulo_referencia=titulo,
            tipo_referencia=tipo
        ).first()
        
        if referencia_existente:
            return jsonify({
                'error': f'Já existe uma referência do tipo "{tipo}" com o título "{titulo}"',
                'referencia_existente': {
                    'id_referencia': referencia_existente.id_referencia,
                    'titulo': referencia_existente.titulo_referencia,
                    'tipo': referencia_existente.tipo_referencia
                }
            }), 409
        
        # Criar referência
        referencia = Referencia(
            link_referencia=link,
            tipo_referencia=tipo,
            titulo_referencia=titulo,
            ano=ano if ano else None
        )
        db.session.add(referencia)
        db.session.flush()  # Para obter o ID
        
        # ✅ PROCESSAR AUTORES COM LÓGICA INTELIGENTE
        autores_criados = []
        for i, autor_info in enumerate(autores_data):
            autor = None
            
            # Verificar se é autor existente ou novo
            if autor_info.get('id_autor'):
                # Autor existente
                autor = Autor.query.get(autor_info['id_autor'])
                if not autor:
                    return jsonify({'error': f'Autor com ID {autor_info["id_autor"]} não encontrado'}), 400
            else:
                # ✅ BUSCA INTELIGENTE: nome + afiliação
                nome_autor = autor_info['nome_autor'].strip()
                afiliacao = autor_info.get('afiliacao', '').strip()
                
                # Buscar por nome exato primeiro
                autor_existente = Autor.query.filter_by(nome_autor=nome_autor).first()
                
                # Se tem afiliação, buscar por nome + afiliação
                if not autor_existente and afiliacao:
                    autor_existente = Autor.query.filter_by(
                        nome_autor=nome_autor,
                        afiliacao=afiliacao
                    ).first()
                
                if autor_existente:
                    # Usar autor existente
                    autor = autor_existente
                else:
                    # Criar novo autor
                    autor = Autor(
                        nome_autor=nome_autor,
                        afiliacao=afiliacao or None,
                        sigla_afiliacao=autor_info.get('sigla_afiliacao', '').strip() or None
                    )
                    db.session.add(autor)
                    db.session.flush()
            
            # ✅ VERIFICAR SE ASSOCIAÇÃO JÁ EXISTE
            associacao_existente = AutorReferencia.query.filter_by(
                id_autor=autor.id_autor,
                id_referencia=referencia.id_referencia
            ).first()
            
            if not associacao_existente:
                # Criar associação autor-referência
                autor_ref = AutorReferencia(
                    id_autor=autor.id_autor,
                    id_referencia=referencia.id_referencia,
                    ordem_autor=autor_info.get('ordem_autor', i + 1),
                    papel=autor_info.get('papel', 'coautor')
                )
                db.session.add(autor_ref)
            
            autores_criados.append({
                'id_autor': autor.id_autor,
                'nome_autor': autor.nome_autor,
                'afiliacao': autor.afiliacao,
                'sigla_afiliacao': autor.sigla_afiliacao,
                'ordem_autor': autor_info.get('ordem_autor', i + 1),
                'papel': autor_info.get('papel', 'coautor'),
                'isNew': not autor_info.get('id_autor')  # True se foi criado agora
            })
        
        db.session.commit()
        
        # ✅ LOG DETALHADO
        logger.info(f"✅ Referência criada: {referencia.titulo_referencia} (ID: {referencia.id_referencia})")
        logger.info(f"   • Tipo: {referencia.tipo_referencia}")
        logger.info(f"   • {len(autores_criados)} autores associados")
        logger.info(f"   • Autores: {[a['nome_autor'] for a in autores_criados]}")
        
        # Retornar referência completa com autores
        return jsonify({
            'id_referencia': referencia.id_referencia,
            'titulo_referencia': referencia.titulo_referencia,
            'link_referencia': referencia.link_referencia,
            'tipo_referencia': referencia.tipo_referencia,
            'ano': referencia.ano,
            'autores': autores_criados,
            'message': f'Referência "{titulo}" criada com sucesso com {len(autores_criados)} autores!'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar referência")

@app.route('/api/autores', methods=['POST'])
def create_autor_from_wizard():
    """Criar novo autor a partir do wizard"""
    try:
        data = request.get_json()
        if not data or 'nome_autor' not in data:
            return jsonify({'error': 'Nome do autor é obrigatório'}), 400
        
        autor = Autor(
            nome_autor=data['nome_autor'],
            afiliacao=data.get('afiliacao'),
            sigla_afiliacao=data.get('sigla_afiliacao')
        )
        db.session.add(autor)
        db.session.commit()
        
        return jsonify(autor.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar autor")

@app.route('/api/referencias/<int:id_referencia>/autores', methods=['GET'])
def get_autores_referencia(id_referencia):
    """Buscar autores de uma referência específica"""
    try:
        referencia = Referencia.query.get_or_404(id_referencia)
        
        # Buscar autores ordenados pela ordem_autor
        autores_refs = AutorReferencia.query.filter_by(
            id_referencia=id_referencia
        ).order_by(AutorReferencia.ordem_autor).all()
        
        autores = []
        for ar in autores_refs:
            autores.append({
                'id_autor': ar.autor.id_autor,
                'nome_autor': ar.autor.nome_autor,
                'afiliacao': ar.autor.afiliacao,
                'sigla_afiliacao': ar.autor.sigla_afiliacao,
                'ordem_autor': ar.ordem_autor,
                'papel': ar.papel
            })
        
        return jsonify({
            'id_referencia': id_referencia,
            'titulo_referencia': referencia.titulo_referencia,
            'autores': autores
        }), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao buscar autores da referência")

@app.route('/api/wizard/search/nome-cientifico', methods=['GET'])
def search_nome_cientifico():
    try:
        nome = request.args.get('nome', '').strip()
        if not nome:
            return jsonify({'exists': False}), 200
        
        existing = Planta.query.filter_by(nome_cientifico=nome).first()
        
        return jsonify({
            'exists': existing is not None,
            'planta': existing.to_dict() if existing else None
        }), 200
        
    except Exception as e:
        return handle_error(e, "Erro na busca")

@app.route('/api/wizard/autocomplete/autores', methods=['GET'])
def autocomplete_autores():
    try:
        search = request.args.get('search', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        query = Autor.query
        if search:
            query = query.filter(
                db.or_(
                    Autor.nome_autor.ilike(f'%{search}%'),
                    Autor.afiliacao.ilike(f'%{search}%')
                )
            )
        
        autores = query.limit(limit).all()
        return jsonify([autor.to_dict() for autor in autores]), 200
        
    except Exception as e:
        return handle_error(e, "Erro no autocomplete")

@app.route('/api/wizard/autocomplete/referencias', methods=['GET'])
def autocomplete_referencias():
    try:
        search = request.args.get('search', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        if not search:
            # Se não há busca, retornar referências mais recentes
            referencias = Referencia.query.order_by(Referencia.id_referencia.desc()).limit(limit).all()
        else:
            # Subquery para buscar referências por autores
            referencias_por_autores = db.session.query(AutorReferencia.id_referencia).join(Autor).filter(
                Autor.nome_autor.ilike(f'%{search}%')
            ).subquery()
            
            # Query principal
            query = Referencia.query.filter(
                db.or_(
                    Referencia.titulo_referencia.ilike(f'%{search}%'),
                    Referencia.link_referencia.ilike(f'%{search}%'),
                    Referencia.id_referencia.in_(referencias_por_autores)
                )
            )
            
            referencias = query.order_by(Referencia.titulo_referencia).limit(limit).all()
        
        # Incluir autores no resultado
        resultado = []
        for ref in referencias:
            ref_dict = ref.to_dict()
            resultado.append(ref_dict)
        
        return jsonify(resultado), 200
        
    except Exception as e:
        return handle_error(e, "Erro no autocomplete de referências")

# =====================================================
# ROTAS DE PLANTAS SIMILARES E TEMPLATES
# =====================================================

@app.route('/api/wizard/plantas/similar', methods=['GET'])
def get_plantas_similares():
    try:
        id_familia = request.args.get('id_familia', type=int)
        if not id_familia:
            return jsonify([]), 200
        
        plantas = Planta.query.filter_by(id_familia=id_familia).limit(5).all()
        
        return jsonify([{
            'id_planta': planta.id_planta,
            'nome_cientifico': planta.nome_cientifico,
            'nomes_comuns': [nc.nome_comum_planta for nc in planta.nomes_comuns[:2]],
            'total_usos': len(planta.usos_planta),
            'total_provincias': len(planta.provincias)
        } for planta in plantas]), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao buscar plantas similares")

@app.route('/api/wizard/plantas/template/<int:id_planta>', methods=['GET'])
def get_planta_template(id_planta):
    try:
        planta = Planta.query.get_or_404(id_planta)
        
        template = {
            'id_familia': planta.id_familia,
            'provincias': [p.id_provincia for p in planta.provincias],
            'compostos': [c.id_composto for c in planta.compostos],
            'propriedades': [p.id_propriedade for p in planta.propriedades],
            'autores': [a.id_autor for a in planta.autores],
            'referencias': [r.id_referencia for r in planta.referencias],
            'usos_template': []
        }
        
        # Template dos usos
        for uso in planta.usos_planta:
            uso_template = {
                'id_parte': uso.id_parte,
                'indicacoes': [ind.id_indicacao for ind in uso.indicacoes],
                'metodos_preparacao': [mp.id_preparacao for mp in uso.metodos_preparacao],
                'metodos_extracao': [me.id_extraccao for me in uso.metodos_extracao]
            }
            template['usos_template'].append(uso_template)
        
        return jsonify({
            'planta_origem': planta.to_dict(),
            'template': template
        }), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao obter template")

# =====================================================
# ROTAS DE ESTATÍSTICAS E UTILITÁRIOS
# =====================================================

@app.route('/api/wizard/stats', methods=['GET'])
def get_wizard_stats():
    try:
        clean_expired_drafts()
        
        # ✅ ESTATÍSTICAS DETALHADAS
        stats = {
            'totais': {
                'plantas': Planta.query.count(),
                'familias': Familia.query.count(),
                'autores': Autor.query.count(),
                'referencias': Referencia.query.count(),
                'associacoes_autor_referencia': AutorReferencia.query.count(),
                'provincias': Provincia.query.count(),
                'indicacoes': Indicacao.query.count()
            },
            'plantas_com_referencias': {
                'total': db.session.query(Planta).join('referencias').distinct().count(),
                'percentual': round(
                    db.session.query(Planta).join('referencias').distinct().count() * 100 / max(Planta.query.count(), 1), 2
                )
            },
            'autores_produtivos': [
                {
                    'nome': result[0],
                    'total_referencias': result[1]
                }
                for result in db.session.query(
                    Autor.nome_autor,
                    db.func.count(AutorReferencia.id_referencia)
                ).join(AutorReferencia).group_by(Autor.nome_autor).order_by(
                    db.func.count(AutorReferencia.id_referencia).desc()
                ).limit(5).all()
            ],
            'tipos_referencias': [
                {
                    'tipo': result[0] or 'Sem tipo',
                    'total': result[1]
                }
                for result in db.session.query(
                    Referencia.tipo_referencia,
                    db.func.count(Referencia.id_referencia)
                ).group_by(Referencia.tipo_referencia).order_by(
                    db.func.count(Referencia.id_referencia).desc()
                ).all()
            ],
            'rascunhos_ativos': len(plant_drafts)
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao obter estatísticas")

@app.route('/api/wizard/health', methods=['GET'])
def health_check():
    try:
        # Testar conexão com BD usando text() para SQL bruto
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'api': 'Wizard de Criação de Plantas Medicinais',
            'port': 5002,
            'database': 'connected',
            'integration': {
                'main_api': 'http://localhost:5000',
                'admin_api': 'http://localhost:5001',
                'next_app': 'http://localhost:3000'
            },
            'total_drafts': len(plant_drafts)
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@app.route('/api/test/autor-referencia', methods=['GET'])
def test_autor_referencia():
    """Testar dados da tabela autor_referencia"""
    try:
        # Contar associações
        total_associacoes = AutorReferencia.query.count()
        
        # Buscar algumas referências com autores
        referencias_com_autores = db.session.query(
            Referencia.id_referencia,
            Referencia.titulo_referencia,
            db.func.count(AutorReferencia.id_autor).label('total_autores')
        ).outerjoin(AutorReferencia).group_by(
            Referencia.id_referencia,
            Referencia.titulo_referencia
        ).limit(10).all()
        
        # Buscar autores com mais referências
        autores_produtivos = db.session.query(
            Autor.id_autor,
            Autor.nome_autor,
            db.func.count(AutorReferencia.id_referencia).label('total_referencias')
        ).outerjoin(AutorReferencia).group_by(
            Autor.id_autor,
            Autor.nome_autor
        ).order_by(db.desc('total_referencias')).limit(10).all()
        
        return jsonify({
            'status': 'success',
            'total_associacoes': total_associacoes,
            'referencias_com_autores': [
                {
                    'id_referencia': r.id_referencia,
                    'titulo': r.titulo_referencia,
                    'total_autores': r.total_autores
                } for r in referencias_com_autores
            ],
            'autores_mais_produtivos': [
                {
                    'id_autor': a.id_autor,
                    'nome': a.nome_autor,
                    'total_referencias': a.total_referencias
                } for a in autores_produtivos
            ]
        }), 200
        
    except Exception as e:
        return handle_error(e, "Erro no teste")

@app.route('/api/wizard/info', methods=['GET'])
def api_info():
    return jsonify({
        'name': 'Wizard API para Plantas Medicinais',
        'version': '2.0.0',
        'description': 'API Flask para criar plantas medicinais com lógica simplificada',
        'port': 5002,
        'integration': {
            'main_api': 5000,
            'admin_api': 5001,
            'wizard_api': 5002,
            'frontend': 3000
        },
        'mudancas_v2': [
            'Referências bibliográficas agora são OBRIGATÓRIAS',
            'Autores da planta = APENAS autores das referências',
            'Removida opção de autores adicionais',
            'Validação rigorosa na criação de referências',
            'Prevenção de referências duplicadas',
            'Busca inteligente de autores existentes',
            'Log detalhado de criação de plantas e referências'
        ],
        'endpoints': {
            'data': [
                'GET /api/wizard/data/familias',
                'GET /api/wizard/data/provincias',
                'GET /api/wizard/data/partes-usadas',
                'GET /api/wizard/data/indicacoes',
                'GET /api/wizard/data/metodos-preparacao',
                'GET /api/wizard/data/metodos-extracao',
                'GET /api/wizard/data/propriedades',
                'GET /api/wizard/data/compostos'
            ],
            'drafts': [
                'POST /api/wizard/plantas/draft',
                'GET /api/wizard/plantas/draft/<id>',
                'DELETE /api/wizard/plantas/draft/<id>'
            ],
            'wizard': [
                'POST /api/wizard/plantas/validate',
                'POST /api/wizard/plantas/create'
            ],
            'referencias': [
                'POST /api/referencias',
                'GET /api/referencias/<id>/autores'
            ],
            'search': [
                'GET /api/wizard/search/nome-cientifico',
                'GET /api/wizard/autocomplete/autores',
                'GET /api/wizard/autocomplete/referencias'
            ],
            'utils': [
                'GET /api/wizard/stats',
                'GET /api/wizard/health',
                'GET /api/wizard/info',
                'GET /api/test/autor-referencia'
            ]
        },
        'features': [
            'Auto-save de rascunhos',
            'Validação rigorosa por steps',
            'Autocomplete inteligente',
            'Criação de referências com autores',
            'Integração automática autor-referência-planta',
            'Prevenção de duplicatas',
            'CORS configurado para Next.js',
            'Log detalhado para debugging'
        ],
        'validacoes': {
            'step_1': ['nome_cientifico', 'id_familia'],
            'step_2': ['nomes_comuns', 'provincias'],
            'step_3': ['usos'],
            'step_4': ['opcional'],
            'step_5': ['referencias - OBRIGATÓRIO'],
            'step_6': ['revisao']
        }
    }), 200

# =====================================================
# TRATAMENTO DE ERROS
# =====================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Método não permitido'}), 405

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Erro interno do servidor'}), 500

# =====================================================
# INICIALIZAÇÃO
# =====================================================
if __name__ == '__main__':
    with app.app_context():
        try:
            # Verificar conexão
            plantas_count = db.session.scalar(text('SELECT COUNT(*) FROM planta'))
            autores_count = db.session.scalar(text('SELECT COUNT(*) FROM autor'))
            referencias_count = db.session.scalar(text('SELECT COUNT(*) FROM referencia'))
            associacoes_count = db.session.scalar(text('SELECT COUNT(*) FROM autor_referencia'))
            
            logger.info(f"✅ Conectado! BD tem:")
            logger.info(f"   • {plantas_count} plantas")
            logger.info(f"   • {autores_count} autores") 
            logger.info(f"   • {referencias_count} referências")
            logger.info(f"   • {associacoes_count} associações autor-referência")
            
        except Exception as e:
            logger.error(f"❌ Erro de conexão com BD: {e}")
            logger.info("💡 Verifique se o MySQL está em execução e a BD existe")
    
    # Iniciar servidor
    host = '0.0.0.0'
    port = 5002
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    logger.info("🌿" + "="*80)
    logger.info("🌿 WIZARD API v2.0 - PLANTAS MEDICINAIS (LÓGICA SIMPLIFICADA)")
    logger.info("🌿" + "="*80)
    logger.info(f"🚀 Porta: {port}")
    logger.info(f"🔗 Health: http://localhost:{port}/api/wizard/health")
    logger.info(f"📖 Info: http://localhost:{port}/api/wizard/info")
    logger.info(f"📊 Stats: http://localhost:{port}/api/wizard/stats")
    logger.info(f"🧪 Teste: http://localhost:{port}/api/test/autor-referencia")
    logger.info(f"")
    logger.info(f"✨ MUDANÇAS PRINCIPAIS v2.0:")
    logger.info(f"   🔒 Referências bibliográficas são OBRIGATÓRIAS")
    logger.info(f"   👥 Autores da planta = APENAS autores das referências")
    logger.info(f"   ❌ Removida opção de 'autores adicionais'")
    logger.info(f"   🛡️ Validação rigorosa na criação de referências")
    logger.info(f"   🔍 Busca inteligente de autores existentes")
    logger.info(f"   🚫 Prevenção de referências duplicadas")
    logger.info(f"   📝 Log detalhado para debugging")
    logger.info(f"")
    logger.info(f"🎯 FLUXO SIMPLIFICADO:")
    logger.info(f"   1. Criar/selecionar referências bibliográficas")
    logger.info(f"   2. Autores são automaticamente extraídos das referências")
    logger.info(f"   3. Planta criada com autores das referências")
    logger.info("🌿" + "="*80)
    
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )