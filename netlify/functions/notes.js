// assets/js/notes.js

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('tpg_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Não foi possível ler o usuário da sessão:', e);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();

  // Se por algum motivo não tiver user aqui, envia para login
  if (!user || !user.id) {
    window.location.href = 'login.html';
    return;
  }

  console.log('Usuário detectado em notes:', user);

  // Elementos
  const notesUsername = document.getElementById('notes-username');
  const notesStatus = document.getElementById('notes-status');
  const notesList = document.getElementById('notes-list');
  const refreshBtn = document.getElementById('notes-refresh-btn');

  const form = document.getElementById('note-form');
  const noteIdInput = document.getElementById('note-id');
  const noteTitleInput = document.getElementById('note-title');
  const noteContentInput = document.getElementById('note-content');
  const formTitle = document.getElementById('note-form-title');
  const submitBtn = document.getElementById('note-submit-btn');
  const cancelEditBtn = document.getElementById('note-cancel-edit');
  const noteMessage = document.getElementById('note-message');

  // Mostrar nome do usuário
  if (user.name) {
    notesUsername.textContent = `Notas de ${user.name}`;
  } else if (user.email) {
    notesUsername.textContent = `Notas de ${user.email}`;
  }

  // Estado: está editando?
  let isEditing = false;

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
        notesStatus.textContent = 'Você ainda não tem nenhuma nota.';
        return;
      }

      notesStatus.textContent = `Você tem ${notes.length} nota(s).`;
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
    formTitle.textContent = 'Editar nota';
    submitBtn.textContent = 'Atualizar nota';
    cancelEditBtn.classList.remove('d-none');
    noteMessage.textContent =
      'Você está editando uma nota. Clique em "Cancelar edição" para voltar.';
  }

  cancelEditBtn.addEventListener('click', () => {
    resetForm();
  });

  async function saveNote(e) {
    e.preventDefault();

    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    if (!title || !content) {
      noteMessage.textContent = 'Preencha título e conteúdo.';
      return;
    }

    noteMessage.textContent = isEditing ? 'Atualizando nota...' : 'Salvando nota...';

    try {
      const payload = {
        userId: user.id,
        title,
        content
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

      if (isEditing) {
        noteMessage.textContent = 'Nota atualizada com sucesso.';
      } else {
        noteMessage.textContent = 'Nota criada com sucesso.';
      }

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

      notesStatus.textContent = 'Nota excluída.';
      loadNotes();
    } catch (err) {
      console.error(err);
      notesStatus.textContent = err.message || 'Erro ao excluir nota.';
    }
  }

  // Listeners
  form.addEventListener('submit', saveNote);
  refreshBtn.addEventListener('click', loadNotes);

  // Carrega logo ao entrar
  loadNotes();
});
