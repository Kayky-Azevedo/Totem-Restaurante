let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

function carregarPedidos() {
    const listaPedidos = document.getElementById('lista-pedidos');
    listaPedidos.innerHTML = '';

    pedidos.forEach(pedido => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="pedido-detalhes">
                <strong>${pedido.cliente}</strong>
                <span>${pedido.produtos}</span>
                <span><strong>Total:</strong> R$ ${pedido.total}</span>
                <span class="pedido-hora"><strong>Data/Hora:</strong> ${pedido.dataHora}</span>
            </div>
        `;
        listaPedidos.appendChild(li);
    });
}

window.onload = carregarPedidos;
