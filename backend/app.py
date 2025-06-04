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
CORS(app)  # Permitir requests do Next.js

# Modelos da Base de Dados
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
    nome_cientifico = db.Column(db.String(150), nullable=False)
    nome_comum = db.Column(db.String(150))
    numero_exsicata = db.Column(db.String(50))
    referencia = db.Column(db.Text)
    id_familia = db.Column(db.Integer, db.ForeignKey('Familia.id_familia'), nullable=False)
    
    def to_dict(self, include_relations=False):
        data = {
            'id_planta': self.id_planta,
            'nome_cientifico': self.nome_cientifico,
            'nome_comum': self.nome_comum,
            'numero_exsicata': self.numero_exsicata,
            'referencia': self.referencia,
            'id_familia': self.id_familia,
            'familia': self.familia.nome_familia if self.familia else None
        }
        
        if include_relations:
            data.update({
                'autores': [autor.to_dict() for autor in self.autores],
                'locais': [local.to_dict() for local in self.locais],
                'usos': [uso.to_dict() for uso in self.usos],
                'propriedades': [prop.to_dict() for prop in self.propriedades],
                'compostos': [comp.to_dict() for comp in self.compostos]
            })
        
        return data

class Autor(db.Model):
    __tablename__ = 'Autor'
    id_autor = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_autor = db.Column(db.String(100), nullable=False)
    afiliacao = db.Column(db.String(150))
    
    def to_dict(self):
        return {
            'id_autor': self.id_autor,
            'nome_autor': self.nome_autor,
            'afiliacao': self.afiliacao
        }

class AutorPlanta(db.Model):
    __tablename__ = 'Autor_Planta'
    id_autor = db.Column(db.Integer, db.ForeignKey('Autor.id_autor'), primary_key=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), primary_key=True)

class LocalColheita(db.Model):
    __tablename__ = 'Local_colheita'
    id_local = db.Column(db.Integer, primary_key=True, autoincrement=True)
    provincia = db.Column(db.String(100))
    regiao = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id_local': self.id_local,
            'provincia': self.provincia,
            'regiao': self.regiao
        }

class PlantaLocal(db.Model):
    __tablename__ = 'Planta_Local'
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), primary_key=True)
    id_local = db.Column(db.Integer, db.ForeignKey('Local_colheita.id_local'), primary_key=True)

class Uso(db.Model):
    __tablename__ = 'Uso'
    id_uso = db.Column(db.Integer, primary_key=True, autoincrement=True)
    parte_usada = db.Column(db.String(150))
    indicacao_uso = db.Column(db.Text)
    metodo_preparacao_tradicional = db.Column(db.Text)
    metodo_extraccao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id_uso': self.id_uso,
            'parte_usada': self.parte_usada,
            'indicacao_uso': self.indicacao_uso,
            'metodo_preparacao_tradicional': self.metodo_preparacao_tradicional,
            'metodo_extraccao': self.metodo_extraccao
        }

class PlantaUso(db.Model):
    __tablename__ = 'Planta_Uso'
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta.id_planta'), primary_key=True)
    id_uso = db.Column(db.Integer, db.ForeignKey('Uso.id_uso'), primary_key=True)

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

# Configurar relacionamentos many-to-many
Planta.autores = db.relationship('Autor', secondary='Autor_Planta', backref='plantas', lazy='select')
Planta.locais = db.relationship('LocalColheita', secondary='Planta_Local', backref='plantas', lazy='select')
Planta.usos = db.relationship('Uso', secondary='Planta_Uso', backref='plantas', lazy='select')
Planta.propriedades = db.relationship('PropriedadeFarmacologica', secondary='Planta_Propriedade', backref='plantas', lazy='select')
Planta.compostos = db.relationship('ComposicaoQuimica', secondary='Planta_Composicao', backref='plantas', lazy='select')

# Função auxiliar para tratamento de erros
def handle_error(e, message="Erro interno do servidor"):
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

@app.route('/api/familias/<int:id_familia>', methods=['GET'])
def get_familia(id_familia):
    try:
        familia = Familia.query.get_or_404(id_familia)
        return jsonify(familia.to_dict())
    except Exception as e:
        return handle_error(e)

# ROTAS - PLANTAS
@app.route('/api/plantas', methods=['GET'])
def get_plantas():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        familia_id = request.args.get('familia_id', type=int)
        
        query = Planta.query
        
        if search:
            query = query.filter(
                db.or_(
                    Planta.nome_cientifico.ilike(f'%{search}%'),
                    Planta.nome_comum.ilike(f'%{search}%')
                )
            )
        
        if familia_id:
            query = query.filter(Planta.id_familia == familia_id)
        
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
            nome_comum=data.get('nome_comum'),
            numero_exsicata=data.get('numero_exsicata'),
            referencia=data.get('referencia'),
            id_familia=data['id_familia']
        )
        
        db.session.add(planta)
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
        
        planta.nome_cientifico = data.get('nome_cientifico', planta.nome_cientifico)
        planta.nome_comum = data.get('nome_comum', planta.nome_comum)
        planta.numero_exsicata = data.get('numero_exsicata', planta.numero_exsicata)
        planta.referencia = data.get('referencia', planta.referencia)
        planta.id_familia = data.get('id_familia', planta.id_familia)
        
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

# ROTAS - AUTORES
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
        if not data or 'nome_autor' not in data:
            return jsonify({'error': 'Nome do autor é obrigatório'}), 400
        
        autor = Autor(
            nome_autor=data['nome_autor'],
            afiliacao=data.get('afiliacao')
        )
        db.session.add(autor)
        db.session.commit()
        return jsonify(autor.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - LOCAIS DE COLHEITA
@app.route('/api/locais', methods=['GET'])
def get_locais():
    try:
        locais = LocalColheita.query.all()
        return jsonify([local.to_dict() for local in locais])
    except Exception as e:
        return handle_error(e)

@app.route('/api/locais', methods=['POST'])
def create_local():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        local = LocalColheita(
            provincia=data.get('provincia'),
            regiao=data.get('regiao')
        )
        db.session.add(local)
        db.session.commit()
        return jsonify(local.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# ROTAS - USOS
@app.route('/api/usos', methods=['GET'])
def get_usos():
    try:
        usos = Uso.query.all()
        return jsonify([uso.to_dict() for uso in usos])
    except Exception as e:
        return handle_error(e)

@app.route('/api/usos', methods=['POST'])
def create_uso():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        uso = Uso(
            parte_usada=data.get('parte_usada'),
            indicacao_uso=data.get('indicacao_uso'),
            metodo_preparacao_tradicional=data.get('metodo_preparacao_tradicional'),
            metodo_extraccao=data.get('metodo_extraccao')
        )
        db.session.add(uso)
        db.session.commit()
        return jsonify(uso.to_dict()), 201
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

@app.route('/api/plantas/<int:id_planta>/locais/<int:id_local>', methods=['POST'])
def associar_local_planta(id_planta, id_local):
    try:
        planta = Planta.query.get_or_404(id_planta)
        local = LocalColheita.query.get_or_404(id_local)
        
        if local not in planta.locais:
            planta.locais.append(local)
            db.session.commit()
            return jsonify({'message': 'Local associado à planta com sucesso'}), 200
        else:
            return jsonify({'message': 'Local já associado a esta planta'}), 409
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
            'total_locais': LocalColheita.query.count(),
            'total_usos': Uso.query.count(),
            'total_propriedades': PropriedadeFarmacologica.query.count(),
            'total_compostos': ComposicaoQuimica.query.count()
        }
        return jsonify(stats)
    except Exception as e:
        return handle_error(e)

# ROTA DE SAÚDE DA API
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
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