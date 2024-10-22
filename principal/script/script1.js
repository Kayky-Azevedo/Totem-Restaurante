const baseURL = 'http://localhost:5000/api';

// Função para buscar categorias
async function fetchCategorias() {
    try {
        const response = await fetch('http://localhost:5000/api/categorias');
        if (!response.ok) {
            throw new Error('Erro ao buscar categorias');
        }
        
        const categoriaArray = await response.json();
        console.log("Categorias recebidas:", categoriaArray); // Log para depuração

        // Verifica se a resposta é um array
        if (!Array.isArray(categoriaArray)) {
            throw new Error('A resposta não é um array');
        }

        exibirCategorias(categoriaArray);
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);
    }
}

// Função para exibir categorias no HTML
function exibirCategorias(categoriaArray) {
    const menuList = document.getElementById('menu--list');
    menuList.innerHTML = ''; // Limpa a lista antes de adicionar novas categorias

    // Itera sobre as categorias e as exibe
    categoriaArray.forEach(categoria => {
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'categoria';
        categoriaDiv.innerHTML = `
            <h3 class="categoria--titulo" onclick="fetchLanches(${categoria.id})">${categoria.nome}</h3>
        `;
        menuList.appendChild(categoriaDiv);
    });
}

// Função para buscar lanches por categoria
async function fetchLanches(categoriaId) {
    try {
        const response = await fetch(`http://localhost:5000/api/lanches?categoria_id=${categoriaId}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar lanches');
        }
        
        const lanches = await response.json();
        console.log("Lanches recebidos:", lanches); // Verifique a estrutura aqui

        // Se lanches for um array de arrays, achate-o.
        const lanchesArray = Array.isArray(lanches) && lanches.length > 0 ? (lanches[0] || []) : [];

        // Verifique se lanchesArray é um array válido
        if (!Array.isArray(lanchesArray)) {
            throw new Error('A resposta não é um array de lanches');
        }

        exibirLanches(lanchesArray);
    } catch (error) {
        console.error("Erro ao buscar lanches:", error);
    }
}

function exibirLanches(lanchesArray) {
    const cardList = document.querySelector('.card--list');
    cardList.innerHTML = ''; // Limpa a lista antes de adicionar novos lanches

    // Verifica se o array de lanches é realmente um array e não está vazio
    if (Array.isArray(lanchesArray) && lanchesArray.length > 0) {
        lanchesArray.forEach(lancheArray => {
            // Verifica se lancheArray é realmente um array e possui pelo menos 5 elementos
            if (Array.isArray(lancheArray) && lancheArray.length >= 5) {
                const id = lancheArray[0]; // ID do lanche
                const nome = lancheArray[1]; // Nome do lanche
                const descricao = lancheArray[2]; // Descrição do lanche
                const preco = parseFloat(lancheArray[3]); // Preço do lanche
                const imagem_url = lancheArray[4]; // URL da imagem do lanche

                // Verifica se as informações necessárias são válidas
                if (id !== undefined && nome && descricao && !isNaN(preco) && imagem_url) {
                    const lancheDiv = document.createElement('div');
                    lancheDiv.className = 'card';
                    lancheDiv.innerHTML = `
                        <img src="${imagem_url}" alt="${nome}">
                        <h4 class="card--title">${nome}</h4>
                        <p class="card-description">${descricao}</p>
                        <div class="card--price">
                            <div class="price">R$${preco.toFixed(2)}</div>
                            <i class="fa-solid fa-plus add-to-cart" onclick="adicionarAoCarrinho(${id})"></i>
                        </div>
                    `;
                    cardList.appendChild(lancheDiv);
                } else {
                    console.error("Lanche não possui informações válidas:", lancheArray);
                }
            } else {
                console.error("Lanche não é um objeto válido:", lancheArray);
            }
        });
    } else {
        console.error("Nenhum lanche encontrado.");
    }
}



// Chama a função para buscar categorias ao carregar a página
document.addEventListener('DOMContentLoaded', fetchCategorias);