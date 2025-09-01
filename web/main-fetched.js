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
  list.innerHTML = books.map(b => `<div><strong>${b.title}</strong><div>${b.author}</div><div>ISBN: ${b.isbn}</div><div>Disponibile: ${b.available}</div><div>ID: ${b.id}</div></div><hr/>`).join('');
  } catch (e) { list.innerHTML = 'Error'; }
}

async function loadUsers() {
  const el = document.getElementById('users'); el.innerHTML = 'Loading...';
  try {
    const users = await fetchJson('/api/users');
  el.innerHTML = users.map(u => `<div>${u.name} &lt;${u.email}&gt; [${u.id}]</div>`).join('');
  } catch (e) { el.innerHTML = 'Error'; }
}

async function loadLoans() {
  const el = document.getElementById('loans'); el.innerHTML = 'Loading...';
  try {
    const loans = await fetchJson('/api/loans');
    // resolve book titles and user names by fetching lists (simple approach)
    const books = await fetchJson('/api/books');
    const users = await fetchJson('/api/users');
    const bookMap = {};
    books.forEach(b => bookMap[b.id] = b.title);
    const userMap = {};
    users.forEach(u => userMap[u.id] = u.name);
    el.innerHTML = loans.map(l => {
      const title = bookMap[l.bookId] || l.bookId;
      const uname = userMap[l.userId] || l.userId;
      return `<div>${l.id} - Libro: ${title} - Utente: ${uname} - Restituito: ${l.returnedAt || 'NO' } <button onclick="returnLoan('${l.id}')">Restituisci</button></div>`;
    }).join('');
  } catch (e) { el.innerHTML = 'Error'; }
}

async function createBook() {
  const title = document.getElementById('nb_title').value;
  const author = document.getElementById('nb_author').value;
  const genre = document.getElementById('nb_genre').value;
  const year = parseInt(document.getElementById('nb_year').value || '0');
  const isbn = document.getElementById('nb_isbn').value;
  try {
    await fetchJson('/api/books', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title, author, genre, publicationYear: year, isbn }) });
    loadBooks();
  } catch (e) { alert('Error creating book'); }
}

async function createUser() {
  const name = document.getElementById('nu_name').value;
  const email = document.getElementById('nu_email').value;
  try {
    await fetchJson('/api/users', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email }) });
    loadUsers();
  } catch (e) { alert('Error creating user'); }
}

async function createLoan() {
  const bookId = document.getElementById('nl_book').value;
  const userId = document.getElementById('nl_user').value;
  const days = parseInt(document.getElementById('nl_days').value || '14');
  try {
    await fetchJson('/api/loans', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ bookId, userId, days }) });
    loadLoans(); loadBooks();
  } catch (e) { alert('Error creating loan'); }
}

async function returnLoan(id) {
  try {
    await fetchJson('/api/loans/' + id + '/return', { method: 'POST' });
    loadLoans(); loadBooks();
  } catch (e) { alert('Error returning loan'); }
}

window.onload = () => { loadBooks(); loadUsers(); loadLoans(); };
