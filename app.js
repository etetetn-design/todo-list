/* ========================================
   ✨ Pink Bubble To-Do List - App Logic
   ======================================== */

(function () {
  'use strict';

  // --- DOM Elements ---
  const todoInput = document.getElementById('todo-input');
  const addBtn = document.getElementById('add-btn');
  const todoList = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');
  const footerActions = document.getElementById('footer-actions');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const statTotal = document.getElementById('stat-total');
  const statActive = document.getElementById('stat-active');
  const statCompleted = document.getElementById('stat-completed');

  // --- State ---
  let todos = JSON.parse(localStorage.getItem('bubble-todos')) || [];
  let currentFilter = 'all';

  // --- Initialize ---
  function init() {
    createBubbleCanvas();
    renderTodos();
    updateStats();
    bindEvents();
    startBubbleGenerator();
  }

  // =====================
  // 🫧 Bubble Background
  // =====================
  function createBubbleCanvas() {
    const canvas = document.createElement('div');
    canvas.className = 'bubble-canvas';
    canvas.id = 'bubble-canvas';
    document.body.prepend(canvas);
  }

  function createBubble() {
    const canvas = document.getElementById('bubble-canvas');
    if (!canvas) return;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const size = Math.random() * 60 + 20; // 20-80px
    const left = Math.random() * 100;
    const duration = Math.random() * 8 + 8; // 8-16s
    const drift = (Math.random() - 0.5) * 120; // -60 to 60px horizontal drift
    const delay = Math.random() * 2;

    // Randomize pink hues
    const hue = 330 + Math.random() * 30; // 330-360 (pink range)
    const saturation = 60 + Math.random() * 30;
    const lightness = 75 + Math.random() * 15;

    bubble.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      bottom: -${size}px;
      --drift: ${drift}px;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      background: radial-gradient(circle at 30% 30%,
        rgba(255, 255, 255, 0.8),
        hsla(${hue}, ${saturation}%, ${lightness}%, 0.35) 40%,
        hsla(${hue}, ${saturation}%, ${lightness - 15}%, 0.15) 70%,
        transparent 100%);
    `;

    canvas.appendChild(bubble);

    // Remove bubble after animation
    setTimeout(() => {
      bubble.remove();
    }, (duration + delay) * 1000);
  }

  function startBubbleGenerator() {
    // Create initial batch
    for (let i = 0; i < 8; i++) {
      setTimeout(() => createBubble(), i * 400);
    }
    // Continuously generate
    setInterval(createBubble, 1800);
  }

  // =====================
  // 📋 Todo CRUD
  // =====================
  function addTodo(text) {
    if (!text.trim()) return;

    const todo = {
      id: Date.now() + Math.random(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    todos.unshift(todo);
    saveTodos();
    renderTodos();
    updateStats();
    todoInput.value = '';
    todoInput.focus();

    // Burst effect
    spawnConfetti(addBtn);
    showToast('✨ 新增成功！');
  }

  function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      saveTodos();
      renderTodos();
      updateStats();

      if (todo.completed) {
        showToast('🎉 任務完成！太棒了！');
      }
    }
  }

  function deleteTodo(id) {
    const item = todoList.querySelector(`[data-id="${id}"]`);
    if (item) {
      item.classList.add('removing');
      setTimeout(() => {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
        updateStats();
      }, 400);
    }
  }

  function clearCompleted() {
    const completedItems = todoList.querySelectorAll('.todo-item.completed');
    completedItems.forEach((item, i) => {
      setTimeout(() => item.classList.add('removing'), i * 80);
    });

    setTimeout(() => {
      todos = todos.filter(t => !t.completed);
      saveTodos();
      renderTodos();
      updateStats();
      showToast('🗑️ 已清除完成項目');
    }, completedItems.length * 80 + 400);
  }

  // =====================
  // 🎨 Rendering
  // =====================
  function renderTodos() {
    const filtered = getFilteredTodos();

    todoList.innerHTML = '';

    if (todos.length === 0) {
      emptyState.classList.remove('hidden');
      emptyState.style.display = '';
      footerActions.style.display = 'none';
      return;
    }

    emptyState.classList.add('hidden');
    emptyState.style.display = 'none';

    if (filtered.length === 0) {
      const noItems = document.createElement('div');
      noItems.className = 'empty-state';
      noItems.innerHTML = `
        <div class="empty-icon">🔍</div>
        <p class="empty-text">這個分類沒有項目</p>
        <p class="empty-subtext">試試切換其他篩選條件</p>
      `;
      todoList.appendChild(noItems);
    }

    filtered.forEach((todo, index) => {
      const li = createTodoElement(todo, index);
      todoList.appendChild(li);
    });

    // Show/hide footer
    const hasCompleted = todos.some(t => t.completed);
    footerActions.style.display = hasCompleted ? '' : 'none';
  }

  function createTodoElement(todo, index) {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;
    li.dataset.id = todo.id;
    li.style.animationDelay = `${index * 0.05}s`;

    li.innerHTML = `
      <label class="todo-checkbox">
        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="checkmark"></span>
      </label>
      <span class="todo-text">${escapeHTML(todo.text)}</span>
      <button class="delete-btn" title="刪除" aria-label="刪除">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    // Checkbox
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      toggleTodo(todo.id);
      if (checkbox.checked) {
        spawnConfetti(li.querySelector('.checkmark'));
      }
    });

    // Delete
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTodo(todo.id);
    });

    return li;
  }

  function getFilteredTodos() {
    switch (currentFilter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return [...todos];
    }
  }

  // =====================
  // 📊 Stats
  // =====================
  function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;

    animateNumber(statTotal, total);
    animateNumber(statActive, active);
    animateNumber(statCompleted, completed);
  }

  function animateNumber(el, newValue) {
    const oldValue = parseInt(el.textContent);
    if (oldValue !== newValue) {
      el.textContent = newValue;
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 400);
    }
  }

  // =====================
  // 🎉 Effects
  // =====================
  function spawnConfetti(anchor) {
    const rect = anchor.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const colors = ['#f49ac2', '#e84393', '#d63384', '#c084fc', '#fda4af', '#f9c8e0', '#ff6b9d'];

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = (Math.PI * 2 * i) / 12;
      const velocity = 30 + Math.random() * 40;
      const x = cx + Math.cos(angle) * velocity;
      const y = cy + Math.sin(angle) * velocity;
      const size = 4 + Math.random() * 6;

      particle.style.cssText = `
        left: ${cx}px;
        top: ${cy}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        animation-duration: ${0.6 + Math.random() * 0.5}s;
        transform: translate(${x - cx}px, ${y - cy}px);
      `;

      // Animate with JS for radial burst
      document.body.appendChild(particle);

      const startTime = performance.now();
      const duration = 600 + Math.random() * 400;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity - 20;

      function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        particle.style.left = `${cx + dx * ease}px`;
        particle.style.top = `${cy + dy * ease + progress * progress * 60}px`;
        particle.style.opacity = 1 - progress;
        particle.style.transform = `scale(${1 - progress * 0.5}) rotate(${progress * 360}deg)`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      }

      requestAnimationFrame(animate);
    }
  }

  function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 2200);
  }

  // =====================
  // 🔧 Utilities
  // =====================
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function saveTodos() {
    localStorage.setItem('bubble-todos', JSON.stringify(todos));
  }

  // =====================
  // 🎯 Event Bindings
  // =====================
  function bindEvents() {
    // Add todo
    addBtn.addEventListener('click', () => addTodo(todoInput.value));

    todoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addTodo(todoInput.value);
      }
    });

    // Input animation
    todoInput.addEventListener('input', () => {
      if (todoInput.value.length > 0) {
        addBtn.style.background = 'linear-gradient(135deg, #e84393, #d63384)';
      } else {
        addBtn.style.background = '';
      }
    });

    // Filters
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
      });
    });

    // Clear completed
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Keyboard shortcut hint
    todoInput.addEventListener('focus', () => {
      todoInput.setAttribute('placeholder', '輸入待辦事項，按 Enter 新增 ✨');
    });

    todoInput.addEventListener('blur', () => {
      todoInput.setAttribute('placeholder', '新增待辦事項...');
    });
  }

  // --- Start ---
  document.addEventListener('DOMContentLoaded', init);
})();
