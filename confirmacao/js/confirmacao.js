document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const loadingOverlay = document.getElementById('loadingOverlay');
    const mainContent = document.getElementById('mainContent');
    const numeroPedidoElement = document.getElementById('numeroPedido');
    const valorTotalElement = document.getElementById('valorTotal');

    // Dados do pedido
    const pedidoId = sessionStorage.getItem('pedidoId');
    const valorTotal = sessionStorage.getItem('totalPedido');

    // Preencher dados
    if (numeroPedidoElement && pedidoId) {
        numeroPedidoElement.textContent = `#${pedidoId.padStart(6, '0')}`;
    }

    if (valorTotalElement && valorTotal) {
        valorTotalElement.textContent = formatarMoeda(valorTotal);
    }

    // Esconder loading e mostrar conteúdo após 1 segundo
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        if (mainContent) {
            mainContent.style.display = 'block';
        }
    }, 1000);
});

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function voltarHome() {
    window.location.href = '../index.html';
}

function verPedidos() {
    window.location.href = '../pedidos/index.html';
} 