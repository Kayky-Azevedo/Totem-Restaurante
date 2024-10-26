document.addEventListener('DOMContentLoaded', () => {
    const menuList = document.getElementById('menu--list');
    const cardContainer = document.querySelector('.card--list');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const cartItemCount = document.querySelector('.cart-icon span');
    const cartIcon = document.querySelector('.cart-icon');
    const sidebar = document.getElementById('sidebar');
    const closeButton = document.querySelector('.sidebar-close');

    let cart = [];
    let totalAmount = 0;

    fetch('http://localhost:5000/api/categorias')
        .then(response => response.json())
        .then(categories => {
            categories.forEach(createCategory);
        })
        .catch(error => console.error('Erro ao buscar categorias:', error));

    function createCategory(category) {
        const menuItem = document.createElement('div');
        menuItem.classList.add('menu--item');
        menuItem.dataset.category = category.nome;

        const title = document.createElement('h5');
        title.textContent = category.nome;

        menuItem.appendChild(title);
        menuList.appendChild(menuItem);

        menuItem.addEventListener('click', () => filterProducts(category.id));
    }

    function filterProducts(categoriaId) {
        fetch(`http://localhost:5000/api/lanches?categoria_id=${categoriaId}`)
            .then(response => response.json())
            .then(products => {
                createCards(products);
            })
            .catch(error => console.error('Erro ao buscar lanches:', error));
    }

    function createCards(filteredProducts) {
        cardContainer.innerHTML = '';

        filteredProducts.forEach(product => {
            const [id, nome, descricao, preco, categoriaId, imagem] = product;

            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.id = id;

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
            addToCartIcon.addEventListener('click', () => {
                console.log('Adicionando ao carrinho:', { id, nome, preco, imagem });
                addToCart({ id, nome, preco: parseFloat(preco), imagem });
            });

            priceContainer.appendChild(price);
            priceContainer.appendChild(addToCartIcon);
            card.appendChild(priceContainer);

            cardContainer.appendChild(card);
        });
    }
    function addToCart(product) {
        const existingProduct = cart.find(item => item.id === product.id);

        if (existingProduct) {
            existingProduct.quantity += 1;
            console.log('Produto existente, aumentando quantidade:', existingProduct);
        } else {
            product.quantity = 1;
            cart.push(product);
            console.log('Novo produto, adicionando ao carrinho:', product);
        }

        updateCartUI();
    }

    function updateCartUI() {
        cartItemsContainer.innerHTML = ''; // Limpa o container antes de adicionar novos itens
        let total = 0;

        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');

            // Adiciona a imagem do produto
            const img = document.createElement('img');
            img.src = item.imagem;
            img.alt = item.nome;
            img.classList.add('cart-item-img'); // Adiciona uma classe para estilização, se necessário
            cartItem.appendChild(img);

            const title = document.createElement('span');
            title.textContent = `${item.nome}`;

            const price = document.createElement('span');
            price.textContent = `R$${(item.preco * item.quantity).toFixed(2)}`;
            total += item.preco * item.quantity;

            // Botões de aumentar e diminuir quantidade
            const quantityControls = document.createElement('div');
            quantityControls.classList.add('quantity-controls');

            const minusButton = document.createElement('button');
            minusButton.classList.add('minus-btn');
            minusButton.textContent = '-';
            minusButton.addEventListener('click', () => {
                decreaseItemQuantity(index);
            });

            const quantityLabel = document.createElement('span');
            quantityLabel.textContent = ` x${item.quantity} `;

            const plusButton = document.createElement('button');
            plusButton.classList.add('plus-btn');
            plusButton.textContent = '+';
            plusButton.addEventListener('click', () => {
                increaseItemQuantity(index);
            });

            cartItem.appendChild(quantityControls);
            cartItem.appendChild(title);
            cartItem.appendChild(price);
            quantityControls.appendChild(minusButton);
            quantityControls.appendChild(quantityLabel);
            quantityControls.appendChild(plusButton);
            cartItemsContainer.appendChild(cartItem);
        });

        cartTotal.textContent = `Total: R$${total.toFixed(2)}`;
        cartItemCount.textContent = cart.reduce((acc, item) => acc + item.quantity, 0); // Atualiza o contador do carrinho
    }

    function increaseItemQuantity(index) {
        cart[index].quantity++;
        updateCartUI();
    }

    function decreaseItemQuantity(index) {
        const item = cart[index];

        if (item.quantity > 1) {
            item.quantity--;
        } else {
            // Remove o item se a quantidade for 1 e o botão "-" for pressionado
            cart.splice(index, 1);
        }

        updateCartUI();
    }

    // Manipulação da Sidebar
    cartIcon.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    closeButton.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
});