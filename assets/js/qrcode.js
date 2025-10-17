const form = document.getElementById("formulario");
const inputs = document.getElementById("inputs");
const qrcodeDiv = document.getElementById("qrcode");
const msg = document.getElementById("mensagem");
const downloadBtn = document.getElementById("downloadBtn");
let qr;

function abrirFormulario(tipo) {
  inputs.innerHTML = "";
  qrcodeDiv.innerHTML = "";
  msg.textContent = "Preencha os campos e gere o QR Code";
  downloadBtn.style.display = "none";

  switch (tipo) {
    case "pix":
      inputs.innerHTML = `
        <label>Chave PIX:</label>
        <input type="text" name="chave" placeholder="Email, CPF, telefone ou chave aleatória" required>
        <label>Nome do Recebedor:</label>
        <input type="text" name="nome" placeholder="Nome completo ou empresa" required>
        <label>Cidade (opcional):</label>
        <input list="listaCidades" name="cidade" id="cidade" placeholder="Digite a cidade">
        <datalist id="listaCidades"></datalist>
        <label>Valor (opcional):</label>
        <input type="number" step="0.01" name="valor" placeholder="Ex: 25.50">
        <label>Identificador (opcional):</label>
        <input type="text" name="txid" placeholder="Ex: Pedido123">
      `;
      fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
        .then(r => r.json())
        .then(cs => {
          const dl = document.getElementById("listaCidades");
          cs.forEach(c => {
            const o = document.createElement("option");
            o.value = c.nome;
            dl.appendChild(o);
          });
        });
      break;

    case "url":
      inputs.innerHTML = `
        <label>URL:</label>
        <input type="text" name="data" placeholder="https://seudominio.com" required>
      `;
      break;

    case "wifi":
      inputs.innerHTML = `
        <label>Nome da Rede (SSID):</label>
        <input type="text" name="ssid" required>
        <label>Senha:</label>
        <input type="text" name="senha">
        <label>Tipo de Segurança:</label>
        <select name="tipo">
          <option value="WPA">WPA/WPA2</option>
          <option value="WEP">WEP</option>
          <option value="">Sem senha</option>
        </select>
      `;
      break;

    case "whatsapp":
      inputs.innerHTML = `
        <label>Número (com DDD, ex: 5599999999999):</label>
        <input type="text" name="numero" required>
        <label>Mensagem:</label>
        <input type="text" name="mensagem" placeholder="Digite a mensagem">
      `;
      break;

    case "texto":
      inputs.innerHTML = `
        <label>Texto:</label>
        <textarea name="data" rows="3" required></textarea>
      `;
      break;

    case "email":
      inputs.innerHTML = `
        <label>Email:</label>
        <input type="email" name="email" required>
        <label>Assunto:</label>
        <input type="text" name="assunto">
        <label>Mensagem:</label>
        <textarea name="mensagem" rows="3"></textarea>
      `;
      break;
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  qrcodeDiv.innerHTML = "";
  msg.style.color = "#bbb";

  const fd = new FormData(form);
  let data = "";

  // ========== PIX ==========
  if (fd.get("chave")) {
    const chave = fd.get("chave").trim();
    const nome = fd.get("nome").trim().toUpperCase().substring(0, 25);
    const cidade = (fd.get("cidade")?.trim().toUpperCase() || "BRASILIA").substring(0, 15);
    const valor = fd.get("valor") ? Number(fd.get("valor")).toFixed(2) : "";
    let txid = (fd.get("txid") || "").replace(/[^A-Z0-9]/gi, "").substring(0, 25);
    if (!txid) txid = "0000";

    const tlv = (id, value) => (value ? id + value.length.toString().padStart(2, "0") + value : "");

    const gui = "00" + "14" + "BR.GOV.BCB.PIX" + tlv("01", chave);
    const len26 = gui.length.toString().padStart(2, "0");
    const mAccount = "26" + len26 + gui;

    let payload =
      "000201" +
      mAccount +
      "52040000" +
      "5303986" +
      (valor ? tlv("54", valor) : "") +
      "5802BR" +
      tlv("59", nome) +
      tlv("60", cidade) +
      tlv("62", tlv("05", txid)) +
      "6304";

    payload += gerarCRC16(payload);
    data = payload;
  }

  // ========== WIFI ==========
  else if (fd.get("ssid")) {
    const ssid = fd.get("ssid");
    const senha = fd.get("senha");
    const tipo = fd.get("tipo");
    data = `WIFI:T:${tipo};S:${ssid};P:${senha};;`;
  }

  // ========== WHATSAPP ==========
  else if (fd.get("numero")) {
    const numero = fd.get("numero").replace(/\D/g, "");
    const mensagem = encodeURIComponent(fd.get("mensagem") || "");
    if (!numero.startsWith("55")) {
      msg.textContent = "❗ Inclua o código do país (55) antes do número.";
      msg.style.color = "#ff6b6b";
      return;
    }
    data = `https://wa.me/${numero}?text=${mensagem}`;
  }

  // ========== EMAIL ==========
  else if (fd.get("email")) {
    const email = fd.get("email");
    const assunto = encodeURIComponent(fd.get("assunto") || "");
    const mensagem = encodeURIComponent(fd.get("mensagem") || "");
    data = `mailto:${email}?subject=${assunto}&body=${mensagem}`;
  }

  // ========== TEXTO / URL ==========
  else if (fd.get("data")) {
    data = fd.get("data");
  }

  if (!data) {
    msg.textContent = "Preencha os campos corretamente.";
    msg.style.color = "#ff6b6b";
    return;
  }

  qr = new QRCode(qrcodeDiv, {
    text: data,
    width: 240,
    height: 240,
    colorDark: "#000000",
    colorLight: "#ffffff",
  });

  msg.textContent = "✅ QR Code gerado com sucesso!";
  setTimeout(() => {
    const img = qrcodeDiv.querySelector("img");
    if (img) {
      downloadBtn.href = img.src;
      downloadBtn.download = "qrcode.png";
      downloadBtn.style.display = "inline-block";
    }
  }, 600);
});

// ===== CRC16-CCITT =====
function gerarCRC16(str) {
  let polinomio = 0x1021, resultado = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    resultado ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((resultado & 0x8000) !== 0) {
        resultado = ((resultado << 1) ^ polinomio) & 0xFFFF;
      } else {
        resultado = (resultado << 1) & 0xFFFF;
      }
    }
  }
  return resultado.toString(16).toUpperCase().padStart(4, "0");
}
