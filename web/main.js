async function fetchJson(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok) { throw new Error('HTTP ' + r.status); }
  return await r.json();
}

async function loadBooks() {
  const list = document.getElementById('books');
  list.innerHTML = 'Loading...';
  try {
    const books = await fetchJson('/api/books');
    if (!books || books.length === 0) {
      list.innerHTML = '<div>(nessun libro)</div>';
      populateBookSelects([]);
      return;
    }
    list.innerHTML = books.map(b => `
      <div class="card-item">
        <div class="card-title">${escapeHtml(b.title)}</div>
        <div class="card-meta">${escapeHtml(b.author || '')} ${b.publicationYear? '· ' + b.publicationYear : ''}</div>
        <div class="card-actions">
          <span class="badge ${b.available? 'badge-success':'badge-warning'}">${b.available? 'Disponibile':'Prestato'}</span>
          <button class="btn btn-ghost" onclick="editBook('${b.id}')">Modifica</button>
          <button class="btn btn-danger" onclick="deleteBook('${b.id}')">Elimina</button>
        </div>
      </div>
    `).join('');
    populateBookSelects(books);
  } catch (e) { list.innerHTML = 'Error'; }
}

async function loadUsers() {
  const el = document.getElementById('users'); el.innerHTML = 'Loading...';
  try {
    const users = await fetchJson('/api/users');
    if (!users || users.length === 0) { el.innerHTML = '<div>(nessun utente)</div>'; populateUserSelect([]); return; }
    el.innerHTML = users.map(u => `
      <div class="card-item">
        <div class="card-title">${escapeHtml(u.name)}</div>
        <div class="card-meta">${escapeHtml(u.email||'')}</div>
      </div>
    `).join('');
    populateUserSelect(users);
  } catch (e) { el.innerHTML = 'Error'; }
}

async function loadLoans() {
  const el = document.getElementById('loans'); el.innerHTML = 'Loading...';
  try {
    const loans = await fetchJson('/api/loans');
    if (!loans || loans.length === 0) { el.innerHTML = '<div>(nessun prestito)</div>'; return; }
    el.innerHTML = loans.map(l => `
      <div class="card-item">
        <div class="card-title">${escapeHtml(l.bookTitle || l.bookId)}</div>
        <div class="card-meta">${escapeHtml(l.userName || l.userId)} · ${formatDate(l.loanedAt)} ${l.returnedAt? '· Restituito: ' + formatDate(l.returnedAt) : ''}</div>
        <div class="card-actions">${!l.returnedAt? `<button class="btn btn-primary" onclick="returnLoan('${l.id}')">Segna restituito</button>` : `<span class="badge">Restituito</span>`}</div>
      </div>
    `).join('');
  } catch (e) { el.innerHTML = 'Error'; }
}

function populateBookSelects(books) {
  const sel = document.getElementById('nl_book');
  if (!sel) return;
  if (!books || books.length === 0) { sel.innerHTML = '<option value="">-- nessun libro --</option>'; return; }
  sel.innerHTML = books.map(b => `<option value="${b.id}">${escapeHtml(b.title)}${b.available? '': ' (Non disponibile)'}</option>`).join('');
}

function populateUserSelect(users) {
  const sel = document.getElementById('nl_user');
  if (!sel) return;
  if (!users || users.length === 0) { sel.innerHTML = '<option value="">-- nessun utente --</option>'; return; }
  sel.innerHTML = users.map(u => `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.email||'')})</option>`).join('');
}

async function createBook() {
  const title = document.getElementById('nb_title').value;
  const author = document.getElementById('nb_author').value;
  const genre = document.getElementById('nb_genre').value;
  const year = parseInt(document.getElementById('nb_year').value || '0');
  const isbn = document.getElementById('nb_isbn').value;
  const msg = document.getElementById('nb_msg');
  msg.textContent = '';
  if (!title || title.trim().length === 0) { alert('Titolo richiesto'); return; }
  try {
    await fetchJson('/api/books', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title, author, genre, publicationYear: year, isbn }) });
    msg.textContent = 'Creato';
    setTimeout(()=> msg.textContent = '', 3000);
    loadBooks();
  } catch (e) { alert('Error creating book'); }
}

async function createUser() {
  const name = document.getElementById('nu_name').value;
  const email = document.getElementById('nu_email').value;
  const msg = document.getElementById('nu_msg'); msg.textContent = '';
  if (!name || name.trim().length === 0) { alert('Nome richiesto'); return; }
  try {
    await fetchJson('/api/users', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email }) });
    msg.textContent = 'Registrato'; setTimeout(()=> msg.textContent = '', 3000);
    loadUsers();
  } catch (e) { alert('Error creating user'); }
}

async function createLoan() {
  const bookId = document.getElementById('nl_book').value;
  const userId = document.getElementById('nl_user').value;
  const days = parseInt(document.getElementById('nl_days').value || '14');
  const msg = document.getElementById('nl_msg'); msg.textContent = '';
  if (!bookId) { alert('Seleziona un libro'); return; }
  if (!userId) { alert('Seleziona un utente'); return; }
  try {
    await fetchJson('/api/loans', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ bookId, userId, days }) });
    msg.textContent = 'Prestito creato'; setTimeout(()=> msg.textContent = '', 3000);
    loadLoans(); loadBooks();
  } catch (e) { alert('Error creating loan'); }
}

async function returnLoan(id) {
  try {
    await fetchJson('/api/loans/' + id + '/return', { method: 'POST' });
    loadLoans(); loadBooks();
  } catch (e) { alert('Error returning loan'); }
}

window.onload = async () => {
  try {
    await loadBooks();
    await loadUsers();
    await loadLoans();
  } catch (e) {
    console.error('Initialization error', e);
  }
};

function formatDate(s) {
  try {
    const d = new Date(s);
    return d.toLocaleString();
  } catch (e) { return s; }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setLoadingButton(id, loading) {
  try {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (loading) { btn.dataset._old = btn.innerHTML; btn.innerHTML = '...'; btn.disabled = true; }
    else { if (btn.dataset._old) btn.innerHTML = btn.dataset._old; btn.disabled = false; }
  } catch (e) { /* ignore */ }
}

function showGlobalMessage(msg) {
  const g = document.getElementById('global_msg');
  if (!g) return; g.textContent = msg; g.classList.add('show'); setTimeout(()=> g.classList.remove('show'), 4000);
}
