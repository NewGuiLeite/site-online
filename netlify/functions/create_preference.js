import fetch from "node-fetch";

export async function handler(event, context) {
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer TEST-SEU_ACCESS_TOKEN_SANDBOX', // substitua pelo seu token depois
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
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
}
