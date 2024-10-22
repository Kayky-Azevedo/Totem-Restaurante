from flask import Flask, request, jsonify
from flask_cors import CORS
import duckdb

# Configuração do Flask
app = Flask(__name__)
CORS(app)
# Conectar ao banco DuckDB (arquivo será criado automaticamente se não existir)
con = duckdb.connect('lanchonete.db')

# Função para criar as tabelas no banco de dados
def criar_tabelas():
    con.execute('''
      CREATE SEQUENCE IF NOT EXISTS lanchonete START 1;
      ''')
    con.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER DEFAULT nextval('lanchonete') PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            senha VARCHAR(255) NOT NULL,
            telefone VARCHAR(15),
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    con.execute('''
      CREATE SEQUENCE IF NOT EXISTS lanchonete START 1;
      ''')
    con.execute('''
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER DEFAULT nextval('lanchonete') PRIMARY KEY,
            nome VARCHAR(50) NOT NULL
        );
    ''')
    con.execute('''
      CREATE SEQUENCE IF NOT EXISTS lanchonete START 1;
      ''')
    con.execute('''
        CREATE TABLE IF NOT EXISTS lanches (
            id INTEGER DEFAULT nextval('lanchonete') PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            descricao TEXT,
            preco DECIMAL(10, 2) NOT NULL,
            categoria_id INTEGER,
            image_url TEXT,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        );
    ''')
    con.execute('''
      CREATE SEQUENCE IF NOT EXISTS lanchonete START 1;
      ''')
    con.execute('''
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER DEFAULT nextval('lanchonete') PRIMARY KEY,
            usuario_id INTEGER,
            data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) DEFAULT 'pendente',
            total DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        );
    ''')
    con.execute('''
      CREATE SEQUENCE IF NOT EXISTS lanchonete START 1;
      ''')
    con.execute('''
        CREATE TABLE IF NOT EXISTS pedido_itens (
            id INTEGER DEFAULT nextval('lanchonete') PRIMARY KEY,
            pedido_id INTEGER,
            lanche_id INTEGER,
            quantidade INTEGER NOT NULL,
            preco_unitario DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
            FOREIGN KEY (lanche_id) REFERENCES lanches(id)
        );
    ''')
    con.execute('''
      CREATE SEQUENCE IF NOT EXISTS lanchonete START 1;
      ''')
    con.execute('''
        CREATE TABLE IF NOT EXISTS pagamentos (
            id INTEGER DEFAULT nextval('lanchonete') PRIMARY KEY,
            pedido_id INTEGER,
            metodo_pagamento VARCHAR(50),
            status_pagamento VARCHAR(20) DEFAULT 'pendente',
            valor_pagamento DECIMAL(10, 2) NOT NULL,
            data_pagamento TIMESTAMP,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        );
    ''')

# Criar as tabelas no banco
criar_tabelas()

def get_connection():
    return duckdb.connect('lanchonete.db')
# ==================== ROTAS DE USUÁRIOS ====================

@app.route('/api/usuarios', methods=['POST'])
def criar_usuario():
  con = get_connection()
  data = request.json
  nome = data.get('nome')
  email = data.get('email')
  senha = data.get('senha')
  telefone = data.get('telefone')
  
  con.execute('''
      INSERT INTO usuarios (nome, email, senha, telefone) 
      VALUES (?, ?, ?, ?)
  ''', (nome, email, senha, telefone))

  return jsonify({'message': 'Usuário criado com sucesso!'}), 201

@app.route('/api/usuarios/login', methods=['POST'])
def login_usuario():
  con = get_connection()
  data = request.json
  email = data.get('email')
  senha = data.get('senha')

  usuario = con.execute('SELECT * FROM usuarios WHERE email = ? AND senha = ?', (email, senha)).fetchone()

  if usuario:
      return jsonify({'message': 'Login bem-sucedido!', 'usuario': usuario}), 200
  else:
      return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/api/reset_password', methods=['POST'])
def reset_password():
    con = get_connection()
    data = request.json
    email = data.get('email')
    nova_senha = data.get('novaSenha')

    # Verifica se o email e a nova senha foram fornecidos
    if not email or not nova_senha:
        return jsonify({'error': 'Email e nova senha são obrigatórios!'}), 400

    try:
        # Hash a nova senha (caso esteja usando bcrypt)
        # Atualiza a senha do usuário no banco de dados
        con.execute('''
            UPDATE usuarios 
            SET senha = ? 
            WHERE email = ?
        ''', (nova_senha, email))

        # Verifica se a atualização foi bem-sucedida usando uma consulta SELECT
        updated_user = con.execute('SELECT * FROM usuarios WHERE email = ?', (email,)).fetchone()

        if updated_user is None:
            return jsonify({'error': 'Email não encontrado.'}), 404
        
        return jsonify({'message': 'Senha redefinida com sucesso!'}), 200
    except Exception as e:
        app.logger.error(f"Erro ao redefinir a senha: {e}")
        return jsonify({'error': 'Erro ao redefinir a senha.'}), 500

# ==================== ROTAS DE LANCHES ====================

@app.route('/api/categorias', methods=['GET'])
def get_categorias():
    con = get_connection()
    try:
        # Buscar as categorias do banco de dados
        categorias = con.execute('SELECT id, nome FROM categorias').fetchall()

        # Converter os resultados para um formato de dicionário
        categorias_list = [{'id': categoria[0], 'nome': categoria[1]} for categoria in categorias]

        return jsonify(categorias_list), 200  # Retorna as categorias como um array JSON
    except Exception as e:
        app.logger.error(f"Erro ao buscar categorias: {e}")
        return jsonify({'error': 'Erro ao buscar categorias.'}), 500


@app.route('/api/lanches', methods=['POST'])
def adicionar_lanche():
  con = get_connection()
  data = request.json
  nome = data.get('nome')
  descricao = data.get('descricao')
  preco = data.get('preco')
  categoria_id = data.get('categoria_id')

  con.execute('''
      INSERT INTO lanches (nome, descricao, preco, categoria_id) 
      VALUES (?, ?, ?, ?)
  ''', (nome, descricao, preco, categoria_id))

  return jsonify({'message': 'Lanche adicionado com sucesso!'}), 201

@app.route('/api/lanches', methods=['GET'])
def listar_lanches():
    categoria_id = request.args.get('categoria_id')
    con = get_connection()
    if categoria_id:
        lanches = con.execute('SELECT * FROM lanches WHERE categoria_id = ?', (categoria_id,)).fetchall()
    else:
        lanches = con.execute('SELECT * FROM lanches').fetchall()

    return jsonify(lanches), 200

@app.route('/api/lanches/<int:id>', methods=['PUT'])
def atualizar_lanche(id):
  con = get_connection()
  data = request.json
  nome = data.get('nome')
  descricao = data.get('descricao')
  preco = data.get('preco')
  categoria_id = data.get('categoria_id')

  con.execute('''
      UPDATE lanches SET nome = ?, descricao = ?, preco = ?, categoria_id = ? WHERE id = ?
  ''', (nome, descricao, preco, categoria_id, id))

  return jsonify({'message': 'Lanche atualizado com sucesso!'}), 200

@app.route('/api/lanches/<int:id>', methods=['DELETE'])
def deletar_lanche(id):
  con = get_connection()
  con.execute('DELETE FROM lanches WHERE id = ?', (id,))
  return jsonify({'message': 'Lanche deletado com sucesso!'}), 200

# ==================== ROTAS DE PEDIDOS ====================

@app.route('/api/pedidos', methods=['POST'])
def criar_pedido():
  con = get_connection()
  data = request.json
  usuario_id = data.get('usuario_id')
  total = data.get('total')
  itens = data.get('itens')  # Lista de itens

  con.execute('''
      INSERT INTO pedidos (usuario_id, total) 
      VALUES (?, ?)
  ''', (usuario_id, total))

  pedido_id = con.execute('SELECT last_insert_rowid()').fetchone()[0]

  # Inserir itens do pedido
  for item in itens:
      lanche_id = item['lanche_id']
      quantidade = item['quantidade']
      preco_unitario = item['preco_unitario']

      con.execute('''
          INSERT INTO pedido_itens (pedido_id, lanche_id, quantidade, preco_unitario) 
          VALUES (?, ?, ?, ?)
      ''', (pedido_id, lanche_id, quantidade, preco_unitario))

  return jsonify({'message': 'Pedido criado com sucesso!'}), 201

# ==================== ROTAS DE PAGAMENTOS ====================

@app.route('/api/pagamentos', methods=['POST'])
def registrar_pagamento():
  con = get_connection()
  data = request.json
  pedido_id = data.get('pedido_id')
  metodo_pagamento = data.get('metodo_pagamento')
  valor_pagamento = data.get('valor_pagamento')

  con.execute('''
      INSERT INTO pagamentos (pedido_id, metodo_pagamento, valor_pagamento) 
      VALUES (?, ?, ?)
  ''', (pedido_id, metodo_pagamento, valor_pagamento))

  return jsonify({'message': 'Pagamento registrado com sucesso!'}), 201

con.close()
# Executar o servidor Flask
if __name__ == '__main__':
    app.run(debug=True)
