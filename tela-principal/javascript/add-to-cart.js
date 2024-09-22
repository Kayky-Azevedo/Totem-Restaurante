let pedido = [];
let total = 0;

// Adiciona um item ao carrinho
function adicionarItem(nome, preco, imagem, descricao) {
    const itemExistente = pedido.find(item => item.nome === nome);
    
    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        pedido.push({ nome: nome, preco: preco, imagem: imagem, quantidade: 1 });
    }

    total += preco;
    atualizarPedido();
    salvarCarrinho(); // Salva o carrinho no localStorage
}

// Atualiza a lista de pedidos no carrinho
function atualizarPedido() {
    const listaPedido = document.getElementById('lista-pedido');
    listaPedido.innerHTML = ''; // Limpa a lista de pedidos

    pedido.forEach(item => {
        const itemPedido = document.createElement('li');
        itemPedido.classList.add('item-pedido');

        itemPedido.innerHTML = `
            <img src="${item.imagem}" alt="${item.nome}">
            <div class="descricao">
                <strong>${item.nome}</strong>
                <div class="quantidade">
                    <button onclick="alterarQuantidade('${item.nome}', -1)">-</button>
                    <span>${item.quantidade}</span>
                    <button onclick="alterarQuantidade('${item.nome}', 1)">+</button>
                </div>
                <span>R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
            </div>
        `;

        listaPedido.appendChild(itemPedido);
    });

    // Atualiza o valor total no carrinho
    const totalElement = document.getElementById('total');
    totalElement.textContent = total.toFixed(2).replace('.', ',');
}

// Altera a quantidade de um item no carrinho
function alterarQuantidade(nome, quantidade) {
    const item = pedido.find(item => item.nome === nome);
    
    if (item) {
        const novaQuantidade = item.quantidade + quantidade;
        
        if (novaQuantidade <= 0) {
            removerItem(nome);
        } else {
            item.quantidade = novaQuantidade;
            total += item.preco * quantidade;
            atualizarPedido();
            salvarCarrinho(); // Salva o carrinho no localStorage
        }
    }
}

// Remove um item do carrinho
function removerItem(nome) {
    const item = pedido.find(item => item.nome === nome);
    
    if (item) {
        total -= item.preco * item.quantidade; // Subtrai o valor total do item (preço * quantidade)
        
        // Remove o item do pedido
        pedido = pedido.filter(item => item.nome !== nome);
        
        // Atualiza a exibição do pedido e o total
        atualizarPedido();
        salvarCarrinho(); // Salva o carrinho no localStorage
    }
}

// Função para salvar o carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('cartItems', JSON.stringify(pedido));
}

// Função para finalizar o pedido
function finalizarPedido() {
    if (pedido.length === 0) {
        alert("O carrinho está vazio! Adicione produtos antes de finalizar.");
        return;
    }

    // Armazena os detalhes do pedido no localStorage
    localStorage.setItem('orderDetails', JSON.stringify({ produtos: pedido, total: total.toFixed(2) }));

    // Redireciona para a página de pagamento
    window.location.href = '../tela-de-pagamento/pagamento.html';
}
