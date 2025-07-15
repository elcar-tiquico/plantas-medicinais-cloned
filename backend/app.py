from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask import send_from_directory
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
import os
from datetime import datetime
from datetime import datetime
from dotenv import load_dotenv
from werkzeug.exceptions import NotFound
load_dotenv()

#UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'plantas_imagens')
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'D:\\Elcar\\uploads\\plantas_imagens')

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
    __tablename__ = 'familia'
    id_familia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_familia = db.Column(db.String(100), nullable=False)
    
    plantas = db.relationship('Planta', backref='familia', lazy=True)
    
    def to_dict(self):
        return {
            'id_familia': self.id_familia,
            'nome_familia': self.nome_familia
        }

class Planta(db.Model):
    __tablename__ = 'planta'
    id_planta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_familia = db.Column(db.Integer, db.ForeignKey('familia.id_familia'), nullable=False)
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
            
            referencias_com_autores = []
            for ref in self.referencias:
                ref_data = ref.to_dict(include_autores=True)
                referencias_com_autores.append(ref_data)


            data.update({
                'autores': [autor.to_dict() for autor in self.autores],
                'provincias': [provincia.to_dict() for provincia in self.provincias],
                'partes_usadas': partes_com_indicacoes,  # ← CORRIGIDO: agora usa estrutura específica
                'propriedades': [prop.to_dict() for prop in self.propriedades],
                'compostos': [comp.to_dict() for comp in self.compostos],
                'referencias': referencias_com_autores,
                'imagens': [
                    {
                        'id_imagem': img.id_imagem,
                        'nome_arquivo': img.nome_arquivo,
                        'ordem': img.ordem,
                        'legenda': img.legenda or '',
                        'url': get_full_image_url(self.id_planta, img.nome_arquivo),
                        'data_upload': img.data_upload.isoformat() if img.data_upload else None
                    } for img in self.imagens
                ] 
            })
        
        return data

class NomeComum(db.Model):
    __tablename__ = 'nome_comum'
    id_nome = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), nullable=False)
    nome_comum_planta = db.Column(db.String(150), nullable=False)
    
    def to_dict(self):
        return {
            'id_nome': self.id_nome,
            'id_planta': self.id_planta,
            'nome_comum_planta': self.nome_comum_planta
        }

class AutorReferencia(db.Model):
    __tablename__ = 'autor_referencia'
    id_autor = db.Column(db.Integer, db.ForeignKey('autor.id_autor'), primary_key=True)  # Should be 'autor.id_autor'
    id_referencia = db.Column(db.Integer, db.ForeignKey('referencia.id_referencia'), primary_key=True)
    ordem_autor = db.Column(db.Integer, default=1)
    papel = db.Column(db.Enum('primeiro', 'correspondente', 'coautor'), default='coautor')
    
    # Relacionamentos
    autor = db.relationship('Autor', backref='autor_referencias')
    referencia = db.relationship('Referencia', backref='referencia_autores')

class PlantaImagem(db.Model):
    __tablename__ = 'planta_imagem'
    id_imagem = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), nullable=False)
    nome_arquivo = db.Column(db.String(255), nullable=False)
    ordem = db.Column(db.Integer, default=1)
    legenda = db.Column(db.Text)
    data_upload = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento com a planta
    planta = db.relationship('Planta', backref=db.backref('imagens', lazy=True))

class Referencia(db.Model):
    __tablename__ = 'referencia'
    id_referencia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    link_referencia = db.Column(db.Text, nullable=False)
    tipo_referencia = db.Column(db.Enum('URL', 'Artigo', 'Livro', 'Tese'), nullable=True)
    titulo_referencia = db.Column(db.Text, nullable=True)
    ano = db.Column(db.String(4), nullable=True)
    
    def to_dict(self, include_autores=False):
        data = {
            'id_referencia': self.id_referencia,
            'link_referencia': self.link_referencia,
            'tipo_referencia': self.tipo_referencia,
            'titulo_referencia': self.titulo_referencia,
            'ano': self.ano
        }
        
        if include_autores:
            # Buscar autores desta referência ordenados
            autores_ref = db.session.query(
                Autor.id_autor,
                Autor.nome_autor,
                Autor.afiliacao,
                Autor.sigla_afiliacao,
                AutorReferencia.ordem_autor,
                AutorReferencia.papel
            ).join(
                AutorReferencia, Autor.id_autor == AutorReferencia.id_autor
            ).filter(
                AutorReferencia.id_referencia == self.id_referencia
            ).order_by(AutorReferencia.ordem_autor).all()
            
            data['autores'] = [{
                'id_autor': ar.id_autor,
                'nome_autor': ar.nome_autor,
                'afiliacao': ar.afiliacao,
                'sigla_afiliacao': ar.sigla_afiliacao,
                'ordem_autor': ar.ordem_autor,
                'papel': ar.papel
            } for ar in autores_ref]
        
        return data

class PlantaReferencia(db.Model):
    __tablename__ = 'planta_referencia'
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)
    id_referencia = db.Column(db.Integer, db.ForeignKey('referencia.id_referencia'), primary_key=True)

class PropriedadeFarmacologica(db.Model):
    __tablename__ = 'propriedade_farmacologica'
    id_propriedade = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id_propriedade': self.id_propriedade,
            'descricao': self.descricao
        }

class PlantaPropriedade(db.Model):
    __tablename__ = 'planta_propriedade'
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)
    id_propriedade = db.Column(db.Integer, db.ForeignKey('propriedade_farmacologica.id_propriedade'), primary_key=True)

class Autor(db.Model):
    __tablename__ = 'autor'
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
    __tablename__ = 'autor_planta'
    id_autor = db.Column(db.Integer, db.ForeignKey('autor.id_autor'), primary_key=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)

class ComposicaoQuimica(db.Model):
    __tablename__ = 'composicao_quimica'
    id_composto = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_composto = db.Column(db.String(150))
    
    def to_dict(self):
        return {
            'id_composto': self.id_composto,
            'nome_composto': self.nome_composto
        }

class PlantaComposicao(db.Model):
    __tablename__ = 'planta_composicao'
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)
    id_composto = db.Column(db.Integer, db.ForeignKey('composicao_quimica.id_composto'), primary_key=True)

class Provincia(db.Model):
    __tablename__ = 'provincia'
    id_provincia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_provincia = db.Column(db.String(100), nullable=False)
    
    regioes = db.relationship('Regiao', backref='provincia', lazy=True)
    
    def to_dict(self):
        return {
            'id_provincia': self.id_provincia,
            'nome_provincia': self.nome_provincia
        }

class Regiao(db.Model):
    __tablename__ = 'regiao'
    id_regiao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_regiao = db.Column(db.String(100))
    id_provincia = db.Column(db.Integer, db.ForeignKey('provincia.id_provincia'))
    
    def to_dict(self):
        return {
            'id_regiao': self.id_regiao,
            'nome_regiao': self.nome_regiao,
            'id_provincia': self.id_provincia,
            'provincia': self.provincia.nome_provincia if self.provincia else None
        }

class PlantaProvincia(db.Model):
    __tablename__ = 'planta_provincia'
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), primary_key=True)
    id_provincia = db.Column(db.Integer, db.ForeignKey('provincia.id_provincia'), primary_key=True)

class ParteUsada(db.Model):
    __tablename__ = 'parte_usada'
    id_uso = db.Column(db.Integer, primary_key=True, autoincrement=True)
    parte_usada = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id_uso': self.id_uso,
            'parte_usada': self.parte_usada
        }

class MetodoExtracao(db.Model):
    __tablename__ = 'metodo_extraccao'
    id_extraccao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id_extraccao': self.id_extraccao,
            'descricao': self.descricao
        }

class MetodoPreparacaoTradicional(db.Model):
    __tablename__ = 'metodo_preparacao_tradicional'
    id_preparacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id_preparacao': self.id_preparacao,
            'descricao': self.descricao
        }

class Indicacao(db.Model):
    __tablename__ = 'indicacao'
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
    __tablename__ = 'uso_planta'
    id_uso_planta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('planta.id_planta'), nullable=False)
    id_parte = db.Column(db.Integer, db.ForeignKey('parte_usada.id_uso'), nullable=False)
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

class LogPesquisas(db.Model):
    __tablename__ = 'log_pesquisas'
    id_pesquisa = db.Column(db.Integer, primary_key=True, autoincrement=True)
    termo_pesquisa = db.Column(db.String(255))
    tipo_pesquisa = db.Column(db.Enum('nome_comum', 'cientifico', 'familia', 'indicacao'), default='nome_comum')
    ip_usuario = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    data_pesquisa = db.Column(db.DateTime, default=datetime.utcnow)
    resultados_encontrados = db.Column(db.Integer, default=0)
# =====================================================
# RELACIONAMENTOS MANY-TO-MANY ATUALIZADOS
# =====================================================

Planta.autores = db.relationship('Autor', secondary='autor_planta', backref='plantas', lazy='select')  # CORRIGIDO
Planta.provincias = db.relationship('Provincia', secondary='planta_provincia', backref='plantas', lazy='select')  # CORRIGIDO
Planta.propriedades = db.relationship('PropriedadeFarmacologica', secondary='planta_propriedade', backref='plantas', lazy='select')  # CORRIGIDO
Planta.compostos = db.relationship('ComposicaoQuimica', secondary='planta_composicao', backref='plantas', lazy='select')  # CORRIGIDO
Planta.referencias = db.relationship('Referencia', secondary='planta_referencia', backref='plantas', lazy='select')  # CORRIGIDO

# NOVOS RELACIONAMENTOS PARA USO ESPECÍFICO (CORRIGIDOS):
UsoPlanta.indicacoes = db.relationship('Indicacao', secondary='uso_planta_indicacao', backref='usos_planta', lazy='select')  # CORRIGIDO
UsoPlanta.metodos_preparacao = db.relationship('MetodoPreparacaoTradicional', secondary='uso_planta_preparacao', backref='usos_planta', lazy='select')  # CORRIGIDO
UsoPlanta.metodos_extracao = db.relationship('MetodoExtracao', secondary='uso_planta_extracao', backref='usos_planta', lazy='select')  # CORRIGIDO

# Função auxiliar para tratamento de erros
def handle_error(e, message="Erro interno do servidor"):
    print(f"Erro: {str(e)}")
    return jsonify({'error': message, 'details': str(e)}), 500

def registar_pesquisa_segura(termo, tipo='nome_comum', resultados=0, request_obj=None):
    """
    Função SEGURA para registar pesquisas - com try/catch completo
    Se der erro, não afeta o funcionamento normal da API
    """
    try:
        if not termo or len(termo.strip()) == 0:
            return False  # Não registar pesquisas vazias
            
        ip_usuario = None
        user_agent = None
        
        if request_obj:
            try:
                ip_usuario = request_obj.remote_addr
                user_agent = request_obj.headers.get('User-Agent', '')
            except:
                pass  # Se der erro ao obter dados do request, continua
        
        nova_pesquisa = LogPesquisas(
            termo_pesquisa=termo[:255] if termo else None,  # Limitar tamanho
            tipo_pesquisa=tipo,
            resultados_encontrados=resultados,
            ip_usuario=ip_usuario[:45] if ip_usuario else None,  # Limitar tamanho
            user_agent=user_agent[:500] if user_agent else None  # Limitar tamanho
        )
        
        db.session.add(nova_pesquisa)
        db.session.commit()
        
        print(f"✅ Pesquisa registada: '{termo}' ({tipo}) -> {resultados} resultados")
        return True
        
    except Exception as e:
        # CRÍTICO: Se der erro no tracking, fazer rollback mas NÃO afetar a API principal
        try:
            db.session.rollback()
        except:
            pass
        print(f"⚠️ Erro ao registar pesquisa (não afeta funcionamento): {e}")
        return False

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

# Adicione estas atualizações ao seu arquivo Flask existente

# ROTA ATUALIZADA - PLANTAS (com suporte a busca por indicação)
# Modificação na rota /api/plantas do seu arquivo Flask (app.py)
# Substitua a rota existente por esta versão atualizada:

@app.route('/api/plantas', methods=['GET'])
def get_plantas():
    """VERSÃO COM FILTRO DE FAMÍLIA - Só busca e retorna resultados"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # ===== PARÂMETROS ORIGINAIS (mantidos iguais) =====
        search_popular = request.args.get('search_popular', '')
        search_cientifico = request.args.get('search_cientifico', '')
        search = request.args.get('search', '')
        
        # Filtros específicos (mantidos iguais + NOVO filtro família)
        autor_id = request.args.get('autor_id', type=int)
        provincia_id = request.args.get('provincia_id', type=int)
        familia_id = request.args.get('familia_id', type=int)  # NOVO FILTRO
        parte_usada = request.args.get('parte_usada', '')
        indicacao_id = request.args.get('indicacao_id', type=int)
        
        # ===== LÓGICA ORIGINAL MANTIDA 100% =====
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
            
        # Filtro por autor
        if autor_id:
            query = query.join(Planta.autores).filter(Autor.id_autor == autor_id)
            
        # Filtro por província
        if provincia_id:
            query = query.join(Planta.provincias).filter(Provincia.id_provincia == provincia_id)
            
        # NOVO: Filtro por família
        if familia_id:
            query = query.filter(Planta.id_familia == familia_id)
            print(f"🔍 Aplicando filtro por família ID: {familia_id}")
            
        # Filtro por parte usada através da nova estrutura
        if parte_usada:
            query = query.join(Planta.usos_planta).join(UsoPlanta.parte_usada).filter(
                ParteUsada.parte_usada.ilike(f'%{parte_usada}%')
            )
        
        # Filtro por indicação (uso tradicional)
        if indicacao_id:
            query = query.join(Planta.usos_planta).join(UsoPlanta.indicacoes).filter(
                Indicacao.id_indicacao == indicacao_id
            )
        
        # Remover duplicatas
        query = query.distinct()
        
        # EXECUTAR QUERY (lógica original)
        plantas = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # ✅ SEM TRACKING AQUI - só retorna resultados
        print(f"🔍 Busca executada: {plantas.total} resultados (tracking será no clique)")
        
        # ===== RESPOSTA ORIGINAL (mantida igual) =====
        return jsonify({
            'plantas': [planta.to_dict() for planta in plantas.items],
            'total': plantas.total,
            'pages': plantas.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        # Tratamento de erro original mantido
        return handle_error(e)

# NOVA ROTA - Buscar plantas por indicação específica
@app.route('/api/plantas/por-indicacao/<int:id_indicacao>', methods=['GET'])
def get_plantas_por_indicacao(id_indicacao):
    """Buscar plantas que têm uma indicação específica"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Verificar se a indicação existe
        indicacao = Indicacao.query.get_or_404(id_indicacao)
        
        # Buscar plantas que têm essa indicação através dos usos
        query = Planta.query.join(Planta.usos_planta).join(UsoPlanta.indicacoes).filter(
            Indicacao.id_indicacao == id_indicacao
        ).distinct()
        
        plantas = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'indicacao': indicacao.to_dict(),
            'plantas': [planta.to_dict(include_relations=True) for planta in plantas.items],
            'total': plantas.total,
            'pages': plantas.pages,
            'current_page': page,
            'per_page': per_page
        })
    except Exception as e:
        return handle_error(e)

# NOVA ROTA - Buscar plantas por parte usada específica
@app.route('/api/plantas/por-parte-usada', methods=['GET'])
def get_plantas_por_parte_usada():
    """Buscar plantas por parte usada (string)"""
    try:
        parte_usada = request.args.get('parte_usada', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        if not parte_usada:
            return jsonify({'error': 'Parâmetro parte_usada é obrigatório'}), 400
        
        # Buscar plantas que usam essa parte
        query = Planta.query.join(Planta.usos_planta).join(UsoPlanta.parte_usada).filter(
            ParteUsada.parte_usada.ilike(f'%{parte_usada}%')
        ).distinct()
        
        plantas = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'parte_usada_busca': parte_usada,
            'plantas': [planta.to_dict(include_relations=True) for planta in plantas.items],
            'total': plantas.total,
            'pages': plantas.pages,
            'current_page': page,
            'per_page': per_page
        })
    except Exception as e:
        return handle_error(e)

# NOVA ROTA - Estatísticas por indicação
@app.route('/api/stats/indicacoes', methods=['GET'])
def get_stats_indicacoes():
    """Estatísticas de uso por indicação"""
    try:
        # Contar quantas plantas têm cada indicação
        stats_query = db.session.query(
            Indicacao.id_indicacao,
            Indicacao.descricao,
            db.func.count(UsoPlanta.id_planta.distinct()).label('total_plantas')
        ).join(
            UsoPlantaIndicacao, Indicacao.id_indicacao == UsoPlantaIndicacao.id_indicacao
        ).join(
            UsoPlanta, UsoPlantaIndicacao.id_uso_planta == UsoPlanta.id_uso_planta
        ).group_by(
            Indicacao.id_indicacao, Indicacao.descricao
        ).order_by(
            db.desc('total_plantas')
        ).all()
        
        stats = []
        for stat in stats_query:
            stats.append({
                'id_indicacao': stat.id_indicacao,
                'descricao': stat.descricao,
                'total_plantas': stat.total_plantas
            })
        
        return jsonify({
            'stats_indicacoes': stats,
            'total_indicacoes_com_plantas': len(stats)
        })
    except Exception as e:
        return handle_error(e)

# NOVA ROTA - Estatísticas por parte usada
@app.route('/api/stats/partes-usadas', methods=['GET'])
def get_stats_partes_usadas():
    """Estatísticas de uso por parte da planta"""
    try:
        # Contar quantas plantas usam cada parte
        stats_query = db.session.query(
            ParteUsada.id_uso,
            ParteUsada.parte_usada,
            db.func.count(UsoPlanta.id_planta.distinct()).label('total_plantas')
        ).join(
            UsoPlanta, ParteUsada.id_uso == UsoPlanta.id_parte
        ).group_by(
            ParteUsada.id_uso, ParteUsada.parte_usada
        ).order_by(
            db.desc('total_plantas')
        ).all()
        
        stats = []
        for stat in stats_query:
            stats.append({
                'id_uso': stat.id_uso,
                'parte_usada': stat.parte_usada,
                'total_plantas': stat.total_plantas
            })
        
        return jsonify({
            'stats_partes_usadas': stats,
            'total_partes_com_plantas': len(stats)
        })
    except Exception as e:
        return handle_error(e)

# NOVA ROTA - Busca combinada (múltiplos critérios)
@app.route('/api/plantas/busca-avancada', methods=['POST'])
def busca_avancada():
    """Busca avançada com múltiplos critérios"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados de busca não fornecidos'}), 400
        
        page = data.get('page', 1)
        per_page = data.get('per_page', 20)
        
        query = Planta.query
        filtros_aplicados = []
        
        # Filtro por nome popular
        if data.get('search_popular'):
            query = query.join(Planta.nomes_comuns).filter(
                NomeComum.nome_comum_planta.ilike(f'%{data["search_popular"]}%')
            )
            filtros_aplicados.append(f"Nome popular contém '{data['search_popular']}'")
        
        # Filtro por nome científico
        if data.get('search_cientifico'):
            query = query.filter(Planta.nome_cientifico.ilike(f'%{data["search_cientifico"]}%'))
            filtros_aplicados.append(f"Nome científico contém '{data['search_cientifico']}'")
        
        # Filtro por autor
        if data.get('autor_id'):
            query = query.join(Planta.autores).filter(Autor.id_autor == data['autor_id'])
            autor = Autor.query.get(data['autor_id'])
            if autor:
                filtros_aplicados.append(f"Autor: {autor.nome_autor}")
        
        # Filtro por província
        if data.get('provincia_id'):
            query = query.join(Planta.provincias).filter(Provincia.id_provincia == data['provincia_id'])
            provincia = Provincia.query.get(data['provincia_id'])
            if provincia:
                filtros_aplicados.append(f"Província: {provincia.nome_provincia}")
        
        # Filtro por parte usada
        if data.get('parte_usada'):
            query = query.join(Planta.usos_planta).join(UsoPlanta.parte_usada).filter(
                ParteUsada.parte_usada.ilike(f'%{data["parte_usada"]}%')
            )
            filtros_aplicados.append(f"Parte usada contém '{data['parte_usada']}'")
        
        # Filtro por indicação
        if data.get('indicacao_id'):
            query = query.join(Planta.usos_planta).join(UsoPlanta.indicacoes).filter(
                Indicacao.id_indicacao == data['indicacao_id']
            )
            indicacao = Indicacao.query.get(data['indicacao_id'])
            if indicacao:
                filtros_aplicados.append(f"Uso: {indicacao.descricao}")
        
        # Remover duplicatas e executar query
        query = query.distinct()
        plantas = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'plantas': [planta.to_dict(include_relations=True) for planta in plantas.items],
            'total': plantas.total,
            'pages': plantas.pages,
            'current_page': page,
            'per_page': per_page,
            'filtros_aplicados': filtros_aplicados,
            'criterios_busca': data
        })
    except Exception as e:
        return handle_error(e)

# ROTA ATUALIZADA - Buscar correlações específicas
@app.route('/api/correlacoes/planta-indicacao', methods=['GET'])
def get_correlacoes_planta_indicacao():
    """Buscar correlações específicas entre plantas, partes usadas e indicações"""
    try:
        planta_id = request.args.get('planta_id', type=int)
        indicacao_id = request.args.get('indicacao_id', type=int)
        parte_usada = request.args.get('parte_usada', '')
        
        # Query base para usos específicos
        query = db.session.query(
            Planta.id_planta,
            Planta.nome_cientifico,
            NomeComum.nome_comum_planta,
            ParteUsada.parte_usada,
            Indicacao.descricao.label('indicacao'),
            UsoPlanta.observacoes
        ).join(
            UsoPlanta, Planta.id_planta == UsoPlanta.id_planta
        ).join(
            ParteUsada, UsoPlanta.id_parte == ParteUsada.id_uso
        ).join(
            UsoPlantaIndicacao, UsoPlanta.id_uso_planta == UsoPlantaIndicacao.id_uso_planta
        ).join(
            Indicacao, UsoPlantaIndicacao.id_indicacao == Indicacao.id_indicacao
        ).outerjoin(
            NomeComum, Planta.id_planta == NomeComum.id_planta
        )
        
        # Aplicar filtros se fornecidos
        if planta_id:
            query = query.filter(Planta.id_planta == planta_id)
        
        if indicacao_id:
            query = query.filter(Indicacao.id_indicacao == indicacao_id)
        
        if parte_usada:
            query = query.filter(ParteUsada.parte_usada.ilike(f'%{parte_usada}%'))
        
        resultados = query.all()
        
        # Organizar resultados
        correlacoes = []
        for resultado in resultados:
            correlacoes.append({
                'planta_id': resultado.id_planta,
                'nome_cientifico': resultado.nome_cientifico,
                'nome_comum': resultado.nome_comum_planta,
                'parte_usada': resultado.parte_usada,
                'indicacao': resultado.indicacao,
                'observacoes': resultado.observacoes
            })
        
        return jsonify({
            'correlacoes': correlacoes,
            'total': len(correlacoes),
            'filtros': {
                'planta_id': planta_id,
                'indicacao_id': indicacao_id,
                'parte_usada': parte_usada
            }
        })
    except Exception as e:
        return handle_error(e)

@app.route('/api/plantas/<int:id_planta>', methods=['GET'])
def get_planta(id_planta):
    """VERSÃO COM TRACKING POR CLIQUE - Mede interesse real"""
    try:
        # Lógica original mantida
        planta = Planta.query.get_or_404(id_planta)
        
        # ✅ TRACKING INTELIGENTE POR CLIQUE
        try:
            # Analisar os parâmetros de query para entender como chegou aqui
            referrer = request.headers.get('Referer', '')
            search_source = request.args.get('search_source', '')  # Parâmetro opcional do frontend
            search_term = request.args.get('search_term', '')      # Parâmetro opcional do frontend
            search_type = request.args.get('search_type', '')      # Parâmetro opcional do frontend
            
            # Determinar termo e tipo da pesquisa original
            termo_pesquisa = None
            tipo_pesquisa = 'nome_cientifico'  # Padrão: assume interesse no nome científico
            
            # ===== LÓGICA INTELIGENTE DE DETECÇÃO =====
            
            # OPÇÃO 1: Frontend passa parâmetros (recomendado)
            if search_term and search_type:
                termo_pesquisa = search_term.strip()
                tipo_pesquisa = search_type
                print(f"🎯 Tracking via parâmetros: {termo_pesquisa} ({tipo_pesquisa})")
            
            # OPÇÃO 2: Usar nome da planta (fallback)
            else:
                # Prioridade: nome comum se existir, senão científico
                if planta.nomes_comuns and len(planta.nomes_comuns) > 0:
                    termo_pesquisa = planta.nomes_comuns[0].nome_comum_planta
                    tipo_pesquisa = 'nome_popular'
                else:
                    termo_pesquisa = planta.nome_cientifico
                    tipo_pesquisa = 'nome_cientifico'
                print(f"🎯 Tracking via nome da planta: {termo_pesquisa} ({tipo_pesquisa})")
            
            # ===== REGISTAR CLIQUE COMO INTERESSE REAL =====
            if termo_pesquisa:
                registar_pesquisa_segura(
                    termo=termo_pesquisa,
                    tipo=tipo_pesquisa,
                    resultados=1,  # Sempre 1 porque clicou numa planta específica
                    request_obj=request
                )
                
        except Exception as tracking_error:
            # Se o tracking falhar, apenas log - NÃO afetar a resposta
            print(f"⚠️ Erro no tracking de clique (ignorado): {tracking_error}")
        
        # Resposta original mantida
        return jsonify(planta.to_dict(include_relations=True))
        
    except Exception as e:
        # Tratamento de erro original mantido
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
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        tipo = request.args.get('tipo', '')
        ano = request.args.get('ano', '')
        search = request.args.get('search', '')
        include_autores = request.args.get('include_autores', 'false').lower() == 'true'
        
        query = Referencia.query
        
        # Filtros existentes
        if tipo and tipo != 'all':
            query = query.filter(Referencia.tipo_referencia == tipo)
        
        if ano:
            query = query.filter(Referencia.ano == ano)
        
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                db.or_(
                    Referencia.titulo_referencia.ilike(search_term),
                    Referencia.link_referencia.ilike(search_term)
                )
            )
        
        query = query.order_by(
            Referencia.ano.desc().nullslast(),
            Referencia.titulo_referencia.asc().nullslast()
        )
        
        referencias = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'referencias': [ref.to_dict(include_autores=include_autores) for ref in referencias.items],
            'pagination': {
                'total': referencias.total,
                'pages': referencias.pages,
                'current_page': page,
                'per_page': per_page,
                'has_next': referencias.has_next,
                'has_prev': referencias.has_prev
            }
        })
    except Exception as e:
        return handle_error(e)

@app.route('/api/referencias', methods=['POST'])
def create_referencia():
    try:
        data = request.get_json()
        if not data or 'link_referencia' not in data:
            return jsonify({'error': 'Link da referência é obrigatório'}), 400
        
        # Validar tipo se fornecido
        tipos_validos = ['URL', 'Artigo', 'Livro', 'Tese']
        tipo = data.get('tipo_referencia')
        if tipo and tipo not in tipos_validos:
            return jsonify({'error': f'Tipo deve ser um dos: {", ".join(tipos_validos)}'}), 400
        
        # Validar ano se fornecido
        ano = data.get('ano')
        if ano:
            try:
                ano_int = int(ano)
                if ano_int < 1900 or ano_int > 2030:
                    return jsonify({'error': 'Ano deve estar entre 1900 e 2030'}), 400
            except ValueError:
                return jsonify({'error': 'Ano deve ser um número válido'}), 400
        
        referencia = Referencia(
            link_referencia=data['link_referencia'],
            tipo_referencia=tipo,
            titulo_referencia=data.get('titulo_referencia'),
            ano=ano
        )
        db.session.add(referencia)
        db.session.commit()
        return jsonify(referencia.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

@app.route('/api/referencias/<int:id_referencia>/autores', methods=['POST'])
def associar_autor_referencia(id_referencia):
    try:
        referencia = Referencia.query.get_or_404(id_referencia)
        data = request.get_json()
        
        if not data or 'id_autor' not in data:
            return jsonify({'error': 'ID do autor é obrigatório'}), 400
        
        autor = Autor.query.get_or_404(data['id_autor'])
        
        # Verificar se já existe
        existente = AutorReferencia.query.filter_by(
            id_autor=data['id_autor'],
            id_referencia=id_referencia
        ).first()
        
        if existente:
            return jsonify({'error': 'Autor já associado a esta referência'}), 409
        
        # Determinar ordem automaticamente se não fornecida
        ordem = data.get('ordem_autor')
        if not ordem:
            max_ordem = db.session.query(
                db.func.max(AutorReferencia.ordem_autor)
            ).filter(
                AutorReferencia.id_referencia == id_referencia
            ).scalar() or 0
            ordem = max_ordem + 1
        
        autor_ref = AutorReferencia(
            id_autor=data['id_autor'],
            id_referencia=id_referencia,
            ordem_autor=ordem,
            papel=data.get('papel', 'coautor')
        )
        
        db.session.add(autor_ref)
        db.session.commit()
        
        return jsonify({
            'message': 'Autor associado à referência com sucesso',
            'autor_referencia': {
                'id_autor': autor_ref.id_autor,
                'id_referencia': autor_ref.id_referencia,
                'ordem_autor': autor_ref.ordem_autor,
                'papel': autor_ref.papel,
                'nome_autor': autor.nome_autor
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# =====================================================
# NOVA ROTA - REMOVER AUTOR DE REFERÊNCIA
# =====================================================

@app.route('/api/referencias/<int:id_referencia>/autores/<int:id_autor>', methods=['DELETE'])
def remover_autor_referencia(id_referencia, id_autor):
    try:
        autor_ref = AutorReferencia.query.filter_by(
            id_autor=id_autor,
            id_referencia=id_referencia
        ).first()
        
        if not autor_ref:
            return jsonify({'error': 'Associação não encontrada'}), 404
        
        db.session.delete(autor_ref)
        db.session.commit()
        
        return jsonify({'message': 'Autor removido da referência com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

@app.route('/api/referencias/<int:id_referencia>/autores', methods=['GET'])
def get_autores_referencia(id_referencia):
    try:
        referencia = Referencia.query.get_or_404(id_referencia)
        
        autores = db.session.query(
            Autor.id_autor,
            Autor.nome_autor,
            Autor.afiliacao,
            Autor.sigla_afiliacao,
            AutorReferencia.ordem_autor,
            AutorReferencia.papel
        ).join(
            AutorReferencia, Autor.id_autor == AutorReferencia.id_autor
        ).filter(
            AutorReferencia.id_referencia == id_referencia
        ).order_by(AutorReferencia.ordem_autor).all()
        
        return jsonify({
            'referencia': referencia.to_dict(),
            'autores': [{
                'id_autor': a.id_autor,
                'nome_autor': a.nome_autor,
                'afiliacao': a.afiliacao,
                'sigla_afiliacao': a.sigla_afiliacao,
                'ordem_autor': a.ordem_autor,
                'papel': a.papel
            } for a in autores]
        })
        
    except Exception as e:
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

# Adicione esta rota ao seu arquivo Flask

@app.route('/api/referencias-com-associacoes', methods=['GET'])
def get_referencias_com_associacoes():
    """Buscar todas as referências com suas plantas e autores associados"""
    try:
        # Buscar todas as referências
        referencias = Referencia.query.all()
        referencias_enriquecidas = []
        
        for referencia in referencias:
            # Buscar plantas associadas através da tabela planta_referencia
            plantas_query = db.session.query(
                Planta.id_planta,
                Planta.nome_cientifico,
                Planta.numero_exsicata
            ).join(
                PlantaReferencia, Planta.id_planta == PlantaReferencia.id_planta
            ).filter(
                PlantaReferencia.id_referencia == referencia.id_referencia
            ).all()
            
            plantas_associadas = []
            autores_associados = []
            autores_map = {}
            
            # Para cada planta associada, buscar seus nomes comuns e autores
            for planta_row in plantas_query:
                # Buscar nomes comuns da planta
                nomes_comuns = db.session.query(
                    NomeComum.nome_comum_planta
                ).filter(
                    NomeComum.id_planta == planta_row.id_planta
                ).all()
                
                planta_info = {
                    'id_planta': planta_row.id_planta,
                    'nome_cientifico': planta_row.nome_cientifico,
                    'numero_exsicata': planta_row.numero_exsicata,
                    'nomes_comuns': [nome.nome_comum_planta for nome in nomes_comuns]
                }
                plantas_associadas.append(planta_info)
                
                # Buscar autores desta planta através da tabela autor_planta
                autores_query = db.session.query(
                    Autor.id_autor,
                    Autor.nome_autor,
                    Autor.afiliacao,
                    Autor.sigla_afiliacao
                ).join(
                    AutorPlanta, Autor.id_autor == AutorPlanta.id_autor
                ).filter(
                    AutorPlanta.id_planta == planta_row.id_planta
                ).all()
                
                # Adicionar autores únicos
                for autor_row in autores_query:
                    if autor_row.id_autor not in autores_map:
                        autores_map[autor_row.id_autor] = {
                            'id_autor': autor_row.id_autor,
                            'nome_autor': autor_row.nome_autor,
                            'afiliacao': autor_row.afiliacao,
                            'sigla_afiliacao': autor_row.sigla_afiliacao
                        }
            
            autores_associados = list(autores_map.values())
            
            referencia_enriquecida = {
                'id_referencia': referencia.id_referencia,
                'link_referencia': referencia.link_referencia,
                'plantas_associadas': plantas_associadas,
                'autores_associados': autores_associados,
                'total_plantas': len(plantas_associadas),
                'total_autores': len(autores_associados)
            }
            referencias_enriquecidas.append(referencia_enriquecida)
        
        return jsonify({
            'referencias': referencias_enriquecidas,
            'total': len(referencias_enriquecidas)
        })
        
    except Exception as e:
        return handle_error(e, "Erro ao buscar referências com associações")

@app.route('/api/referencias/<int:id_referencia>/plantas', methods=['GET'])
def get_plantas_por_referencia(id_referencia):
    """Buscar plantas associadas a uma referência específica"""
    try:
        # Verificar se a referência existe
        referencia = Referencia.query.get_or_404(id_referencia)
        
        # Buscar plantas através da tabela planta_referencia
        plantas_query = db.session.query(
            Planta.id_planta,
            Planta.nome_cientifico,
            Planta.numero_exsicata,
            Familia.nome_familia
        ).join(
            PlantaReferencia, Planta.id_planta == PlantaReferencia.id_planta
        ).join(
            Familia, Planta.id_familia == Familia.id_familia
        ).filter(
            PlantaReferencia.id_referencia == id_referencia
        ).all()
        
        plantas_detalhadas = []
        
        for planta_row in plantas_query:
            # Buscar nomes comuns
            nomes_comuns = db.session.query(
                NomeComum.nome_comum_planta
            ).filter(
                NomeComum.id_planta == planta_row.id_planta
            ).all()
            
            # Buscar autores
            autores_query = db.session.query(
                Autor.id_autor,
                Autor.nome_autor,
                Autor.afiliacao,
                Autor.sigla_afiliacao
            ).join(
                AutorPlanta, Autor.id_autor == AutorPlanta.id_autor
            ).filter(
                AutorPlanta.id_planta == planta_row.id_planta
            ).all()
            
            planta_info = {
                'id_planta': planta_row.id_planta,
                'nome_cientifico': planta_row.nome_cientifico,
                'numero_exsicata': planta_row.numero_exsicata,
                'familia': planta_row.nome_familia,
                'nomes_comuns': [nome.nome_comum_planta for nome in nomes_comuns],
                'autores': [{
                    'id_autor': autor.id_autor,
                    'nome_autor': autor.nome_autor,
                    'afiliacao': autor.afiliacao,
                    'sigla_afiliacao': autor.sigla_afiliacao
                } for autor in autores_query]
            }
            plantas_detalhadas.append(planta_info)
        
        return jsonify({
            'referencia': referencia.to_dict(),
            'plantas': plantas_detalhadas,
            'total_plantas': len(plantas_detalhadas)
        })
        
    except Exception as e:
        return handle_error(e, "Erro ao buscar plantas por referência")

@app.route('/api/referencias/<int:id_referencia>/autores', methods=['GET'])
def get_autores_por_referencia(id_referencia):
    """Buscar autores associados a uma referência através das plantas"""
    try:
        # Verificar se a referência existe
        referencia = Referencia.query.get_or_404(id_referencia)
        
        # Buscar autores através das plantas que usam esta referência
        autores_query = db.session.query(
            Autor.id_autor,
            Autor.nome_autor,
            Autor.afiliacao,
            Autor.sigla_afiliacao
        ).join(
            AutorPlanta, Autor.id_autor == AutorPlanta.id_autor
        ).join(
            PlantaReferencia, AutorPlanta.id_planta == PlantaReferencia.id_planta
        ).filter(
            PlantaReferencia.id_referencia == id_referencia
        ).distinct().all()
        
        autores_detalhados = []
        
        for autor_row in autores_query:
            # Buscar plantas deste autor que usam esta referência
            plantas_autor = db.session.query(
                Planta.id_planta,
                Planta.nome_cientifico
            ).join(
                AutorPlanta, Planta.id_planta == AutorPlanta.id_planta
            ).join(
                PlantaReferencia, Planta.id_planta == PlantaReferencia.id_planta
            ).filter(
                AutorPlanta.id_autor == autor_row.id_autor,
                PlantaReferencia.id_referencia == id_referencia
            ).all()
            
            autor_info = {
                'id_autor': autor_row.id_autor,
                'nome_autor': autor_row.nome_autor,
                'afiliacao': autor_row.afiliacao,
                'sigla_afiliacao': autor_row.sigla_afiliacao,
                'plantas_nesta_referencia': [{
                    'id_planta': planta.id_planta,
                    'nome_cientifico': planta.nome_cientifico
                } for planta in plantas_autor]
            }
            autores_detalhados.append(autor_info)
        
        return jsonify({
            'referencia': referencia.to_dict(),
            'autores': autores_detalhados,
            'total_autores': len(autores_detalhados)
        })
        
    except Exception as e:
        return handle_error(e, "Erro ao buscar autores por referência")

# Adicione esta nova rota ao seu arquivo Flask para otimizar a busca

@app.route('/api/referencias/<int:id_referencia>', methods=['PUT'])
def update_referencia(id_referencia):
    try:
        referencia = Referencia.query.get_or_404(id_referencia)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Atualizar campos
        if 'link_referencia' in data:
            referencia.link_referencia = data['link_referencia']
        
        if 'tipo_referencia' in data:
            tipos_validos = ['URL', 'Artigo', 'Livro', 'Tese']
            if data['tipo_referencia'] and data['tipo_referencia'] not in tipos_validos:
                return jsonify({'error': f'Tipo deve ser um dos: {", ".join(tipos_validos)}'}), 400
            referencia.tipo_referencia = data['tipo_referencia']
        
        if 'titulo_referencia' in data:
            referencia.titulo_referencia = data['titulo_referencia']
        
        if 'ano' in data:
            ano = data['ano']
            if ano:
                try:
                    ano_int = int(ano)
                    if ano_int < 1900 or ano_int > 2030:
                        return jsonify({'error': 'Ano deve estar entre 1900 e 2030'}), 400
                except ValueError:
                    return jsonify({'error': 'Ano deve ser um número válido'}), 400
            referencia.ano = ano
        
        db.session.commit()
        return jsonify(referencia.to_dict())
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

# =====================================================
# ROTA ATUALIZADA - PLANTAS COM REFERÊNCIAS DETALHADAS
# =====================================================
@app.route('/api/plantas-com-referencias', methods=['GET'])
def get_plantas_com_referencias_atualizada():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        
        # Query base mantém igual
        query = db.session.query(
            Planta.id_planta,
            Planta.nome_cientifico,
            Planta.numero_exsicata,
            Familia.nome_familia.label('familia')
        ).join(
            Familia, Planta.id_familia == Familia.id_familia
        ).join(
            PlantaReferencia, Planta.id_planta == PlantaReferencia.id_planta
        ).join(
            Referencia, PlantaReferencia.id_referencia == Referencia.id_referencia
        ).distinct()
        
        if search:
            search_term = f'%{search}%'
            query = query.outerjoin(
                NomeComum, Planta.id_planta == NomeComum.id_planta
            ).filter(
                db.or_(
                    Planta.nome_cientifico.ilike(search_term),
                    NomeComum.nome_comum_planta.ilike(search_term),
                    Familia.nome_familia.ilike(search_term),
                    Referencia.titulo_referencia.ilike(search_term)
                )
            )
        
        query = query.order_by(Planta.nome_cientifico)
        plantas_paginadas = query.paginate(page=page, per_page=per_page, error_out=False)
        
        plantas_completas = []
        
        for planta_row in plantas_paginadas.items:
            # Nomes comuns
            nomes_comuns = db.session.query(
                NomeComum.nome_comum_planta
            ).filter(NomeComum.id_planta == planta_row.id_planta).all()
            
            # REFERÊNCIAS COM AUTORES ESPECÍFICOS
            referencias_query = db.session.query(
                Referencia.id_referencia,
                Referencia.link_referencia,
                Referencia.tipo_referencia,
                Referencia.titulo_referencia,
                Referencia.ano
            ).join(
                PlantaReferencia, Referencia.id_referencia == PlantaReferencia.id_referencia
            ).filter(
                PlantaReferencia.id_planta == planta_row.id_planta
            ).order_by(
                Referencia.ano.desc().nullslast(),
                Referencia.titulo_referencia.asc()
            ).all()
            
            # Para cada referência, buscar seus autores
            referencias_com_autores = []
            for ref in referencias_query:
                autores_ref = db.session.query(
                    Autor.id_autor,
                    Autor.nome_autor,
                    Autor.afiliacao,
                    Autor.sigla_afiliacao,
                    AutorReferencia.ordem_autor,
                    AutorReferencia.papel
                ).join(
                    AutorReferencia, Autor.id_autor == AutorReferencia.id_autor
                ).filter(
                    AutorReferencia.id_referencia == ref.id_referencia
                ).order_by(AutorReferencia.ordem_autor).all()
                
                ref_data = {
                    'id_referencia': ref.id_referencia,
                    'link_referencia': ref.link_referencia,
                    'tipo_referencia': ref.tipo_referencia,
                    'titulo_referencia': ref.titulo_referencia,
                    'ano': ref.ano,
                    'autores': [{
                        'id_autor': ar.id_autor,
                        'nome_autor': ar.nome_autor,
                        'afiliacao': ar.afiliacao,
                        'sigla_afiliacao': ar.sigla_afiliacao,
                        'ordem_autor': ar.ordem_autor,
                        'papel': ar.papel
                    } for ar in autores_ref]
                }
                referencias_com_autores.append(ref_data)
            
            # Autores da planta (mantém para compatibilidade)
            autores_planta = db.session.query(
                Autor.id_autor,
                Autor.nome_autor,
                Autor.afiliacao,
                Autor.sigla_afiliacao
            ).join(
                AutorPlanta, Autor.id_autor == AutorPlanta.id_autor
            ).filter(
                AutorPlanta.id_planta == planta_row.id_planta
            ).all()
            
            planta_completa = {
                'id_planta': planta_row.id_planta,
                'nome_cientifico': planta_row.nome_cientifico,
                'numero_exsicata': planta_row.numero_exsicata,
                'familia': planta_row.familia,
                'nomes_comuns': [nc.nome_comum_planta for nc in nomes_comuns],
                'referencias': referencias_com_autores,  # NOVO: com autores específicos
                'autores': [{  # Autores da planta (mantido para compatibilidade)
                    'id_autor': autor.id_autor,
                    'nome_autor': autor.nome_autor,
                    'afiliacao': autor.afiliacao,
                    'sigla_afiliacao': autor.sigla_afiliacao
                } for autor in autores_planta]
            }
            plantas_completas.append(planta_completa)
        
        return jsonify({
            'plantas': plantas_completas,
            'pagination': {
                'total': plantas_paginadas.total,
                'pages': plantas_paginadas.pages,
                'current_page': page,
                'per_page': per_page,
                'has_next': plantas_paginadas.has_next,
                'has_prev': plantas_paginadas.has_prev
            }
        })
        
    except Exception as e:
        return handle_error(e)


# @app.route('/api/referencias/stats', methods=['GET'])
# def get_referencias_stats():
#     try:
#         stats = get_referencias_statistics()
#         return jsonify(stats)
#     except Exception as e:
#         return handle_error(e, "Erro ao buscar estatísticas de referências")

@app.route('/api/referencias/tipos', methods=['GET'])
def get_tipos_referencia():
    """Retorna os tipos de referência disponíveis"""
    try:
        tipos = ['URL', 'Artigo', 'Livro', 'Tese']
        
        # Contar quantas referências existem de cada tipo
        counts = db.session.query(
            Referencia.tipo_referencia,
            db.func.count(Referencia.id_referencia).label('total')
        ).group_by(Referencia.tipo_referencia).all()
        
        tipos_com_count = []
        for tipo in tipos:
            count = next((c.total for c in counts if c.tipo_referencia == tipo), 0)
            tipos_com_count.append({
                'tipo': tipo,
                'total': count
            })
        
        return jsonify(tipos_com_count)
    except Exception as e:
        return handle_error(e)

# =====================================================
# ROTA - ANOS DISPONÍVEIS
# =====================================================

@app.route('/api/referencias/anos', methods=['GET'])
def get_anos_referencia():
    """Retorna os anos disponíveis nas referências"""
    try:
        anos = db.session.query(
            Referencia.ano,
            db.func.count(Referencia.id_referencia).label('total')
        ).filter(
            Referencia.ano.isnot(None)
        ).group_by(Referencia.ano).order_by(
            Referencia.ano.desc()
        ).all()
        
        return jsonify([
            {
                'ano': ano.ano,
                'total': ano.total
            } for ano in anos
        ])
    except Exception as e:
        return handle_error(e)

@app.route('/api/plantas-com-referencias/stats', methods=['GET'])
def get_stats_plantas_referencias():
    """Estatísticas rápidas sobre plantas com referências"""
    try:
        # Top 10 plantas com mais referências
        top_plantas = db.session.query(
            Planta.nome_cientifico,
            db.func.count(PlantaReferencia.id_referencia).label('total_referencias')
        ).join(
            PlantaReferencia, Planta.id_planta == PlantaReferencia.id_planta
        ).group_by(
            Planta.id_planta, Planta.nome_cientifico
        ).order_by(
            db.desc('total_referencias')
        ).limit(10).all()
        
        # Top 10 autores com mais plantas
        top_autores = db.session.query(
            Autor.nome_autor,
            db.func.count(db.distinct(AutorPlanta.id_planta)).label('total_plantas')
        ).join(
            AutorPlanta, Autor.id_autor == AutorPlanta.id_autor
        ).join(
            PlantaReferencia, AutorPlanta.id_planta == PlantaReferencia.id_planta
        ).group_by(
            Autor.id_autor, Autor.nome_autor
        ).order_by(
            db.desc('total_plantas')
        ).limit(10).all()
        
        # Distribuição por tipo de referência (baseado no link)
        todas_referencias = db.session.query(
            Referencia.link_referencia
        ).join(
            PlantaReferencia, Referencia.id_referencia == PlantaReferencia.id_referencia
        ).all()
        
        tipos_referencias = {}
        for ref in todas_referencias:
            link = ref.link_referencia.lower()
            if 'doi.org' in link:
                tipo = 'DOI'
            elif 'pubmed' in link or 'ncbi' in link:
                tipo = 'PubMed'
            elif 'scielo' in link:
                tipo = 'SciELO'
            elif 'researchgate' in link:
                tipo = 'ResearchGate'
            elif '.pdf' in link:
                tipo = 'PDF'
            else:
                tipo = 'Outros'
            
            tipos_referencias[tipo] = tipos_referencias.get(tipo, 0) + 1
        
        return jsonify({
            'top_plantas_com_referencias': [
                {
                    'nome_cientifico': planta.nome_cientifico,
                    'total_referencias': planta.total_referencias
                } for planta in top_plantas
            ],
            'top_autores_com_plantas': [
                {
                    'nome_autor': autor.nome_autor,
                    'total_plantas': autor.total_plantas
                } for autor in top_autores
            ],
            'distribuicao_tipos_referencias': tipos_referencias
        })
        
    except Exception as e:
        return handle_error(e, "Erro ao buscar estatísticas")

# ROTA DE SAÚDE DA API
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '4.0.0',
        'estrutura': 'corrigida_com_uso_especifico_por_planta'
    })

def get_full_image_url(planta_id, filename, request_obj=None):
    """
    Gera URL completa para imagens das plantas
    """
    try:
        # Usar o request atual ou um fornecido
        req = request_obj or request
        
        # Obter a URL base do servidor
        server_url = req.url_root.rstrip('/')
        
        # Construir URL completa
        full_url = f"{server_url}/uploads/plantas_imagens/{planta_id}/{filename}"
        
        return full_url
    except Exception as e:
        # Fallback para desenvolvimento
        print(f"⚠️ Erro ao gerar URL da imagem: {e}")
        return f"http://localhost:5000/uploads/plantas_imagens/{planta_id}/{filename}"


@app.route('/api/plantas/<int:planta_id>/imagens', methods=['GET'])
def get_imagens_planta_frontend(planta_id):
    """
    Buscar imagens de uma planta para o frontend
    Endpoint principal para carregar imagens nas páginas
    """
    try:
        print(f"📸 Buscando imagens para planta {planta_id} (frontend)")
        
        # Verificar se a planta existe
        planta = Planta.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        # Buscar imagens da planta
        imagens = PlantaImagem.query.filter_by(id_planta=planta_id).order_by(PlantaImagem.ordem).all()
        
        resultado = []
        for img in imagens:
            # Gerar URL completa para cada imagem
            image_url = get_full_image_url(planta_id, img.nome_arquivo)
            
            resultado.append({
                'id_imagem': img.id_imagem,
                'nome_arquivo': img.nome_arquivo,
                'ordem': img.ordem,
                'legenda': img.legenda or '',
                'url': image_url,
                'data_upload': img.data_upload.isoformat() if img.data_upload else None
            })
        
        print(f"✅ Retornando {len(resultado)} imagens para planta {planta_id}")
        
        return jsonify({
            'imagens': resultado, 
            'total': len(resultado),
            'planta_id': planta_id,
            'planta_nome': planta.nome_cientifico
        })
        
    except Exception as e:
        print(f"❌ Erro ao carregar imagens da planta {planta_id}: {e}")
        return jsonify({'error': 'Erro ao carregar imagens'}), 500

# Also need to ensure CORS headers for image serving endpoint:
@app.route('/uploads/plantas_imagens/<int:planta_id>/<filename>')
def serve_plant_image(planta_id, filename):
    """
    Servir imagens das plantas com headers CORS corretos
    """
    try:
        # Verificar se a pasta da planta existe
        planta_folder = os.path.join(UPLOAD_FOLDER, str(planta_id))
        
        if not os.path.exists(planta_folder):
            print(f"❌ Pasta da planta {planta_id} não encontrada: {planta_folder}")
            return jsonify({'error': 'Pasta da planta não encontrada'}), 404
        
        # Verificar se o arquivo existe
        file_path = os.path.join(planta_folder, filename)
        if not os.path.exists(file_path):
            print(f"❌ Imagem não encontrada: {file_path}")
            return jsonify({'error': 'Imagem não encontrada'}), 404
        
        print(f"✅ Servindo imagem: {file_path}")
        
        # Servir o arquivo
        response = send_from_directory(planta_folder, filename)
        
        # Adicionar headers CORS para imagens
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
        response.headers['Cache-Control'] = 'public, max-age=31536000'  # Cache por 1 ano
        
        return response
        
    except Exception as e:
        print(f"❌ Erro ao servir imagem {filename}: {e}")
        return jsonify({'error': 'Erro ao carregar imagem'}), 404

def get_planta_images_info(planta_id):
    """
    Obter informações básicas sobre as imagens de uma planta
    (sem carregar as imagens completas)
    """
    try:
        # Verificar se a planta existe
        planta = Planta.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        # Contar imagens
        total_imagens = PlantaImagem.query.filter_by(id_planta=planta_id).count()
        
        # Buscar primeira imagem (para thumbnail)
        primeira_imagem = PlantaImagem.query.filter_by(id_planta=planta_id).order_by(PlantaImagem.ordem).first()
        
        resultado = {
            'planta_id': planta_id,
            'total_imagens': total_imagens,
            'tem_imagens': total_imagens > 0,
            'primeira_imagem': None
        }
        
        if primeira_imagem:
            resultado['primeira_imagem'] = {
                'id_imagem': primeira_imagem.id_imagem,
                'nome_arquivo': primeira_imagem.nome_arquivo,
                'url': get_full_image_url(planta_id, primeira_imagem.nome_arquivo),
                'legenda': primeira_imagem.legenda or ''
            }
        
        return jsonify(resultado)
        
    except Exception as e:
        print(f"❌ Erro ao obter info das imagens da planta {planta_id}: {e}")
        return jsonify({'error': 'Erro ao obter informações das imagens'}), 500

@app.route('/api/plantas/<int:planta_id>/imagens/check', methods=['GET'])
def check_plant_images_exist(planta_id):
    """
    Verificar se as imagens de uma planta existem fisicamente no disco
    Útil para debug e validação
    """
    try:
        # Verificar se a planta existe
        planta = Planta.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        # Buscar imagens da base de dados
        imagens_db = PlantaImagem.query.filter_by(id_planta=planta_id).all()
        
        resultado = {
            'planta_id': planta_id,
            'total_db': len(imagens_db),
            'imagens_status': [],
            'pasta_existe': False,
            'problemas': []
        }
        
        # Verificar pasta
        planta_folder = os.path.join(UPLOAD_FOLDER, str(planta_id))
        resultado['pasta_existe'] = os.path.exists(planta_folder)
        resultado['caminho_pasta'] = planta_folder
        
        if not resultado['pasta_existe']:
            resultado['problemas'].append(f"Pasta da planta não existe: {planta_folder}")
        
        # Verificar cada imagem
        for img in imagens_db:
            file_path = os.path.join(planta_folder, img.nome_arquivo)
            existe = os.path.exists(file_path)
            
            status = {
                'id_imagem': img.id_imagem,
                'nome_arquivo': img.nome_arquivo,
                'existe_fisicamente': existe,
                'caminho_completo': file_path,
                'url': get_full_image_url(planta_id, img.nome_arquivo)
            }
            
            if not existe:
                resultado['problemas'].append(f"Arquivo não encontrado: {file_path}")
            
            resultado['imagens_status'].append(status)
        
        # Contar arquivos físicos na pasta (se existir)
        if resultado['pasta_existe']:
            try:
                arquivos_fisicos = [f for f in os.listdir(planta_folder) 
                                  if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))]
                resultado['total_arquivos_fisicos'] = len(arquivos_fisicos)
                resultado['arquivos_fisicos'] = arquivos_fisicos
                
                # Verificar arquivos órfãos (no disco mas não na DB)
                nomes_db = {img.nome_arquivo for img in imagens_db}
                arquivos_orfaos = [f for f in arquivos_fisicos if f not in nomes_db]
                if arquivos_orfaos:
                    resultado['arquivos_orfaos'] = arquivos_orfaos
                    resultado['problemas'].extend([f"Arquivo órfão: {f}" for f in arquivos_orfaos])
                    
            except Exception as e:
                resultado['problemas'].append(f"Erro ao listar pasta: {e}")
        
        resultado['tem_problemas'] = len(resultado['problemas']) > 0
        
        return jsonify(resultado)
        
    except Exception as e:
        print(f"❌ Erro ao verificar imagens da planta {planta_id}: {e}")
        return jsonify({'error': 'Erro ao verificar imagens'}), 500

# Endpoint para buscar múltiplas plantas com informação de imagens
@app.route('/api/plantas/com-imagens', methods=['GET'])
def get_plantas_com_info_imagens():
    """
    Buscar plantas com informação básica sobre suas imagens
    Útil para listagens que mostram indicadores de imagens
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Query base
        plantas_query = db.session.query(
            Planta.id_planta,
            Planta.nome_cientifico,
            Familia.nome_familia.label('familia'),
            func.count(PlantaImagem.id_imagem).label('total_imagens')
        ).join(
            Familia, Planta.id_familia == Familia.id_familia
        ).outerjoin(
            PlantaImagem, Planta.id_planta == PlantaImagem.id_planta
        ).group_by(
            Planta.id_planta, Planta.nome_cientifico, Familia.nome_familia
        ).order_by(
            Planta.nome_cientifico
        )
        
        # Aplicar paginação
        plantas_paginadas = plantas_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        resultado = []
        for planta in plantas_paginadas.items:
            resultado.append({
                'id_planta': planta.id_planta,
                'nome_cientifico': planta.nome_cientifico,
                'familia': planta.familia,
                'total_imagens': planta.total_imagens,
                'tem_imagens': planta.total_imagens > 0
            })
        
        return jsonify({
            'plantas': resultado,
            'total': plantas_paginadas.total,
            'page': page,
            'per_page': per_page,
            'total_pages': plantas_paginadas.pages,
            'has_next': plantas_paginadas.has_next,
            'has_prev': plantas_paginadas.has_prev
        })
        
    except Exception as e:
        print(f"❌ Erro ao buscar plantas com info de imagens: {e}")
        return jsonify({'error': 'Erro ao buscar plantas'}), 500

# Endpoint de saúde específico para imagens
@app.route('/api/imagens/health', methods=['GET'])
def images_health_check():
    """
    Verificar a saúde do sistema de imagens
    """
    try:
        resultado = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'upload_folder': UPLOAD_FOLDER,
            'upload_folder_exists': os.path.exists(UPLOAD_FOLDER),
            'total_plantas_com_imagens': 0,
            'total_imagens': 0
        }
        
        # Estatísticas básicas
        total_imagens = PlantaImagem.query.count()
        plantas_com_imagens = db.session.query(PlantaImagem.id_planta).distinct().count()
        
        resultado['total_imagens'] = total_imagens
        resultado['total_plantas_com_imagens'] = plantas_com_imagens
        
        # Verificar espaço em disco (se possível)
        try:
            import shutil
            total, used, free = shutil.disk_usage(UPLOAD_FOLDER)
            resultado['disk_space'] = {
                'total_gb': round(total / (1024**3), 2),
                'used_gb': round(used / (1024**3), 2),
                'free_gb': round(free / (1024**3), 2),
                'usage_percent': round((used / total) * 100, 2)
            }
        except Exception as e:
            resultado['disk_space_error'] = str(e)
        
        return jsonify(resultado)
        
    except Exception as e:
        print(f"❌ Erro no health check de imagens: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@app.route('/api/plantas/<int:id_planta>/track', methods=['GET'])
def get_planta_with_tracking(id_planta):
    """
    VERSÃO MELHORADA - Frontend pode passar dados da pesquisa original
    Uso: /api/plantas/123/track?search_term=moringa&search_type=nome_popular
    """
    try:
        # Lógica original mantida
        planta = Planta.query.get_or_404(id_planta)
        
        # ✅ TRACKING PRECISO COM DADOS DO FRONTEND
        try:
            search_term = request.args.get('search_term', '').strip()
            search_type = request.args.get('search_type', 'nome_popular')
            
            # Se frontend passou dados da pesquisa original, usar esses
            if search_term:
                termo_pesquisa = search_term
                tipo_pesquisa = search_type
                print(f"🎯 Tracking preciso: '{termo_pesquisa}' ({tipo_pesquisa}) → clique em '{planta.nome_cientifico}'")
            else:
                # Fallback: usar dados da planta
                if planta.nomes_comuns and len(planta.nomes_comuns) > 0:
                    termo_pesquisa = planta.nomes_comuns[0].nome_comum_planta
                    tipo_pesquisa = 'nome_popular'
                else:
                    termo_pesquisa = planta.nome_cientifico
                    tipo_pesquisa = 'nome_cientifico'
                print(f"🎯 Tracking fallback: '{termo_pesquisa}' ({tipo_pesquisa})")
            
            # Registar clique como interesse real
            registar_pesquisa_segura(
                termo=termo_pesquisa,
                tipo=tipo_pesquisa,
                resultados=1,
                request_obj=request
            )
                
        except Exception as tracking_error:
            print(f"⚠️ Erro no tracking de clique (ignorado): {tracking_error}")
        
        # Resposta original mantida
        return jsonify(planta.to_dict(include_relations=True))
        
    except Exception as e:
        return handle_error(e)

@app.route('/api/pesquisas/stats', methods=['GET'])
def get_pesquisas_stats_api_principal():
    """Estatísticas de CLIQUES (interesse real) - não buscas vazias"""
    try:
        total_cliques = LogPesquisas.query.count()
        
        if total_cliques == 0:
            return jsonify({
                'total_cliques': 0,
                'mensagem': 'Nenhum clique registado ainda.',
                'dados_disponiveis': False,
                'metrica': 'cliques_em_plantas'
            })
        
        # Top 10 plantas mais clicadas (interesse real)
        top_termos = db.session.query(
            LogPesquisas.termo_pesquisa,
            LogPesquisas.tipo_pesquisa,
            db.func.count(LogPesquisas.id_pesquisa).label('total_cliques')
        ).filter(
            LogPesquisas.termo_pesquisa.isnot(None)
        ).group_by(
            LogPesquisas.termo_pesquisa,
            LogPesquisas.tipo_pesquisa
        ).order_by(
            db.desc('total_cliques')
        ).limit(10).all()
        
        # Distribuição por tipo de interesse
        por_tipo = db.session.query(
            LogPesquisas.tipo_pesquisa,
            db.func.count(LogPesquisas.id_pesquisa).label('total_cliques')
        ).group_by(
            LogPesquisas.tipo_pesquisa
        ).order_by(
            db.desc('total_cliques')
        ).all()
        
        # Cliques hoje
        hoje = datetime.utcnow().date()
        cliques_hoje = LogPesquisas.query.filter(
            db.func.date(LogPesquisas.data_pesquisa) == hoje
        ).count()
        
        # Plantas únicas clicadas
        plantas_unicas = db.session.query(
            db.func.count(db.func.distinct(LogPesquisas.termo_pesquisa))
        ).scalar()
        
        return jsonify({
            'total_cliques': total_cliques,
            'cliques_hoje': cliques_hoje,
            'plantas_unicas_clicadas': plantas_unicas,
            'dados_disponiveis': True,
            'metrica': 'interesse_real_por_cliques',
            'top_plantas_clicadas': [
                {
                    'termo': termo.termo_pesquisa,
                    'tipo_busca': termo.tipo_pesquisa,
                    'total_cliques': termo.total_cliques
                } for termo in top_termos
            ],
            'interesse_por_tipo': [
                {
                    'tipo_busca': tipo.tipo_pesquisa,
                    'total_cliques': tipo.total_cliques,
                    'percentual': round((tipo.total_cliques / total_cliques * 100), 1)
                } for tipo in por_tipo
            ],
            'primeiro_clique': LogPesquisas.query.order_by(LogPesquisas.data_pesquisa.asc()).first().data_pesquisa.isoformat() if total_cliques > 0 else None,
            'ultimo_clique': LogPesquisas.query.order_by(LogPesquisas.data_pesquisa.desc()).first().data_pesquisa.isoformat() if total_cliques > 0 else None
        })
        
    except Exception as e:
        return jsonify({
            'erro': 'Erro ao obter estatísticas de cliques',
            'detalhes': str(e),
            'total_cliques': 0,
            'dados_disponiveis': False
        }), 500

@app.route('/api/pesquisas/debug', methods=['GET'])
def debug_pesquisas_api_principal():
    """Debug das pesquisas - NOVA ROTA"""
    try:
        total = LogPesquisas.query.count()
        
        # Últimas 5 pesquisas
        ultimas = LogPesquisas.query.order_by(
            db.desc(LogPesquisas.data_pesquisa)
        ).limit(5).all()
        
        return jsonify({
            'status': 'OK',
            'total_pesquisas': total,
            'tabela_existe': True,
            'ultimas_pesquisas': [
                {
                    'id': p.id_pesquisa,
                    'termo': p.termo_pesquisa,
                    'tipo': p.tipo_pesquisa,
                    'resultados': p.resultados_encontrados,
                    'data': p.data_pesquisa.isoformat() if p.data_pesquisa else None,
                    'ip': p.ip_usuario
                } for p in ultimas
            ],
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'ERRO',
            'erro': str(e),
            'tabela_existe': False
        }), 500

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