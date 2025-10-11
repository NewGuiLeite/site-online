async function iniciarPagamento() {
  try {
    const response = await fetch('/.netlify/functions/create_preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    console.log("🧾 Resposta da função:", data);

    // Se houver erro na criação da preferência
    if (!response.ok) {
      alert("❌ Erro ao criar pagamento. Tente novamente mais tarde.");
      console.error("Erro Mercado Pago:", data);
      return;
    }

    // Detecta automaticamente o link certo (produção ou sandbox)
    const linkPagamento =
      data.ambiente === "Produção"
        ? data.init_point
        : data.sandbox_init_point;

    if (linkPagamento) {
      console.log(`🌎 Redirecionando para: ${data.ambiente}`);
      window.location.href = linkPagamento;
    } else {
      alert("Erro ao gerar o link de pagamento.");
      console.error("Dados recebidos:", data);
    }
  } catch (error) {
    console.error("❌ Erro ao iniciar pagamento:", error);
    alert("Erro inesperado. Tente novamente mais tarde.");
  }
}

// Ativa o botão
document.getElementById("btnPagar").addEventListener("click", iniciarPagamento);
