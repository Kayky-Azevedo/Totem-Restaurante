document.addEventListener('DOMContentLoaded', () => {
    const menuList = document.getElementById('menu--list');
    const cardContainer = document.querySelector('.card--list');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');

    const categories = [
        { name: 'Salada', imgSrc: 'imagens/porcoes-e-saladas.png' },
        { name: 'Pratos Principais', imgSrc: 'imagens/pratos-principais.png' },
        { name: 'Sobremesas', imgSrc: 'imagens/sobremesas.png' },
        { name: 'Bebidas', imgSrc: 'imagens/bebidas.png' },
        { name: 'Porções', imgSrc: 'imagens/porcoes.png' },
    ];

    const products = [
        { image: 'imagens/porcoes-e-saladas.png', title: 'Salada', description: 'Fresca e saborosa salada mista.', price: 3.50, category: 'Salada' },
        { image: 'imagens/images.jpg', title: 'Prato Principal', description: 'Delicioso prato com carnes.', price: 15.00, category: 'Pratos Principais' },
        { image: 'imagens/sobremesas.png', title: 'Sobremesa', description: 'Uma sobremesa deliciosa.', price: 7.00, category: 'Sobremesas' },
        { image: 'imagens/bebidas.png', title: 'Bebida', description: 'Bebidas refrescantes.', price: 5.00, category: 'Bebidas' },
        { image: 'imagens/porcoes.png', title: 'Porção', description: 'Porções variadas.', price: 10.00, category: 'Porções' },
    ];

    let cart = [];

    function createCategory(category) {
        const menuItem = document.createElement('div');
        menuItem.classList.add('menu--item');
        menuItem.dataset.category = category.name;

        const img = document.createElement('img');
        img.src = category.imgSrc;
        img.alt = category.name;

        const title = document.createElement('h5');
        title.textContent = category.name;

        menuItem.appendChild(img);
        menuItem.appendChild(title);
        menuList.appendChild(menuItem);

        menuItem.addEventListener('click', () => filterProducts(category.name));
    }

    function createCards(filteredProducts) {
        cardContainer.innerHTML = '';
        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('card');

            const img = document.createElement('img');
            img.src = product.image;
            img.alt = product.title;
            card.appendChild(img);

            const title = document.createElement('h4');
            title.classList.add('card--title');
            title.textContent = product.title;
            card.appendChild(title);

            const description = document.createElement('p');
            description.classList.add('card-description');
            description.textContent = product.description;
            card.appendChild(description);

            const priceContainer = document.createElement('div');
            priceContainer.classList.add('card--price');

            const price = document.createElement('div');
            price.classList.add('price');
            price.textContent = `R$${product.price.toFixed(2)}`;

            const addToCartIcon = document.createElement('i');
            addToCartIcon.classList.add('fa-solid', 'fa-plus', 'add-to-cart');
            addToCartIcon.addEventListener('click', () => {
                console.log('Adicionando ao carrinho:', product);
                addToCart(product);
            });

            priceContainer.appendChild(price);
            priceContainer.appendChild(addToCartIcon);
            card.appendChild(priceContainer);

            cardContainer.appendChild(card);
        });
    }

    function filterProducts(category) {
        const filteredProducts = products.filter(product => product.category === category);
        createCards(filteredProducts);
    }

    function addToCart(product) {
        const existingItem = cart.find(item => item.title === product.title);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCartUI();
    }

    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');

            const title = document.createElement('span');
            title.textContent = `${item.title} (x${item.quantity})`;

            const price = document.createElement('span');
            price.textContent = `R$${(item.price * item.quantity).toFixed(2)}`;
            total += item.price * item.quantity;

            cartItem.appendChild(title);
            cartItem.appendChild(price);
            cartItemsContainer.appendChild(cartItem);
        });

        cartTotal.textContent = `Total: R$${total.toFixed(2)}`;
    }

    categories.forEach(createCategory);
    createCards(products);
});