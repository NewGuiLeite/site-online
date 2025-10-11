async function iniciarPagamento() {
  try {
    console.log("🧾 Iniciando processo de pagamento...");

    // Cria a preferência de pagamento no servidor
    const response = await fetch('/.netlify/functions/create_preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    console.log("🧾 Resposta da função:", data);

    // Verifica se houve erro
    if (!response.ok || !data) {
      alert("❌ Erro ao criar pagamento. Tente novamente mais tarde.");
      console.error("Erro Mercado Pago:", data);
      return;
    }

    // Salva o ID da preferência para verificação posterior
    if (data.preference_id) {
      localStorage.setItem("preference_id", data.preference_id);
      console.log(`💾 Preference ID salva: ${data.preference_id}`);
    }

    // Detecta automaticamente se é produção ou sandbox
    const linkPagamento =
      data.ambiente === "Produção"
        ? data.init_point
        : data.sandbox_init_point;

    // Redireciona para o link correto
    if (linkPagamento) {
      console.log(`🌎 Redirecionando para checkout: ${data.ambiente}`);
      window.location.href = linkPagamento;
    } else {
      alert("⚠️ Erro ao gerar o link de pagamento.");
      console.error("Dados recebidos:", data);
    }

  } catch (error) {
    console.error("❌ Erro ao iniciar pagamento:", error);
    alert("Erro inesperado. Tente novamente mais tarde.");
  }
}

// Ativa o botão de pagamento
document.getElementById("btnPagar").addEventListener("click", iniciarPagamento);
