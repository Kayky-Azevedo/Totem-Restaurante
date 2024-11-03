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

        // Inicializa o formulário de produto uma única vez
        const formProduto = document.getElementById('form-produto');
        if (formProduto) {
            formProduto.addEventListener('submit', cadastrarProduto);
        }

        // Carrega os dados iniciais
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
            // Converte o preço para número
            const preco = parseFloat(produto.preco);
            
            const card = document.createElement('div');
            card.className = 'produto-card';
            
            card.innerHTML = `
                <div class="produto-imagem">
                    <img src="${produto.imagem || 'caminho/para/imagem/padrao.jpg'}" 
                         alt="${produto.nome}" 
                         onerror="this.src='../assets/img/not-found.jpg'">
                </div>
                <div class="produto-info">
                    <h3>${produto.nome}</h3>
                    <p class="produto-descricao">${produto.descricao || 'Sem descrição'}</p>
                    <p class="produto-preco">R$ ${preco.toFixed(2)}</p>
                    <p class="produto-categoria">Categoria: ${produto.categoria}</p>
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
        const response = await fetch(`${API_BASE_URL}/lanches/${id}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar produto');
        }

        const produto = await response.json();
        console.log('Dados recebidos do produto:', produto);

        // Scroll suave até o formulário
        const formProduto = document.getElementById('form-produto');
        if (formProduto) {
            formProduto.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Preenche os campos do formulário
        document.getElementById('nome-produto').value = produto.nome || '';
        document.getElementById('descricao-produto').value = produto.descricao || '';
        document.getElementById('preco-produto').value = produto.preco || '';
        document.getElementById('categoria-produto').value = produto.categoria_id || '';
        document.getElementById('imagem-url').value = produto.image_url || ''; // Ajustado para 'imagem'

        produtoEmEdicao = id;

        const btnSalvar = document.getElementById('btn-salvar');
        if (btnSalvar) {
            btnSalvar.textContent = 'Atualizar';
            btnSalvar.classList.add('btn-atualizar');
        }

    } catch (error) {
        console.error('Erro ao carregar produto para edição:', error);
        alert('Erro ao carregar produto para edição: ' + error.message);
    }
}

// Função para atualizar produto
async function atualizarProduto() {
    try {
        if (!produtoEmEdicao) {
            throw new Error('Nenhum produto selecionado para atualização');
        }

        const produto = {
            nome: elementos.nome.value,
            descricao: elementos.descricao.value,
            preco: parseFloat(elementos.preco.value),
            categoria_id: parseInt(elementos.categoria.value),
            image_url: elementos.imagem.value.trim()
        };

        console.log('Dados sendo enviados na atualização:', produto); // Debug

        const response = await fetch(`${API_BASE_URL}/lanches/${produtoEmEdicao}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(produto)
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar produto');
        }

        await atualizarListaProdutos();
        resetarFormularioProduto();
        mostrarNotificacao('Produto atualizado com sucesso!', 'sucesso');

    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao atualizar produto: ' + error.message, 'erro');
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

        // Verifica se todos os elementos existem
        const elementosFaltando = Object.entries(elementos)
            .filter(([, element]) => !element)
            .map(([name]) => name);

        if (elementosFaltando.length > 0) {
            throw new Error(`Elementos não encontrados: ${elementosFaltando.join(', ')}`);
        }

        const formData = {
            nome: elementos.nome.value.trim(),
            descricao: elementos.descricao.value.trim(),
            preco: parseFloat(elementos.preco.value),
            categoria_id: parseInt(elementos.categoria.value),
            image_url: elementos.imagem.value.trim() // Mantém image_url para API
        };

        console.log('Dados sendo enviados:', formData); // Para debug

        const url = produtoEmEdicao 
            ? `${API_BASE_URL}/lanches/${produtoEmEdicao}`
            : `${API_BASE_URL}/lanches`;

        const response = await fetch(url, {
            method: produtoEmEdicao ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao salvar produto');
        }

        // Limpa o formulário e atualiza a lista
        resetarFormularioProduto();
        await carregarProdutos();
        
        alert(produtoEmEdicao ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');

    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    }
}

// Função para resetar o formulário
function resetarFormularioProduto() {
    const form = document.getElementById('form-produto');
    const btnSalvar = document.getElementById('btn-salvar');
    
    if (form) {
        form.reset();
    }
    
    if (btnSalvar) {
        btnSalvar.textContent = 'Cadastrar';
        btnSalvar.classList.remove('btn-atualizar');
    }
    
    produtoEmEdicao = null;
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
                    <h3>${produto.nome}</h3>
                    <p>${produto.descricao || ''}</p>
                    <p>Preço: R$ ${parseFloat(produto.preco).toFixed(2)}</p>
                    <p>Categoria: ${produto.categoria_nome || produto.categoria}</p>
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
    if (eventosRegistrados) return; // Evita registro duplicado de eventos

    const form = document.getElementById('form-produto');
    if (form) {
        // Remove eventos anteriores, se houver
        form.removeEventListener('submit', cadastrarProduto);
        // Adiciona o novo evento
        form.addEventListener('submit', cadastrarProduto);
        eventosRegistrados = true;
    }
}

// Event listener para quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Inicializa os eventos uma única vez
        inicializarEventos();
        
        // Carrega os dados iniciais
        await Promise.all([
            carregarCategorias(),
            carregarProdutos()
        ]);

    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
});

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

