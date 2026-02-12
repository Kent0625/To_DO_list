// --- CONFIGURATION ---
const COLUMNS = [
    { id: 'todo', title: 'To Do' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'testing', title: 'Testing' },
    { id: 'feedback', title: 'Feedback' },
    { id: 'done', title: 'Done' }
];

// --- STATE ---
let tasks = [
    { id: 1, columnId: 'done', title: 'front end', hasImage: false },
    { id: 2, columnId: 'done', title: 'Setup database', hasImage: false },
    { id: 3, columnId: 'done', title: 'backend', hasImage: false },
    { id: 4, columnId: 'done', title: 'Connect frontend to backend', hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80' },
    { id: 5, columnId: 'feedback', title: 'Randomly generated number for auth', hasImage: false },
    { id: 6, columnId: 'todo', title: 'Design System', hasImage: false }
];

let currentColumnToAdd = null;
let draggedCardId = null;

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
        board.appendChild(columnEl);
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

    let html = '';
    if (task.hasImage) {
        html += `<img src="${task.imageUrl}" class="card-image" alt="attachment">`;
    }
    if (task.columnId === 'done') {
            html += `<div class="card-tags"><div class="tag"></div></div>`;
    }
    html += `<span class="card-title">${task.title}</span>`;
    
    el.innerHTML = html;
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

// Initialize Board
renderBoard();