export async function handler(event, context) {
  try {
    // Verifica qual ambiente está ativo
    const ambiente = process.env.MP_ACCESS_TOKEN.startsWith("APP_USR-") ? "Produção" : "Sandbox";
    console.log(`🌎 Ambiente Mercado Pago: ${ambiente}`);

    // Define a URL da API (é a mesma nos dois modos)
    const url = 'https://api.mercadopago.com/checkout/preferences';

    // Cria a preferência de pagamento
    const response = await fetch(url, {
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
            unit_price: 1.99  // 50 centavos
          }
        ],
        back_urls: {
          success: "https://tpgonline.com.br/index.html",
          failure: "https://tpgonline.com.br/pagamento.html",
          pending: "https://tpgonline.com.br/pagamento.html"
        },
        auto_return: "approved"
      })
    });

    const data = await response.json();

    // 🧾 Log completo de retorno
    console.log("🧾 Resposta Mercado Pago:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("❌ Erro da API:", data);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          message: "Erro ao criar preferência de pagamento",
          ambiente,
          data
        })
      };
    }

    // ✅ Tudo certo: devolve a preferência pro front
    return {
      statusCode: 200,
      body: JSON.stringify({
        ambiente,
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        // novo campo para rastrear
        preference_id: data.id
      })
    };
    

  } catch (error) {
    console.error("❌ Erro na função:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro interno no servidor",
        error: error.message
      })
    };
  }
}
