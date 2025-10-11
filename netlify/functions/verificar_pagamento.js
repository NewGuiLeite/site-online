export async function handler(event, context) {
    try {
      const { searchParams } = new URL(event.rawUrl);
      const paymentId = searchParams.get("id");
  
      if (!paymentId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ status: "erro", message: "ID do pagamento não informado" })
        };
      }
  
      // Consulta o status diretamente no Mercado Pago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      });
  
      const pagamento = await response.json();
  
      if (pagamento.status === "approved") {
        return {
          statusCode: 200,
          body: JSON.stringify({
            status: "approved",
            payer: pagamento.payer?.email || "desconhecido",
            date: pagamento.date_approved
          })
        };
      } else {
        return {
          statusCode: 200,
          body: JSON.stringify({ status: pagamento.status || "pendente" })
        };
      }
    } catch (error) {
      console.error("❌ Erro na verificação:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ status: "erro", message: error.message })
      };
    }
  }
  