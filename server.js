const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeData(activities) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(activities, null, 2));
}

function sortActivities(activities) {
  return [...activities].sort(
    (a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;


app.get('/api/activities', (req, res) => {
  res.status(200).json(sortActivities(readData()));
});

app.get('/api/activities/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'ID must be an integer.' });
  }
  const activity = readData().find((a) => a.id === id);
  if (!activity) {
    return res.status(404).json({ error: `Activity with ID ${id} not found.` });
  }
  res.status(200).json(activity);
});

app.post('/api/activities', (req, res) => {
  const body = req.body || {};
  const fields = ['activity', 'location', 'date', 'start_time', 'category'];
  const missing = fields.filter((f) => typeof body[f] !== 'string' || !body[f].trim());
  if (missing.length) {
    return res.status(400).json({ error: `Missing or empty field(s): ${missing.join(', ')}` });
  }

  const date = body.date.trim();
  const start_time = body.start_time.trim();
  if (!DATE_RE.test(date) || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format.' });
  }
  if (!TIME_RE.test(start_time)) {
    return res.status(400).json({ error: 'start_time must be in HH:MM (24-hour) format.' });
  }

  const activities = readData();

  const conflict = activities.find((a) => a.date === date && a.start_time === start_time);
  if (conflict) {
    return res.status(409).json({
      error: `Another activity ("${conflict.activity}", ID ${conflict.id}) is already scheduled on ${date} at ${start_time}.`,
    });
  }

  const nextId = activities.reduce((max, a) => Math.max(max, a.id), 0) + 1;
  const newActivity = {
    id: nextId,
    activity: body.activity.trim(),
    location: body.location.trim(),
    date,
    start_time,
    category: body.category.trim(),
  };

  activities.push(newActivity);
  writeData(activities);
  res.status(201).json(newActivity);
});



app.delete('/api/activities/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'ID must be an integer.' });
  }
  const activities = readData();
  const index = activities.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Activity with ID ${id} not found.` });
  }
  const [deleted] = activities.splice(index, 1);
  writeData(activities);
  res.status(200).json({ message: `Activity ${id} deleted.`, activity: deleted });
});


app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});


app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

app.listen(PORT, () => {
  console.log(`Travel Itinerary API running at http://localhost:${PORT}`);
});
