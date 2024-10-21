document.addEventListener('DOMContentLoaded', () => {
    const cartItemCount = document.querySelector('.cart-icon span');
    const cartItemsList = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const cartIcon = document.querySelector('.cart-icon');
    const sidebar = document.getElementById('sidebar');
    const closeButton = document.querySelector('.sidebar-close');

    let cartItems = [];
    let totalAmount = 0;

    // Captura cliques em botões de adicionar ao carrinho
    document.addEventListener('click', event => {
        if (event.target.classList.contains('add-to-cart')) {
            const card = event.target.closest('.card');
            const itemTitle = card.querySelector('.card--title').textContent;
            const itemPrice = parseFloat(
                card.querySelector('.price').textContent.replace('R$', '').trim()
            );
            const itemImage = card.querySelector('img').src;

            const item = {
                image: itemImage,
                price: itemPrice,
                quantity: 1,
            };

            const existingItem = cartItems.find(cartItem => cartItem.image === item.image);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cartItems.push(item);
            }

            updateCartUI();
        }
    });

    function updateCartUI() {
        cartItemCount.textContent = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        cartItemsList.innerHTML = ''; // Limpa a lista antes de atualizar

        totalAmount = 0; // Reseta o total antes de recalcular

        cartItems.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
                <img src="${item.image}" alt="Produto" class="cart-item-img">
                <div class="cart-item-info">
                    <span class="cart-item-quantity">Quantidade: ${item.quantity}x</span>
                    <span class="cart-item-price">R$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div class="quantity-controls">
                    <button class="minus-btn" data-index="${index}">-</button>
                    <button class="plus-btn" data-index="${index}">+</button>
                </div>
            `;
            cartItemsList.append(cartItem);

            // Soma o total acumulado
            totalAmount += item.price * item.quantity;
        });

        updateCartTotal();
        addEventListenersToButtons();
    }

    function addEventListenersToButtons() {
        document.querySelectorAll('.plus-btn').forEach(button =>
            button.addEventListener('click', event => {
                const index = event.target.dataset.index;
                increaseItemQuantity(index);
            })
        );

        document.querySelectorAll('.minus-btn').forEach(button =>
            button.addEventListener('click', event => {
                const index = event.target.dataset.index;
                decreaseItemQuantity(index);
            })
        );
    }

    function increaseItemQuantity(index) {
        cartItems[index].quantity++;
        updateCartUI();
    }

    function decreaseItemQuantity(index) {
        const item = cartItems[index];

        if (item.quantity > 1) {
            item.quantity--;
        } else {
            // Remove o item se a quantidade for 1 e o botão "-" for pressionado
            cartItems.splice(index, 1);
        }

        updateCartUI();
    }

    cartIcon.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    closeButton.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    function updateCartTotal() {
        cartTotal.textContent = `Total: R$${totalAmount.toFixed(2)}`;
    }
});