function login(event) {
    event.preventDefault(); // Impede o envio do formulário

    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const adminNome = 'NomeAdmin'; // Substitua pelo nome do administrador
    const adminCpf = '12345678901'; // Substitua pelo CPF do administrador

    const segundoNome = 'SegundoNome'; // Substitua pelo segundo nome do administrador
    const senhaEspecifica = '09876543212'; // Substitua pela senha específica

    const message = document.getElementById('message');

    if (!isValidCpf(cpf)) {
        message.textContent = 'O CPF deve conter exatamente 11 números.';
        return false; // Retorna falso para não prosseguir
    }

    if (nome === adminNome && cpf === adminCpf) {
        window.location.href = '../telas-administrador/cadastro/cadastro-produtos.html'; // Redireciona para a página do administrador
    } else if (nome === segundoNome && cpf === senhaEspecifica) {
        window.location.href = '../telas-administrador/pedidos/pedidos.html'; // Redireciona para a segunda página do administrador
    } else {
        // Redireciona para a tela principal
        window.location.href = "../tela-principal/menu.html"; // Substitua pelo caminho da sua tela principal
    }
}

function isValidCpf(cpf) {
    // Remove caracteres não numéricos
    const cleanedCpf = cpf.replace(/\D/g, '');
    return cleanedCpf.length === 11; // Verifica se tem exatamente 11 números
}

// Adiciona o evento ao botão
document.getElementById("cadastro-form").addEventListener('submit', login);

