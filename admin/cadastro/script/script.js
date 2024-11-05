// Funções para carregar, cadastrar, editar e deletar produtos e categorias
let produtoEmEdicao = null;
let modal = null;
let btnAbrirModal = null;
let spanFechar = null;

// Variável global para controlar se os eventos já foram registrados
let eventosRegistrados = false;

function inicializarModal() {
    // Busca os elementos do modal
    const elementos = {
        modal: document.getElementById('modal-categorias'),
        btnAbrir: document.getElementById('btn-abrir-modal'),
        btnFechar: document.querySelector('.close'),
        formCategoria: document.getElementById('form-categoria'),
        listaCategorias: document.getElementById('lista-categorias')
    };

    // Verifica quais elementos estão faltando
    const elementosFaltando = Object.entries(elementos)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (elementosFaltando.length > 0) {
        console.warn('Elementos do modal não encontrados:', elementosFaltando);
        return false;
    }

    // Configura os eventos do modal
    elementos.btnAbrir.addEventListener('click', () => {
        elementos.modal.style.display = 'block';
        atualizarListaCategorias();
    });

    elementos.btnFechar.addEventListener('click', () => {
        elementos.modal.style.display = 'none';
    });

    // Fecha o modal quando clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === elementos.modal) {
            elementos.modal.style.display = 'none';
        }
    });

    // Configura o formulário de categorias
    elementos.formCategoria.addEventListener('submit', async (event) => {
        event.preventDefault();
        await cadastrarCategoria(event);
        await atualizarListaCategorias();
    });

    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Tenta inicializar o modal
        if (!inicializarModal()) {
            throw new Error('Falha ao inicializar o modal');
        }

        inicializarEventos();

        await Promise.all([
            carregarCategorias(),
            carregarProdutos()
        ]);

        console.log('Inicialização concluída com sucesso');
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
});

// Constante para a URL base da API
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Configuração padrão para todas as chamadas fetch
const fetchConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    mode: 'cors'
};

// Função para carregar categorias do banco de dados e preencher o select
async function carregarCategorias() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`, fetchConfig);
        if (!response.ok) {
            throw new Error('Erro ao carregar categorias: ' + response.status);
        }
        const categorias = await response.json();
        const selectCategoria = document.getElementById('categoria-produto');
        selectCategoria.innerHTML = ''; // Limpa as opções existentes
        
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            selectCategoria.appendChild(option);
        });
    } catch (error) {
        console.error(error);
    }
}

// Função para carregar produtos do banco de dados e exibir na lista
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE_URL}/lanches`, fetchConfig);
        if (!response.ok) {
            throw new Error('Erro ao carregar produtos: ' + response.status);
        }
        const produtos = await response.json();
        const listaProdutos = document.getElementById('lista-produtos-cadastrados');
        listaProdutos.innerHTML = '';

        produtos.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            
            // Garante que a URL da imagem seja usada corretamente
            const imagemUrl = produto.image_url || produto.imagem || '../assets/img/not-found.jpg';
            
            card.innerHTML = `
                <div class="produto-imagem">
                    <img src="${imagemUrl}" 
                         alt="${produto.nome}" 
                         onerror="this.src='../assets/img/not-found.jpg'"
                         style="max-width: 100%; height: auto;">
                </div>
                <div class="produto-info">
                    <h3>${produto.nome}</h3>
                    <p class="produto-descricao">${produto.descricao || 'Sem descrição'}</p>
                    <p class="produto-preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
                    <p class="produto-categoria">Categoria: ${produto.categoria || 'Sem categoria'}</p>
                </div>
                <div class="produto-acoes">
                    <button class="btn-icon btn-edit" onclick="editarProduto(${produto.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deletarProduto(${produto.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            listaProdutos.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

// Função para editar produto
async function editarProduto(id) {
    try {
        console.log(`🔄 Iniciando edição do produto ID: ${id}`);
        
        const response = await fetch(`${API_BASE_URL}/lanches/${id}`);
        const produto = await response.json();
        
        console.log('📦 Dados do produto recebidos:', produto);
        
        // Preenche os campos do formulário
        document.getElementById('nome-produto').value = produto.nome || '';
        document.getElementById('descricao-produto').value = produto.descricao || '';
        document.getElementById('preco-produto').value = produto.preco || '';
        
        const selectCategoria = document.getElementById('categoria-produto');
        if (selectCategoria) {
            console.log(`🎯 Categoria atual: ${produto.categoria_id}`);
            selectCategoria.value = produto.categoria_id;
        }
        
        document.getElementById('imagem-url').value = produto.image_url || '';
        
        produtoEmEdicao = id;
        console.log('✏️ Produto em modo de edição:', id);

        // Atualiza o texto do botão
        const btnSalvar = document.getElementById('btn-salvar');
        if (btnSalvar) {
            btnSalvar.textContent = 'Atualizar';
        }

    } catch (error) {
        console.error('❌ Erro ao carregar produto:', error);
        mostrarNotificacao('Erro ao carregar produto para edição', 'erro');
    }
}

// Função para atualizar produto
async function atualizarProduto(event) {
    event.preventDefault();
    
    try {
        const formData = {
            nome: document.getElementById('nome-produto').value.trim(),
            descricao: document.getElementById('descricao-produto').value.trim(),
            preco: parseFloat(document.getElementById('preco-produto').value),
            categoria_id: parseInt(document.getElementById('categoria-produto').value),
            image_url: document.getElementById('imagem-url').value.trim()
        };

        console.log('Dados sendo enviados:', formData);

        const response = await fetch(`${API_BASE_URL}/lanches/${produtoEmEdicao}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Produto esta em algum pedido');
        }

        // Exibe mensagem apropriada baseada na resposta
        let mensagem = data.message;
        if (data.tem_pedidos && formData.categoria_id !== data.lanche.categoria_id) {
            mensagem = 'Produto atualizado parcialmente. A categoria não pôde ser alterada pois existem pedidos vinculados.';
        }

        alert(mensagem);
        
        // Atualiza a tabela
        await carregarProdutos();
        
        // Limpa o formulário e reseta o estado
        document.getElementById('form-produto').reset();
        produtoEmEdicao = null;
        document.querySelector('button[type="submit"]').textContent = 'Cadastrar';
        
        // Esconde o preview da imagem
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }

    } catch (error) {
        console.error('Erro na atualização:', error);
        alert(error.message || 'Erro ao atualizar produto');
    }
}

// Função para deletar produto
async function deletarProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/lanches/${id}`, {
                method: 'DELETE',
                ...fetchConfig
            });

            if (!response.ok) {
                throw new Error('Erro ao deletar produto');
            }

            alert('Produto deletado com sucesso!');
            await carregarProdutos(); // Recarrega a lista
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            alert('Erro ao deletar produto');
        }
    }
}

// Função para cadastrar produto
async function cadastrarProduto(event) {
    event.preventDefault();
    
    try {
        const elementos = {
            nome: document.getElementById('nome-produto'),
            descricao: document.getElementById('descricao-produto'),
            preco: document.getElementById('preco-produto'),
            categoria: document.getElementById('categoria-produto'),
            imagem: document.getElementById('imagem-url')
        };

        const formData = {
            nome: elementos.nome.value.trim(),
            descricao: elementos.descricao.value.trim(),
            preco: parseFloat(elementos.preco.value),
            categoria_id: parseInt(elementos.categoria.value),
            image_url: elementos.imagem.value.trim()
        };

        console.log('Dados sendo enviados:', formData);

        const response = await fetch(`${API_BASE_URL}/lanches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Erro ao salvar produto');
        }

        limparFormulario();
        await carregarProdutos();
        mostrarNotificacao('Produto cadastrado com sucesso!', 'sucesso');

    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao(error.message, 'erro');
    }
}

// Nova função para limpar o formulário
function limparFormulario() {
    const form = document.getElementById('form-produto');
    if (form) {
        form.reset();
        
        // Reseta o botão
        const btnSubmit = form.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.textContent = 'Cadastrar';
        }
        
        // Limpa a variável de edição
        produtoEmEdicao = null;
        
        // Esconde o preview da imagem
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }
}

// Variável global para controlar a categoria em edição
let categoriaEmEdicao = null;

// Função para atualizar a lista de categorias
async function atualizarListaCategorias() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`, fetchConfig);
        if (!response.ok) {
            throw new Error('Erro ao carregar categorias');
        }
        const categorias = await response.json();
        
        // Atualiza a lista no modal
        const listaCategorias = document.getElementById('lista-categorias');
        if (listaCategorias) {
            listaCategorias.innerHTML = categorias.map(categoria => `
                <div class="categoria-item" data-id="${categoria.id}">
                    <span class="categoria-nome">${categoria.nome}</span>
                    <div class="categoria-acoes">
                        <button class="btn-icon btn-edit" onclick="editarCategoria(${categoria.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deletarCategoria(${categoria.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Atualiza o select de categorias se existir
        const selectCategorias = document.getElementById('categoria-produto');
        if (selectCategorias) {
            const categoriaAtual = selectCategorias.value;
            selectCategorias.innerHTML = categorias.map(categoria => `
                <option value="${categoria.id}" ${categoria.id == categoriaAtual ? 'selected' : ''}>
                    ${categoria.nome}
                </option>
            `).join('');
        }

        return categorias; // Retorna as categorias caso seja necessário usar em outro lugar
    } catch (error) {
        console.error('Erro ao atualizar lista de categorias:', error);
        console.error('Erro ao atualizar lista de categorias');
        return [];
    }
}

// Função para cadastrar/atualizar categoria
async function cadastrarCategoria(event) {
    event.preventDefault();
    
    try {
        const formData = {
            nome: document.getElementById('nome-categoria').value
        };

        let url = `${API_BASE_URL}/categorias`;
        let method = 'POST';

        if (categoriaEmEdicao) {
            url = `${API_BASE_URL}/categorias/${categoriaEmEdicao}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar categoria');
        }

        console.success(
            categoriaEmEdicao ? 'Categoria atualizada com sucesso!' : 'Categoria cadastrada com sucesso!'
        );
        
        // Reseta o formulário
        resetarFormularioCategoria();
        
        // Atualiza a lista de categorias
        await atualizarListaCategorias();

    } catch (error) {
        console.error('Erro:', error);
        console.error(error.message || 'Erro ao salvar categoria');
    }
}

// Função para deletar categoria
async function deletarCategoria(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
            return;
        }

        const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
            method: 'DELETE',
            ...fetchConfig
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.error && data.error.includes('produtos vinculados')) {
                console.error(
                    'Não é possível excluir esta categoria pois existem produtos vinculados a ela',
                    'Ação não permitida'
                );
            } else {
                throw new Error(data.error || 'Erro ao deletar categoria');
            }
            return;
        }

        console.success('Categoria deletada com sucesso!');
        
        // Atualiza a lista de categorias
        await atualizarListaCategorias();

    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        console.error(error.message || 'Erro ao deletar categoria');
    }
}

// Função para editar categoria
async function editarCategoria(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias/${id}`, fetchConfig);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar categoria');
        }

        const inputNome = document.getElementById('nome-categoria');
        const btnSubmit = document.querySelector('#form-categoria button[type="submit"]');
        
        if (!inputNome || !btnSubmit) {
            throw new Error('Elementos do formulário não encontrados');
        }

        inputNome.value = data.nome;
        btnSubmit.textContent = 'Atualizar Categoria';
        categoriaEmEdicao = id;

    } catch (error) {
        console.error('Erro ao carregar categoria para edição:', error);
        console.error(error.message || 'Erro ao carregar categoria para edição');
    }
}

// Função para resetar o formulário
function resetarFormularioCategoria() {
    const form = document.getElementById('form-categoria');
    const btnSubmit = form.querySelector('button[type="submit"]');
    
    if (form && btnSubmit) {
        form.reset();
        btnSubmit.textContent = 'Cadastrar Categoria';
        categoriaEmEdicao = null;
    }
}

// Adicionar eventos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    const formCategoria = document.getElementById('form-categoria');
    if (formCategoria) {
        formCategoria.onsubmit = cadastrarCategoria; // Usa apenas um handler
    }
    
    // Carregar categorias inicialmente
    atualizarListaCategorias();
});

// Adicionar evento para cancelar edição
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente ...

    // Adicionar botão de cancelar edição no formulário
    const formCategoria = document.getElementById('form-categoria');
    if (formCategoria) {
        const btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.className = 'btn-sec';
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.display = 'none';
        btnCancelar.onclick = function() {
            formCategoria.reset();
            categoriaEmEdicao = null;
            const btnSubmit = formCategoria.querySelector('button[type="submit"]');
            btnSubmit.textContent = 'Cadastrar Categoria';
            btnCancelar.style.display = 'none';
        };
        formCategoria.appendChild(btnCancelar);
    }
});

// Função para atualizar apenas a lista de produtos
async function atualizarListaProdutos() {
    try {
        const response = await fetch(`${API_BASE_URL}/lanches`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar produtos');
        }
        
        const produtos = await response.json();
        
        // Verifica se o elemento existe usando querySelector
        const listaProdutos = document.querySelector('#lista-produtos-cadastrados, #lista-produtos');
        if (!listaProdutos) {
            throw new Error('Container de produtos não encontrado');
        }

        listaProdutos.innerHTML = produtos.map(produto => `
            <div class="produto-item" data-id="${produto.id}">
                <div class="produto-info">
                    ${produto.imagem ? `
                        <div class="produto-imagem">
                            <img 
                                src="${produto.imagem}" 
                                alt="${produto.nome}"
                                onerror="this.onerror=null;this.src='../assets/img/not-found.jpg'"
                            >
                        </div>
                    ` : ''}
                    <div class="produto-detalhes">
                        <h3 class="produto-nome">${produto.nome}</h3>
                        <p class="produto-descricao">${produto.descricao || ''}</p>
                        <p class="produto-preco">Preço: R$ ${parseFloat(produto.preco).toFixed(2)}</p>
                        <p class="produto-categoria">Categoria: ${produto.categoria || produto.categoria_nome}</p>
                    </div>
                </div>
                <div class="produto-acoes">
                    <button class="btn-icon btn-edit" onclick="editarProduto(${produto.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deletarProduto(${produto.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro ao atualizar lista de produtos:', error);
        console.error('Erro ao atualizar lista de produtos');
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    // ... outras inicializações ...

    // Carrega os produtos inicialmente
    await atualizarListaProdutos();
});

// Função para inicializar os eventos do formulário
function inicializarEventos() {
    if (eventosRegistrados) return;

    const form = document.getElementById('form-produto');
    if (form) {
        // Remove event listeners existentes
        const novoForm = form.cloneNode(true);
        form.parentNode.replaceChild(novoForm, form);
        
        // Adiciona novo event listener
        novoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (produtoEmEdicao) {
                atualizarProduto(event);
            } else {
                cadastrarProduto(event);
            }
        });
        
        eventosRegistrados = true;
    }
}

// Adicionar função auxiliar para scroll suave
function scrollToForm() {
    const formProduto = document.getElementById('form-produto');
    if (formProduto) {
        formProduto.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
        });
    }
}

// Adicione a função mostrarNotificacao
function mostrarNotificacao(mensagem, tipo) {
    // Implementação básica de notificação
    alert(mensagem);
}

