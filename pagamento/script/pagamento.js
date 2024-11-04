document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
    configurarBotoes();
});

function inicializarPagina() {
    exibirValorTotal();
}

function exibirValorTotal() {
    const totalPedido = sessionStorage.getItem('totalPedido');
    const valorTotalElement = document.getElementById('valorTotal');
    
    if (valorTotalElement && totalPedido) {
        valorTotalElement.textContent = formatarMoeda(totalPedido);
    }
}

// Função para gerar QR Code
function gerarQRCode() {
    const nomeCompletoPix = document.getElementById('nomeCompletoPix').value;
    
    if (!nomeCompletoPix) {
        alert('Por favor, preencha o nome completo!');
        return;
    }

    const valorPix = sessionStorage.getItem('totalPedido');
    
    // Gerar QR Code
    const qrCode = new QRious({
        element: document.getElementById('qrcode'),
        value: `PIX;${nomeCompletoPix};${valorPix}`,
        size: 200
    });
    
    // Mostrar container do QR Code e esconder botão de gerar
    document.getElementById('qrcodeContainer').style.display = 'block';
    document.getElementById('btnGerarQRCode').style.display = 'none';
    
    // Garantir que o botão de confirmar esteja visível
    const btnConfirmarPix = document.getElementById('btnConfirmarPix');
    if (btnConfirmarPix) {
        btnConfirmarPix.style.display = 'block';
    }
}

// Função para processar pagamento com cartão
async function processPayment(event) {
    if (event) {
        event.preventDefault();
    }

    // Limpar erros anteriores
    limparErros();

    // Coletar e validar dados do formulário
    const campos = {
        nomeCompleto: {
            valor: document.getElementById('nomeCompleto').value.trim(),
            mensagem: 'Nome Completo é obrigatório'
        },
        email: {
            valor: document.getElementById('email').value.trim(),
            mensagem: 'E-mail inválido',
            validacao: validarEmail
        },
        endereco: {
            valor: document.getElementById('endereco').value.trim(),
            mensagem: 'Endereço é obrigatório'
        },
        cidade: {
            valor: document.getElementById('cidade').value.trim(),
            mensagem: 'Cidade é obrigatória'
        },
        estado: {
            valor: document.getElementById('estado').value.trim(),
            mensagem: 'Estado é obrigatório'
        },
        cep: {
            valor: document.getElementById('cep').value.trim(),
            mensagem: 'CEP inválido (formato: 00000-000)',
            validacao: validarCEP
        },
        nomeCartao: {
            valor: document.getElementById('nomeCartao').value.trim(),
            mensagem: 'Nome no cartão é obrigatório'
        },
        numeroCartao: {
            valor: document.getElementById('numeroCartao').value.trim(),
            mensagem: 'Número do cartão inválido',
            validacao: validarCartao
        },
        expiraMes: {
            valor: document.getElementById('expiraMes').value.trim(),
            mensagem: 'Mês de expiração é obrigatório'
        },
        expiraAno: {
            valor: document.getElementById('expiraAno').value.trim(),
            mensagem: 'Ano de expiração é obrigatório'
        },
        cvv: {
            valor: document.getElementById('cvv').value.trim(),
            mensagem: 'CVV inválido',
            validacao: validarCVV
        }
    };

    let temErro = false;

    // Validar cada campo
    Object.entries(campos).forEach(([id, campo]) => {
        const elemento = document.getElementById(id);
        
        if (!campo.valor) {
            mostrarErro(elemento, campo.mensagem);
            temErro = true;
        } else if (campo.validacao && !campo.validacao(campo.valor)) {
            mostrarErro(elemento, campo.mensagem);
            temErro = true;
        }
    });

    if (temErro) {
        return;
    }

    // Continuar com o processamento do pagamento
    try {
        mostrarLoading();
        const paymentData = {
            pedido_id: sessionStorage.getItem('pedidoId'),
            metodo_pagamento: 'cartao',
            valor_pagamento: sessionStorage.getItem('totalPedido'),
            ...Object.fromEntries(Object.entries(campos).map(([key, campo]) => [key, campo.valor]))
        };

        const response = await fetch('http://localhost:5000/api/pagamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        if (response.ok) {
            window.location.href = '../confirmacao/index.html';
        } else {
            esconderLoading();
            throw new Error('Erro ao processar pagamento');
        }
    } catch (error) {
        esconderLoading();
        mostrarErroGeral('Erro ao processar pagamento. Tente novamente.');
    }
}

// Funções de validação
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarCEP(cep) {
    return /^\d{5}-?\d{3}$/.test(cep);
}

function validarCartao(numero) {
    return /^\d{13,19}$/.test(numero.replace(/[\s-]/g, ''));
}

function validarCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

// Funções de manipulação de erro
function mostrarErro(elemento, mensagem) {
    elemento.classList.add('input-erro');
    
    // Criar ou atualizar mensagem de erro
    let erroElement = elemento.parentElement.querySelector('.erro-mensagem');
    if (!erroElement) {
        erroElement = document.createElement('div');
        erroElement.className = 'erro-mensagem';
        elemento.parentElement.appendChild(erroElement);
    }
    erroElement.textContent = mensagem;
}

function limparErros() {
    document.querySelectorAll('.input-erro').forEach(elemento => {
        elemento.classList.remove('input-erro');
    });
    
    document.querySelectorAll('.erro-mensagem').forEach(elemento => {
        elemento.remove();
    });
}

function mostrarErroGeral(mensagem) {
    const erroGeral = document.createElement('div');
    erroGeral.className = 'erro-geral';
    erroGeral.textContent = mensagem;
    
    const form = document.querySelector('form');
    form.insertBefore(erroGeral, form.firstChild);
    
    setTimeout(() => {
        erroGeral.remove();
    }, 5000);
}

// Função para processar pagamento PIX
async function processPixPayment(event) {
    if (event) {
        event.preventDefault();
    }
    
    const nomeCompletoPix = document.getElementById('nomeCompletoPix').value.trim();

    if (!nomeCompletoPix) {
        alert('Por favor, preencha seu nome completo para continuar com o pagamento PIX');
        return;
    }

    try {
        mostrarLoading();
        const paymentData = {
            pedido_id: sessionStorage.getItem('pedidoId'),
            metodo_pagamento: 'pix',
            valor_pagamento: sessionStorage.getItem('totalPedido'),
            nome_completo: nomeCompletoPix
        };

        const response = await fetch('http://localhost:5000/api/pagamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        if (response.ok) {
            window.location.href = '../confirmacao/index.html';
        } else {
            esconderLoading();
            throw new Error('Erro ao processar PIX');
        }
    } catch (error) {
        esconderLoading();
        alert(`Erro ao processar PIX: ${error.message}`);
    }
}

// Funções auxiliares
function mostrarLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function esconderLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function mostrarSucesso() {
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.style.display = 'flex';
    }
}

// Função para alternar entre cartão e PIX
function toggleFormaPagamento(forma) {
    const formPagamento = document.getElementById('formPagamento');
    const formPix = document.getElementById('formPix');
    
    if (forma === 'pix') {
        formPagamento.style.display = 'none';
        formPix.style.display = 'block';
    } else {
        formPagamento.style.display = 'block';
        formPix.style.display = 'none';
    }
}

// Configurar os event listeners
function configurarBotoes() {
    const btnPix = document.getElementById('btnPix');
    if (btnPix) {
        btnPix.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFormaPagamento('pix');
        });
    }

    const btnSubmit = document.getElementById('btnSubmit');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            processPayment();
        });
    }

    const btnGerarQRCode = document.getElementById('btnGerarQRCode');
    if (btnGerarQRCode) {
        btnGerarQRCode.addEventListener('click', (e) => {
            e.preventDefault();
            gerarQRCode();
        });
    }

    const btnConfirmarPix = document.getElementById('btnConfirmarPix');
    if (btnConfirmarPix) {
        btnConfirmarPix.addEventListener('click', (e) => {
            e.preventDefault();
            processPixPayment();
        });
    }
}

// Função para voltar para o pagamento com cartão
function voltarParaCartao() {
    toggleFormaPagamento('cartao');
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Nova função para redirecionamento
function redirecionarParaConfirmacao() {
    console.log('Redirecionando para confirmação...'); // Debug
    setTimeout(() => {
        try {
            window.location.replace('../confirmacao/index.html');
        } catch (error) {
            console.error('Erro no redirecionamento:', error);
            // Tentar caminho alternativo
            window.location.href = '/confirmacao/index.html';
        }
    }, 2000);
}