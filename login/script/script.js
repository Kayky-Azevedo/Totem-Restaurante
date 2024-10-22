const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

document.getElementById('signupForm').addEventListener('submit', async function (event) {
    event.preventDefault();  // Evita o reload da página

    const nome = document.getElementById('signupNome').value;
    const email = document.getElementById('signupEmail').value;
    const senha = document.getElementById('signupSenha').value;
    const telefone = document.getElementById('signupTelefone').value;

    // Envia os dados para a API de cadastro
    try {
        const response = await fetch('http://localhost:5000/api/usuarios', {  // Certifique-se de que a URL está correta
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome, email, senha, telefone })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);  // Exibe a mensagem de sucesso
        } else {
            alert(data.error || 'Erro ao cadastrar o usuário');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cadastrar o usuário');
    }
});

// Função para login de usuários
document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();  // Evita o reload da página

    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;

    // Envia os dados para a API de login
    try {
        const response = await fetch('http://localhost:5000/api/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();
        if (response.ok) {
            window.location.href = '../../principal/principal.html';
        } else {
            alert(data.error || 'Erro ao fazer login');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao fazer login');
    }
});

// Função para redefinir senha (esqueci a senha)
document.getElementById('resetPasswordForm').addEventListener('submit', async function (event) {
    event.preventDefault();  // Evita o reload da página

    const email = document.getElementById('email').value;
    const novaSenha = document.getElementById('newPassword').value;

    // Envia os dados para a API de redefinição de senha
    try {
        const response = await fetch('http://localhost:5000/api/reset_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, novaSenha })
        });

        const data = await response.json();
        if (response.ok) {
            console.log()
        } else {
            alert(data.error || 'Erro ao redefinir a senha');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao redefinir a senha');
    }
});

// Parte para abrir o modal
document.getElementById('forgotPassword').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('resetPasswordModal').classList.add('active');
    document.getElementById('modalBackground').classList.add('active');
});

// Parte para fechar o modal
document.getElementById('modalBackground').addEventListener('click', function () {
    document.getElementById('resetPasswordModal').classList.remove('active');
    document.getElementById('modalBackground').classList.remove('active');
});