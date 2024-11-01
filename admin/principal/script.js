// Seleciona os botões pelo ID
const btnPedidos = document.getElementById('btnPedidos');
const btnCadastro = document.getElementById('btnCadastro');

// Adiciona eventos de clique para os botões
btnPedidos.addEventListener('click', function() {
    // Redireciona para a página de pedidos
    window.location.href = '../pedidos/pedidos.html';
});

btnCadastro.addEventListener('click', function() {
    // Redireciona para a página de cadastro de produtos
    window.location.href = '../cadastro-produtos/cadastro.html';
});
