from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

# Configuração da base de dados
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 'mysql+pymysql://root:@localhost/plantas_medicinais'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_AS_ASCII'] = False

# Inicializar extensões
db = SQLAlchemy(app)
CORS(app)

# MODELOS ATUALIZADOS PARA A NOVA ESTRUTURA

class Familia(db.Model):
    __tablename__ = 'Familia'
    id_familia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_familia = db.Column(db.String(100), nullable=False)
    
    plantas = db.relationship('Planta', backref='familia', lazy=True)
    
    def to_dict(self):
        return {
            'id_familia': self.id_familia,
            'nome_familia': self.nome_familia
        }

class Planta(db.Model):
    __tablename__ = 'Planta'
    id_planta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_familia = db.Column(db.Integer, db.ForeignKey('Familia.id_familia'), nullable=False)
    nome_cientifico = db.Column(db.String(150), nullable=False)
    numero_exsicata = db.Column(db.String(50))
    
    # Relacionamentos
    nomes_comuns = db.relationship('NomeComum', backref='planta', lazy=True, cascade="all, delete-orphan")
    usos_planta = db.relationship('UsoPlanta', backref='planta', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=False):
        data = {
            'id_planta': self.id_planta,
            'nome_cientifico': self.nome_cientifico,
            'numero_exsicata': self.numero_exsicata,
            'id_familia': self.id_familia,
            'familia': self.familia.nome_familia if self.familia else None,
            'nomes_comuns': [nc.nome_comum_planta for nc in self.nomes_comuns]
        }
        
        if include_relations:
            # NOVA ESTRUTURA: Buscar partes usadas com indicações específicas através de Uso_Planta
            partes_com_indicacoes = []
            for uso in self.usos_planta:
                parte_data = {
                    'id_uso': uso.parte_usada.id_uso,
                    'parte_usada': uso.parte_usada.parte_usada,
                    'indicacoes': [{'id_indicacao': ind.id_indicacao, 'descricao': ind.descricao} 
                                  for ind in uso.indicacoes],
                    'metodos_preparacao': [{'id_preparacao': mp.id_preparacao, 'descricao': mp.descricao} 
                                          for mp in uso.metodos_preparacao],
                    'metodos_extracao': [{'id_extraccao': me.id_extraccao, 'descricao': me.descricao} 
                                        for me in uso.metodos_extracao],
                    'observacoes': uso.observacoes
                }
                partes_com_indicacoes.append(parte_data)
            
            data.update({
                'autores': [autor.to_dict() for autor in self.autores],
                'provincias': [provincia.to_dict() for provincia in self.provincias],
                'partes_usadas': partes_com_indicacoes,  # ← CORRIGIDO: agora usa estrutura específica
                'propriedades': [prop.to_dict() for prop in self.propriedades],
                'compostos': [comp.to_dict() for comp in self.compostos],
                'referencias': [ref.to_dict() for ref in self.referencias]
            })
        
        return data

class NomeComum(db.Model):
    __tablename__ = 'Nome_comum'
    id_nome = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), nullable=False)
    nome_comum_planta = db.Column(db.String(150), nullable=False)
    
    def to_dict(self):
        return {
            'id_nome': self.id_nome,
            'id_planta': self.id_planta,
            'nome_comum_planta': self.nome_comum_planta
        }

class Referencia(db.Model):
    __tablename__ = 'Referencia'
    id_referencia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    link_referencia = db.Column(db.Text, nullable=False)
    
    def to_dict(self):
        return {
            'id_referencia': self.id_referencia,
            'link_referencia': self.link_referencia
        }

class PlantaReferencia(db.Model):
    __tablename__ = 'Planta_Referencia'
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), primary_key=True)
    id_referencia = db.Column(db.Integer, db.ForeignKey('Referencia.id_referencia'), primary_key=True)

class PropriedadeFarmacologica(db.Model):
    __tablename__ = 'Propriedade_farmacologica'
    id_propriedade = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id_propriedade': self.id_propriedade,
            'descricao': self.descricao
        }

class PlantaPropriedade(db.Model):
    __tablename__ = 'Planta_Propriedade'
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), primary_key=True)
    id_propriedade = db.Column(db.Integer, db.ForeignKey('Propriedade_farmacologica.id_propriedade'), primary_key=True)

class Autor(db.Model):
    __tablename__ = 'Autor'
    id_autor = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_autor = db.Column(db.String(150))
    afiliacao = db.Column(db.String(150))
    sigla_afiliacao = db.Column(db.String(50))
    
    def to_dict(self):
        return {
            'id_autor': self.id_autor,
            'nome_autor': self.nome_autor,
            'afiliacao': self.afiliacao,
            'sigla_afiliacao': self.sigla_afiliacao
        }

class AutorPlanta(db.Model):
    __tablename__ = 'Autor_Planta'
    id_autor = db.Column(db.Integer, db.ForeignKey('Autor.id_autor'), primary_key=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), primary_key=True)

class ComposicaoQuimica(db.Model):
    __tablename__ = 'Composicao_quimica'
    id_composto = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_composto = db.Column(db.String(150))
    
    def to_dict(self):
        return {
            'id_composto': self.id_composto,
            'nome_composto': self.nome_composto
        }

class PlantaComposicao(db.Model):
    __tablename__ = 'Planta_Composicao'
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), primary_key=True)
    id_composto = db.Column(db.Integer, db.ForeignKey('Composicao_quimica.id_composto'), primary_key=True)

class Provincia(db.Model):
    __tablename__ = 'Provincia'
    id_provincia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_provincia = db.Column(db.String(100), nullable=False)
    
    regioes = db.relationship('Regiao', backref='provincia', lazy=True)
    
    def to_dict(self):
        return {
            'id_provincia': self.id_provincia,
            'nome_provincia': self.nome_provincia
        }

class Regiao(db.Model):
    __tablename__ = 'Regiao'
    id_regiao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_regiao = db.Column(db.String(100))
    id_provincia = db.Column(db.Integer, db.ForeignKey('Provincia.id_provincia'))
    
    def to_dict(self):
        return {
            'id_regiao': self.id_regiao,
            'nome_regiao': self.nome_regiao,
            'id_provincia': self.id_provincia,
            'provincia': self.provincia.nome_provincia if self.provincia else None
        }

class PlantaProvincia(db.Model):
    __tablename__ = 'Planta_Provincia'
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), primary_key=True)
    id_provincia = db.Column(db.Integer, db.ForeignKey('Provincia.id_provincia'), primary_key=True)

class ParteUsada(db.Model):
    __tablename__ = 'Parte_usada'
    id_uso = db.Column(db.Integer, primary_key=True, autoincrement=True)
    parte_usada = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id_uso': self.id_uso,
            'parte_usada': self.parte_usada
        }

class MetodoExtracao(db.Model):
    __tablename__ = 'Metodo_extraccao'
    id_extraccao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id_extraccao': self.id_extraccao,
            'descricao': self.descricao
        }

class MetodoPreparacaoTradicional(db.Model):
    __tablename__ = 'Metodo_preparacao_tradicional'
    id_preparacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id_preparacao': self.id_preparacao,
            'descricao': self.descricao
        }

class Indicacao(db.Model):
    __tablename__ = 'Indicacao'
    id_indicacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id_indicacao': self.id_indicacao,
            'descricao': self.descricao
        }

# =====================================================
# NOVOS MODELOS PARA ESTRUTURA CORRIGIDA
# =====================================================

class UsoPlanta(db.Model):
    __tablename__ = 'Uso_Planta'
    id_uso_planta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), nullable=False)
    id_parte = db.Column(db.Integer, db.ForeignKey('Parte_usada.id_uso'), nullable=False)
    observacoes = db.Column(db.Text)
    
    # Relacionamentos
    parte_usada = db.relationship('ParteUsada', backref='usos', lazy=True)
    
    def to_dict(self):
        return {
            'id_uso_planta': self.id_uso_planta,
            'id_planta': self.id_planta,
            'id_parte': self.id_parte,
            'observacoes': self.observacoes,
            'parte_usada': self.parte_usada.parte_usada if self.parte_usada else None
        }

class UsoPlantaIndicacao(db.Model):
    __tablename__ = 'Uso_Planta_Indicacao'
    id_uso_planta = db.Column(db.Integer, db.ForeignKey('Uso_Planta.id_uso_planta'), primary_key=True)
    id_indicacao = db.Column(db.Integer, db.ForeignKey('Indicacao.id_indicacao'), primary_key=True)

class UsoPlantaPreparacao(db.Model):
    __tablename__ = 'Uso_Planta_Preparacao'
    id_uso_planta = db.Column(db.Integer, db.ForeignKey('Uso_Planta.id_uso_planta'), primary_key=True)
    id_preparacao = db.Column(db.Integer, db.ForeignKey('Metodo_preparacao_tradicional.id_preparacao'), primary_key=True)

class UsoPlantaExtracao(db.Model):
    __tablename__ = 'Uso_Planta_Extracao'
    id_uso_planta = db.Column(db.Integer, db.ForeignKey('Uso_Planta.id_uso_planta'), primary_key=True)
    id_extraccao = db.Column(db.Integer, db.ForeignKey('Metodo_extraccao.id_extraccao'), primary_key=True)

# =====================================================
# RELACIONAMENTOS MANY-TO-MANY ATUALIZADOS
# =====================================================

Planta.autores = db.relationship('Autor', secondary='Autor_Planta', backref='plantas', lazy='select')
Planta.provincias = db.relationship('Provincia', secondary='Planta_Provincia', backref='plantas', lazy='select')
Planta.propriedades = db.relationship('PropriedadeFarmacologica', secondary='Planta_Propriedade', backref='plantas', lazy='select')
Planta.compostos = db.relationship('ComposicaoQuimica', secondary='Planta_Composicao', backref='plantas', lazy='select')
Planta.referencias = db.relationship('Referencia', secondary='Planta_Referencia', backref='plantas', lazy='select')

# NOVOS RELACIONAMENTOS PARA USO ESPECÍFICO
UsoPlanta.indicacoes = db.relationship('Indicacao', secondary='Uso_Planta_Indicacao', backref='usos_planta', lazy='select')
UsoPlanta.metodos_preparacao = db.relationship('MetodoPreparacaoTradicional', secondary='Uso_Planta_Preparacao', backref='usos_planta', lazy='select')
UsoPlanta.metodos_extracao = db.relationship('MetodoExtracao', secondary='Uso_Planta_Extracao', backref='usos_planta', lazy='select')

# Função auxiliar para tratamento de erros
def handle_error(e, message="Erro interno do servidor"):
    print(f"Erro: {str(e)}")
    return jsonify({'error': message, 'details': str(e)}), 500

# ROTAS - FAMÍLIAS
@app.route('/api/familias', methods=['GET'])
def get_familias():
    try:
        familias = Familia.query.all()
        return jsonify([familia.to_dict() for familia in familias])
    except Exception as e:
        return handle_error(e)

@app.route('/api/familias', methods=['POST'])
def create_familia():
    try:
        data = request.get_json()
        if not data or 'nome_familia' not in data:
            return jsonify({'error': 'Nome da família é obrigatório'}), 400
        
        familia = Familia(nome_familia=data['nome_familia'])
        db.session.add(familia)
        db.session.commit()
        return jsonify(familia.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - PLANTAS (ATUALIZADAS PARA NOVA ESTRUTURA)
@app.route('/api/plantas', methods=['GET'])
def get_plantas():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Parâmetros de busca
        search_popular = request.args.get('search_popular', '')
        search_cientifico = request.args.get('search_cientifico', '')
        search = request.args.get('search', '')
        
        # Filtros
        familia_id = request.args.get('familia_id', type=int)
        autor_id = request.args.get('autor_id', type=int)
        provincia_id = request.args.get('provincia_id', type=int)
        regiao_id = request.args.get('regiao_id', type=int)
        parte_usada = request.args.get('parte_usada', '')
        parte_id = request.args.get('parte_id', type=int)
        
        query = Planta.query
        
        # Filtro por nome popular (buscar nos nomes comuns)
        if search_popular:
            query = query.join(Planta.nomes_comuns).filter(
                NomeComum.nome_comum_planta.ilike(f'%{search_popular}%')
            )
        
        # Filtro por nome científico
        if search_cientifico:
            query = query.filter(Planta.nome_cientifico.ilike(f'%{search_cientifico}%'))
        
        # Filtro geral (científico OU popular)
        if search and not search_popular and not search_cientifico:
            query = query.outerjoin(Planta.nomes_comuns).filter(
                db.or_(
                    Planta.nome_cientifico.ilike(f'%{search}%'),
                    NomeComum.nome_comum_planta.ilike(f'%{search}%')
                )
            )
        
        # Filtro por família
        if familia_id:
            query = query.filter(Planta.id_familia == familia_id)
            
        # Filtro por autor
        if autor_id:
            query = query.join(Planta.autores).filter(Autor.id_autor == autor_id)
            
        # Filtro por província
        if provincia_id:
            query = query.join(Planta.provincias).filter(Provincia.id_provincia == provincia_id)
        
        # Filtro por região (através da província)
        if regiao_id:
            query = query.join(Planta.provincias).join(Provincia.regioes).filter(Regiao.id_regiao == regiao_id)
            
        # CORRIGIDO: Filtro por parte usada através da nova estrutura
        if parte_usada:
            query = query.join(Planta.usos_planta).join(UsoPlanta.parte_usada).filter(
                ParteUsada.parte_usada.ilike(f'%{parte_usada}%')
            )
        elif parte_id:
            query = query.join(Planta.usos_planta).filter(UsoPlanta.id_parte == parte_id)
        
        # Remover duplicatas
        query = query.distinct()
        
        plantas = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'plantas': [planta.to_dict() for planta in plantas.items],
            'total': plantas.total,
            'pages': plantas.pages,
            'current_page': page,
            'per_page': per_page
        })
    except Exception as e:
        return handle_error(e)

@app.route('/api/plantas/<int:id_planta>', methods=['GET'])
def get_planta(id_planta):
    try:
        planta = Planta.query.get_or_404(id_planta)
        return jsonify(planta.to_dict(include_relations=True))
    except Exception as e:
        return handle_error(e)

@app.route('/api/plantas', methods=['POST'])
def create_planta():
    try:
        data = request.get_json()
        required_fields = ['nome_cientifico', 'id_familia']
        
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Campos obrigatórios: nome_cientifico, id_familia'}), 400
        
        planta = Planta(
            nome_cientifico=data['nome_cientifico'],
            numero_exsicata=data.get('numero_exsicata'),
            id_familia=data['id_familia']
        )
        
        db.session.add(planta)
        db.session.flush()  # Para obter o ID da planta
        
        # Adicionar nomes comuns se fornecidos
        if 'nomes_comuns' in data and data['nomes_comuns']:
            for nome_comum in data['nomes_comuns']:
                if nome_comum.strip():
                    nome = NomeComum(
                        id_planta=planta.id_planta,
                        nome_comum_planta=nome_comum.strip()
                    )
                    db.session.add(nome)
        
        db.session.commit()
        return jsonify(planta.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Família não encontrada'}), 400
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

@app.route('/api/plantas/<int:id_planta>', methods=['PUT'])
def update_planta(id_planta):
    try:
        planta = Planta.query.get_or_404(id_planta)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Atualizar campos básicos
        planta.nome_cientifico = data.get('nome_cientifico', planta.nome_cientifico)
        planta.numero_exsicata = data.get('numero_exsicata', planta.numero_exsicata)
        planta.id_familia = data.get('id_familia', planta.id_familia)
        
        # Atualizar nomes comuns se fornecidos
        if 'nomes_comuns' in data:
            # Remover nomes antigos
            NomeComum.query.filter_by(id_planta=id_planta).delete()
            
            # Adicionar novos nomes
            for nome_comum in data['nomes_comuns']:
                if nome_comum.strip():
                    nome = NomeComum(
                        id_planta=id_planta,
                        nome_comum_planta=nome_comum.strip()
                    )
                    db.session.add(nome)
        
        db.session.commit()
        return jsonify(planta.to_dict())
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

@app.route('/api/plantas/<int:id_planta>', methods=['DELETE'])
def delete_planta(id_planta):
    try:
        planta = Planta.query.get_or_404(id_planta)
        db.session.delete(planta)
        db.session.commit()
        return jsonify({'message': 'Planta eliminada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - NOMES COMUNS
@app.route('/api/plantas/<int:id_planta>/nomes-comuns', methods=['GET'])
def get_nomes_comuns_planta(id_planta):
    try:
        planta = Planta.query.get_or_404(id_planta)
        return jsonify([nc.to_dict() for nc in planta.nomes_comuns])
    except Exception as e:
        return handle_error(e)

@app.route('/api/plantas/<int:id_planta>/nomes-comuns', methods=['POST'])
def add_nome_comum_planta(id_planta):
    try:
        planta = Planta.query.get_or_404(id_planta)
        data = request.get_json()
        
        if not data or 'nome_comum_planta' not in data:
            return jsonify({'error': 'Nome comum é obrigatório'}), 400
        
        nome = NomeComum(
            id_planta=id_planta,
            nome_comum_planta=data['nome_comum_planta']
        )
        db.session.add(nome)
        db.session.commit()
        return jsonify(nome.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# NOVAS ROTAS PARA USO ESPECÍFICO DE PLANTAS
@app.route('/api/plantas/<int:id_planta>/usos', methods=['GET'])
def get_usos_planta(id_planta):
    try:
        planta = Planta.query.get_or_404(id_planta)
        usos = []
        
        for uso in planta.usos_planta:
            uso_data = uso.to_dict()
            uso_data.update({
                'indicacoes': [ind.to_dict() for ind in uso.indicacoes],
                'metodos_preparacao': [mp.to_dict() for mp in uso.metodos_preparacao],
                'metodos_extracao': [me.to_dict() for me in uso.metodos_extracao]
            })
            usos.append(uso_data)
        
        return jsonify(usos)
    except Exception as e:
        return handle_error(e)

@app.route('/api/plantas/<int:id_planta>/usos', methods=['POST'])
def create_uso_planta(id_planta):
    try:
        planta = Planta.query.get_or_404(id_planta)
        data = request.get_json()
        
        if not data or 'id_parte' not in data:
            return jsonify({'error': 'ID da parte é obrigatório'}), 400
        
        # Verificar se já existe uso desta parte para esta planta
        uso_existente = UsoPlanta.query.filter_by(
            id_planta=id_planta,
            id_parte=data['id_parte']
        ).first()
        
        if uso_existente:
            return jsonify({'error': 'Uso desta parte já existe para esta planta'}), 409
        
        uso = UsoPlanta(
            id_planta=id_planta,
            id_parte=data['id_parte'],
            observacoes=data.get('observacoes')
        )
        
        db.session.add(uso)
        db.session.flush()
        
        # Adicionar indicações se fornecidas
        if 'indicacoes' in data:
            for id_indicacao in data['indicacoes']:
                indicacao = Indicacao.query.get(id_indicacao)
                if indicacao:
                    uso.indicacoes.append(indicacao)
        
        # Adicionar métodos de preparação se fornecidos
        if 'metodos_preparacao' in data:
            for id_preparacao in data['metodos_preparacao']:
                metodo = MetodoPreparacaoTradicional.query.get(id_preparacao)
                if metodo:
                    uso.metodos_preparacao.append(metodo)
        
        # Adicionar métodos de extração se fornecidos
        if 'metodos_extracao' in data:
            for id_extraccao in data['metodos_extracao']:
                metodo = MetodoExtracao.query.get(id_extraccao)
                if metodo:
                    uso.metodos_extracao.append(metodo)
        
        db.session.commit()
        return jsonify(uso.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS EXISTENTES MANTIDAS
@app.route('/api/referencias', methods=['GET'])
def get_referencias():
    try:
        referencias = Referencia.query.all()
        return jsonify([ref.to_dict() for ref in referencias])
    except Exception as e:
        return handle_error(e)

@app.route('/api/referencias', methods=['POST'])
def create_referencia():
    try:
        data = request.get_json()
        if not data or 'link_referencia' not in data:
            return jsonify({'error': 'Link da referência é obrigatório'}), 400
        
        referencia = Referencia(link_referencia=data['link_referencia'])
        db.session.add(referencia)
        db.session.commit()
        return jsonify(referencia.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

@app.route('/api/autores', methods=['GET'])
def get_autores():
    try:
        autores = Autor.query.all()
        return jsonify([autor.to_dict() for autor in autores])
    except Exception as e:
        return handle_error(e)

@app.route('/api/autores', methods=['POST'])
def create_autor():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        autor = Autor(
            nome_autor=data.get('nome_autor'),
            afiliacao=data.get('afiliacao'),
            sigla_afiliacao=data.get('sigla_afiliacao')
        )
        db.session.add(autor)
        db.session.commit()
        return jsonify(autor.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - PROVÍNCIAS
@app.route('/api/provincias', methods=['GET'])
def get_provincias():
    try:
        provincias = Provincia.query.all()
        return jsonify([provincia.to_dict() for provincia in provincias])
    except Exception as e:
        return handle_error(e)

@app.route('/api/provincias', methods=['POST'])
def create_provincia():
    try:
        data = request.get_json()
        if not data or 'nome_provincia' not in data:
            return jsonify({'error': 'Nome da província é obrigatório'}), 400
        
        provincia = Provincia(nome_provincia=data['nome_provincia'])
        db.session.add(provincia)
        db.session.commit()
        return jsonify(provincia.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - REGIÕES
@app.route('/api/regioes', methods=['GET'])
def get_regioes():
    try:
        provincia_id = request.args.get('provincia_id', type=int)
        query = Regiao.query
        
        if provincia_id:
            query = query.filter(Regiao.id_provincia == provincia_id)
            
        regioes = query.all()
        return jsonify([regiao.to_dict() for regiao in regioes])
    except Exception as e:
        return handle_error(e)

@app.route('/api/regioes', methods=['POST'])
def create_regiao():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        regiao = Regiao(
            nome_regiao=data.get('nome_regiao'),
            id_provincia=data.get('id_provincia')
        )
        db.session.add(regiao)
        db.session.commit()
        return jsonify(regiao.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - PARTES USADAS
@app.route('/api/partes-usadas', methods=['GET'])
def get_partes_usadas():
    try:
        partes = ParteUsada.query.all()
        return jsonify([parte.to_dict() for parte in partes])
    except Exception as e:
        return handle_error(e)

@app.route('/api/partes-usadas/<int:id_uso>', methods=['GET'])
def get_parte_usada(id_uso):
    try:
        parte = ParteUsada.query.get_or_404(id_uso)
        return jsonify(parte.to_dict())
    except Exception as e:
        return handle_error(e)

@app.route('/api/partes-usadas', methods=['POST'])
def create_parte_usada():
    try:
        data = request.get_json()
        if not data or 'parte_usada' not in data:
            return jsonify({'error': 'Nome da parte usada é obrigatório'}), 400
        
        parte = ParteUsada(parte_usada=data['parte_usada'])
        db.session.add(parte)
        db.session.commit()
        return jsonify(parte.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - PROPRIEDADES FARMACOLÓGICAS
@app.route('/api/propriedades', methods=['GET'])
def get_propriedades():
    try:
        propriedades = PropriedadeFarmacologica.query.all()
        return jsonify([prop.to_dict() for prop in propriedades])
    except Exception as e:
        return handle_error(e)

@app.route('/api/propriedades', methods=['POST'])
def create_propriedade():
    try:
        data = request.get_json()
        if not data or 'descricao' not in data:
            return jsonify({'error': 'Descrição é obrigatória'}), 400
        
        propriedade = PropriedadeFarmacologica(descricao=data['descricao'])
        db.session.add(propriedade)
        db.session.commit()
        return jsonify(propriedade.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - COMPOSTOS QUÍMICOS
@app.route('/api/compostos', methods=['GET'])
def get_compostos():
    try:
        compostos = ComposicaoQuimica.query.all()
        return jsonify([composto.to_dict() for composto in compostos])
    except Exception as e:
        return handle_error(e)

@app.route('/api/compostos', methods=['POST'])
def create_composto():
    try:
        data = request.get_json()
        if not data or 'nome_composto' not in data:
            return jsonify({'error': 'Nome do composto é obrigatório'}), 400
        
        composto = ComposicaoQuimica(nome_composto=data['nome_composto'])
        db.session.add(composto)
        db.session.commit()
        return jsonify(composto.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - INDICAÇÕES
@app.route('/api/indicacoes', methods=['GET'])
def get_indicacoes():
    try:
        indicacoes = Indicacao.query.all()
        return jsonify([indicacao.to_dict() for indicacao in indicacoes])
    except Exception as e:
        return handle_error(e)

@app.route('/api/indicacoes', methods=['POST'])
def create_indicacao():
    try:
        data = request.get_json()
        if not data or 'descricao' not in data:
            return jsonify({'error': 'Descrição é obrigatória'}), 400
        
        indicacao = Indicacao(descricao=data['descricao'])
        db.session.add(indicacao)
        db.session.commit()
        return jsonify(indicacao.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - MÉTODOS DE EXTRAÇÃO
@app.route('/api/metodos-extracao', methods=['GET'])
def get_metodos_extracao():
    try:
        metodos = MetodoExtracao.query.all()
        return jsonify([metodo.to_dict() for metodo in metodos])
    except Exception as e:
        return handle_error(e)

@app.route('/api/metodos-extracao', methods=['POST'])
def create_metodo_extracao():
    try:
        data = request.get_json()
        if not data or 'descricao' not in data:
            return jsonify({'error': 'Descrição é obrigatória'}), 400
        
        metodo = MetodoExtracao(descricao=data['descricao'])
        db.session.add(metodo)
        db.session.commit()
        return jsonify(metodo.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - MÉTODOS DE PREPARAÇÃO
@app.route('/api/metodos-preparacao', methods=['GET'])
def get_metodos_preparacao():
    try:
        metodos = MetodoPreparacaoTradicional.query.all()
        return jsonify([metodo.to_dict() for metodo in metodos])
    except Exception as e:
        return handle_error(e)

@app.route('/api/metodos-preparacao', methods=['POST'])
def create_metodo_preparacao():
    try:
        data = request.get_json()
        if not data or 'descricao' not in data:
            return jsonify({'error': 'Descrição é obrigatória'}), 400
        
        metodo = MetodoPreparacaoTradicional(descricao=data['descricao'])
        db.session.add(metodo)
        db.session.commit()
        return jsonify(metodo.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS DE ASSOCIAÇÃO
@app.route('/api/plantas/<int:id_planta>/autores/<int:id_autor>', methods=['POST'])
def associar_autor_planta(id_planta, id_autor):
    try:
        planta = Planta.query.get_or_404(id_planta)
        autor = Autor.query.get_or_404(id_autor)
        
        if autor not in planta.autores:
            planta.autores.append(autor)
            db.session.commit()
            return jsonify({'message': 'Autor associado à planta com sucesso'}), 200
        else:
            return jsonify({'message': 'Autor já associado a esta planta'}), 409
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

@app.route('/api/plantas/<int:id_planta>/referencias/<int:id_referencia>', methods=['POST'])
def associar_referencia_planta(id_planta, id_referencia):
    try:
        planta = Planta.query.get_or_404(id_planta)
        referencia = Referencia.query.get_or_404(id_referencia)
        
        if referencia not in planta.referencias:
            planta.referencias.append(referencia)
            db.session.commit()
            return jsonify({'message': 'Referência associada à planta com sucesso'}), 200
        else:
            return jsonify({'message': 'Referência já associada a esta planta'}), 409
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

@app.route('/api/plantas/<int:id_planta>/provincias/<int:id_provincia>', methods=['POST'])
def associar_provincia_planta(id_planta, id_provincia):
    try:
        planta = Planta.query.get_or_404(id_planta)
        provincia = Provincia.query.get_or_404(id_provincia)
        
        if provincia not in planta.provincias:
            planta.provincias.append(provincia)
            db.session.commit()
            return jsonify({'message': 'Província associada à planta com sucesso'}), 200
        else:
            return jsonify({'message': 'Província já associada a esta planta'}), 409
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# NOVAS ROTAS PARA GERENCIAR INDICAÇÕES ESPECÍFICAS DE USO
@app.route('/api/usos/<int:id_uso_planta>/indicacoes/<int:id_indicacao>', methods=['POST'])
def associar_indicacao_uso(id_uso_planta, id_indicacao):
    try:
        uso = UsoPlanta.query.get_or_404(id_uso_planta)
        indicacao = Indicacao.query.get_or_404(id_indicacao)
        
        if indicacao not in uso.indicacoes:
            uso.indicacoes.append(indicacao)
            db.session.commit()
            return jsonify({'message': 'Indicação associada ao uso com sucesso'}), 200
        else:
            return jsonify({'message': 'Indicação já associada a este uso'}), 409
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

@app.route('/api/usos/<int:id_uso_planta>/indicacoes/<int:id_indicacao>', methods=['DELETE'])
def desassociar_indicacao_uso(id_uso_planta, id_indicacao):
    try:
        uso = UsoPlanta.query.get_or_404(id_uso_planta)
        indicacao = Indicacao.query.get_or_404(id_indicacao)
        
        if indicacao in uso.indicacoes:
            uso.indicacoes.remove(indicacao)
            db.session.commit()
            return jsonify({'message': 'Indicação removida do uso com sucesso'}), 200
        else:
            return jsonify({'message': 'Indicação não estava associada a este uso'}), 404
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS DE ESTATÍSTICAS
@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        stats = {
            'total_plantas': Planta.query.count(),
            'total_familias': Familia.query.count(),
            'total_autores': Autor.query.count(),
            'total_provincias': Provincia.query.count(),
            'total_regioes': Regiao.query.count(),
            'total_partes_usadas': ParteUsada.query.count(),
            'total_indicacoes': Indicacao.query.count(),
            'total_propriedades': PropriedadeFarmacologica.query.count(),
            'total_compostos': ComposicaoQuimica.query.count(),
            'total_metodos_extracao': MetodoExtracao.query.count(),
            'total_metodos_preparacao': MetodoPreparacaoTradicional.query.count(),
            'total_referencias': Referencia.query.count(),
            'total_nomes_comuns': NomeComum.query.count(),
            'total_usos_especificos': UsoPlanta.query.count()
        }
        return jsonify(stats)
    except Exception as e:
        return handle_error(e)

# ROTA DE DEBUG - Verificar correlações ATUALIZADA
@app.route('/api/debug/planta/<int:id_planta>/correlacoes', methods=['GET'])
def debug_plant_correlations(id_planta):
    try:
        planta = Planta.query.get_or_404(id_planta)
        
        debug_data = {
            'planta_id': planta.id_planta,
            'nome_cientifico': planta.nome_cientifico,
            'nomes_comuns': [nc.nome_comum_planta for nc in planta.nomes_comuns],
            'usos_especificos_detalhados': []
        }
        
        # CORRIGIDO: Verificar cada uso específico e suas correlações
        for uso in planta.usos_planta:
            uso_debug = {
                'uso_id': uso.id_uso_planta,
                'parte_id': uso.id_parte,
                'parte_nome': uso.parte_usada.parte_usada if uso.parte_usada else None,
                'observacoes': uso.observacoes,
                'indicacoes_count': len(uso.indicacoes),
                'indicacoes': [
                    {
                        'id': ind.id_indicacao,
                        'descricao': ind.descricao
                    } for ind in uso.indicacoes
                ],
                'metodos_preparacao_count': len(uso.metodos_preparacao),
                'metodos_preparacao': [
                    {
                        'id': mp.id_preparacao,
                        'descricao': mp.descricao
                    } for mp in uso.metodos_preparacao
                ],
                'metodos_extracao_count': len(uso.metodos_extracao),
                'metodos_extracao': [
                    {
                        'id': me.id_extraccao,
                        'descricao': me.descricao
                    } for me in uso.metodos_extracao
                ]
            }
            debug_data['usos_especificos_detalhados'].append(uso_debug)
        
        return jsonify(debug_data)
    except Exception as e:
        return handle_error(e)

# ROTA DE SAÚDE DA API
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '4.0.0',
        'estrutura': 'corrigida_com_uso_especifico_por_planta'
    })

# Tratamento de erros globais
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Recurso não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)