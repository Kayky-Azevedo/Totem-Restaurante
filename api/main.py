from flask import Flask, request, jsonify, session, make_response
from werkzeug.utils import secure_filename
from flask_session import Session  # Utilize Flask-Session para gerenciar sessões do lado do servidor
from flask_cors import CORS
import json
import secrets
import duckdb
import os

# Configuração do Flask
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:5501",
            "http://localhost:5501"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
app.secret_key = 'macaco'
app.config['SESSION_TYPE'] = 'filesystem'  # Armazena a sessão no sistema de arquivos
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Use True apenas em HTTPS

Session(app)

# Conectar ao banco DuckDB (arquivo será criado automaticamente se não existir)
con = duckdb.connect('lanchonete.db')

# Função para criar as tabelas no banco de dados
def criar_tabelas():
    con.execute('''
      CREATE TABLE IF NOT EXISTS usuarios (
          id BIGINT PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          senha VARCHAR(255) NOT NULL,
          telefone VARCHAR(15),
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    ''')
    con.execute('''
      CREATE TABLE IF NOT EXISTS categorias (
          id BIGINT PRIMARY KEY,
          nome VARCHAR(50) NOT NULL
      );
    ''')
    con.execute('''
      CREATE TABLE IF NOT EXISTS lanches (
          id BIGINT PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          descricao TEXT,
          preco DECIMAL(10, 2) NOT NULL,
          categoria_id BIGINT,
          image_url TEXT,
          FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      );
    ''')
    con.execute('''
      CREATE TABLE IF NOT EXISTS pedidos (
          id BIGINT PRIMARY KEY,
          usuario_id BIGINT,
          data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) DEFAULT 'pendente',
          total DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
    ''')
    con.execute('''
      CREATE TABLE IF NOT EXISTS pedido_itens (
          id BIGINT PRIMARY KEY,
          pedido_id BIGINT,
          lanche_id BIGINT,
          quantidade INTEGER NOT NULL,
          preco_unitario DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
          FOREIGN KEY (lanche_id) REFERENCES lanches(id)
      );
    ''')
    con.execute('''
      CREATE TABLE IF NOT EXISTS pagamentos (
          id BIGINT PRIMARY KEY,
          pedido_id BIGINT,
          metodo_pagamento VARCHAR(50),
          status_pagamento VARCHAR(20) DEFAULT 'pendente',
          valor_pagamento DECIMAL(10, 2) NOT NULL,
          data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          nome_completo VARCHAR(100),
          email VARCHAR(100),
          endereco VARCHAR(200),
          cidade VARCHAR(50),
          estado VARCHAR(50),
          cep VARCHAR(20),
          FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
      );
    ''')
    con.execute('''
        DROP TABLE IF EXISTS Carrinho;
        CREATE TABLE Carrinho (
            id BIGINT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            items TEXT NOT NULL,
            total DECIMAL(10, 2),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios(id)
        );
    ''')

    # Criar sequences para cada tabela
    con.execute('CREATE SEQUENCE IF NOT EXISTS seq_usuarios START 1')
    con.execute('CREATE SEQUENCE IF NOT EXISTS seq_categorias START 1')
    con.execute('CREATE SEQUENCE IF NOT EXISTS seq_lanches START 1')
    con.execute('CREATE SEQUENCE IF NOT EXISTS seq_pedidos START 1')
    con.execute('CREATE SEQUENCE IF NOT EXISTS seq_pedido_itens START 1')
    con.execute('CREATE SEQUENCE IF NOT EXISTS seq_pagamentos START 1')
    con.execute('CREATE SEQUENCE IF NOT EXISTS seq_carrinho START 1')

# Criar as tabelas no banco
criar_tabelas()

def get_connection():
    return duckdb.connect('lanchonete.db')
# ==================== ROTAS DE USUÁRIOS ====================

@app.route('/api/usuarios', methods=['POST'])
def criar_usuario():
    con = get_connection()
    try:
        data = request.json
        nome = data.get('nome')
        email = data.get('email')
        senha = data.get('senha')
        telefone = data.get('telefone')
        
        # Pegar o próximo ID da sequência
        next_id = con.execute('SELECT nextval(\'seq_usuarios\')').fetchone()[0]
        
        # Incluir o ID na inserção
        con.execute('''
            INSERT INTO usuarios (id, nome, email, senha, telefone) 
            VALUES (?, ?, ?, ?, ?)
        ''', (next_id, nome, email, senha, telefone))
        
        con.commit()
        return jsonify({'message': 'Usuário criado com sucesso!'}), 201
    except Exception as e:
        con.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        con.close()

@app.route('/api/usuarios/login', methods=['POST'])
def login_usuario():
    con = get_connection()
    data = request.json
    email = data.get('email')
    senha = data.get('senha')
    usuario = con.execute('''
        SELECT id, nome, email FROM usuarios WHERE email = ? AND senha = ?
    ''', (email, senha)).fetchone()
    if usuario:
        session['user_id'] = usuario[0]  # Salva o ID do usuário na sessão
        session['name'] = usuario[1]  # Salva o ID do usuário na sessão
        print("Sessão após login:", session)  # Verifique se o user_id está aqui
        return jsonify({'message': 'Login bem-sucedido!', 'user_id': usuario[0], 'name': usuario[1]}), 200
    else:
        return jsonify({'error': 'Credenciais inválidas!'}), 401

@app.route('/api/usuario', methods=['GET'])
def get_usuario():
    print("Sessão no get_usuario:", session)
    if 'user_id' in session:
        return jsonify({'user_id': session['user_id'], 'userName': session['name']}), 200
    return jsonify({'message': 'Usuário não autenticado'}), 401

@app.route('/api/reset_password', methods=['POST'])
def reset_password():
    con = get_connection()
    data = request.json
    email = data.get('email')
    nova_senha = data.get('novaSenha')
    if not email or not nova_senha:
        return jsonify({'error': 'Email e nova senha são obrigatórios!'}), 400
    try:
        con.execute('''
            UPDATE usuarios 
            SET senha = ? 
            WHERE email = ?
        ''', (nova_senha, email))
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
        categorias = con.execute('SELECT id, nome FROM categorias').fetchall()
        categorias_list = [{'id': categoria[0], 'nome': categoria[1]} for categoria in categorias]
        return jsonify(categorias_list), 200  # Retorna as categorias como um array JSON
    except Exception as e:
        app.logger.error(f"Erro ao buscar categorias: {e}")
        return jsonify({'error': 'Erro ao buscar categorias.'}), 500

        
@app.route('/api/lanches/<int:id>', methods=['GET'])
def obter_lanche(id):
    con = get_connection()
    cursor = con.cursor()
    cursor.execute("SELECT * FROM lanches WHERE id = ?", (id,))
    lanche = cursor.fetchone()
    if lanche:
        return jsonify({
            'id': lanche[0],
            'nome': lanche[1],
            'descricao': lanche[2],
            'preco': lanche[3],
            'categoria_id': lanche[4],
            'image_url': lanche[5],
        }), 200
    else:
        return jsonify({'message': 'Lanche não encontrado.'}), 404

@app.route('/api/lanches', methods=['GET'])
def listar_lanches():
    con = get_connection()
    try:
        lanches = con.execute('''
            SELECT l.*, c.nome as categoria 
            FROM lanches l 
            JOIN categorias c ON l.categoria_id = c.id
        ''').fetchall()
        
        lanches_list = []
        for lanche in lanches:
            # Debug: imprimir os dados do lanche
            print(f"Lanche ID: {lanche[0]}, Nome: {lanche[1]}, Imagem: {lanche[5]}")
            
            lanches_list.append({
                'id': lanche[0],
                'nome': lanche[1],
                'descricao': lanche[2],
                'preco': lanche[3],
                'categoria_id': lanche[4],
                'imagem': lanche[5] if lanche[5] else None,  # Garante que imagem nula seja None
                'categoria': lanche[6]
            })
        
        return jsonify(lanches_list), 200
    except Exception as e:
        print(f"Erro ao listar lanches: {str(e)}")
        return jsonify({'message': f'Erro ao listar lanches: {str(e)}'}), 500
    finally:
        con.close()

@app.route('/api/lanches', methods=['POST'])
def adicionar_lanche():
    con = get_connection()
    try:
        data = request.get_json()
        nome = data.get('nome')
        descricao = data.get('descricao')
        preco = data.get('preco')
        categoria_id = data.get('categoria_id')
        image_url = data.get('image_url')

        if not all([nome, preco, categoria_id]):
            return jsonify({"message": "Nome, preço e categoria são obrigatórios."}), 400

        # Pegar o próximo ID da sequência
        next_id = con.execute('SELECT nextval(\'seq_lanches\')').fetchone()[0]

        # Incluir o ID na inserção
        con.execute('''
            INSERT INTO lanches (id, nome, descricao, preco, categoria_id, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (next_id, nome, descricao, preco, categoria_id, image_url))
        
        con.commit()
        return jsonify({"message": "Lanche adicionado com sucesso!", "id": next_id}), 201

    except Exception as e:
        con.rollback()
        print(f"Erro ao adicionar lanche: {str(e)}")  # Para debug
        return jsonify({"message": f"Erro ao adicionar lanche: {str(e)}"}), 500
    finally:
        con.close()

@app.route('/api/lanches/<int:id>', methods=['PUT'])
def atualizar_lanche(id):
    con = get_connection()
    try:
        data = request.json
        
        # Verifica se o lanche existe
        lanche_existente = con.execute(
            "SELECT * FROM lanches WHERE id = ?", 
            (id,)
        ).fetchone()
        
        if not lanche_existente:
            return jsonify({'message': 'Lanche não encontrado.'}), 404

        # Prepara os dados para atualização
        nome = data.get('nome')
        descricao = data.get('descricao')
        preco = data.get('preco')
        categoria_id = data.get('categoria_id')
        image_url = data.get('image_url')
        
        if image_url == 'undefined':
            image_url = None
        
        # Executa as atualizações individualmente
        try:
            con.execute("UPDATE lanches SET nome = ? WHERE id = ?", (nome, id))
            con.execute("UPDATE lanches SET descricao = ? WHERE id = ?", (descricao, id))
            con.execute("UPDATE lanches SET preco = ? WHERE id = ?", (preco, id))
            con.execute("UPDATE lanches SET categoria_id = ? WHERE id = ?", (categoria_id, id))
            con.execute("UPDATE lanches SET image_url = ? WHERE id = ?", (image_url, id))
            
            con.commit()
            
            # Verifica se a atualização foi bem-sucedida
            lanche_atualizado = con.execute("SELECT * FROM lanches WHERE id = ?", (id,)).fetchone()
            
            if lanche_atualizado:
                return jsonify({
                    'message': 'Lanche atualizado com sucesso!',
                    'lanche': {
                        'id': lanche_atualizado[0],
                        'nome': lanche_atualizado[1],
                        'descricao': lanche_atualizado[2],
                        'preco': float(lanche_atualizado[3]),
                        'categoria_id': lanche_atualizado[4],
                        'image_url': lanche_atualizado[5]
                    }
                }), 200
            
        except Exception as update_error:
            # Se o erro contiver "Duplicate key" mas a atualização funcionou, podemos ignorar
            if "Duplicate key" in str(update_error):
                return jsonify({
                    'message': 'Lanche atualizado com sucesso!',
                    'warning': 'Houve um aviso durante a atualização, mas os dados foram salvos corretamente.'
                }), 200
            else:
                raise update_error
                
    except Exception as e:
        print(f"Erro durante a atualização: {str(e)}")
        return jsonify({
            'message': 'Erro ao atualizar lanche',
            'error': str(e)
        }), 500
    
    finally:
        if con:
            try:
                con.close()
            except:
                pass

@app.route('/api/lanches/<int:id>', methods=['DELETE'])
def remover_lanche(id):
    con = get_connection()
    try:
        con.execute('DELETE FROM lanches WHERE id = ?', (id,))
        con.commit()
        return jsonify({'message': 'Lanche removido com sucesso!'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        if con:
            con.close()

@app.route('/api/categorias', methods=['POST'])
def adicionar_categoria():
    con = get_connection()
    try:
        data = request.json
        nome = data.get('nome')
        
        if not nome:
            return jsonify({'message': 'Nome da categoria é obrigatório'}), 400
            
        # Pega o último ID
        ultimo_id = con.execute("SELECT MAX(id) FROM categorias").fetchone()[0]
        novo_id = 1 if ultimo_id is None else ultimo_id + 1
            
        # Insere a nova categoria com ID
        con.execute(
            "INSERT INTO categorias (id, nome) VALUES (?, ?)",
            (novo_id, nome)
        )
        con.commit()
        
        return jsonify({
            'message': 'Categoria cadastrada com sucesso!',
            'categoria': {
                'id': novo_id,
                'nome': nome
            }
        }), 201
        
    except Exception as e:
        print(f"Erro ao adicionar categoria: {str(e)}")
        if con:
            try:
                con.rollback()
            except:
                pass
        return jsonify({'message': f'Erro ao cadastrar categoria: {str(e)}'}), 500
        
    finally:
        if con:
            try:
                con.close()
            except:
                pass

@app.route('/api/categorias', methods=['GET'])
def listar_categorias():
    con = get_connection()
    try:
        categorias = con.execute("SELECT * FROM categorias").fetchall()
        return jsonify([{
            'id': categoria[0],
            'nome': categoria[1]
        } for categoria in categorias])
        
    except Exception as e:
        print(f"Erro ao listar categorias: {str(e)}")
        return jsonify({'message': f'Erro ao listar categorias: {str(e)}'}), 500
        
    finally:
        con.close()

@app.route('/api/categorias/<int:id>', methods=['PUT'])
def atualizar_categoria(id):
    try:
        data = request.json
        nome = data.get('nome')
        
        if not nome:
            return jsonify({'error': 'Nome da categoria é obrigatório'}), 400
        
        con = get_connection()
        cursor = con.cursor()
        
        # Verifica se a categoria existe
        cursor.execute("SELECT id FROM categorias WHERE id = ?", (id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Categoria não encontrada'}), 404
        
        # Atualiza a categoria
        cursor.execute("UPDATE categorias SET nome = ? WHERE id = ?", (nome, id))
        con.commit()
        
        return jsonify({
            'message': 'Categoria atualizada com sucesso',
            'id': id,
            'nome': nome
        }), 200
            
    except Exception as e:
        print(f"Erro ao atualizar categoria: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'con' in locals():
            con.close()

# Remover uma categoria
@app.route('/api/categorias/<int:id>', methods=['DELETE'])
def deletar_categoria(id):
    try:
        con = get_connection()
        cursor = con.cursor()
        
        # Verifica se a categoria existe
        cursor.execute("SELECT id FROM categorias WHERE id = ?", (id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Categoria não encontrada'}), 404
        
        # Verifica se existem produtos usando esta categoria
        cursor.execute("SELECT COUNT(*) FROM lanches WHERE categoria_id = ?", (id,))
        if cursor.fetchone()[0] > 0:
            return jsonify({
                'error': 'Não é possível excluir esta categoria pois existem produtos vinculados a ela'
            }), 400
        
        # Deleta a categoria
        cursor.execute("DELETE FROM categorias WHERE id = ?", (id,))
        con.commit()
        
        return jsonify({'message': 'Categoria deletada com sucesso'}), 200
            
    except Exception as e:
        print(f"Erro ao deletar categoria: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'con' in locals():
            con.close()

@app.route('/api/carrinho/<int:user_id>', methods=['GET'])
def get_cart(user_id):
    try:
        con = get_connection()
        existing_cart = con.execute('SELECT items FROM carrinho WHERE user_id = ?', (user_id,)).fetchone()
        if existing_cart:
            items = json.loads(existing_cart[0])
            return jsonify(items), 200
        else:
            return jsonify([]), 200
    except Exception as e:
        app.logger.error(f"Erro ao carregar o carrinho: {e}")
        return jsonify({"error": "Erro ao carregar o carrinho."}), 500

@app.route('/api/carrinho/<int:user_id>', methods=['POST'])
def update_cart(user_id):
    try:
        con = get_connection()
        data = request.get_json()
        item_id = data['id']
        action = data['action']
        
        # Busca carrinho existente
        existing_cart = con.execute('SELECT id, items FROM carrinho WHERE user_id = ?', (user_id,)).fetchone()
        
        if existing_cart:
            cart_id = existing_cart[0]
            items = json.loads(existing_cart[1])
        else:
            # Gera novo ID para o carrinho
            cart_id = con.execute('SELECT COALESCE(MAX(id), 0) + 1 FROM Carrinho').fetchone()[0]
            items = []

        # Lógica para atualizar itens
        item_found = next((item for item in items if item['id'] == item_id), None)
        if action == 'add':
            if item_found:
                item_found['quantity'] += 1
            else:
                new_item = {
                    'id': item_id,
                    'nome': data.get('nome'),
                    'preco': data.get('preco'),
                    'imagem': data.get('imagem'),
                    'quantity': 1
                }
                items.append(new_item)
        elif action == 'increase' and item_found:
            item_found['quantity'] += 1
        elif action == 'decrease' and item_found:
            item_found['quantity'] -= 1
            if item_found['quantity'] == 0:
                items.remove(item_found)

        total = sum(item['preco'] * item['quantity'] for item in items)        

        # Atualiza ou insere o carrinho
        if existing_cart:
            con.execute('''
                UPDATE Carrinho 
                SET items = ?, total = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (json.dumps(items), total, cart_id))
        else:
            con.execute('''
                INSERT INTO Carrinho (id, user_id, items, total) 
                VALUES (?, ?, ?, ?)
            ''', (cart_id, user_id, json.dumps(items), total))

        con.commit()
        return jsonify(items), 200
    except Exception as e:
        app.logger.error(f"Erro ao atualizar o carrinho: {e}")
        return jsonify({"error": "Erro ao atualizar o carrinho."}), 500
    finally:
        con.close()

@app.route('/api/carrinho/<int:user_id>/item/<int:lanche_id>', methods=['DELETE'])
def remove_item_cart(user_id, lanche_id):
    con = get_connection()
    existing_cart = con.execute('SELECT items FROM carrinho WHERE user_id = ?', (user_id,)).fetchone()
    if not existing_cart:
        return jsonify({"error": "Carrinho não encontrado para o usuário"}), 404
    items = json.loads(existing_cart[0])
    item_found = False
    for item in items:
        if item['id'] == lanche_id:
            item_found = True
            if item['quantity'] > 1:
                item['quantity'] -= 1
            else:
                items.remove(item)
            break
    if not item_found:
        return jsonify({"error": "Item não encontrado no carrinho"}), 404
    con.execute('UPDATE carrinho SET items = ? WHERE user_id = ?', (json.dumps(items), user_id))
    con.commit()
    return jsonify({"message": "Item removido do carrinho com sucesso"}), 200

# ==================== ROTAS DE PEDIDOS ====================
@app.route('/api/pedidos', methods=['POST'])
def criar_pedido():
    try:
        con = get_connection()
        data = request.json
        usuario_id = data.get('usuario_id')
        total = data.get('total')
        itens = data.get('itens')  # Lista de itens
        con.execute('''INSERT INTO pedidos (usuario_id, total) VALUES (?, ?)''', (usuario_id, total))
        pedido_id = con.execute('SELECT last_insert_rowid()').fetchone()[0]
        for item in itens:
            lanche_id = item['lanche_id']
            quantidade = item['quantidade']
            preco_unitario = item['preco_unitario']
            con.execute('''INSERT INTO pedido_itens (pedido_id, lanche_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)''', (pedido_id, lanche_id, quantidade, preco_unitario))
        con.execute('DELETE FROM Carrinho WHERE usuario_id = ?', (usuario_id,))
        con.commit()
        return jsonify({'message': 'Pedido criado com sucesso!'}), 201
    except Exception as e:
        app.logger.error(f"Erro ao criar pedido: {e}")
        return jsonify({'error': 'Erro ao criar pedido.'}), 500
    finally:
        con.close()

@app.route('/api/checkout', methods=['POST'])
def checkout():
    con = get_connection()
    data = request.json
    usuario_id = data.get('usuario_id')
    itens = data.get('itens')
    total = sum(item['preco'] * item.get('quantidade', 1) for item in itens)
    try:
        con.execute('INSERT INTO pedidos (usuario_id, total) VALUES (?, ?)', (usuario_id, total))
        pedido_id = con.execute('SELECT id FROM pedidos ORDER BY id DESC LIMIT 1').fetchone()[0]
        for item in itens:
            lanche_id = item['id']
            quantidade = item.get('quantidade', 1)
            preco_unitario = item['preco']
            con.execute('''INSERT INTO pedido_itens (pedido_id, lanche_id, quantidade, preco_unitario) 
                           VALUES (?, ?, ?, ?)''', (pedido_id, lanche_id, quantidade, preco_unitario))
        con.execute('DELETE FROM carrinho WHERE user_id = ?', (usuario_id,))
        session[pedido_id] = pedido_id
        con.commit()
        return jsonify({'message': 'Pedido criado com sucesso!', 'pedido_id': session[pedido_id]}), 201
    except Exception as e:
        con.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        con.close()

@app.route('/api/pedidos', methods=['GET'])
def get_pedidos():
    con = get_connection()
    pedidos = con.execute('''SELECT p.id, p.data_pedido, p.status, p.total, u.nome AS usuario_nome FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id''').fetchall()
    pedidos_detalhes = []
    for pedido in pedidos:
        pedido_id = pedido[0]
        itens = con.execute('''
            SELECT i.quantidade, i.preco_unitario, l.nome FROM pedido_itens i
            JOIN lanches l ON i.lanche_id = l.id
            WHERE i.pedido_id = ?''', (pedido_id,)).fetchall()
        pedidos_detalhes.append({
            'id': pedido[0],
            'data_pedido': pedido[1],
            'status': pedido[2],
            'total': pedido[3],
            'usuario': pedido[4],
            'itens': [{'nome': item[2], 'quantidade': item[0], 'preco_unitario': item[1]} for item in itens]
        })

    return jsonify(pedidos_detalhes), 200

# ==================== ROTAS DE PAGAMENTOS ====================
@app.route('/api/pagamento', methods=['POST'])
def pagamento():
    con = get_connection()
    data = request.json
    pedido_id = data.get('pedido_id')
    metodo_pagamento = data.get('metodo_pagamento', 'Cartão de Crédito')
    status_pagamento = data.get('status_pagamento', 'pago')
    valor_pagamento = data.get('valor_pagamento')
    nome_completo = data.get('nome_completo')
    email = data.get('email')
    endereco = data.get('endereco')
    cidade = data.get('cidade')
    estado = data.get('estado')
    cep = data.get('cep')

    try:
        con.execute('UPDATE pedidos SET status_pagamento = ? WHERE id = ?', (status_pagamento, pedido_id))
        con.execute('''INSERT INTO pagamentos (pedido_id, metodo_pagamento, status_pagamento, valor_pagamento, 
                                               data_pagamento, nome_completo, email, endereco, cidade, estado, cep)
                       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)''', 
                   (pedido_id, metodo_pagamento, status_pagamento, valor_pagamento, 
                    nome_completo, email, endereco, cidade, estado, cep))
        con.commit()
        return jsonify({'message': 'Pagamento confirmado com sucesso!'}), 200
    except Exception as e:
        con.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        con.close()

@app.route('/api/lanches/categoria/<int:categoria_id>', methods=['GET'])
def listar_lanches_por_categoria(categoria_id):
    con = get_connection()
    try:
        if categoria_id:
            lanches = con.execute('''
                SELECT l.*, c.nome as categoria 
                FROM lanches l 
                JOIN categorias c ON l.categoria_id = c.id 
                WHERE l.categoria_id = ?
            ''', (categoria_id,)).fetchall()
        else:
            lanches = con.execute('''
                SELECT l.*, c.nome as categoria 
                FROM lanches l 
                JOIN categorias c ON l.categoria_id = c.id
            ''').fetchall()

        lanches_list = [{
            'id': lanche[0],
            'nome': lanche[1],
            'descricao': lanche[2],
            'preco': lanche[3],
            'categoria_id': lanche[4],
            'imagem': lanche[5],
            'categoria': lanche[6]
        } for lanche in lanches]
        
        return jsonify(lanches_list), 200
    except Exception as e:
        print(f"Erro ao listar lanches por categoria: {str(e)}")
        return jsonify({'message': f'Erro ao listar lanches: {str(e)}'}), 500
    finally:
        con.close()

# Rota para obter uma categoria específica
@app.route('/api/categorias/<int:id>', methods=['GET'])
def obter_categoria(id):
    try:
        con = get_connection()
        cursor = con.cursor()
        cursor.execute("SELECT * FROM categorias WHERE id = ?", (id,))
        categoria = cursor.fetchone()
        
        if categoria:
            return jsonify({
                'id': categoria[0],
                'nome': categoria[1]
            }), 200
        else:
            return jsonify({'message': 'Categoria não encontrada.'}), 404
            
    except Exception as e:
        print(f"Erro ao obter categoria: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        con.close()

con.close()
if __name__ == '__main__':
    app.run(debug=True)