/**
 * Cloudflare Worker: Serverless Student Task Management Application
 * Manages REST API endpoints and persists student tasks to Cloudflare Workers KV.
 * 
 * Bound KV Namespace: env.TASKS_KV
 */

// Frontend assets injected at deploy time via Terraform template substitution
const EMBEDDED_HTML = "__EMBEDDED_HTML__";
const EMBEDDED_CSS = "__EMBEDDED_CSS__";
const EMBEDDED_JS = "__EMBEDDED_JS__";

// Standard CORS Headers for API communication
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

/**
 * Creates standardized JSON HTTP responses
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

/**
 * Verifies that the Workers KV binding is properly configured
 */
function verifyKVBinding(env) {
  if (!env || !env.TASKS_KV) {
    throw new Error(
      "Cloudflare Workers KV binding 'TASKS_KV' is not configured. Please ensure Terraform has created and bound the KV namespace."
    );
  }
}

/**
 * Main Worker Fetch Event Handler (ES Modules format)
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // 1. Handle CORS Pre-flight Options Requests
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // 2. Serve Static Frontend Assets
      if (pathname === '/' || pathname === '/index.html') {
        return new Response(EMBEDDED_HTML, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        });
      }

      if (pathname === '/style.css') {
        return new Response(EMBEDDED_CSS, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/css; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        });
      }

      if (pathname === '/script.js') {
        return new Response(EMBEDDED_JS, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        });
      }

      // Favicon handler
      if (pathname === '/favicon.ico') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // 3. REST API Routes (/api/tasks)
      if (pathname === '/api/tasks' || pathname.startsWith('/api/tasks/')) {
        verifyKVBinding(env);

        const pathParts = pathname.split('/').filter(Boolean); // ['api', 'tasks'] or ['api', 'tasks', '{id}']
        
        // Reject invalid deep sub-paths (e.g., /api/tasks/id/extra)
        if (pathParts.length > 3) {
          return jsonResponse({ success: false, error: `Invalid API route: ${pathname}` }, 404);
        }

        const taskId = pathParts.length === 3 ? decodeURIComponent(pathParts[2]) : null;

        // Route: GET /api/tasks — Retrieve all tasks
        if (method === 'GET' && !taskId) {
          const list = await env.TASKS_KV.list({ prefix: 'task:' });
          const keys = list.keys || [];

          // Parallel fetch all tasks from KV
          const taskPromises = keys.map(async (key) => {
            try {
              return await env.TASKS_KV.get(key.name, { type: 'json' });
            } catch (err) {
              console.error(`Failed to read key ${key.name}:`, err);
              return null;
            }
          });

          const rawTasks = await Promise.all(taskPromises);
          const validTasks = rawTasks.filter((t) => t && typeof t === 'object' && t.id);

          // Sort tasks by created date descending
          validTasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

          return jsonResponse({
            success: true,
            count: validTasks.length,
            data: validTasks,
          });
        }

        // Route: POST /api/tasks — Create a task
        if (method === 'POST' && !taskId) {
          let body;
          try {
            body = await request.json();
          } catch {
            return jsonResponse({ success: false, error: 'Invalid or malformed JSON request payload.' }, 400);
          }

          if (!body || typeof body !== 'object') {
            return jsonResponse({ success: false, error: 'Request body must be a JSON object.' }, 400);
          }

          if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
            return jsonResponse({ success: false, error: 'Task title is required and cannot be empty.' }, 400);
          }

          if (body.priority !== undefined && !['Low', 'Medium', 'High'].includes(body.priority)) {
            return jsonResponse({ success: false, error: 'Invalid priority. Must be one of: Low, Medium, High.' }, 400);
          }

          if (body.status !== undefined && !['Pending', 'In Progress', 'Completed'].includes(body.status)) {
            return jsonResponse({ success: false, error: 'Invalid status. Must be one of: Pending, In Progress, Completed.' }, 400);
          }

          const now = new Date().toISOString();
          const cleanId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          const newTask = {
            id: cleanId,
            title: body.title.trim(),
            priority: body.priority || 'Medium',
            status: body.status || 'Pending',
            createdAt: now,
            updatedAt: now,
          };

          // Save to Cloudflare Workers KV
          await env.TASKS_KV.put(`task:${cleanId}`, JSON.stringify(newTask));

          return jsonResponse(
            {
              success: true,
              message: 'Task created successfully',
              data: newTask,
            },
            201
          );
        }

        // Route: GET /api/tasks/{id} — Retrieve one task
        if (method === 'GET' && taskId) {
          const task = await env.TASKS_KV.get(`task:${taskId}`, { type: 'json' });

          if (!task) {
            return jsonResponse(
              {
                success: false,
                error: `Task with ID "${taskId}" not found.`,
              },
              404
            );
          }

          return jsonResponse({
            success: true,
            data: task,
          });
        }

        // Route: PUT /api/tasks/{id} — Update a task
        if (method === 'PUT' && taskId) {
          const existing = await env.TASKS_KV.get(`task:${taskId}`, { type: 'json' });

          if (!existing) {
            return jsonResponse(
              {
                success: false,
                error: `Task with ID "${taskId}" not found.`,
              },
              404
            );
          }

          let body;
          try {
            body = await request.json();
          } catch {
            return jsonResponse({ success: false, error: 'Invalid or malformed JSON request payload.' }, 400);
          }

          if (!body || typeof body !== 'object') {
            return jsonResponse({ success: false, error: 'Request body must be a JSON object.' }, 400);
          }

          // Strict field validation
          if (body.title !== undefined) {
            if (typeof body.title !== 'string' || !body.title.trim()) {
              return jsonResponse({ success: false, error: 'Task title cannot be empty.' }, 400);
            }
          }

          if (body.priority !== undefined && !['Low', 'Medium', 'High'].includes(body.priority)) {
            return jsonResponse({ success: false, error: 'Invalid priority. Must be one of: Low, Medium, High.' }, 400);
          }

          if (body.status !== undefined && !['Pending', 'In Progress', 'Completed'].includes(body.status)) {
            return jsonResponse({ success: false, error: 'Invalid status. Must be one of: Pending, In Progress, Completed.' }, 400);
          }

          const updatedTask = {
            ...existing,
            title: body.title !== undefined ? body.title.trim() : existing.title,
            priority: body.priority !== undefined ? body.priority : existing.priority,
            status: body.status !== undefined ? body.status : existing.status,
            updatedAt: new Date().toISOString(),
          };

          await env.TASKS_KV.put(`task:${taskId}`, JSON.stringify(updatedTask));

          return jsonResponse({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask,
          });
        }

        // Route: DELETE /api/tasks/{id} — Delete a task
        if (method === 'DELETE' && taskId) {
          const existing = await env.TASKS_KV.get(`task:${taskId}`, { type: 'json' });

          if (!existing) {
            return jsonResponse(
              {
                success: false,
                error: `Task with ID "${taskId}" not found.`,
              },
              404
            );
          }

          await env.TASKS_KV.delete(`task:${taskId}`);

          return jsonResponse({
            success: true,
            message: `Task with ID "${taskId}" was deleted successfully.`,
          });
        }

        // Method not allowed on /api/tasks
        return jsonResponse(
          {
            success: false,
            error: `Method ${method} is not supported for ${pathname}.`,
          },
          405
        );
      }

      // 4. Default 404 handler for unknown routes
      return jsonResponse(
        {
          success: false,
          error: `Route not found: ${pathname}`,
        },
        404
      );
    } catch (err) {
      console.error('Unhandled Worker error:', err);
      return jsonResponse(
        {
          success: false,
          error: err.message || 'Internal Server Error',
        },
        500
      );
    }
  },
};
