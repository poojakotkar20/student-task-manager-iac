/**
 * Local Development & Testing Server
 * Simulates Cloudflare Worker + Workers KV REST API locally without requiring credentials.
 * Zero npm dependencies (Uses standard Node.js http, fs, and path modules).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const APP_DIR = path.join(__dirname, 'application');

// In-Memory Simulated Workers KV Store
const kvStore = new Map();

// Seed initial student tasks for demo/testing
const seedTasks = [
  {
    id: `task_${Date.now() - 100000}_seed1`,
    title: 'Initialize Terraform Cloudflare Provider Configuration',
    priority: 'High',
    status: 'Completed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: `task_${Date.now() - 50000}_seed2`,
    title: 'Verify Worker to Workers KV Namespace Binding',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: `task_${Date.now()}_seed3`,
    title: 'Prepare College Mini-Project Viva Presentation & Report',
    priority: 'High',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

seedTasks.forEach(task => kvStore.set(`task:${task.id}`, task));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      if (!body) return resolve({});
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

  // CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  // Static Frontend Routes
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

  // REST API: /api/tasks
  if (pathname === '/api/tasks' || pathname.startsWith('/api/tasks/')) {
    const parts = pathname.split('/').filter(Boolean);
    const taskId = parts.length >= 3 ? decodeURIComponent(parts[2]) : null;

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
      try {
        const body = await parseJsonBody(req);
        if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
          return sendJson(res, 400, { success: false, error: 'Task title is required.' });
        }

        const cleanId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();
        const newTask = {
          id: cleanId,
          title: body.title.trim(),
          priority: ['Low', 'Medium', 'High'].includes(body.priority) ? body.priority : 'Medium',
          status: ['Pending', 'In Progress', 'Completed'].includes(body.status) ? body.status : 'Pending',
          createdAt: now,
          updatedAt: now,
        };

        kvStore.set(`task:${cleanId}`, newTask);
        return sendJson(res, 201, {
          success: true,
          message: 'Task created successfully in mock KV',
          data: newTask,
        });
      } catch {
        return sendJson(res, 400, { success: false, error: 'Invalid JSON body.' });
      }
    }

    // GET /api/tasks/{id} — Retrieve one task
    if (method === 'GET' && taskId) {
      const task = kvStore.get(`task:${taskId}`);
      if (!task) {
        return sendJson(res, 404, { success: false, error: `Task "${taskId}" not found.` });
      }
      return sendJson(res, 200, { success: true, data: task });
    }

    // PUT /api/tasks/{id} — Update a task
    if (method === 'PUT' && taskId) {
      const existing = kvStore.get(`task:${taskId}`);
      if (!existing) {
        return sendJson(res, 404, { success: false, error: `Task "${taskId}" not found.` });
      }

      try {
        const body = await parseJsonBody(req);
        const updated = {
          ...existing,
          title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : existing.title,
          priority: ['Low', 'Medium', 'High'].includes(body.priority) ? body.priority : existing.priority,
          status: ['Pending', 'In Progress', 'Completed'].includes(body.status) ? body.status : existing.status,
          updatedAt: new Date().toISOString(),
        };

        kvStore.set(`task:${taskId}`, updated);
        return sendJson(res, 200, {
          success: true,
          message: 'Task updated successfully',
          data: updated,
        });
      } catch {
        return sendJson(res, 400, { success: false, error: 'Invalid JSON body.' });
      }
    }

    // DELETE /api/tasks/{id} — Delete a task
    if (method === 'DELETE' && taskId) {
      const existing = kvStore.get(`task:${taskId}`);
      if (!existing) {
        return sendJson(res, 404, { success: false, error: `Task "${taskId}" not found.` });
      }

      kvStore.delete(`task:${taskId}`);
      return sendJson(res, 200, {
        success: true,
        message: `Task "${taskId}" deleted successfully.`,
      });
    }

    return sendJson(res, 405, { success: false, error: `Method ${method} not allowed.` });
  }

  // 404 Fallback
  sendJson(res, 404, { success: false, error: `Route not found: ${pathname}` });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Student Task Manager Local Dev Server Running!`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Simulated KV Store: ${kvStore.size} sample tasks seeded`);
  console.log(`REST API Base: http://localhost:${PORT}/api/tasks`);
  console.log(`=======================================================`);
});
