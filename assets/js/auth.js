// assets/js/auth.js

const tabs = document.querySelectorAll('.tab');
const form = document.getElementById('auth-form');
const fieldName = document.querySelector('.field-name');
const messageEl = document.getElementById('message');

let mode = 'login'; // 'login' ou 'register'

// se não achar o form, já avisa no console
if (!form) {
  console.error('Formulário #auth-form não encontrado em login.html');
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    mode = tab.dataset.mode;

    if (mode === 'register') {
      fieldName.style.display = 'block';
    } else {
      fieldName.style.display = 'none';
    }

    messageEl.textContent = '';
    messageEl.className = 'message';
  });
});

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    messageEl.textContent = 'Processando...';
    messageEl.className = 'message';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      let url;
      let payload;

      if (mode === 'register') {
        url = '/.netlify/functions/register-user';
        payload = { name, email, password };
      } else {
        url = '/.netlify/functions/login-user';
        payload = { email, password };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error('Resposta não JSON da function:', text);
        throw new Error(
          `Erro no servidor (${res.status}). Detalhes: ${text || 'sem detalhes'}`
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Erro no servidor (${res.status}).`);
      }

      // guarda usuário
      localStorage.setItem('tpg_user', JSON.stringify(data.user));

      messageEl.textContent =
        mode === 'register'
          ? 'Cadastro realizado com sucesso! Redirecionando...'
          : 'Login realizado com sucesso! Redirecionando...';
      messageEl.className = 'message success';

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
    } catch (err) {
      console.error(err);
      messageEl.textContent = err.message || 'Erro inesperado.';
      messageEl.className = 'message error';
    }
  });
}
