window.onload = function() {
    const orderDetails = JSON.parse(localStorage.getItem('orderDetails'));

    if (orderDetails) {
        const listaProdutos = document.getElementById('lista-produtos');
        const totalElement = document.getElementById('total-pagamento');

        orderDetails.produtos.forEach(produto => {
            const item = document.createElement('li');

            item.innerHTML = `
                <img src="${produto.imagem}" alt="${produto.nome}">
                <div class="produto-detalhes">
                    <span><strong>${produto.quantidade}x</strong> ${produto.nome}</span>
                    <span>R$ ${(produto.preco * produto.quantidade).toFixed(2).replace('.', ',')}</span>
                </div>
            `;

            listaProdutos.appendChild(item);
        });

        totalElement.textContent = 'R$ ' + orderDetails.total.replace('.', ',');
    }
};

function validarFormulario() {
    // Adicione a validação dos campos aqui
    // Por exemplo, verificando se os campos obrigatórios estão preenchidos
    const nome = document.getElementById('nome').value;
    const cartao = document.getElementById('cartao').value;
    const validade = document.getElementById('validade').value;
    const cvv = document.getElementById('cvv').value;

    if (nome === '' || cartao === '' || validade === '' || cvv === '') {
        alert('Por favor, preencha todos os campos.');
        return false;
    }

    // Se a validação for bem-sucedida, redirecione para a página de carregamento
    return true;
}

function confirmarPagamento() {
    if (validarFormulario()) {
        window.location.href = 'loading-pagamento/loading.html'; // Ajuste o caminho conforme necessário
    }
}

