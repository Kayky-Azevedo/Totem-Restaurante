const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

// Função para máscara de telefone
function mascaraTelefone(telefone) {
    let valor = telefone.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    
    // Limita o valor a 11 dígitos
    valor = valor.substring(0, 11);
    
    // Aplica a máscara
    if (valor.length > 2) {
        valor = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    }
    if (valor.length > 10) {
        valor = `${valor.substring(0, 10)}-${valor.substring(10)}`;
    }
    
    telefone.value = valor;
}

// Função para validar senha
function validarSenha(senha) {
    const regras = {
        minLength: senha.length >= 5,
        hasUpperCase: /[A-Z]/.test(senha),
        hasNumber: /[0-9]/.test(senha),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(senha)
    };

    const mensagens = [];
    if (!regras.minLength) mensagens.push("Mínimo de 5 caracteres");
    if (!regras.hasUpperCase) mensagens.push("Uma letra maiúscula");
    if (!regras.hasNumber) mensagens.push("Um número");
    if (!regras.hasSpecialChar) mensagens.push("Um caractere especial");

    return {
        valido: Object.values(regras).every(rule => rule === true),
        mensagens
    };
}

// Adicionar os event listeners para as máscaras e validações
document.addEventListener('DOMContentLoaded', function() {
    const telefoneInput = document.getElementById('signupTelefone');
    const senhaInput = document.getElementById('signupSenha');
    const feedbackSenha = document.createElement('div');
    feedbackSenha.className = 'senha-feedback';
    senhaInput.parentNode.appendChild(feedbackSenha);

    // Máscara do telefone
    telefoneInput.addEventListener('input', function() {
        mascaraTelefone(this);
    });

    // Validação da senha em tempo real
    senhaInput.addEventListener('input', function() {
        const resultado = validarSenha(this.value);
        if (!resultado.valido) {
            feedbackSenha.style.display = 'block';
            feedbackSenha.innerHTML = `
                <p>A senha precisa ter:</p>
                <ul>
                    ${resultado.mensagens.map(msg => `<li>${msg}</li>`).join('')}
                </ul>
            `;
            feedbackSenha.style.color = '#ff3333';
        } else {
            feedbackSenha.style.display = 'none';
        }
    });

    // Impedir colar (paste) de texto maior que o permitido
    telefoneInput.addEventListener('paste', function(e) {
        e.preventDefault();
        let texto = (e.clipboardData || window.clipboardData).getData('text');
        texto = texto.replace(/\D/g, '');
        texto = texto.substring(0, 11);
        mascaraTelefone({value: texto, ...this});
    });

    // Impedir caracteres não numéricos
    telefoneInput.addEventListener('keypress', function(e) {
        const char = String.fromCharCode(e.keyCode);
        if (!/[0-9]/.test(char)) {
            e.preventDefault();
        }
        
        // Impedir digitação se já atingiu o limite (considerando a máscara)
        const numeroAtual = this.value.replace(/\D/g, '');
        if (numeroAtual.length >= 11) {
            e.preventDefault();
        }
    });
});

document.getElementById('signupForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const nome = document.getElementById('signupNome').value;
    const email = document.getElementById('signupEmail').value;
    const senha = document.getElementById('signupSenha').value;
    const telefone = document.getElementById('signupTelefone').value;

    // Validar senha antes de enviar
    const validacaoSenha = validarSenha(senha);
    if (!validacaoSenha.valido) {
        alert('Senha não atende aos requisitos mínimos:\n' + validacaoSenha.mensagens.join('\n'));
        return;
    }

    // Validar formato do telefone
    const telefoneNumeros = telefone.replace(/\D/g, '');
    if (telefoneNumeros.length !== 11) {
        alert('Telefone inválido. Digite um número de celular válido.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                nome, 
                email, 
                senha, 
                telefone: telefoneNumeros // Envia apenas os números
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
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
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    // Credenciais padrão do administrador
    const adminEmail = "admin@gmail.com";
    const adminSenha = "admin";

    if (email === adminEmail && senha === adminSenha) {
        // Redireciona para o painel do administrador se as credenciais correspondem às do admin
        window.location.href = '../admin/principal/escolhas.html';
    } else {
        try {
            const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            // Armazenar dados do usuário no sessionStorage
            sessionStorage.setItem('userId', data.user_id);
            sessionStorage.setItem('userName', data.nome);
            sessionStorage.setItem('userEmail', data.email);

            // Redirecionar para a página principal
            window.location.href = '../principal/principal.html';
        } else {
            alert(data.error || 'Email ou senha incorretos');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao fazer login. Tente novamente.');
    }
}
});

// Função para redefinir senha (esqueci a senha)
document.addEventListener('DOMContentLoaded', function() {
    const modalSenhaInput = document.getElementById('newPassword');
    const modalFeedbackSenha = document.createElement('div');
    modalFeedbackSenha.className = 'senha-feedback';
    modalSenhaInput.parentNode.appendChild(modalFeedbackSenha);

    // Validação da senha em tempo real no modal
    modalSenhaInput.addEventListener('input', function() {
        const resultado = validarSenha(this.value);
        if (!resultado.valido) {
            modalFeedbackSenha.style.display = 'block';
            modalFeedbackSenha.innerHTML = `
                <p>A senha precisa ter:</p>
                <ul>
                    ${resultado.mensagens.map(msg => `<li>${msg}</li>`).join('')}
                </ul>
            `;
        } else {
            modalFeedbackSenha.style.display = 'none';
        }
    });

    document.getElementById('resetPasswordForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const novaSenha = document.getElementById('newPassword').value;

        // Validar senha antes de enviar
        const validacaoSenha = validarSenha(novaSenha);
        if (!validacaoSenha.valido) {
            alert('A nova senha não atende aos requisitos mínimos:\n' + validacaoSenha.mensagens.join('\n'));
            return;
        }

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
                alert('Senha redefinida com sucesso!');
                // Fechar o modal
                document.getElementById('resetPasswordModal').classList.remove('active');
                document.getElementById('modalBackground').classList.remove('active');
                // Limpar o formulário
                this.reset();
            } else {
                alert(data.error || 'Erro ao redefinir a senha');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao redefinir a senha');
        }
    });
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

// Função para alternar visibilidade da senha
function setupPasswordToggles() {
    const passwordContainers = document.querySelectorAll('.password-container');
    
    passwordContainers.forEach(container => {
        const input = container.querySelector('input');
        const toggle = container.querySelector('.toggle-password');
        
        if (toggle) {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Alterna o tipo do input
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                
                // Alterna o ícone
                const icon = toggle.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            });
        }
    });
}

function setupPasswordValidation(inputId, formId, feedbackContainerId) {
    const senhaInput = document.getElementById(inputId);
    const form = document.getElementById(formId);
    
    // Remove qualquer feedback existente que possa estar ao lado do input
    const oldFeedback = senhaInput.parentElement.querySelector('.senha-feedback');
    if (oldFeedback) {
        oldFeedback.remove();
    }
    
    // Criar o container de feedback apenas após o botão
    const feedbackContainer = document.createElement('div');
    feedbackContainer.id = feedbackContainerId;
    feedbackContainer.className = 'senha-feedback';
    
    // Adicionar o feedback após o botão de submit
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.insertAdjacentElement('afterend', feedbackContainer);

    senhaInput.addEventListener('input', function() {
        const resultado = validarSenha(this.value);
        if (!resultado.valido) {
            feedbackContainer.style.display = 'block';
            feedbackContainer.innerHTML = `
                <p>A senha precisa ter:</p>
                <ul>
                    ${resultado.mensagens.map(msg => `<li>${msg}</li>`).join('')}
                </ul>
            `;
        } else {
            feedbackContainer.style.display = 'none';
        }
    });

    // Mostrar feedback quando o input de senha receber foco
    senhaInput.addEventListener('focus', function() {
        if (!validarSenha(this.value).valido) {
            feedbackContainer.style.display = 'block';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Setup para senha do cadastro
    setupPasswordValidation('signupSenha', 'signupForm', 'signup-feedback');
    
    // Setup para senha do modal de redefinição
    setupPasswordValidation('newPassword', 'resetPasswordForm', 'modal-feedback');
    
    // Setup dos toggles de visualização de senha
    setupPasswordToggles();
});