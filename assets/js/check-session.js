// assets/js/check-session.js

(function () {
  function applySessionToNavbar() {
    const raw = localStorage.getItem('tpg_user');

    const navLoginItem = document.getElementById('nav-login-item');
    const navUserItem = document.getElementById('nav-user-item');
    const navLogoutItem = document.getElementById('nav-logout-item');
    const userNameEl = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    // se a navbar ainda não foi carregada (includes.js), só sai
    if (!navLoginItem && !navUserItem && !navLogoutItem) {
      return;
    }

    if (!raw) {
      // Ninguém logado
      if (navLoginItem) navLoginItem.classList.remove('d-none');
      if (navUserItem) navUserItem.classList.add('d-none');
      if (navLogoutItem) navLogoutItem.classList.add('d-none');
      return;
    }

    try {
      const user = JSON.parse(raw);

      if (userNameEl) {
        user.name ||= user.email || 'usuário';
        userNameEl.textContent = user.name;
      }

      if (navLoginItem) navLoginItem.classList.add('d-none');
      if (navUserItem) navUserItem.classList.remove('d-none');
      if (navLogoutItem) navLogoutItem.classList.remove('d-none');

      if (logoutBtn && !logoutBtn.dataset._tpgBound) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('tpg_user');
          window.location.reload();
        });
        logoutBtn.dataset._tpgBound = '1';
      }
    } catch (e) {
      console.error('Erro ao ler sessão:', e);
      localStorage.removeItem('tpg_user');
      if (navLoginItem) navLoginItem.classList.remove('d-none');
      if (navUserItem) navUserItem.classList.add('d-none');
      if (navLogoutItem) navLogoutItem.classList.add('d-none');
    }
  }

  document.addEventListener('DOMContentLoaded', applySessionToNavbar);
  window.tpgRefreshSessionUI = applySessionToNavbar;
})();
