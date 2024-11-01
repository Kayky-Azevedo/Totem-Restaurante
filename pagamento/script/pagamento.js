document.addEventListener('DOMContentLoaded', () => {
  // Função para capturar e validar os dados do formulário
  async function processPayment() {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
          alert("Erro: userId está indefinido. Verifique se o usuário está logado.");
          return;
      }

      // Capturando os valores dos inputs
      const nomeCompleto = document.getElementById('nomeCompleto').value;
      const email = document.getElementById('email').value;
      const endereco = document.getElementById('endereco').value;
      const cidade = document.getElementById('cidade').value;
      const estado = document.getElementById('estado').value;
      const cep = document.getElementById('cep').value;
      const nomeCartao = document.getElementById('nomeCartao').value;
      const numeroCartao = document.getElementById('numeroCartao').value;
      const expiraMes = document.getElementById('expiraMes').value;
      const expiraAno = document.getElementById('expiraAno').value;
      const cvv = document.getElementById('cvv').value;

      // Validação simples
      if (!nomeCompleto || !email || !endereco || !cidade || !estado || !cep || !nomeCartao || !numeroCartao || !expiraMes || !expiraAno || !cvv) {
          alert('Por favor, preencha todos os campos!');
          return;
      }

      // Validação adicional para o formato dos dados
      const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
      if (!emailPattern.test(email)) {
          alert('Por favor, insira um e-mail válido!');
          return;
      }
      if (numeroCartao.length !== 16 || isNaN(numeroCartao)) {
          alert('Por favor, insira um número de cartão de crédito válido (16 dígitos)!');
          return;
      }
      if (cvv.length !== 3 || isNaN(cvv)) {
          alert('Por favor, insira um CVV válido (3 dígitos)!');
          return;
      }

      // Chamar a API para processar o pagamento
      try {
          const response = await fetch('http://localhost:5000/api/pagamento', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  pedido_id: sessionStorage.getItem('pedidoId')  // ID do pedido salvo durante o checkout
              })
          });

          if (response.ok) {
              alert('Pagamento processado com sucesso!');
              window.location.href = '../confirmacao_pedido/index.html';  // Redirecionar para a página de confirmação de pedido
          } else {
              const error = await response.json();
              alert('Erro ao processar pagamento: ' + error.error);
          }

      } catch (error) {
          alert('Erro ao processar pagamento: ' + error.message);
      }
  }

  // Evento para o botão "Pagar" do formulário de cartão de crédito
  document.getElementById('btnSubmit').addEventListener('click', async (event) => {
      event.preventDefault();
      await processPayment();
  });

  // Mostrar formulário Pix ao clicar no botão "Pagar via Pix"
  document.getElementById('btnPix').addEventListener('click', function() {
      document.getElementById('formPagamento').style.display = 'none';
      document.getElementById('formPix').style.display = 'block';
  });

  // Gerar QRCode ao clicar no botão "Gerar QRCode"
  document.getElementById('btnSubmitPix').addEventListener('click', function() {
      const nomeCompletoPix = document.getElementById('nomeCompletoPix').value;
      const valorPix = document.getElementById('valorPix').value;
      // Validação dos campos do formulário Pix
      if (!nomeCompletoPix || !valorPix) {
          alert('Por favor, preencha todos os campos do pagamento via Pix!');
          return;
      }
      // Exibir o QRCode e as instruções
      const qr = new QRious({
          element: document.getElementById('qrcode'),
          size: 200,
          value: 'Pagamento via Pix - Nome: ' + nomeCompletoPix + ', Valor: ' + valorPix
      });
      document.getElementById('qrcode').style.display = 'block';
      document.getElementById('instructions').style.display = 'block';
  });
})