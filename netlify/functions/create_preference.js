export async function handler(event, context) {
  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: "Teste de QI Premium",
            description: "Liberação do resultado e certificado simbólico",
            quantity: 1,
            currency_id: "BRL",
            unit_price: 3.99
          }
        ],
        back_urls: {
          success: "https://tpgonline.com.br/certificado.html",
          failure: "https://tpgonline.com.br/resultado.html",
          pending: "https://tpgonline.com.br/resultado.html"
        },
        auto_return: "approved"
      })
    });

    const data = await response.json();

    // 🔍 log detalhado para debug
    console.log("🧾 Resposta Mercado Pago:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ message: "Erro Mercado Pago", data })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("❌ Erro na função:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
