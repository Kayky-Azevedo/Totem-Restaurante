const products = [
    {
        name: "Hambúrguer Clássico",
        description: "Pão, carne, queijo, alface, tomate",
        price: "R$15,00",
        image: "./imagens-produtos/lanchinho.jpg",
        category: "salgados"
    },
    {
        name: "Cheeseburger",
        description: "Pão, carne, queijo, alface, tomate",
        price: "R$18,00",
        image: "https://images.unsplash.com/photo-1522680028838-8ac40f7a4305?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MXwyMDg5NzR8MHwxfGFsbHwyfHx8fHx8fHwxNjIwNjE3MjM1&ixlib=rb-1.2.1&q=80&w=400",
        category: "salgados"
    },
    {
        name: "Coca-Cola",
        description: "Refrigerante gelado",
        price: "R$5,00",
        image: "https://images.unsplash.com/photo-1568050684151-055c73a8b56e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MXwyMDg5NzR8MHwxfGFsbHwzfHx8fHx8fHwxNjIwNjE3MjM1&ixlib=rb-1.2.1&q=80&w=400",
        category: "salgados"
    },
    {
        name: "Sorvete",
        description: "Sorvete de creme com calda de chocolate",
        price: "R$10,00",
        image: "https://images.unsplash.com/photo-1553887996-07dd7b5f7e71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MXwyMDg5NzR8MHwxfGFsbHwxfHx8fHx8fHwxNjIwNjE3MjM1&ixlib=rb-1.2.1&q=80&w=400",
        category: "sobremesas"
    }
];


// Função para criar os cards de produtos
function createProductCards(filteredProducts) {
    const productCardsContainer = document.getElementById('product-cards');
    productCardsContainer.innerHTML = ''; // Limpa os produtos anteriores

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('card');

        card.innerHTML = `
            <div class="card-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="card-content">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="card-footer">
                    <span class="price">${product.price}</span>
                    <button class="add-to-cart" onclick="addToCart('${product.name}', '${product.price}', '${product.image}', '${product.description}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24">
                            <rect x="10" y="4" width="4" height="16"/>
                            <rect x="4" y="10" width="16" height="4"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        productCardsContainer.appendChild(card);
    });
}

// Função para filtrar os produtos por categoria
function filterProducts(category) {
    const filteredProducts = products.filter(product => product.category === category);
    createProductCards(filteredProducts);
}

// Adiciona eventos de clique aos itens de categoria
document.querySelectorAll('.categorias li').forEach(item => {
    item.addEventListener('click', () => {
        const category = item.getAttribute('data-category');
        filterProducts(category);
    });
});

// Carregar a primeira categoria por padrão
window.onload = () => {
    filterProducts('salgados'); // Exibe "Salgados" ao carregar a página
};

// Adiciona o item ao carrinho
function addToCart(name, price, image, description) {
    // Verifica se a função existe
    if (typeof adicionarItem === 'function') {
        adicionarItem(name, parseFloat(price.replace('R$', '').replace(',', '.')), image, description);
    } else {
        console.error('Função adicionarItem não encontrada.');
    }
}


