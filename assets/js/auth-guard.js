// assets/js/auth-guard.js

(function () {
  const path = window.location.pathname.toLowerCase();

  // Páginas públicas (não precisam de login)
  const publicPages = [
    '/',
    '/index.html',
    '/login.html',
    '/privacy.html',
    '/terms.html',
    '/cookies.html',
    '/hash-senha.html',
    '/plano-emagrecimento-limitado.html',
    '/acesso-glp1-7f39a2-a151561-d15s8235.html'
  ];

  const isPublic = publicPages.some((p) => path === p);

  // 👇 Tem que bater com o que o auth.js usa pra salvar o usuário
  const userStr = localStorage.getItem('tpg_user');

  // Se não estiver logado e a página NÃO for pública → manda pro login
  if (!userStr && !isPublic) {
    window.location.href = 'login.html';
    return;
  }

  // Se já estiver logado e cair na página de login → manda pro main
  if (userStr && path.endsWith('/login.html')) {
    window.location.href = 'main.html';
  }
})();
