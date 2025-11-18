// assets/js/auth-guard.js

(function () {
    const raw = localStorage.getItem('tpg_user');
  
    if (!raw) {
      window.location.href = 'login.html';
      return;
    }
  
    try {
      const user = JSON.parse(raw);
      window.TPG_USER = user;
    } catch (e) {
      console.error('Erro ao validar sessão:', e);
      localStorage.removeItem('tpg_user');
      window.location.href = 'login.html';
    }
  })();
  