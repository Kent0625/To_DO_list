// --- CONFIGURATION ---
const API_URL = 'http://localhost:8000/tasks/';

const COLUMNS = [
    { id: 'todo', title: 'To Do' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'testing', title: 'Testing' },
    { id: 'feedback', title: 'Feedback' },
    { id: 'done', title: 'Done' }
];

// --- STATE ---
// Default data if nothing is saved
const DEFAULT_TASKS = [
    { id: 1, columnId: 'done', title: 'front end', hasImage: false },
    { id: 2, columnId: 'done', title: 'Setup database', hasImage: false },
    { id: 3, columnId: 'done', title: 'backend', hasImage: false },
    { id: 4, columnId: 'done', title: 'Connect frontend to backend', hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80' },
    { id: 5, columnId: 'feedback', title: 'Randomly generated number for auth', hasImage: false },
    { id: 6, columnId: 'todo', title: 'Design System', hasImage: false }
];

let tasks = []; // Will be loaded from localStorage or set to DEFAULT_TASKS

let currentColumnToAdd = null;
let draggedCardId = null;

// --- PERSISTENCE ---
async function loadBoard() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        // Convert backend format to frontend format
        tasks = data.map(task => ({
            id: task.id,
            columnId: task.status,   // status = column
            title: task.title,
            hasImage: false
        }));

        renderBoard();
    } catch (err) {
        console.error("Failed to load tasks", err);
    }
}


// --- RENDERING ---
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    COLUMNS.forEach(col => {
        const columnEl = document.createElement('div');
        columnEl.className = 'column';
        columnEl.setAttribute('data-id', col.id);
        
        columnEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            columnEl.classList.add('drag-over');
        });
        columnEl.addEventListener('dragleave', () => columnEl.classList.remove('drag-over'));
        columnEl.addEventListener('drop', handleDrop);

        const header = document.createElement('div');
        header.className = 'column-header';
        header.innerHTML = `<h2>${col.title}</h2><span>...</span>`;

        const cardList = document.createElement('div');
        cardList.className = 'card-list';
        
        const columnTasks = tasks.filter(t => t.columnId === col.id);
        
        columnTasks.forEach(task => {
            const card = createCardElement(task);
            cardList.appendChild(card);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'add-card-btn';
        addBtn.innerText = 'Add a card';
        addBtn.onclick = () => openModal(col.id);

        columnEl.appendChild(header);
        columnEl.appendChild(cardList);
        columnEl.appendChild(addBtn);

        // wrap column so we can position gutter actions outside the column
        const wrap = document.createElement('div');
        wrap.className = 'column-wrap';
        wrap.appendChild(columnEl);
        board.appendChild(wrap);
    });
    // create gutter actions after DOM nodes exist
    setTimeout(createGutterActions, 0);
}

// Create gutter actions for each card in a column wrap (called after renderBoard)
function createGutterActions() {
    // remove any existing gutter actions
    document.querySelectorAll('.column-gutter').forEach(n => n.remove());

    document.querySelectorAll('.column-wrap').forEach(wrap => {
        const columnEl = wrap.querySelector('.column');
        const cardList = wrap.querySelector('.card-list');
        if (!columnEl || !cardList) return;

        const tasksInColumn = tasks.filter(t => t.columnId === columnEl.getAttribute('data-id'));

        tasksInColumn.forEach(task => {
            const cardEl = columnEl.querySelector(`.card[data-id="${task.id}"]`);
            if (!cardEl) return;

            const gutter = document.createElement('div');
            gutter.className = 'column-gutter';
            gutter.setAttribute('data-id', task.id);

            const btn = document.createElement('button');
            btn.className = 'gutter-btn';
            btn.type = 'button';
            btn.innerText = '⋯';
            gutter.appendChild(btn);

            const menu = document.createElement('div');
            menu.className = 'gutter-menu';

            const editBtn = document.createElement('button'); editBtn.type = 'button'; editBtn.innerText = 'Edit'; menu.appendChild(editBtn);
            const saveBtn = document.createElement('button'); saveBtn.type = 'button'; saveBtn.innerText = 'Save'; menu.appendChild(saveBtn);
            const deleteBtn = document.createElement('button'); deleteBtn.type = 'button'; deleteBtn.innerText = 'Delete'; menu.appendChild(deleteBtn);

            gutter.appendChild(menu);
            wrap.appendChild(gutter);

            // position gutter aligned to card
            const top = cardEl.offsetTop;
            gutter.style.top = top + 'px';

            // toggle
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                document.querySelectorAll('.gutter-menu.open').forEach(m => m.classList.remove('open'));
                menu.classList.toggle('open');
            });

            editBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                task.editing = true; renderBoard(); setTimeout(createGutterActions, 0);
            });

            saveBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const card = columnEl.querySelector(`.card[data-id="${task.id}"]`);
                if (card) {
                    const input = card.querySelector('.card-edit-input');
                    if (input) {
                        const newVal = input.value.trim();
                        if (newVal) task.title = newVal;
                        task.editing = false; renderBoard(); setTimeout(createGutterActions, 0); return;
                    }
                }
                const newTitle = prompt('Edit task title:', task.title);
                if (newTitle) { task.title = newTitle; task.editing = false; renderBoard(); setTimeout(createGutterActions, 0); }
            });

            deleteBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                tasks = tasks.filter(t => t.id !== task.id);
                renderBoard(); setTimeout(createGutterActions, 0);
            });
        });
    });
}

function createCardElement(task) {
    const el = document.createElement('div');
    el.className = `card ${task.hasImage ? 'has-image' : ''}`;
    el.draggable = true;
    el.setAttribute('data-id', task.id);

    el.addEventListener('dragstart', (e) => {
        draggedCardId = task.id;
        el.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    
    el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        draggedCardId = null;
        document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
    });

    // Image (optional)
    if (task.hasImage) {
        const img = document.createElement('img');
        img.src = task.imageUrl;
        img.className = 'card-image';
        img.alt = 'attachment';
        el.appendChild(img);
    }

    // Tags for done column
    if (task.columnId === 'done') {
        const tags = document.createElement('div');
        tags.className = 'card-tags';
        const tag = document.createElement('div');
        tag.className = 'tag';
        tags.appendChild(tag);
        el.appendChild(tags);
    }

    // Title container (will hold span or input while editing)
    const titleContainer = document.createElement('div');
    titleContainer.className = 'card-title-container';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'card-title';
    titleSpan.innerText = task.title;
    titleContainer.appendChild(titleSpan);
    el.appendChild(titleContainer);

    // Actions (three dots + menu)
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'card-menu-btn';
    menuBtn.type = 'button';
    menuBtn.innerText = '⋯';
    actions.appendChild(menuBtn);

    const menu = document.createElement('div');
    menu.className = 'card-menu';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.innerText = 'Edit';
    menu.appendChild(editBtn);

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.innerText = 'Save';
    menu.appendChild(saveBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.innerText = 'Delete';
    menu.appendChild(deleteBtn);

    actions.appendChild(menu);
    el.appendChild(actions);

    // If task is in editing state, show input instead of span
    if (task.editing) {
        const input = document.createElement('input');
        input.className = 'card-edit-input';
        input.type = 'text';
        input.value = task.title;
        titleContainer.replaceChild(input, titleSpan);
        // Focus at end
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }, 0);
    }

    // Menu toggle
    menuBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        // close other menus
        document.querySelectorAll('.card-menu.open').forEach(m => m.classList.remove('open'));
        menu.classList.toggle('open');
    });

    // Edit handler: toggle edit mode on task and re-render
    editBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        task.editing = true;
        renderBoard();
    });

    // Save handler: if input exists, save new title
    saveBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const input = el.querySelector('.card-edit-input');
        if (input) {
            const newVal = input.value.trim();
            if (newVal) task.title = newVal;
            task.editing = false;
            renderBoard();
        } else {
            // nothing to save, just close menu
            menu.classList.remove('open');
        }
    });

    // Delete handler
    deleteBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        tasks = tasks.filter(t => t.id !== task.id);
        renderBoard();
    });

    return el;
}

// --- DRAG AND DROP LOGIC ---
function handleDrop(e) {
    e.preventDefault();
    const columnEl = e.target.closest('.column');
    if (!columnEl || !draggedCardId) return;

    const newColumnId = columnEl.getAttribute('data-id');

    tasks = tasks.map(t => {
        if (t.id === draggedCardId) {
            return { ...t, columnId: newColumnId };
        }
        return t;
    });

    renderBoard();
}

// --- ADD CARD MODAL LOGIC ---
function openModal(columnId) {
    currentColumnToAdd = columnId;
    document.getElementById('addModal').style.display = 'flex';
    document.getElementById('newCardText').focus();
}

function closeModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('newCardText').value = '';
    currentColumnToAdd = null;
}

function confirmAddCard() {
    const text = document.getElementById('newCardText').value;
    if (!text.trim()) return;

    const newTask = {
        id: Date.now(),
        columnId: currentColumnToAdd,
        title: text,
        hasImage: false
    };

    tasks.push(newTask);
    closeModal();
    renderBoard();
}

// --- BACKEND SYNC FUNCTIONS ---
async function saveAllToBackend() {
    try {
        // Get all tasks from backend
        const res = await fetch(API_URL);
        const backendTasks = await res.json();
        
        // Delete all existing tasks
        for (const task of backendTasks) {
            await fetch(`${API_URL}${task.id}`, { method: 'DELETE' });
        }
        
        // Create all current tasks
        for (const task of tasks) {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: task.title,
                    description: '',
                    status: task.columnId
                })
            });
        }
        
        alert('All tasks saved to database!');
        await loadBoard(); // Reload to get updated IDs from backend
    } catch (err) {
        console.error('Failed to save tasks:', err);
        alert('Failed to save tasks. Make sure the backend is running.');
    }
}

// Add event listener for Save All button
document.getElementById('saveAllBtn').addEventListener('click', saveAllToBackend);

// Initialize Board
loadBoard();
renderBoard();

// After initial render, create gutter actions
createGutterActions();

// Close any open card menus when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.card-menu.open').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.gutter-menu.open').forEach(m => m.classList.remove('open'));
});