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
        image: "./imagens-produtos/1.avif",
        category: "salgados"
    },
    {
        name: "Coca-Cola",
        description: "Refrigerante gelado",
        price: "R$5,00",
        image: "./imagens-produtos/2442.webp",
        category: "bebidas"
    },
    {
        name: "Sorvete",
        description: "Sorvete de morango",
        price: "R$10,00",
        image: "./imagens-produtos/sor-1.webp",
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


