// assets/js/check-session.js

(function () {
  let user = null;
  const raw = localStorage.getItem('tpg_user');

  if (raw) {
    try {
      user = JSON.parse(raw);
      window.TPG_USER = user;
    } catch (e) {
      console.error('Erro ao ler usuário do localStorage:', e);
      localStorage.removeItem('tpg_user');
      user = null;
    }
  }

  window.tpgRefreshSessionUI = function () {
    const loginItem = document.getElementById('nav-login-item');
    const userItem = document.getElementById('nav-user-item');
    const logoutItem = document.getElementById('nav-logout-item');
    const userNameSpan = document.getElementById('user-name');

    if (!loginItem && !userItem && !logoutItem) {
      return;
    }

    if (user) {
      if (userNameSpan) {
        userNameSpan.textContent = user.name || user.email || 'Usuário';
      }
      if (loginItem) loginItem.classList.add('d-none');
      if (userItem) userItem.classList.remove('d-none');
      if (logoutItem) logoutItem.classList.remove('d-none');
    } else {
      if (loginItem) loginItem.classList.remove('d-none');
      if (userItem) userItem.classList.add('d-none');
      if (logoutItem) logoutItem.classList.add('d-none');
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && !logoutBtn._tpgBound) {
      logoutBtn._tpgBound = true;
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('tpg_user');
        user = null;
        window.TPG_USER = null;
        window.tpgRefreshSessionUI();
        window.location.href = 'index.html';
      });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.tpgRefreshSessionUI();
  });
})();
