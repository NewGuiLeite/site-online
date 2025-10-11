import fetch from "node-fetch";

export async function handler(event, context) {
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer TEST-SEU_ACCESS_TOKEN_SANDBOX', // depois troque por PROD
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
        success: "https://SEUSITE.netlify.app/certificado.html",
        failure: "https://SEUSITE.netlify.app/resultado.html",
        pending: "https://SEUSITE.netlify.app/resultado.html"
      },
      auto_return: "approved"
    })
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
}
