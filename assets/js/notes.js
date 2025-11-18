// assets/js/notes.js

const DEFAULT_NOTE_COLOR = '#0f172a';

function getCurrentUser() {
  try {
    const raw =
      localStorage.getItem('tpg_user') ||
      sessionStorage.getItem('tpg_user') ||
      localStorage.getItem('tpgUser') ||
      sessionStorage.getItem('tpgUser');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Nao foi possivel ler o usuario da sessao:', e);
    return null;
  }
}

function sanitizeColorInput(value) {
  if (!value && value !== 0) return '';
  const str = value.toString().trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(str)) return str;
  if (/^[0-9a-f]{6}$/i.test(str)) return `#${str}`;
  return '';
}

function getContrastColor(hex) {
  const normalized = sanitizeColorInput(hex) || DEFAULT_NOTE_COLOR;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 160 ? '#0f172a' : '#f8fafc';
}

function getMetaColor(textColor) {
  return textColor === '#0f172a' ? '#1f2937' : 'rgba(248, 250, 252, 0.75)';
}

function applyNoteTheme(card, color) {
  const base = sanitizeColorInput(color) || DEFAULT_NOTE_COLOR;
  const textColor = getContrastColor(base);
  card.style.setProperty('--note-card-bg', base);
  card.style.setProperty('--note-card-border', base);
  card.style.setProperty('--note-card-text', textColor);
  card.style.setProperty('--note-card-meta', getMetaColor(textColor));
}

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  console.log('Usuario detectado em notes:', user);

  const notesUsername = document.getElementById('notes-username');
  const notesStatus = document.getElementById('notes-status');
  const notesList = document.getElementById('notes-list');
  const refreshBtn = document.getElementById('notes-refresh-btn');

  const form = document.getElementById('note-form');
  const noteIdInput = document.getElementById('note-id');
  const noteTitleInput = document.getElementById('note-title');
  const noteContentInput = document.getElementById('note-content');
  const noteColorInput = document.getElementById('note-color');
  const colorButtons = Array.from(document.querySelectorAll('.note-color-option'));
  const formTitle = document.getElementById('note-form-title');
  const submitBtn = document.getElementById('note-submit-btn');
  const cancelEditBtn = document.getElementById('note-cancel-edit');
  const noteMessage = document.getElementById('note-message');

  if (user.name) {
    notesUsername.textContent = `Notas de ${user.name}`;
  } else if (user.email) {
    notesUsername.textContent = `Notas de ${user.email}`;
  }

  let isEditing = false;

  function setActiveColor(color) {
    if (!noteColorInput) return;
    const safe = sanitizeColorInput(color) || DEFAULT_NOTE_COLOR;
    noteColorInput.value = safe;
    colorButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.color === safe);
    });
  }

  colorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveColor(btn.dataset.color);
    });
  });

  if (noteColorInput) {
    setActiveColor(noteColorInput.value);
  }

  function getSelectedColor() {
    if (!noteColorInput) return DEFAULT_NOTE_COLOR;
    return sanitizeColorInput(noteColorInput.value) || DEFAULT_NOTE_COLOR;
  }

  function setLoading(statusText = 'Carregando notas...') {
    notesStatus.textContent = statusText;
  }

  async function loadNotes() {
    setLoading('Carregando notas...');
    notesList.innerHTML = '';

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
        notesStatus.textContent = 'Voce ainda nao tem nenhuma nota.';
        return;
      }

      notesStatus.textContent = `Voce tem ${notes.length} nota(s).`;
      renderNotes(notes);
    } catch (err) {
      console.error(err);
      notesStatus.textContent =
        'Erro ao carregar notas. Tente novamente em instantes.';
    }
  }

  function formatDate(dateStr) {
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

  function renderNotes(notes) {
    notesList.innerHTML = '';

    notes.forEach((note) => {
      const card = document.createElement('div');
      card.className = 'note-card';
      applyNoteTheme(card, note.color);

      const header = document.createElement('div');
      header.className = 'note-card-header';

      const titleEl = document.createElement('div');
      titleEl.className = 'note-title';
      titleEl.textContent = note.title;

      const metaEl = document.createElement('div');
      metaEl.className = 'note-meta';
      metaEl.textContent = `Atualizada em ${formatDate(note.updated_at)}`;

      header.appendChild(titleEl);
      header.appendChild(metaEl);

      const contentEl = document.createElement('div');
      contentEl.className = 'note-content';
      contentEl.textContent = note.content;

      const actions = document.createElement('div');
      actions.className = 'note-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-sm btn-outline-light';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => startEdit(note));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-sm btn-outline-danger';
      deleteBtn.textContent = 'Excluir';
      deleteBtn.addEventListener('click', () => deleteNote(note.id));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      card.appendChild(header);
      card.appendChild(contentEl);
      card.appendChild(actions);

      notesList.appendChild(card);
    });
  }

  function resetForm() {
    isEditing = false;
    noteIdInput.value = '';
    noteTitleInput.value = '';
    noteContentInput.value = '';
    setActiveColor(DEFAULT_NOTE_COLOR);
    formTitle.textContent = 'Nova nota';
    submitBtn.textContent = 'Salvar nota';
    cancelEditBtn.classList.add('d-none');
    noteMessage.textContent = '';
  }

  function startEdit(note) {
    isEditing = true;
    noteIdInput.value = note.id;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    setActiveColor(note.color || DEFAULT_NOTE_COLOR);
    formTitle.textContent = 'Editar nota';
    submitBtn.textContent = 'Atualizar nota';
    cancelEditBtn.classList.remove('d-none');
    noteMessage.textContent =
      'Voce esta editando uma nota. Clique em "Cancelar edicao" para voltar.';
  }

  cancelEditBtn.addEventListener('click', () => {
    resetForm();
  });

  async function saveNote(e) {
    e.preventDefault();

    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const color = getSelectedColor();

    if (!title || !content) {
      noteMessage.textContent = 'Preencha titulo e conteudo.';
      return;
    }

    noteMessage.textContent = isEditing ? 'Atualizando nota...' : 'Salvando nota...';

    try {
      const payload = {
        userId: user.id,
        title,
        content,
        color
      };

      let method = 'POST';

      if (isEditing) {
        method = 'PUT';
        payload.id = noteIdInput.value;
      }

      const res = await fetch('/.netlify/functions/notes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao salvar nota.');
      }

      noteMessage.textContent = isEditing
        ? 'Nota atualizada com sucesso.'
        : 'Nota criada com sucesso.';

      resetForm();
      loadNotes();
    } catch (err) {
      console.error(err);
      noteMessage.textContent = err.message || 'Erro ao salvar nota.';
    }
  }

  async function deleteNote(id) {
    const ok = confirm('Tem certeza que deseja apagar esta nota?');
    if (!ok) return;

    notesStatus.textContent = 'Excluindo nota...';

    try {
      const res = await fetch('/.netlify/functions/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId: user.id })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao excluir nota.');
      }

      notesStatus.textContent = 'Nota excluida.';
      loadNotes();
    } catch (err) {
      console.error(err);
      notesStatus.textContent = err.message || 'Erro ao excluir nota.';
    }
  }

  form.addEventListener('submit', saveNote);
  refreshBtn.addEventListener('click', loadNotes);

  loadNotes();
});
