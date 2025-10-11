import crypto from "crypto";

export async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    // Corpo da requisição e assinatura vinda do Mercado Pago
    const body = event.body;
    const signature = event.headers["x-signature"] || "";
    const secret = process.env.MP_WEBHOOK_SECRET; // variável de ambiente no Netlify

    // ✅ Verifica se a requisição veio realmente do Mercado Pago
    if (!secret) {
      console.error("❌ MP_WEBHOOK_SECRET não configurado!");
    } else {
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(body);
      const hash = hmac.digest("hex");

      if (hash !== signature) {
        console.warn("⚠️ Assinatura inválida! Ignorando webhook não autorizado.");
        return { statusCode: 401, body: "Unauthorized" };
      }
    }

    const payload = JSON.parse(body || "{}");
    console.log("📩 Webhook recebido:", JSON.stringify(payload, null, 2));

    // Se for um pagamento
    if (payload.type === "payment" || payload.action?.includes("payment")) {
      const paymentId = payload.data?.id;
      console.log("💰 Pagamento recebido, ID:", paymentId);

      // Consulta detalhes do pagamento
      const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      });

      const pagamento = await resp.json();
      console.log("🔎 Status do pagamento:", pagamento.status);

      if (pagamento.status === "approved") {
        console.log("✅ Pagamento aprovado com sucesso!");
        // Aqui você pode salvar ou liberar o certificado automaticamente
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook processado com sucesso" })
    };
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
