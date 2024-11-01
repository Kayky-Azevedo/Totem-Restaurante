document.addEventListener('DOMContentLoaded', () => {
    const menuList = document.getElementById('menu--list');
    const cardContainer = document.querySelector('.card--list');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const cartItemCount = document.querySelector('.cart-icon span');
    const cartIcon = document.querySelector('.cart-icon');
    const sidebar = document.getElementById('sidebar');
    const closeButton = document.querySelector('.sidebar-close');

    document.getElementById('openCartButton').addEventListener('click', async (event) => {
        event.preventDefault();
        await loadCartFromDatabase();
        sidebar.style.display = 'block';  // Abre o sidebar
    });

    const userName = sessionStorage.getItem('userName');  // Supondo que o nome do usuário seja salvo no sessionStorage
    const greetingElement = document.getElementById('greeting');
    if (userName) {
        greetingElement.textContent = `Olá, ${userName}`;
    } else {
        greetingElement.textContent = 'Olá, visitante';
    }

    let cart = [];
    let totalAmount = 0;

    fetchAllProducts();
    fetchCategories();

    function fetchCategories() {
        fetch('http://localhost:5000/api/categorias')
            .then(response => response.json())
            .then(categories => {
                categories.forEach(createCategory);
            })
            .catch(error => console.error('Erro ao buscar categorias:', error));
    }

    async function loadCartFromDatabase() {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            console.error("Erro: userId está indefinido. Verifique se o usuário está logado.");
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                cart = Array.isArray(data) ? data : [];
                updateCartUI();  // Atualiza a UI após carregar os itens do carrinho
            } else {
                console.error('Erro ao carregar o carrinho:', response.statusText);
            }
        } catch (error) {
            console.error('Erro ao carregar o carrinho do banco de dados:', error);
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
                body: JSON.stringify(cart),
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
        fetch(`http://localhost:5000/api/lanches?categoria_id=${categoriaId}`)
            .then(response => response.json())
            .then(products => createCards(products))
            .catch(error => console.error('Erro ao buscar lanches:', error));
    }

    function createCards(products) {
        cardContainer.innerHTML = ''; // Limpa o container
        
        products.forEach(product => {
            const { id, nome, descricao, preco, imagem, categoria } = product;

            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.id = id;

            const categoryLabel = document.createElement('h6');
            categoryLabel.classList.add('category-label');
            categoryLabel.textContent = categoria; // Adiciona a categoria no topo do card
            card.appendChild(categoryLabel);

            const img = document.createElement('img');
            img.src = imagem;
            img.alt = nome;
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
            addToCartIcon.addEventListener('click', (event) => {
                event.preventDefault();  // Impede o refresh
                const product = { id, nome, preco: parseFloat(preco), imagem };
                addToCart(product); // Passando o objeto correto
            });

            priceContainer.appendChild(price);
            priceContainer.appendChild(addToCartIcon);
            card.appendChild(priceContainer);

            cardContainer.appendChild(card);
        });
    }

    async function addToCart(product) {
        const userId = sessionStorage.getItem('userId');
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
                    action: 'add',
                    quantity: 1
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                console.error('Erro ao adicionar ao carrinho:', error.error);
                return;
            }
            cart = await response.json(); // Recebe o carrinho atualizado
            updateCartUI();
            await saveCartToDatabase(); // Sincroniza com o banco
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error.message);
        }
    }

    function updateCartUI() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total');
        const cartItemCount = document.querySelector('#openCartButton span');
        
        cartItemsContainer.innerHTML = '';
        let total = 0;
        
        if (!Array.isArray(cart) || cart.length === 0) {
            cartTotal.textContent = "Total: R$0.00";
            cartItemCount.textContent = '0';
            return;
        }
        
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            const img = document.createElement('img');
            img.src = item.imagem;
            img.alt = item.nome;
            img.classList.add('cart-item-img');
            cartItem.appendChild(img);
            
            const title = document.createElement('span');
            title.textContent = `${item.nome}`;
            const price = document.createElement('span');
            price.textContent = `R$${(item.preco * item.quantity).toFixed(2)}`;
            total += item.preco * item.quantity;
            
            const quantityControls = document.createElement('div');
            quantityControls.classList.add('quantity-controls');
            
            const minusButton = document.createElement('button');
            minusButton.classList.add('minus-btn');
            minusButton.textContent = '-';
            minusButton.addEventListener('click', (event) => {
                event.preventDefault();
                decreaseItemQuantity(index);
            });
            
            const quantityLabel = document.createElement('span');
            quantityLabel.textContent = ` x${item.quantity} `;
            
            const plusButton = document.createElement('button');
            plusButton.classList.add('plus-btn');
            plusButton.textContent = '+';
            plusButton.addEventListener('click', (event) => {
                event.preventDefault();
                increaseItemQuantity(index);
            });
            
            cartItem.appendChild(title);
            cartItem.appendChild(price);
            cartItem.appendChild(quantityControls);
            
            quantityControls.appendChild(minusButton);
            quantityControls.appendChild(quantityLabel);
            quantityControls.appendChild(plusButton);
            cartItemsContainer.appendChild(cartItem);
        });
        
        cartTotal.textContent = `Total: R$${total.toFixed(2)}`;
        cartItemCount.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    }

    async function increaseItemQuantity(index) {
        const productId = cart[index].id;
        cart[index].quantity++;
        await updateCartInDatabase(productId, 'increase', cart[index].quantity);
        updateCartUI();
    }

    async function decreaseItemQuantity(index) {
        const productId = cart[index].id;
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
            await updateCartInDatabase(productId, 'decrease', cart[index].quantity);
            updateCartUI();
        } else {
            await removeItemFromCart(index);
        }
    }
    
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
        const productId = cart[index].id;
        const userId = sessionStorage.getItem('userId');
        try {
            const response = await fetch(`http://localhost:5000/api/carrinho/${userId}/item/${productId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                cart.splice(index, 1);  // Remove item localmente
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
        sidebar.classList.remove('open');
    });

    loadCartFromDatabase(); // Carrega o carrinho quando a página é carregada

    async function checkout() {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            console.error("Erro: userId está indefinido. Verifique se o usuário está logado.");
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: userId,
                    itens: cart,
                    status_pagamento: 'pendente'
                })
            });
            const data = await response.json();
            if (response.ok) {
                const pedidoId = data.pedido_id;
                console.log('Pedido criado com sucesso', pedidoId);
                sessionStorage.setItem('pedidoId', pedidoId);
                window.location.href = '../pagamento/index.html';
            } else {
                const error = await response.json();
                console.error('Erro ao criar pedido:', error.error);
            }

        } catch (error) {
            console.error('Erro ao processar o pedido:', error.message);
        }
    }

    document.getElementById('finalizeOrderButton').addEventListener('click', async (event) => {
        event.preventDefault();
        if (!cart || cart.length === 0) {
            alert("O carrinho está vazio! Adicione itens antes de prosseguir para o pagamento.");
            return;
        }
        await checkout();
    });
});
