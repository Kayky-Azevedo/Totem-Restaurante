document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
    const checkoutButton = document.querySelector('#sidebar .checkout-button') || 
                          document.querySelector('.sidebar--footer .checkout-button');
    console.log('Botão de checkout encontrado:', checkoutButton);

    const menuList = document.getElementById('menu--list');
    const cardContainer = document.querySelector('.card--list');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const cartItemCount = document.querySelector('.cart-icon span');
    const cartIcon = document.querySelector('.cart-icon');
    const sidebar = document.getElementById('sidebar');
    const closeButton = document.querySelector('.sidebar-close');

    document.getElementById('openCartButton').addEventListener('click', async () => {
        await loadCartFromDatabase();
        sidebar.style.display = 'block';
    });

    const userName = sessionStorage.getItem('userName');  // Supondo que o nome do usuário seja salvo no sessionStorage
    const greetingElement = document.getElementById('greeting');
    if (userName) {
        greetingElement.textContent = `Olá, ${userName}`;
    } else {
        greetingElement.textContent = 'Olá, visitante';
    }

    let totalAmount = 0;

    fetchAllProducts();
    fetchCategories();

    function fetchCategories() {
        fetch('http://localhost:5000/api/categorias')
            .then(response => response.json())
            .then(categories => {
                // Limpa a lista de menu antes de adicionar os itens
                menuList.innerHTML = '';
                
                // Adiciona o botão "Todos" primeiro
                const todosItem = document.createElement('div');
                todosItem.classList.add('menu--item', 'active');
                todosItem.dataset.category = 'todos';
                
                const todosTitle = document.createElement('h5');
                todosTitle.textContent = 'Todos';
                
                todosItem.appendChild(todosTitle);
                menuList.appendChild(todosItem);
                
                todosItem.addEventListener('click', (event) => {
                    event.preventDefault();
                    
                    // Remove a classe ativa de todos os itens
                    document.querySelectorAll('.menu--item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Adiciona a classe ativa ao item "Todos"
                    todosItem.classList.add('active');
                    
                    currentCategoryId = null; // Reset da categoria atual
                    fetchAllProducts(); // Mostra todos os produtos
                });
                
                // Adiciona as demais categorias
                categories.forEach(createCategory);
            })
            .catch(error => console.error('Erro ao buscar categorias:', error));
    }

    async function loadCartFromDatabase() {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            console.log("Usuário não está logado");
            return;
        }

        try {
            console.log('Carregando carrinho para usuário:', userId); // Debug
            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}`);
            
            if (!response.ok) {
                console.error('Erro na resposta:', response.status);
                throw new Error('Erro ao carregar carrinho');
            }

            const data = await response.json();
            console.log('Dados recebidos do servidor:', data); // Debug

            // Atualiza o carrinho global
            window.cart = Array.isArray(data) ? data : [];
            console.log('Carrinho após processamento:', window.cart); // Debug

            updateCartUI();
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
        }
    }

    async function saveCartToDatabase() {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            console.error("Erro: userId está indefinido. Verifique se o usuário está logado.");
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(window.cart),
            });
            if (!response.ok) {
                const error = await response.json();
                console.error('Erro ao salvar o carrinho no banco de dados:', error.error);
            }
        } catch (error) {
            console.error('Erro ao salvar o carrinho no banco de dados:', error);
        }
    }

    async function fetchAllProducts() {
        try {
            const response = await fetch('http://localhost:5000/api/lanches');
            const products = await response.json();
            createCards(products);
        } catch (error) {
            console.error('Erro ao buscar todos os lanches:', error);
        }
    }
        
    function createCategory(category) {
        const menuItem = document.createElement('div');
        menuItem.classList.add('menu--item');
        menuItem.dataset.category = category.nome;

        const title = document.createElement('h5');
        title.textContent = category.nome;

        menuItem.appendChild(title);
        menuList.appendChild(menuItem);

        menuItem.addEventListener('click', (event) => {
            event.preventDefault();
            filterProducts(category.id);
        });
    }

    function filterProducts(categoriaId) {
        fetch(`http://localhost:5000/api/lanches/categoria/${categoriaId}`)
            .then(response => response.json())
            .then(products => createCards(products))
            .catch(error => console.error('Erro ao buscar lanches:', error));
    }

    function createCards(products) {
        cardContainer.innerHTML = ''; 
        
        products.forEach(product => {
            console.log('Dados do produto:', product); // Debug
            const { id, nome, descricao, preco, imagem, categoria } = product;
            console.log('URL da imagem:', imagem); // Debug
            
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.id = id;

            const categoryLabel = document.createElement('h6');
            categoryLabel.classList.add('category-label');
            categoryLabel.textContent = categoria;
            card.appendChild(categoryLabel);

            const img = document.createElement('img');
            if (imagem && imagem !== 'null' && imagem !== 'undefined') {
                img.src = imagem;
                img.alt = nome;
                img.onerror = function() {
                    console.error(`Erro ao carregar imagem para ${nome}: ${imagem}`);
                    this.src = '../assets/img/default-product.png';
                };
            } else {
                img.src = '../assets/img/default-product.png';
                img.alt = 'Imagem indisponível';
            }
            
            // Adiciona classe para estilização
            img.classList.add('card-image');
            card.appendChild(img);

            const title = document.createElement('h4');
            title.classList.add('card--title');
            title.textContent = nome;
            card.appendChild(title);

            const description = document.createElement('p');
            description.classList.add('card-description');
            description.textContent = descricao;
            card.appendChild(description);

            const priceContainer = document.createElement('div');
            priceContainer.classList.add('card--price');

            const price = document.createElement('div');
            price.classList.add('price');
            price.textContent = `R$${parseFloat(preco).toFixed(2)}`;

            const addToCartIcon = document.createElement('i');
            addToCartIcon.classList.add('fa-solid', 'fa-plus', 'add-to-cart');
            addToCartIcon.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const product = { 
                    id, 
                    nome, 
                    preco: parseFloat(preco), 
                    imagem: imagem 
                };
                await addToCart(product);
            });

            priceContainer.appendChild(price);
            priceContainer.appendChild(addToCartIcon);
            card.appendChild(priceContainer);

            cardContainer.appendChild(card);
        });
    }

    async function addToCart(product) {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert('Por favor, faça login para adicionar itens ao carrinho');
            window.location.href = '../login/index.html';
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: product.id,
                    nome: product.nome,
                    preco: product.preco,
                    imagem: product.imagem,
                    action: 'add'
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao adicionar ao carrinho');
            }

            const data = await response.json();
            window.cart = data; // Atualiza o carrinho com os dados do servidor
            
            // Atualiza a UI e mostra o carrinho
            updateCartUI();
            document.getElementById('sidebar').style.display = 'block';
            
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            alert('Erro ao adicionar ao carrinho: ' + error.message);
        }
    }

    function updateCartUI() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total');
        const cartItemCount = document.querySelector('.cart-icon span');
        
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (Array.isArray(window.cart) && window.cart.length > 0) {
            window.cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
                
                cartItem.innerHTML = `
                    <div class="cart-item-content">
                        <div class="cart-item-left">
                            <img src="${item.imagem || '../assets/img/default-product.png'}" 
                                 alt="${item.nome}">
                        </div>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.nome}</div>
                            <div class="cart-item-price">R$ ${Number(item.preco).toFixed(2)}</div>
                        </div>
                        <div class="cart-item-actions">
                            <button onclick="decreaseItemQuantity(${index})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="increaseItemQuantity(${index})">+</button>
                        </div>
                    </div>
                `;
                    
                cartItemsContainer.appendChild(cartItem);
                total += item.preco * item.quantity;
            });
        } else {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
        }

        cartTotal.textContent = `R$ ${total.toFixed(2)}`;
        cartItemCount.textContent = window.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Definir as funções no escopo global
    window.decreaseItemQuantity = async function(index) {
        const userId = sessionStorage.getItem('userId');
        if (!userId || !window.cart[index]) return;

        try {
            const item = window.cart[index];
            if (item.quantity <= 1) {
                // Se a quantidade for 1, remove o item
                await removeItemFromCart(index);
                return;
            }

            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: item.id,
                    nome: item.nome,
                    preco: item.preco,
                    imagem: item.imagem,
                    quantity: item.quantity - 1,
                    action: 'decrease'
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar quantidade');
            }

            const data = await response.json();
            window.cart = Array.isArray(data) ? data : [];
            updateCartUI();
        } catch (error) {
            console.error('Erro ao diminuir quantidade:', error);
        }
    };

    window.increaseItemQuantity = async function(index) {
        const userId = sessionStorage.getItem('userId');
        if (!userId || !window.cart[index]) return;

        try {
            const item = window.cart[index];
            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: item.id,
                    nome: item.nome,
                    preco: item.preco,
                    imagem: item.imagem,
                    quantity: item.quantity + 1,
                    action: 'increase'
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar quantidade');
            }

            const data = await response.json();
            window.cart = Array.isArray(data) ? data : [];
            updateCartUI();
        } catch (error) {
            console.error('Erro ao aumentar quantidade:', error);
        }
    };

    window.removeItemFromCart = async function(index) {
        const userId = sessionStorage.getItem('userId');
        if (!userId || !window.cart[index]) return;

        try {
            const item = window.cart[index];
            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: item.id,
                    action: 'remove'
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao remover item');
            }

            const data = await response.json();
            window.cart = Array.isArray(data) ? data : [];
            updateCartUI();
        } catch (error) {
            console.error('Erro ao remover item:', error);
        }
    };

    async function updateCartInDatabase(productId, action, quantity) {
        const userId = sessionStorage.getItem('userId');
        try {
            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: productId, action: action, quantity: quantity }),
            });
            if (!response.ok) {
                const error = await response.json();
                console.error('Erro ao atualizar a quantidade no carrinho:', error.error);
            }
        } catch (error) {
            console.error('Erro ao atualizar a quantidade no carrinho:', error.message);
        }
    }

    async function removeItemFromCart(index) {
        const productId = window.cart[index].id;
        const userId = sessionStorage.getItem('userId');
        try {
            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}/item/${productId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                window.cart.splice(index, 1);  // Remove item localmente
                updateCartUI();  // Atualiza UI
            } else {
                const error = await response.json();
                console.error('Erro ao remover o item do carrinho:', error.error);
            }
        } catch (error) {
            console.error('Erro ao remover o item do carrinho:', error.message);
        }
    }

    cartIcon.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    closeButton.addEventListener('click', () => {
        sidebar.style.display = 'none';
    });

    loadCartFromDatabase(); // Carrega o carrinho quando a página é carregada

    // Mova o evento de click para cá
    if (checkoutButton) {
        checkoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clique no botão de checkout detectado');
            
            try {
                if (!window.cart || window.cart.length === 0) {
                    alert("O carrinho está vazio!");
                    return;
                }
                
                const userId = sessionStorage.getItem('userId');
                if (!userId) {
                    alert('Por favor, faça login para continuar com a compra');
                    window.location.href = '../login/index.html';
                    return;
                }

                const pedidoData = {
                    usuario_id: parseInt(userId),
                    total: window.cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0),
                    itens: window.cart.map(item => ({
                        lanche_id: item.id,
                        quantidade: item.quantity,
                        preco_unitario: item.preco
                    }))
                };

                console.log('Dados do pedido:', pedidoData);

                const response = await fetch('http://localhost:5000/api/pedidos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pedidoData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao criar pedido');
                }

                const responseData = await response.json();
                console.log('Resposta do servidor:', responseData);

                // Salvar dados do pedido
                sessionStorage.setItem('pedidoId', responseData.pedido_id);
                sessionStorage.setItem('totalPedido', pedidoData.total.toFixed(2));

                // Limpar carrinho no banco de dados
                try {
                    const clearCartResponse = await fetch(`http://localhost:5000/api/carrinho/${userId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify([])
                    });

                    if (!clearCartResponse.ok) {
                        console.error('Erro ao limpar carrinho no banco de dados');
                    }
                } catch (error) {
                    console.error('Erro ao limpar carrinho:', error);
                }

                // Limpar carrinho local
                window.cart = [];
                
                // Atualizar UI do carrinho
                const cartItemsContainer = document.querySelector('.cart-items');
                if (cartItemsContainer) {
                    cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
                }
                
                const cartTotal = document.querySelector('.cart-total');
                if (cartTotal) {
                    cartTotal.textContent = 'R$ 0,00';
                }
                
                const cartItemCount = document.querySelector('.cart-icon span');
                if (cartItemCount) {
                    cartItemCount.textContent = '0';
                }

                // Fechar sidebar
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.style.display = 'none';
                }

                // Redirecionar para página de pagamento
                window.location.href = '../pagamento/index.html';
            } catch (error) {
                console.error('Erro durante o checkout:', error);
                alert('Erro ao processar o pedido: ' + error.message);
            }
        });
    } else {
        console.error('Botão de checkout não encontrado no DOM!');
    }

    // Função auxiliar para atualizar o total no carrinho
    function updateCartTotal() {
        const total = window.cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0);
        cartTotal.textContent = `R$${total.toFixed(2)}`;
        return total;
    }

    const searchInput = document.querySelector('.search--box input');
    let timeoutId = null;

    searchInput.addEventListener('input', (e) => {
        // Cancela o timeout anterior se existir
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        // Cria um novo timeout para fazer a pesquisa
        timeoutId = setTimeout(() => {
            const termo = e.target.value.trim();
            if (termo === '') {
                fetchAllProducts(); // Retorna todos os produtos se a pesquisa estiver vazia
                return;
            }
            
            fetch(`http://localhost:5000/api/lanches/pesquisa?termo=${encodeURIComponent(termo)}`)
                .then(response => response.json())
                .then(products => {
                    createCards(products);
                })
                .catch(error => {
                    console.error('Erro na pesquisa:', error);
                });
        }, 300); // Aguarda 300ms após o último caractere digitado
    });
});