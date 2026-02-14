let gameState = {
    level: 1,
    totalXP: 0,
    currentXP: 0,
    xpForNextLevel: 100,
    questsCompleted: 0,
    tasks: {
        todo: [],
        progress: [],
        completed: []
    }
};

const XP_VALUES = {
    low: 10,
    medium: 25,
    high: 50
};

function loadGameState() {
    const saved = localStorage.getItem('questBoardState');
    if (saved) {
        gameState = JSON.parse(saved);
        updateUI();
        renderAllTasks();
    }
}

function saveGameState() {
    localStorage.setItem('questBoardState', JSON.stringify(gameState));
}

function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;

    if (!title) {
        alert('Please enter a quest name!');
        return;
    }

    const task = {
        id: Date.now(),
        title,
        description,
        priority,
        xp: XP_VALUES[priority],
        createdAt: new Date().toISOString()
    };

    gameState.tasks.todo.push(task);
    
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    
    saveGameState();
    renderAllTasks();
}

function deleteTask(taskId, column) {
    gameState.tasks[column] = gameState.tasks[column].filter(task => task.id !== taskId);
    saveGameState();
    renderAllTasks();
}

function renderAllTasks() {
    renderColumn('todo');
    renderColumn('progress');
    renderColumn('completed');
    updateTaskCounts();
}

function renderColumn(column) {
    const list = document.getElementById(column + 'List');
    const tasks = gameState.tasks[column];

    if (tasks.length === 0) {
        const emptyMessages = {
            todo: { icon: '🎯', text: 'No quests yet. Start your adventure!' },
            progress: { icon: '🔥', text: 'Drag quests here when you start them' },
            completed: { icon: '🏆', text: 'Complete quests to earn XP!' }
        };
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${emptyMessages[column].icon}</div>
                <p>${emptyMessages[column].text}</p>
            </div>
        `;
        return;
    }

    list.innerHTML = tasks.map(task => `
        <div class="task-card" draggable="true" ondragstart="drag(event)" data-task-id="${task.id}" data-column="${column}">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-priority priority-${task.priority}">${task.priority}</div>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-footer">
                <div class="task-xp">⭐ ${task.xp} XP</div>
                <div class="task-actions">
                    <button onclick="deleteTask(${task.id}, '${column}')" class="delete-btn">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateTaskCounts() {
    document.getElementById('todoCount').textContent = gameState.tasks.todo.length;
    document.getElementById('progressCount').textContent = gameState.tasks.progress.length;
    document.getElementById('completedCount').textContent = gameState.tasks.completed.length;
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData('taskId', ev.target.dataset.taskId);
    ev.dataTransfer.setData('fromColumn', ev.target.dataset.column);
    ev.target.classList.add('dragging');
}

function drop(ev, toColumn) {
    ev.preventDefault();
    const taskId = parseInt(ev.dataTransfer.getData('taskId'));
    const fromColumn = ev.dataTransfer.getData('fromColumn');

    document.querySelector('.dragging')?.classList.remove('dragging');

    if (fromColumn === toColumn) return;

    const taskIndex = gameState.tasks[fromColumn].findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = gameState.tasks[fromColumn][taskIndex];
    gameState.tasks[fromColumn].splice(taskIndex, 1);
    gameState.tasks[toColumn].push(task);

    if (toColumn === 'completed' && fromColumn !== 'completed') {
        awardXP(task.xp);
        gameState.questsCompleted++;
    }

    saveGameState();
    renderAllTasks();
    updateUI();
}

function awardXP(xp) {
    gameState.totalXP += xp;
    gameState.currentXP += xp;

    while (gameState.currentXP >= gameState.xpForNextLevel) {
        gameState.currentXP -= gameState.xpForNextLevel;
        gameState.level++;
        gameState.xpForNextLevel = Math.floor(gameState.xpForNextLevel * 1.5);
        showLevelUpPopup();
    }

    updateUI();
    saveGameState();
}


function updateUI() {
    document.getElementById('playerLevel').textContent = gameState.level;
    document.getElementById('totalXP').textContent = gameState.totalXP;
    document.getElementById('questsCompleted').textContent = gameState.questsCompleted;

    const xpPercent = (gameState.currentXP / gameState.xpForNextLevel) * 100;
    document.getElementById('xpBar').style.width = xpPercent + '%';
    document.getElementById('xpText').textContent = `${gameState.currentXP} / ${gameState.xpForNextLevel}`;
}


function showLevelUpPopup() {
    const overlay = document.getElementById('overlay');
    overlay.classList.add('active');

    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
        <h2>🎉 Level Up!</h2>
        <div class="achievement-icon">⬆️</div>
        <p style="font-size: 1.2em; margin: 10px 0;">You've reached <strong>Level ${gameState.level}</strong>!</p>
        <p style="color: #666;">Keep completing quests to grow stronger!</p>
        <button onclick="closePopup()" style="margin-top: 20px;">Continue Adventure</button>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.style.animation = 'none';
    }, 500);
}


function closePopup() {
    document.getElementById('overlay').classList.remove('active');
    const popup = document.querySelector('.achievement-popup');
    if (popup) {
        popup.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('taskTitle').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    document.getElementById('taskDescription').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

   
    loadGameState();
});
