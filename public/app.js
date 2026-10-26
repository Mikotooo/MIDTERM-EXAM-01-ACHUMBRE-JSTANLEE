const API = '/api/activities';

const tbody = document.getElementById('tbody');
const addForm = document.getElementById('addForm');
const searchForm = document.getElementById('searchForm');
const addMsg = document.getElementById('addMsg');
const listMsg = document.getElementById('listMsg');
const searchResult = document.getElementById('searchResult');

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}

// RETRIEVE all
async function loadActivities() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No activities yet.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map((a) => `
      <tr>
        <td>${a.id}</td>
        <td>${escapeHtml(a.date)}</td>
        <td>${escapeHtml(a.start_time)}</td>
        <td>${escapeHtml(a.activity)}</td>
        <td>${escapeHtml(a.location)}</td>
        <td>${escapeHtml(a.category)}</td>
        <td><button data-id="${a.id}">Delete</button></td>
      </tr>`).join('');
  } catch (err) {
    listMsg.textContent = 'Error: ' + err.message;
  }
}

// INSERT
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(addForm));
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    addMsg.textContent = `Added "${data.activity}" (ID ${data.id}).`;
    addForm.reset();
    loadActivities();
  } catch (err) {
    addMsg.textContent = 'Error: ' + err.message;
  }
});

// RETRIEVE one by ID
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = searchForm.id.value;
  try {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`);
    const a = await res.json();
    if (!res.ok) throw new Error(a.error);
    searchResult.innerHTML = `
      <p>
        ID: ${a.id}<br />
        Activity: ${escapeHtml(a.activity)}<br />
        Location: ${escapeHtml(a.location)}<br />
        Date: ${escapeHtml(a.date)}<br />
        Start time: ${escapeHtml(a.start_time)}<br />
        Category: ${escapeHtml(a.category)}
      </p>`;
  } catch (err) {
    searchResult.textContent = 'Error: ' + err.message;
  }
});

// DELETE
tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!confirm(`Delete activity #${id}?`)) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    listMsg.textContent = data.message;
    loadActivities();
  } catch (err) {
    listMsg.textContent = 'Error: ' + err.message;
  }
});

document.getElementById('refreshBtn').addEventListener('click', loadActivities);

loadActivities();
