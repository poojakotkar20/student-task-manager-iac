/**
 * Local Development & Testing Server
 * Simulates Cloudflare Worker + Workers KV REST API locally without requiring Cloudflare credentials.
 * Zero npm dependencies (Uses standard Node.js http, fs, and path modules).
 * 
 * Persists data to a local simulated KV JSON file (local-kv-store.json).
 * Starts with an empty store (no fake tasks).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const APP_DIR = path.join(__dirname, 'application');
const KV_FILE = path.join(__dirname, 'local-kv-store.json');

// Helper to load simulated KV store from disk
function loadKV() {
  if (!fs.existsSync(KV_FILE)) {
    return new Map();
  }
  try {
    const raw = fs.readFileSync(KV_FILE, 'utf8');
    const data = JSON.parse(raw);
    const map = new Map();
    if (Array.isArray(data)) {
      data.forEach(task => map.set(`task:${task.id}`, task));
    }
    return map;
  } catch (err) {
    console.error('Error reading local-kv-store.json:', err);
    return new Map();
  }
}

// Helper to persist simulated KV store to disk
function saveKV(map) {
  try {
    const tasks = Array.from(map.values());
    fs.writeFileSync(KV_FILE, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local-kv-store.json:', err);
  }
}

// Initialize store (empty by default if file doesn't exist)
const kvStore = loadKV();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(data, null, 2));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve(null);
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method.toUpperCase();

  // 1. CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  // 2. Static Frontend Routes (Identical to worker.js behavior)
  if (pathname === '/' || pathname === '/index.html') {
    const file = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8');
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(file);
  }

  if (pathname === '/style.css') {
    const file = fs.readFileSync(path.join(APP_DIR, 'style.css'), 'utf8');
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'text/css; charset=utf-8' });
    return res.end(file);
  }

  if (pathname === '/script.js') {
    const file = fs.readFileSync(path.join(APP_DIR, 'script.js'), 'utf8');
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/javascript; charset=utf-8' });
    return res.end(file);
  }

  // Favicon handler
  if (pathname === '/favicon.ico') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  // 3. REST API Routes: /api/tasks
  if (pathname === '/api/tasks' || pathname.startsWith('/api/tasks/')) {
    const parts = pathname.split('/').filter(Boolean);

    // Reject invalid deep sub-paths (e.g., /api/tasks/id/extra)
    if (parts.length > 3) {
      return sendJson(res, 404, { success: false, error: `Invalid API route: ${pathname}` });
    }

    const taskId = parts.length === 3 ? decodeURIComponent(parts[2]) : null;

    // GET /api/tasks — Retrieve all tasks
    if (method === 'GET' && !taskId) {
      const tasks = Array.from(kvStore.values());
      tasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return sendJson(res, 200, {
        success: true,
        count: tasks.length,
        data: tasks,
      });
    }

    // POST /api/tasks — Create a task
    if (method === 'POST' && !taskId) {
      let body;
      try {
        body = await parseJsonBody(req);
      } catch {
        return sendJson(res, 400, { success: false, error: 'Invalid or malformed JSON request payload.' });
      }

      if (!body || typeof body !== 'object') {
        return sendJson(res, 400, { success: false, error: 'Request body must be a JSON object.' });
      }

      if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
        return sendJson(res, 400, { success: false, error: 'Task title is required and cannot be empty.' });
      }

      if (body.priority !== undefined && !['Low', 'Medium', 'High'].includes(body.priority)) {
        return sendJson(res, 400, { success: false, error: 'Invalid priority. Must be one of: Low, Medium, High.' });
      }

      if (body.status !== undefined && !['Pending', 'In Progress', 'Completed'].includes(body.status)) {
        return sendJson(res, 400, { success: false, error: 'Invalid status. Must be one of: Pending, In Progress, Completed.' });
      }

      const cleanId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const newTask = {
        id: cleanId,
        title: body.title.trim(),
        priority: body.priority || 'Medium',
        status: body.status || 'Pending',
        createdAt: now,
        updatedAt: now,
      };

      kvStore.set(`task:${cleanId}`, newTask);
      saveKV(kvStore);

      return sendJson(res, 201, {
        success: true,
        message: 'Task created successfully',
        data: newTask,
      });
    }

    // GET /api/tasks/{id} — Retrieve one task
    if (method === 'GET' && taskId) {
      const task = kvStore.get(`task:${taskId}`);
      if (!task) {
        return sendJson(res, 404, { success: false, error: `Task with ID "${taskId}" not found.` });
      }
      return sendJson(res, 200, { success: true, data: task });
    }

    // PUT /api/tasks/{id} — Update a task
    if (method === 'PUT' && taskId) {
      const existing = kvStore.get(`task:${taskId}`);
      if (!existing) {
        return sendJson(res, 404, { success: false, error: `Task with ID "${taskId}" not found.` });
      }

      let body;
      try {
        body = await parseJsonBody(req);
      } catch {
        return sendJson(res, 400, { success: false, error: 'Invalid or malformed JSON request payload.' });
      }

      if (!body || typeof body !== 'object') {
        return sendJson(res, 400, { success: false, error: 'Request body must be a JSON object.' });
      }

      // Strict field validation
      if (body.title !== undefined) {
        if (typeof body.title !== 'string' || !body.title.trim()) {
          return sendJson(res, 400, { success: false, error: 'Task title cannot be empty.' });
        }
      }

      if (body.priority !== undefined && !['Low', 'Medium', 'High'].includes(body.priority)) {
        return sendJson(res, 400, { success: false, error: 'Invalid priority. Must be one of: Low, Medium, High.' });
      }

      if (body.status !== undefined && !['Pending', 'In Progress', 'Completed'].includes(body.status)) {
        return sendJson(res, 400, { success: false, error: 'Invalid status. Must be one of: Pending, In Progress, Completed.' });
      }

      const updated = {
        ...existing,
        title: body.title !== undefined ? body.title.trim() : existing.title,
        priority: body.priority !== undefined ? body.priority : existing.priority,
        status: body.status !== undefined ? body.status : existing.status,
        updatedAt: new Date().toISOString(),
      };

      kvStore.set(`task:${taskId}`, updated);
      saveKV(kvStore);

      return sendJson(res, 200, {
        success: true,
        message: 'Task updated successfully',
        data: updated,
      });
    }

    // DELETE /api/tasks/{id} — Delete a task
    if (method === 'DELETE' && taskId) {
      const existing = kvStore.get(`task:${taskId}`);
      if (!existing) {
        return sendJson(res, 404, { success: false, error: `Task with ID "${taskId}" not found.` });
      }

      kvStore.delete(`task:${taskId}`);
      saveKV(kvStore);

      return sendJson(res, 200, {
        success: true,
        message: `Task with ID "${taskId}" was deleted successfully.`,
      });
    }

    return sendJson(res, 405, { success: false, error: `Method ${method} is not supported for ${pathname}.` });
  }

  // 4. 404 Fallback
  sendJson(res, 404, { success: false, error: `Route not found: ${pathname}` });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Student Task Manager Local Dev Server Running!`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Persisted Tasks in Store: ${kvStore.size}`);
  console.log(`REST API: http://localhost:${PORT}/api/tasks`);
  console.log(`=======================================================`);
});
