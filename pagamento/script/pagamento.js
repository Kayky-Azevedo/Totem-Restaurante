document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
    configurarBotoes();
});

function inicializarPagina() {
    exibirValorTotal();
    configurarValidacaoEmTempoReal();
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

    // Array com a ordem dos campos
    const ordemCampos = [
        'nomeCompleto',
        'email',
        'endereco',
        'cidade',
        'estado',
        'cep',
        'nomeCartao',
        'numeroCartao',
        'dataExpiracao',
        'cvv'
    ];

    // Validar campos na ordem
    for (const campoId of ordemCampos) {
        const elemento = document.getElementById(campoId);
        if (!validarCampo(elemento)) {
            elemento.focus(); // Foca no primeiro campo com erro
            return; // Para a validação no primeiro erro encontrado
        }
    }

    // Se chegou aqui, todos os campos estão válidos
    try {
        mostrarLoading();
        const paymentData = {
            pedido_id: sessionStorage.getItem('pedidoId'),
            metodo_pagamento: 'cartao',
            valor_pagamento: sessionStorage.getItem('totalPedido'),
            ...Object.fromEntries(ordemCampos.map(id => [
                id, 
                document.getElementById(id).value.trim()
            ]))
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
    // Remove erro anterior se existir
    limparErro(elemento);
    
    // Adiciona classe de erro ao input
    elemento.classList.add('input-erro');
    
    // Cria elemento de mensagem de erro
    const erroElement = document.createElement('div');
    erroElement.className = 'erro-mensagem';
    erroElement.textContent = mensagem;
    
    // Insere a mensagem após o input
    elemento.parentElement.appendChild(erroElement);
}

function limparErro(elemento) {
    elemento.classList.remove('input-erro');
    const erroExistente = elemento.parentElement.querySelector('.erro-mensagem');
    if (erroExistente) {
        erroExistente.remove();
    }
}

function limparErros() {
    document.querySelectorAll('.input-erro').forEach(elemento => {
        limparErro(elemento);
    });
}

// Atualizar a função de validação para validar em tempo real
function configurarValidacaoEmTempoReal() {
    const campos = document.querySelectorAll('input');
    campos.forEach(campo => {
        campo.addEventListener('blur', () => {
            validarCampo(campo);
        });
        
        campo.addEventListener('input', () => {
            if (campo.id === 'dataExpiracao') {
                formatarDataExpiracao(campo);
            }
            if (campo.classList.contains('input-erro')) {
                validarCampo(campo);
            }
        });
    });
}

function validarCampo(campo) {
    limparErro(campo);
    
    const valor = campo.value.trim();
    
    if (!valor) {
        mostrarErro(campo, `${campo.previousElementSibling.textContent.replace(':', '')} é obrigatório`);
        return false;
    }
    
    // Validações específicas
    switch(campo.id) {
        case 'email':
            if (!validarEmail(valor)) {
                mostrarErro(campo, 'E-mail inválido');
                return false;
            }
            break;
        case 'cep':
            if (!validarCEP(valor)) {
                mostrarErro(campo, 'CEP inválido (formato: 00000-000)');
                return false;
            }
            break;
        case 'numeroCartao':
            if (!validarCartao(valor)) {
                mostrarErro(campo, 'Número de cartão inválido');
                return false;
            }
            break;
        case 'cvv':
            if (!validarCVV(valor)) {
                mostrarErro(campo, 'CVV inválido');
                return false;
            }
            break;
        case 'dataExpiracao':
            if (!validarDataExpiracao(valor)) {
                mostrarErro(campo, 'Data de expiração inválida');
                return false;
            }
            break;
    }
    
    return true;
}

// Adicionar novas funções de validação
function validarMes(mes) {
    const mesNum = parseInt(mes);
    return mesNum >= 1 && mesNum <= 12;
}

function validarAno(ano) {
    const anoAtual = new Date().getFullYear();
    const anoNum = parseInt(ano);
    return anoNum >= anoAtual && anoNum <= anoAtual + 10;
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

// Função para formatar a data de expiração
function formatarDataExpiracao(campo) {
    let valor = campo.value.replace(/\D/g, ''); // Remove não-dígitos
    
    if (valor.length >= 2) {
        valor = valor.substring(0,2) + '/' + valor.substring(2);
    }
    
    campo.value = valor;
}

// Função para validar a data de expiração
function validarDataExpiracao(valor) {
    if (!/^\d{2}\/\d{4}$/.test(valor)) {
        return false;
    }

    const [mes, ano] = valor.split('/');
    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth() + 1;

    // Validar mês
    if (mesNum < 1 || mesNum > 12) {
        return false;
    }

    // Validar ano
    if (anoNum < anoAtual || anoNum > anoAtual + 10) {
        return false;
    }

    // Verificar se o mês atual é menor que o mês de expiração
    if (mesNum < mesAtual && anoNum === anoAtual) {
        return false;
    }

    return true;
}