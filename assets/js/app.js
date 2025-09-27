/**
 * App basic JS
 * - Year in footer
 * - Navbar "Usuários" item shown only when username is admin/ADMIN (case-insensitive).
 *   We read from localStorage.userName to keep this static front-end demo simple.
 */

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Determine user
  const currentUser = (localStorage.getItem('userName') || '').trim();
  const isAdmin = currentUser.toUpperCase() === 'ADMIN';

  // Toggle admin item
  document.querySelectorAll('[data-nav-admin]').forEach(el => {
    el.classList.toggle('d-none', !isAdmin);
  });

  // Small helper to set the user from the account dropdown demo
  const setUserForm = document.getElementById('set-user-form');
  if (setUserForm) {
    setUserForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('userNameInput').value || '').trim();
      localStorage.setItem('userName', name);
      location.reload();
    });
  }

  // Fill current user label
  const userLabel = document.getElementById('current-user-label');
  if (userLabel) userLabel.textContent = currentUser || 'convidado';
});
