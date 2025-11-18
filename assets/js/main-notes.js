// assets/js/main-notes.js

const DASHBOARD_DEFAULT_COLOR = '#0f172a';

function dashboardGetUser() {
  try {
    const raw =
      localStorage.getItem('tpg_user') ||
      sessionStorage.getItem('tpg_user') ||
      localStorage.getItem('tpgUser') ||
      sessionStorage.getItem('tpgUser');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Nao foi possivel ler o usuario para o dashboard de notas:', e);
    return null;
  }
}

function dashboardSanitizeColor(value) {
  if (!value && value !== 0) return '';
  const str = value.toString().trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(str)) return str;
  if (/^[0-9a-f]{6}$/.test(str)) return `#${str}`;
  return '';
}

function dashboardContrastColor(hex) {
  const normalized = dashboardSanitizeColor(hex) || DASHBOARD_DEFAULT_COLOR;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 160 ? '#0f172a' : '#f8fafc';
}

function dashboardMetaColor(textColor) {
  return textColor === '#0f172a' ? '#1f2937' : 'rgba(248, 250, 252, 0.75)';
}

function dashboardApplyTheme(card, color) {
  const base = dashboardSanitizeColor(color) || DASHBOARD_DEFAULT_COLOR;
  const textColor = dashboardContrastColor(base);
  card.style.setProperty('--note-card-bg', base);
  card.style.setProperty('--note-card-border', base);
  card.style.setProperty('--note-card-text', textColor);
  card.style.setProperty('--note-card-meta', dashboardMetaColor(textColor));
}

function dashboardFormatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('main-notes-section');
  if (!section) return;

  const listEl = section.querySelector('[data-notes-list]');
  const statusEl = section.querySelector('[data-notes-status]');
  const emptyEl = section.querySelector('[data-notes-empty]');
  const user = dashboardGetUser();

  if (!user) {
    section.classList.add('d-none');
    return;
  }

  async function loadDashboardNotes() {
    if (statusEl) statusEl.textContent = 'Carregando notas...';
    if (listEl) listEl.innerHTML = '';
    emptyEl?.classList.add('d-none');

    try {
      const res = await fetch(
        `/.netlify/functions/notes?userId=${encodeURIComponent(user.id)}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao carregar notas.');
      }

      const data = await res.json();
      const notes = data.notes || [];

      if (notes.length === 0) {
        if (statusEl) statusEl.textContent = 'Voce ainda nao criou notas.';
        emptyEl?.classList.remove('d-none');
        return;
      }

      if (statusEl) statusEl.textContent = `Voce tem ${notes.length} nota(s).`;

      notes.forEach((note) => {
        const card = document.createElement('article');
        card.className = 'note-card note-card-compact';
        dashboardApplyTheme(card, note.color);

        const title = document.createElement('h3');
        title.className = 'note-title';
        title.textContent = note.title;

        const meta = document.createElement('p');
        meta.className = 'note-meta mb-1';
        meta.textContent = `Atualizada em ${dashboardFormatDate(note.updated_at)}`;

        const content = document.createElement('p');
        content.className = 'note-content';
        content.textContent = note.content;

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(content);
        listEl.appendChild(card);
      });
    } catch (err) {
      console.error('Dashboard notas', err);
      if (statusEl) {
        statusEl.textContent = 'Nao foi possivel carregar suas notas agora.';
      }
    }
  }

  loadDashboardNotes();
});
