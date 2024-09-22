let produtos = [];
let editando = false;
let produtoAtual = null;

function salvarProduto() {
    const nome = document.getElementById('nome-produto').value;
    const preco = document.getElementById('preco-produto').value;
    const categoria = document.getElementById('categoria-produto').value;
    const descricao = document.getElementById('descricao-produto').value;
    const imagem = document.getElementById('imagem-produto').files[0];

    const novoProduto = {
        id: Date.now(),
        nome,
        preco,
        categoria,
        descricao,
        imagem: URL.createObjectURL(imagem)
    };

    produtos.push(novoProduto);
    atualizarListaProdutos();
    limparFormulario();
}

function atualizarListaProdutos() {
    const listaProdutos = document.getElementById('lista-produtos-cadastrados');
    listaProdutos.innerHTML = '';

    produtos.forEach(produto => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <img src="${produto.imagem}" alt="${produto.nome}">
                <strong>${produto.nome}</strong> - R$ ${produto.preco}
            </div>
            <div class="produto-acoes">
                <button onclick="editarProduto(${produto.id})">Editar</button>
                <button onclick="deletarProduto(${produto.id})">Deletar</button>
            </div>
        `;
        listaProdutos.appendChild(li);
    });
}

function editarProduto(id) {
    const produto = produtos.find(produto => produto.id === id);

    document.getElementById('nome-produto').value = produto.nome;
    document.getElementById('preco-produto').value = produto.preco;
    document.getElementById('categoria-produto').value = produto.categoria;
    document.getElementById('descricao-produto').value = produto.descricao;
    produtoAtual = produto;

    document.getElementById('btn-salvar').style.display = 'none';
    document.getElementById('btn-atualizar').style.display = 'inline-block';
    document.getElementById('btn-cancelar').style.display = 'inline-block';
}

function atualizarProduto() {
    produtoAtual.nome = document.getElementById('nome-produto').value;
    produtoAtual.preco = document.getElementById('preco-produto').value;
    produtoAtual.categoria = document.getElementById('categoria-produto').value;
    produtoAtual.descricao = document.getElementById('descricao-produto').value;

    atualizarListaProdutos();
    cancelarEdicao();
}

function deletarProduto(id) {
    produtos = produtos.filter(produto => produto.id !== id);
    atualizarListaProdutos();
}

function cancelarEdicao() {
    limparFormulario();
    document.getElementById('btn-salvar').style.display = 'inline-block';
    document.getElementById('btn-atualizar').style.display = 'none';
    document.getElementById('btn-cancelar').style.display = 'none';
}

function limparFormulario() {
    document.getElementById('nome-produto').value = '';
    document.getElementById('preco-produto').value = '';
    document.getElementById('categoria-produto').value = '';
    document.getElementById('descricao-produto').value = '';
    document.getElementById('imagem-produto').value = '';
    produtoAtual = null;
}
