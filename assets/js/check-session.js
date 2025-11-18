(function () {
    const raw = localStorage.getItem('tpg_user');
  
    const navLoginItem = document.getElementById('nav-login-item');
    const navUserItem = document.getElementById('nav-user-item');
    const navLogoutItem = document.getElementById('nav-logout-item');
  
    const userNameEl = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
  
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
        userNameEl.textContent = user.name || user.email || 'usuário';
      }
  
      if (navLoginItem) navLoginItem.classList.add('d-none');
      if (navUserItem) navUserItem.classList.remove('d-none');
      if (navLogoutItem) navLogoutItem.classList.remove('d-none');
  
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('tpg_user');
          window.location.reload();
        });
      }
    } catch (e) {
      console.error('Erro ao ler usuário:', e);
      localStorage.removeItem('tpg_user');
      if (navLoginItem) navLoginItem.classList.remove('d-none');
      if (navUserItem) navUserItem.classList.add('d-none');
      if (navLogoutItem) navLogoutItem.classList.add('d-none');
    }
  })();
  