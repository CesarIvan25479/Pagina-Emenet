import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'conocimiento-users.json');

// Middlewares
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Ensure data dir and file
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}
ensureDataFile();

function readData() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error reading data:', e);
    return [];
  }
}

function writeData(arr) {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing data:', e);
    return false;
  }
}

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Get all knowledge
app.get('/conocimiento', (_req, res) => {
  const data = readData();
  res.json({ data });
});

// Add or upsert an item
app.post('/conocimiento', (req, res) => {
  const { pregunta, respuesta, timestamp, fuente, sessionId } = req.body || {};
  if (!pregunta || !respuesta) {
    return res.status(400).json({ error: 'pregunta y respuesta son requeridos' });
  }
  const now = Date.now();
  const item = {
    pregunta: String(pregunta).trim(),
    respuesta: String(respuesta).trim(),
    timestamp: typeof timestamp === 'number' ? timestamp : now,
    fuente: fuente === 'gemini' || fuente === 'manual' ? fuente : 'manual',
    sessionId: sessionId ? String(sessionId) : undefined,
  };

  const normalizar = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const key = normalizar(item.pregunta);

  const data = readData();
  const idx = data.findIndex((d) => normalizar(d.pregunta) === key);
  if (idx >= 0) {
    // keep most recent
    data[idx] = data[idx].timestamp >= item.timestamp ? data[idx] : item;
  } else {
    data.push(item);
  }

  if (!writeData(data)) {
    return res.status(500).json({ error: 'No se pudo guardar el conocimiento' });
  }
  res.json({ ok: true, item });
});

app.listen(PORT, () => {
  console.log(`Servidor de conocimiento escuchando en http://localhost:${PORT}`);
});
