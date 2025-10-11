import fs from "fs";

export async function handler() {
  try {
    const path = "/tmp/status_pagamento.json";
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path);
      return { statusCode: 200, body: data.toString() };
    } else {
      return { statusCode: 200, body: JSON.stringify({ status: "pendente" }) };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
