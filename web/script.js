// 主题切换功能
const themeToggle = document.getElementById('themeToggle');
let isDarkMode = true;

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        isDarkMode = false;
        themeToggle.textContent = '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '🌞';
    }
}

// 切换主题
function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.textContent = '🌞';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        themeToggle.textContent = '🌙';
    }
}

// 初始化
initTheme();
themeToggle.addEventListener('click', toggleTheme);

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// 初始化渲染（新增此行）
renderTasks();
// 添加任务（保持原逻辑）
function addTask() {
  const taskName = document.getElementById('taskName').value;
  const taskTime = document.getElementById('taskTime').value;
  const taskLeader = document.getElementById('taskLeader').value;
  const taskProgress = document.getElementById('taskProgress').value;

  if (!taskName || !taskTime || !taskLeader) {
    alert('请填写所有字段！');
    return;
  }

  tasks.push({
    id: Date.now(),
    name: taskName,
    time: taskTime,
    leader: taskLeader,
    progress: taskProgress,
    isEditing: false // 新增编辑状态
  });

  saveTasks();
  renderTasks();
  clearForm();
}

// 渲染任务列表（修改后）
function renderTasks() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = tasks.map(task => `
    <div class="task-item ${task.isEditing ? 'editing' : ''}" id="task-${task.id}">
      <div class="task-info">
        ${task.isEditing ? `
          <!-- 编辑模式 -->
          <div class="edit-form">
            <input type="text" value="${task.name}" class="edit-field" id="edit-name-${task.id}">
            <input type="date" value="${task.time}" class="edit-field" id="edit-time-${task.id}">
            <input type="text" value="${task.leader}" class="edit-field" id="edit-leader-${task.id}">
            <select class="edit-field" id="edit-progress-${task.id}">
              <option value="未开始" ${task.progress === '未开始' ? 'selected' : ''}>未开始</option>
              <option value="进行中" ${task.progress === '进行中' ? 'selected' : ''}>进行中</option>
              <option value="已完成" ${task.progress === '已完成' ? 'selected' : ''}>已完成</option>
            </select>
          </div>
        ` : `
          <!-- 展示模式 -->
          <h3>${task.name}</h3>
          <p>时间: ${task.time}</p>
          <p>负责人: ${task.leader}</p>
          <p>进度: ${task.progress}</p>
        `}
      </div>
      <div class="task-actions">
        ${task.isEditing ? `
          <button onclick="saveEdit(${task.id})" class="save-btn">保存</button>
          <button onclick="cancelEdit(${task.id})" class="cancel-btn">取消</button>
        ` : `
          <button onclick="startEdit(${task.id})">编辑</button>
          <button onclick="deleteTask(${task.id})" style="background: #ff4444" class="delete-btn">删除</button>
        `}
      </div>
    </div>
  `).join('');
}

// 进入编辑模式
function startEdit(taskId) {
  tasks = tasks.map(task => 
    task.id === taskId ? { ...task, isEditing: true } : task
  );
  renderTasks();
}

// 保存编辑
function saveEdit(taskId) {
  const task = tasks.find(t => t.id === taskId);
  const newName = document.getElementById(`edit-name-${taskId}`).value;
  const newTime = document.getElementById(`edit-time-${taskId}`).value;
  const newLeader = document.getElementById(`edit-leader-${taskId}`).value;
  const newProgress = document.getElementById(`edit-progress-${taskId}`).value;

  if (!newName || !newTime || !newLeader) {
    alert('请填写所有字段！');
    return;
  }

  task.name = newName;
  task.time = newTime;
  task.leader = newLeader;
  task.progress = newProgress;
  task.isEditing = false;

  saveTasks();
  renderTasks();
}

// 取消编辑
function cancelEdit(taskId) {
  tasks = tasks.map(task => 
    task.id === taskId ? { ...task, isEditing: false } : task
  );
  renderTasks();
}

// 删除任务（保持原逻辑）
function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  renderTasks();
}

// 其他辅助函数保持不变
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function clearForm() {
  document.getElementById('taskName').value = '';
  document.getElementById('taskTime').value = '';
  document.getElementById('taskLeader').value = '';
  document.getElementById('taskProgress').value = '未开始';
}