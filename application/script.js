/**
 * Student Task Manager Client Logic
 * Interacts with Cloudflare Worker REST API + Workers KV
 */

// Application State
const state = {
  tasks: [],
  activeFilter: 'all', // 'all' | 'Pending' | 'In Progress' | 'Completed'
  priorityFilter: 'all', // 'all' | 'High' | 'Medium' | 'Low'
  searchQuery: '',
  sortBy: 'newest', // 'newest' | 'oldest' | 'priority' | 'title'
  apiEndpoint: localStorage.getItem('task_manager_api_base') || '',
  selectedTaskForDelete: null,
  selectedTaskForEdit: null,
};

// DOM Elements
const DOM = {
  // Counts
  totalCount: document.getElementById('totalTasksCount'),
  pendingCount: document.getElementById('pendingTasksCount'),
  progressCount: document.getElementById('progressTasksCount'),
  completedCount: document.getElementById('completedTasksCount'),

  // Filters & Search
  statFilterAll: document.getElementById('statFilterAll'),
  statFilterPending: document.getElementById('statFilterPending'),
  statFilterProgress: document.getElementById('statFilterProgress'),
  statFilterCompleted: document.getElementById('statFilterCompleted'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  priorityFilter: document.getElementById('priorityFilter'),
  statusFilter: document.getElementById('statusFilter'),
  sortFilter: document.getElementById('sortFilter'),

  // Task Grid & Container
  tasksContainer: document.getElementById('tasksContainer'),
  tasksGrid: document.getElementById('tasksGrid'),
  loadingState: document.getElementById('loadingState'),
  emptyState: document.getElementById('emptyState'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateMessage: document.getElementById('emptyStateMessage'),

  // Forms
  createTaskForm: document.getElementById('createTaskForm'),
  taskTitleInput: document.getElementById('taskTitleInput'),
  taskPriorityInput: document.getElementById('taskPriorityInput'),
  taskStatusInput: document.getElementById('taskStatusInput'),
  submitCreateTaskBtn: document.getElementById('submitCreateTaskBtn'),

  // Refresh & Status
  refreshTasksBtn: document.getElementById('refreshTasksBtn'),
  apiStatusIndicator: document.getElementById('apiStatusIndicator'),
  apiStatusText: document.getElementById('apiStatusText'),

  // Modals
  viewTaskModal: document.getElementById('viewTaskModal'),
  viewModalBody: document.getElementById('viewModalBody'),
  closeViewModalBtn: document.getElementById('closeViewModalBtn'),
  viewModalCloseAction: document.getElementById('viewModalCloseAction'),
  viewModalEditAction: document.getElementById('viewModalEditAction'),

  editTaskModal: document.getElementById('editTaskModal'),
  editTaskForm: document.getElementById('editTaskForm'),
  editTaskId: document.getElementById('editTaskId'),
  editTaskTitle: document.getElementById('editTaskTitle'),
  editTaskPriority: document.getElementById('editTaskPriority'),
  editTaskStatus: document.getElementById('editTaskStatus'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  closeEditModalBtn: document.getElementById('closeEditModalBtn'),

  deleteConfirmModal: document.getElementById('deleteConfirmModal'),
  deleteTaskTitlePreview: document.getElementById('deleteTaskTitlePreview'),
  closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

  apiSettingsModal: document.getElementById('apiSettingsModal'),
  apiSettingsBtn: document.getElementById('apiSettingsBtn'),
  closeApiModalBtn: document.getElementById('closeApiModalBtn'),
  customApiEndpointInput: document.getElementById('customApiEndpointInput'),
  resetApiSettingsBtn: document.getElementById('resetApiSettingsBtn'),
  saveApiSettingsBtn: document.getElementById('saveApiSettingsBtn'),

  toastContainer: document.getElementById('toastContainer'),
};

/**
 * Returns the effective API base URL.
 * If running on Cloudflare Workers, relative root "" works automatically.
 */
function getApiUrl(path) {
  const base = state.apiEndpoint.trim().replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * REST API Client Helpers
 */
const API = {
  // GET /api/tasks
  async fetchAllTasks() {
    setLoading(true);
    updateApiStatus('connecting', 'Fetching Tasks...');
    try {
      const response = await fetch(getApiUrl('/api/tasks'), {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      state.tasks = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
      updateApiStatus('online', 'Live Serverless API');
      renderDashboard();
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      updateApiStatus('offline', 'API Connection Error');
      showToast(`Failed to load tasks: ${err.message}`, 'error');
      renderDashboard();
    } finally {
      setLoading(false);
    }
  },

  // GET /api/tasks/{id}
  async fetchTaskById(id) {
    try {
      const response = await fetch(getApiUrl(`/api/tasks/${encodeURIComponent(id)}`), {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Task not found (${response.status})`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (err) {
      console.error(`Error fetching task ${id}:`, err);
      showToast(`Could not load task details: ${err.message}`, 'error');
      return null;
    }
  },

  // POST /api/tasks
  async createTask(payload) {
    try {
      const response = await fetch(getApiUrl('/api/tasks'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      showToast('Task added successfully!', 'success');
      await API.fetchAllTasks();
      return result.data;
    } catch (err) {
      console.error('Error creating task:', err);
      showToast(`Create failed: ${err.message}`, 'error');
      throw err;
    }
  },

  // PUT /api/tasks/{id}
  async updateTask(id, updates) {
    try {
      const response = await fetch(getApiUrl(`/api/tasks/${encodeURIComponent(id)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      showToast('Task updated successfully!', 'success');
      await API.fetchAllTasks();
      return result.data;
    } catch (err) {
      console.error('Error updating task:', err);
      showToast(`Update failed: ${err.message}`, 'error');
      throw err;
    }
  },

  // DELETE /api/tasks/{id}
  async deleteTask(id) {
    try {
      const response = await fetch(getApiUrl(`/api/tasks/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      showToast('Task deleted from Workers KV', 'info');
      await API.fetchAllTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast(`Delete failed: ${err.message}`, 'error');
      throw err;
    }
  },
};

/**
 * UI State Helpers
 */
function setLoading(isLoading) {
  if (isLoading) {
    DOM.loadingState.classList.remove('hidden');
    DOM.tasksGrid.classList.add('hidden');
    DOM.emptyState.classList.add('hidden');
  } else {
    DOM.loadingState.classList.add('hidden');
    DOM.tasksGrid.classList.remove('hidden');
  }
}

function updateApiStatus(status, text) {
  const dot = DOM.apiStatusIndicator.querySelector('.status-dot');
  dot.className = `status-dot ${status}`;
  DOM.apiStatusText.textContent = text;
}

/**
 * Filter, Sort, and Render Tasks
 */
function renderDashboard() {
  updateMetrics();

  // Filter tasks
  let filtered = [...state.tasks];

  // Status Filter
  if (state.activeFilter !== 'all') {
    filtered = filtered.filter(t => t.status === state.activeFilter);
  }

  // Priority Filter
  if (state.priorityFilter !== 'all') {
    filtered = filtered.filter(t => t.priority === state.priorityFilter);
  }

  // Search Query
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q))
    );
  }

  // Sort
  filtered.sort((a, b) => {
    if (state.sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (state.sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (state.sortBy === 'priority') {
      const pMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    } else if (state.sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return 0;
  });

  // Render Grid
  DOM.tasksGrid.innerHTML = '';

  if (filtered.length === 0) {
    DOM.emptyState.classList.remove('hidden');
    if (state.searchQuery || state.activeFilter !== 'all' || state.priorityFilter !== 'all') {
      DOM.emptyStateTitle.textContent = 'No matching tasks';
      DOM.emptyStateMessage.textContent = 'Try adjusting your search query or filters to view other tasks.';
    } else {
      DOM.emptyStateTitle.textContent = 'No tasks found';
      DOM.emptyStateMessage.textContent = 'You have not added any tasks yet. Create one using the form on the left!';
    }
  } else {
    DOM.emptyState.classList.add('hidden');
    filtered.forEach(task => {
      const card = createTaskCardElement(task);
      DOM.tasksGrid.appendChild(card);
    });
  }
}

/**
 * Metrics Counter Update
 */
function updateMetrics() {
  const total = state.tasks.length;
  const pending = state.tasks.filter(t => t.status === 'Pending').length;
  const progress = state.tasks.filter(t => t.status === 'In Progress').length;
  const completed = state.tasks.filter(t => t.status === 'Completed').length;

  DOM.totalCount.textContent = total;
  DOM.pendingCount.textContent = pending;
  DOM.progressCount.textContent = progress;
  DOM.completedCount.textContent = completed;
}

/**
 * Generates DOM Element for a Single Task Card
 */
function createTaskCardElement(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.setAttribute('data-id', task.id);

  const priorityClass = `priority-${(task.priority || 'medium').toLowerCase()}`;
  const statusClass = getStatusClass(task.status);
  const formattedDate = formatCardDate(task.createdAt);

  card.innerHTML = `
    <div class="task-card-header">
      <span class="task-id-badge" title="Click to copy full Task ID" data-copy="${escapeHtml(task.id)}">
        <strong>ID:</strong> ${escapeHtml(task.id)}
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </span>
      <span class="task-priority-badge ${priorityClass}">
        <span class="badge-dot"></span>
        ${escapeHtml(task.priority || 'Medium')}
      </span>
    </div>

    <h3 class="task-title">${escapeHtml(task.title || 'Untitled Task')}</h3>

    <div class="task-card-meta">
      <div class="task-status-control">
        <span class="meta-label">Status:</span>
        <select class="task-status-select ${statusClass}" data-action="change-status" title="Change task status">
          <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>
      </div>
      <div class="task-date-info">
        <span class="meta-label">Created:</span>
        <span class="task-date" title="${formatFullDate(task.createdAt)}">${formattedDate}</span>
      </div>
    </div>

    <div class="task-card-actions">
      <button class="btn btn-secondary btn-sm" data-action="view-details" title="View full task details">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <span>Details</span>
      </button>
      <button class="btn btn-secondary btn-sm" data-action="edit-task" title="Edit title or priority">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span>Edit</span>
      </button>
      <button class="btn btn-danger btn-sm" data-action="delete-task" title="Delete Task from KV">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Delete</span>
      </button>
    </div>
  `;

  // Attach card event listeners
  const copyBtn = card.querySelector('[data-copy]');
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    copyToClipboard(task.id, 'Task ID copied to clipboard!');
  });

  const statusSelect = card.querySelector('[data-action="change-status"]');
  statusSelect.addEventListener('change', async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      await API.updateTask(task.id, { status: newStatus });
    } catch {
      statusSelect.value = task.status; // Revert on error
    }
  });

  const viewDetailsBtn = card.querySelector('[data-action="view-details"]');
  viewDetailsBtn.addEventListener('click', () => openViewModal(task.id));

  const editTaskBtn = card.querySelector('[data-action="edit-task"]');
  editTaskBtn.addEventListener('click', () => openEditModal(task));

  const deleteTaskBtn = card.querySelector('[data-action="delete-task"]');
  deleteTaskBtn.addEventListener('click', () => openDeleteConfirmModal(task));

  return card;
}

/**
 * Status cycle rotation
 */
function getNextStatus(current) {
  if (current === 'Pending') return 'In Progress';
  if (current === 'In Progress') return 'Completed';
  return 'Pending';
}

function getStatusClass(status) {
  if (status === 'Pending') return 'status-pending';
  if (status === 'In Progress') return 'status-progress';
  if (status === 'Completed') return 'status-completed';
  return 'status-pending';
}

/**
 * Modals Management
 */
async function openViewModal(taskId) {
  DOM.viewModalBody.innerHTML = '<div class="spinner"></div>';
  DOM.viewTaskModal.classList.remove('hidden');

  const task = await API.fetchTaskById(taskId);
  if (!task) {
    DOM.viewTaskModal.classList.add('hidden');
    return;
  }

  state.selectedTaskForEdit = task;

  DOM.viewModalBody.innerHTML = `
    <div class="detail-item">
      <span class="detail-item-label">Task ID</span>
      <div class="detail-item-value code-box">
        <span>${escapeHtml(task.id)}</span>
        <button class="btn btn-ghost btn-sm" id="modalCopyIdBtn" title="Copy ID">Copy</button>
      </div>
    </div>

    <div class="detail-item">
      <span class="detail-item-label">Title</span>
      <div class="detail-item-value" style="font-weight: 600; font-size: 1.1rem;">
        ${escapeHtml(task.title)}
      </div>
    </div>

    <div class="form-row">
      <div class="detail-item">
        <span class="detail-item-label">Priority</span>
        <div class="detail-item-value">
          <span class="task-priority-badge priority-${(task.priority || 'medium').toLowerCase()}">
            <span class="badge-dot"></span> ${escapeHtml(task.priority || 'Medium')}
          </span>
        </div>
      </div>

      <div class="detail-item">
        <span class="detail-item-label">Current Status</span>
        <div class="detail-item-value">
          <span class="task-status-btn ${getStatusClass(task.status)}">
            ${escapeHtml(task.status || 'Pending')}
          </span>
        </div>
      </div>
    </div>

    <div class="form-row">
      <div class="detail-item">
        <span class="detail-item-label">Created Date</span>
        <div class="detail-item-value" style="font-size: 0.85rem; color: var(--text-secondary);">
          ${formatFullDate(task.createdAt)}
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-item-label">Last Modified</span>
        <div class="detail-item-value" style="font-size: 0.85rem; color: var(--text-secondary);">
          ${formatFullDate(task.updatedAt || task.createdAt)}
        </div>
      </div>
    </div>

    <div class="detail-item">
      <span class="detail-item-label">KV JSON Document</span>
      <pre class="raw-json-inspector">${escapeHtml(JSON.stringify(task, null, 2))}</pre>
    </div>
  `;

  document.getElementById('modalCopyIdBtn')?.addEventListener('click', () => {
    copyToClipboard(task.id, 'Task ID copied!');
  });
}

function openEditModal(task) {
  state.selectedTaskForEdit = task;
  DOM.editTaskId.value = task.id;
  DOM.editTaskTitle.value = task.title || '';
  DOM.editTaskPriority.value = task.priority || 'Medium';
  DOM.editTaskStatus.value = task.status || 'Pending';

  DOM.editTaskModal.classList.remove('hidden');
}

function openDeleteConfirmModal(task) {
  state.selectedTaskForDelete = task;
  DOM.deleteTaskTitlePreview.textContent = `"${task.title || 'Untitled'}" (ID: ${task.id})`;
  DOM.deleteConfirmModal.classList.remove('hidden');
}

function closeAllModals() {
  DOM.viewTaskModal.classList.add('hidden');
  DOM.editTaskModal.classList.add('hidden');
  DOM.deleteConfirmModal.classList.add('hidden');
  DOM.apiSettingsModal.classList.add('hidden');
}

/**
 * Toast Notifications
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

/**
 * Utility Functions
 */
function copyToClipboard(text, successMsg) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(successMsg, 'info');
  }).catch(() => {
    showToast('Failed to copy text', 'error');
  });
}

function formatCardDate(isoString) {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Invalid date';
  }
}

function formatFullDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Event Listeners Initialization
 */
function initializeEventListeners() {
  // Create Task Form Submit
  DOM.createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = DOM.taskTitleInput.value.trim();
    if (!title) return;

    const payload = {
      title,
      priority: DOM.taskPriorityInput.value,
      status: DOM.taskStatusInput.value,
    };

    DOM.submitCreateTaskBtn.disabled = true;
    try {
      await API.createTask(payload);
      DOM.taskTitleInput.value = '';
    } catch {
      // Toast handled by API helper
    } finally {
      DOM.submitCreateTaskBtn.disabled = false;
    }
  });

  // Edit Task Form Submit
  DOM.editTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = DOM.editTaskId.value;
    const updates = {
      title: DOM.editTaskTitle.value.trim(),
      priority: DOM.editTaskPriority.value,
      status: DOM.editTaskStatus.value,
    };

    if (!updates.title) return;

    try {
      await API.updateTask(id, updates);
      closeAllModals();
    } catch {
      // Toast handled in helper
    }
  });

  // Confirm Delete Button
  DOM.confirmDeleteBtn.addEventListener('click', async () => {
    if (!state.selectedTaskForDelete) return;
    DOM.confirmDeleteBtn.disabled = true;
    try {
      await API.deleteTask(state.selectedTaskForDelete.id);
      closeAllModals();
    } finally {
      DOM.confirmDeleteBtn.disabled = false;
      state.selectedTaskForDelete = null;
    }
  });

  // Metric Filter Clicks
  [
    { el: DOM.statFilterAll, filter: 'all' },
    { el: DOM.statFilterPending, filter: 'Pending' },
    { el: DOM.statFilterProgress, filter: 'In Progress' },
    { el: DOM.statFilterCompleted, filter: 'Completed' },
  ].forEach(({ el, filter }) => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      state.activeFilter = filter;
      DOM.statusFilter.value = filter;
      renderDashboard();
    });
  });

  // Dropdown Filters
  DOM.statusFilter.addEventListener('change', (e) => {
    state.activeFilter = e.target.value;
    document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('active'));
    if (e.target.value === 'all') DOM.statFilterAll.classList.add('active');
    else if (e.target.value === 'Pending') DOM.statFilterPending.classList.add('active');
    else if (e.target.value === 'In Progress') DOM.statFilterProgress.classList.add('active');
    else if (e.target.value === 'Completed') DOM.statFilterCompleted.classList.add('active');
    renderDashboard();
  });

  DOM.priorityFilter.addEventListener('change', (e) => {
    state.priorityFilter = e.target.value;
    renderDashboard();
  });

  DOM.sortFilter.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderDashboard();
  });

  // Search Input
  DOM.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    DOM.clearSearchBtn.classList.toggle('hidden', !state.searchQuery);
    renderDashboard();
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    state.searchQuery = '';
    DOM.clearSearchBtn.classList.add('hidden');
    renderDashboard();
  });

  // Refresh Button
  DOM.refreshTasksBtn.addEventListener('click', () => {
    API.fetchAllTasks();
  });

  // Modal Close Handlers
  [
    DOM.closeViewModalBtn, DOM.viewModalCloseAction,
    DOM.cancelEditBtn, DOM.closeEditModalBtn,
    DOM.cancelDeleteBtn, DOM.closeDeleteModalBtn,
    DOM.closeApiModalBtn,
  ].forEach(btn => btn?.addEventListener('click', closeAllModals));

  // Edit from View Modal
  DOM.viewModalEditAction.addEventListener('click', () => {
    if (state.selectedTaskForEdit) {
      const task = state.selectedTaskForEdit;
      closeAllModals();
      openEditModal(task);
    }
  });

  // Close modals on overlay backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModals();
    });
  });

  // API Settings Modal Handlers
  DOM.apiSettingsBtn.addEventListener('click', () => {
    DOM.customApiEndpointInput.value = state.apiEndpoint;
    DOM.apiSettingsModal.classList.remove('hidden');
  });

  DOM.saveApiSettingsBtn.addEventListener('click', () => {
    const val = DOM.customApiEndpointInput.value.trim();
    state.apiEndpoint = val;
    if (val) {
      localStorage.setItem('task_manager_api_base', val);
      showToast('Custom API URL saved', 'info');
    } else {
      localStorage.removeItem('task_manager_api_base');
      showToast('Reset to default Worker origin', 'info');
    }
    closeAllModals();
    API.fetchAllTasks();
  });

  DOM.resetApiSettingsBtn.addEventListener('click', () => {
    DOM.customApiEndpointInput.value = '';
    state.apiEndpoint = '';
    localStorage.removeItem('task_manager_api_base');
    showToast('Reset to default Worker origin', 'info');
    closeAllModals();
    API.fetchAllTasks();
  });

  // Keyboard Shortcuts (Esc to close modal)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  API.fetchAllTasks();
});
