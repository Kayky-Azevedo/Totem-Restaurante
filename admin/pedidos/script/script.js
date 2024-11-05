document.addEventListener('DOMContentLoaded', () => {
    fetchPedidos();
});

function fetchPedidos() {
    fetch('http://localhost:5000/api/pedidos')
        .then(response => response.json())
        .then(data => {
            const listaPedidos = document.getElementById('lista-pedidos');
            listaPedidos.innerHTML = '';

            // Calcula o valor total dos pedidos
            const valorTotal = data.reduce((total, pedido) => {
                const valorPedido = isNaN(Number(pedido.total)) ? 0 : Number(pedido.total);
                return total + valorPedido;
            }, 0);

            // Atualiza o elemento com o valor total
            const totalElement = document.querySelector('.total-pedidos span');
            if (totalElement) {
                totalElement.textContent = `R$ ${valorTotal.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
            }

            data.forEach(pedido => {
                const pedidoItem = document.createElement('li');
                pedidoItem.classList.add('pedido-item');

                // Apenas número do pedido e nome do cliente inicialmente
                pedidoItem.innerHTML = `
                    <div class="pedido-header">Pedido #${pedido.id} - Cliente: ${pedido.usuario}</div>
                    <div class="pedido-detalhes" style="display: none;">
                        <p>Data: ${new Date(pedido.data_pedido).toLocaleString()}</p>
                        <p>Status: ${pedido.status}</p>
                        <p>Total: R$${isNaN(Number(pedido.total)) ? '0.00' : Number(pedido.total).toFixed(2)}</p>
                        <h4>Itens:</h4>
                        <ul>
                            ${pedido.itens.map(item => `
                                <li>${item.nome} - Quantidade: ${item.quantidade} - Preço: R$${isNaN(Number(item.preco_unitario)) ? '0.00' : Number(item.preco_unitario).toFixed(2)}</li>
                            `).join('')}
                        </ul>
                    </div>
                `;

                // Evento de clique para mostrar/ocultar detalhes
                pedidoItem.querySelector('.pedido-header').addEventListener('click', () => {
                    const detalhes = pedidoItem.querySelector('.pedido-detalhes');
                    detalhes.style.display = detalhes.style.display === 'none' ? 'block' : 'none';
                });

                listaPedidos.appendChild(pedidoItem);
            });
        })
        .catch(error => {
            console.error('Erro ao buscar pedidos:', error);
            // Adiciona tratamento de erro visual
            const totalElement = document.querySelector('.total-pedidos span');
            if (totalElement) {
                totalElement.textContent = 'Erro ao calcular total';
            }
        });
}

// Opcional: Atualizar os pedidos a cada X segundos
function iniciarAtualizacaoAutomatica(intervalo = 30000) { // 30 segundos
    setInterval(fetchPedidos, intervalo);
}

// Iniciar atualizações automáticas quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    fetchPedidos();
    iniciarAtualizacaoAutomatica();
});
