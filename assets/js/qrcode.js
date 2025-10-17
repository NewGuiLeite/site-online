const form = document.getElementById("formulario");
const inputs = document.getElementById("inputs");
const qrcodeDiv = document.getElementById("qrcode");
const msg = document.getElementById("mensagem");
const downloadBtn = document.getElementById("downloadBtn");

let qr;

function abrirFormulario(tipo) {
  inputs.innerHTML = "";
  msg.textContent = "Preencha os campos e gere o QR Code";
  qrcodeDiv.innerHTML = "";
  downloadBtn.style.display = "none";

  switch (tipo) {
    case "url":
      inputs.innerHTML = `
        <label>URL:</label>
        <input type="text" name="data" placeholder="https://seusite.com" required>
      `;
      break;
    case "wifi":
      inputs.innerHTML = `
        <label>Nome da Rede (SSID):</label>
        <input type="text" name="ssid" required>
        <label>Senha:</label>
        <input type="text" name="senha" required>
      `;
      break;
    case "whatsapp":
      inputs.innerHTML = `
        <label>Número (com DDD):</label>
        <input type="text" name="numero" placeholder="55XXXXXXXXXXX" required>
        <label>Mensagem:</label>
        <input type="text" name="mensagem" required>
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
        <input type="text" name="assunto" required>
        <label>Mensagem:</label>
        <textarea name="mensagem" required></textarea>
      `;
      break;
  }
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  qrcodeDiv.innerHTML = "";

  const formData = new FormData(form);
  let data = "";

  if (formData.get("data")) {
    data = formData.get("data");
  } else if (formData.get("ssid")) {
    data = `WIFI:T:WPA;S:${formData.get("ssid")};P:${formData.get("senha")};;`;
  } else if (formData.get("numero")) {
    data = `https://wa.me/${formData.get("numero")}?text=${encodeURIComponent(formData.get("mensagem"))}`;
  } else if (formData.get("email")) {
    const assunto = encodeURIComponent(formData.get("assunto"));
    const mensagem = encodeURIComponent(formData.get("mensagem"));
    data = `mailto:${formData.get("email")}?subject=${assunto}&body=${mensagem}`;
  }

  if (!data) {
    msg.textContent = "Preencha os campos corretamente.";
    return;
  }

  qr = new QRCode(qrcodeDiv, {
    text: data,
    width: 200,
    height: 200,
    colorDark: "#00b4ff",
    colorLight: "#ffffff",
  });

  msg.textContent = "QR Code gerado com sucesso!";
  setTimeout(() => {
    const img = qrcodeDiv.querySelector("img");
    if (img) {
      downloadBtn.href = img.src;
      downloadBtn.download = "qrcode.png";
      downloadBtn.style.display = "inline-block";
    }
  }, 600);
});
