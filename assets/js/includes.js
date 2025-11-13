// assets/js/includes.js

document.addEventListener('DOMContentLoaded', async () => {
    // carrega parciais marcadas com data-include="caminho/do/arquivo.html"
    const nodes = document.querySelectorAll('[data-include]');
    for (const el of nodes) {
      const url = el.getAttribute('data-include');
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
        el.innerHTML = await res.text();
      } catch (e) {
        console.error('Include error:', url, e);
        el.innerHTML = `<div class="text-danger small">Erro ao carregar: ${url}</div>`;
      }
    }
  
    // depois que as parciais entram, ajusta o resto
    marcarNavAtiva();
    initCookies();
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });
  
  function marcarNavAtiva() {
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('nav .nav-link').forEach((a) => {
      const href = (a.getAttribute('href') || '')
        .split('?')[0]
        .split('#')[0]
        .toLowerCase();
      const isHome = current === '' || current === 'index.html';
      const match = href === current || (isHome && href === 'index.html');
      a.classList.toggle('active', match);
    });
  }
  
  function initCookies() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
  
    const choice = localStorage.getItem('cookiesChoice');
    if (!choice) {
      banner.style.display = 'block';
    } else {
      updateConsent(choice === 'accepted');
    }
  
    const accept = document.getElementById('acceptCookies');
    const reject = document.getElementById('rejectCookies');
  
    if (accept)
      accept.addEventListener('click', () => {
        localStorage.setItem('cookiesChoice', 'accepted');
        banner.style.display = 'none';
        updateConsent(true);
      });
  
    if (reject)
      reject.addEventListener('click', () => {
        localStorage.setItem('cookiesChoice', 'rejected');
        banner.style.display = 'none';
        updateConsent(false);
      });
  }
  
  function updateConsent(granted) {
    if (typeof gtag !== 'function') return;
    gtag('consent', 'update', {
      ad_storage: granted ? 'granted' : 'denied',
      analytics_storage: granted ? 'granted' : 'denied',
    });
  }
  