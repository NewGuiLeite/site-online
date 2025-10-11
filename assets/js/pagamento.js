async function iniciarPagamento() {
    const response = await fetch('/.netlify/functions/create_preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  
    const data = await response.json();
    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      alert("Erro ao criar pagamento. Tente novamente mais tarde.");
    }
  }
  
  document.getElementById("btnPagar").addEventListener("click", iniciarPagamento);
  