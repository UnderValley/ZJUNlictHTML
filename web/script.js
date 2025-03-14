// 主题切换功能
const themeToggle = document.getElementById('themeToggle');
let isDarkMode = true;
let filterCategory = 'all';

const API_TASK_URL = 'http://10.12.225.190:12235/api/tasks';
const API_ROBOT_URL = 'http://10.12.225.190:12235/api/robot_status';

// 获取任务列表
async function fetchTasks() {
  try {
    const response = await fetch(API_TASK_URL);
    return await response.json();
  } catch (error) {
    console.error('获取任务失败:', error);
    return [];
  }
}

// 修改后的筛选功能
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
      // 移除所有按钮的激活状态
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      
      // 添加当前按钮激活状态
      btn.classList.add('active');
      
      // 获取筛选类型
      filterCategory = btn.dataset.category;
      
      // 执行筛选
      renderTasks();
  });
});
       

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
    document.querySelectorAll('.blue div').forEach(circle => {
      circle.style.backgroundColor = isDarkMode ? '#2196F3' : '#1565C0';
    });
    document.querySelectorAll('.yellow div').forEach(circle => {
      circle.style.backgroundColor = isDarkMode ? '#FFC107' : '#856E2B';
    });
}

// 初始化
initTheme();
themeToggle.addEventListener('click', toggleTheme);

initIcons();
// 初始化渲染（新增此行）
renderTasks();

let currentTaskIdToDelete = null;

// 显示弹窗
function showDeleteConfirm(taskId) {
  currentTaskIdToDelete = taskId;
  document.getElementById('deleteModal').style.display = 'flex';
}

// 绑定事件
document.getElementById('confirmDelete').addEventListener('click', async () => {
  document.getElementById('deleteModal').style.display = 'none';
  if (currentTaskIdToDelete) {
    await deleteTask(currentTaskIdToDelete);
    currentTaskIdToDelete = null;
  }
});

document.getElementById('cancelDelete').addEventListener('click', () => {
  document.getElementById('deleteModal').style.display = 'none';
  currentTaskIdToDelete = null;
});

// 渲染任务列表（修改后）
async function renderTasks() {
  let tasks = await fetchTasks();
  
  if (filterCategory !== 'all') {
      tasks = tasks.filter(task => task.category === filterCategory);
  }
  // const tasks = await fetchTasks();
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = tasks.map(task => `
    <div class="task-item ${task.isEditing ? 'editing' : ''}" id="task-${task.id}">
      <div class="task-info">
        ${task.isEditing ? `
          <!-- 编辑模式 -->
          <div class="edit-form">
            <input type="text" value="${task.name}" class="edit-field" id="edit-name-${task.id}" placeholder="任务名称">
            <input type="date" value="${task.time}" class="edit-field" id="edit-time-${task.id}">
            <input type="text" value="${task.leader}" class="edit-field" id="edit-leader-${task.id}" placeholder="负责人">
            <input type="text" value="${task.progress}" class="edit-field" id="edit-progress-${task.id}" placeholder="任务进度">
            <select class="edit-field" id="edit-category-${task.id}">
              <option value="软件" ${task.category === '软件' ? 'selected' : ''}>软件</option>
              <option value="电路" ${task.category === '电路' ? 'selected' : ''}>电路</option>
              <option value="机械" ${task.category === '机械' ? 'selected' : ''}>机械</option>
            </select>
          </div>
        ` : `
          <!-- 展示模式 -->
          <h3>${task.name}</h3>
          <p>组别: ${task.category}</p>
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
          <button onclick="showDeleteConfirm(${task.id})" style="background: #ff4444" class="delete-btn">删除</button>
        `}
      </div>
    </div>
  `).join('');
}

// 进入编辑模式
async function startEdit(taskId) {
  let tasks = await fetchTasks();
  const choosedTask = tasks.find(task => task.id === taskId);

  try {
    const response = await fetch(`${API_TASK_URL}/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      params: { id: taskId },
      body: JSON.stringify({
        name: choosedTask.name,
        time: choosedTask.time,
        leader: choosedTask.leader,
        progress: choosedTask.progress,
        category: choosedTask.category,
        isEditing: true
      })
    });

    if (response.ok) {
      renderTasks();
    } else {
      throw new Error('更改失败失败');
    }
  } catch (error) {
    console.error('更改任务失败:', error);
    alert('更改失败');
  }
}

// 保存编辑
async function saveEdit(taskId) {
  const newName = document.getElementById(`edit-name-${taskId}`).value;
  const newTime = document.getElementById(`edit-time-${taskId}`).value;
  const newLeader = document.getElementById(`edit-leader-${taskId}`).value;
  const newProgress = document.getElementById(`edit-progress-${taskId}`).value;
  const newCategory = document.getElementById(`edit-category-${taskId}`).value;

  if (!newName) {
    alert('请填写所有字段！');
    return;
  }

  try {
    const response = await fetch(`${API_TASK_URL}/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      params: { id: taskId },
      body: JSON.stringify({
        name: newName,
        time: newTime,
        leader: newLeader,
        progress: newProgress,
        category: newCategory,
        isEditing: false
      })
    });

    if (response.ok) {
      renderTasks();
    } else {
      throw new Error('更改失败失败');
    }
  } catch (error) {
    console.error('更改任务失败:', error);
    alert('更改失败');
  }

}

// 取消编辑
async function cancelEdit(taskId) {
  let tasks = await fetchTasks();
  const choosedTask = tasks.find(task => task.id === taskId);

  try {
    const response = await fetch(`${API_TASK_URL}/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      params: { id: taskId },
      body: JSON.stringify({
        name: choosedTask.name,
        time: choosedTask.time,
        leader: choosedTask.leader,
        progress: choosedTask.progress,
        category: choosedTask.category,
        isEditing: false
      })
    });

    if (response.ok) {
      renderTasks();
    } else {
      throw new Error('更改失败失败');
    }
  } catch (error) {
    console.error('更改任务失败:', error);
    alert('更改失败');
  }
}

// 删除任务
async function deleteTask(taskId) {
  try {
    await fetch(`${API_TASK_URL}/${taskId}`, { method: 'DELETE' });
    renderTasks();
  } catch (error) {
    console.error('删除任务失败:', error);
  }
}

function clearForm() {
  document.getElementById('taskName').value = '';
  document.getElementById('taskTime').value = '';
  document.getElementById('taskLeader').value = '';
  document.getElementById('taskProgress').value = '';
}

// 在 script.js 末尾添加以下代码

// 生成圆形图标
function createCircles() {
  const blueColumn = document.querySelector('.circle-column.blue');
  const yellowColumn = document.querySelector('.circle-column.yellow');
  
  // 创建图标数据存储对象
  window.iconData = window.iconData || {
    blue: Array(16).fill().map(() => ({ status: '空闲', note: '' })),
    yellow: Array(16).fill().map(() => ({ status: '空闲', note: '' }))
  };

  for (let i = 0; i < 16; i++) {
    [blueColumn, yellowColumn].forEach((col, index) => {
      const color = index === 0 ? 'blue' : 'yellow';
      const circle = document.createElement('div');
      const text = document.createElement('div');
      text.textContent = i;
      text.style.background = '#ffffff00';
      text.style.position = 'relative';
      text.style.left = '3px';

      circle.appendChild(text);
      circle.dataset.id = i;
      circle.dataset.color = color;
      
      // 添加状态指示点
      const statusDot = document.createElement('div');
      statusDot.className = 'status-dot';
      statusDot.style.width = '5px';
      statusDot.style.height = '5px';
      circle.appendChild(statusDot);
      
      circle.addEventListener('click', showPopover);
      circle.addEventListener('mouseenter', showStatusTooltip);
      // circle.addEventListener('mouseleave', hideStatusTooltip);
      col.appendChild(circle);
      updateStatusVisual(circle, 0); // 初始状态更新
    });
  }
}

// 显示弹窗
function showAddTaskModal() {
  document.getElementById('addTaskModal').style.display = 'flex';
}

// 关闭弹窗
function closeAddTaskModal() {
  document.getElementById('addTaskModal').style.display = 'none';
  clearModalForm();
}

// 清空表单
function clearModalForm() {
  document.getElementById('modalTaskName').value = '';
  document.getElementById('modalTaskTime').value = '';
  document.getElementById('modalTaskLeader').value = '';
  document.getElementById('modalTaskProgress').value = '';
  document.getElementById('modalTaskCategory').value = '软件';
}

// 提交任务
async function submitTask() {
  const taskName = document.getElementById('modalTaskName').value;
  const taskTime = document.getElementById('modalTaskTime').value;
  const taskLeader = document.getElementById('modalTaskLeader').value;
  const taskProgress = document.getElementById('modalTaskProgress').value;
  const taskCategory = document.getElementById('modalTaskCategory').value;
  if (!taskName) {
    alert('请填写项目名称！');
    return;
  }

  try {
    const response = await fetch(API_TASK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: taskName,
        time: taskTime,
        leader: taskLeader,
        progress: taskProgress,
        category: taskCategory,
        isEditing: false
      })
    });

    if (response.ok) {
      closeAddTaskModal();
      renderTasks();
    } else {
      throw new Error('添加任务失败');
    }
  } catch (error) {
    console.error('添加任务失败:', error);
    alert('添加任务失败，请检查网络连接');
  }
}

// 点击弹窗外围关闭
window.onclick = function(event) {
  const modal = document.getElementById('addTaskModal');
  if (event.target == modal) {
    closeAddTaskModal();
  }
}

// 状态指示点样式
const statusDotStyle = `
.status-dot {
  position: relative;
  bottom: -10px;
  right: 17px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  transition: transform 0.3s ease;
  /*border: 1px solid var(--container-bg);*/
}

.status-dot[data-status="可用"] { background: #4CAF50;border: 1px solid var(--container-bg); }
.status-dot[data-status="分档未测"] { background: #FF9800; }
.status-dot[data-status="维修"] { background: #F44336; }
.status-dot[data-status="不存在"] { background: #424242; }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = statusDotStyle;
document.head.appendChild(styleSheet);

// 显示浮窗函数
let currentPopover = null;
// 实时定位监听
let resizeObserver;
function showPopover(event) {
  closeCurrentPopover();
  
  const icon = event.currentTarget;
  const color = icon.dataset.color;
  const id = icon.dataset.id;
  const data = window.iconData[color][id];

  // 创建浮窗
  const popover = document.getElementById('popover-template')
    .content.cloneNode(true).firstElementChild;
  
  // 定位计算
  const rect = icon.getBoundingClientRect();
  popover.style.left = `${rect.left - 300}px`;
  popover.style.top = `${rect.top}px`;

  // 填充数据
  popover.querySelector('#popover-title').textContent = `${color === 'blue' ? '蓝' : '黄'}${id}号`;
  popover.querySelector('#popover-status').value = data.status;
  popover.querySelector('#popover-note').value = data.note;

  // 事件绑定
  popover.querySelector('.btn-save').addEventListener('click', () => saveRobotStatus(icon, color, id));
  popover.querySelector('.btn-close').addEventListener('click', closeCurrentPopover);

  document.body.appendChild(popover);
  currentPopover = { element: popover, icon };
  addOutsideClickListener();
  positionPopover(icon, popover);
  resizeObserver = new ResizeObserver(() => positionPopover(icon, popover));
  resizeObserver.observe(document.documentElement);
}

// 数据获取与保存
async function fetchIconData() {
  try {
    const response = await fetch(API_ROBOT_URL);
    return await response.json();
  } catch (error) {
    console.error('获取图标数据失败:', error);
    return [];
  }
}

async function saveRobotStatus(icon, color, number) {
  const status = document.getElementById('popover-status').value;
  const note = document.getElementById('popover-note').value;
  window.iconData[color][number] = { status, note };
  try {
    await fetch(API_ROBOT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color, number, status, note })
    });
    closeCurrentPopover();
    updateStatusVisual(icon, 1);
  } catch (error) {
    console.error('保存失败:', error);
    alert('数据保存失败，请检查控制台');
  }
}

// 初始化图标数据
async function initIcons() {
  const data = await fetchIconData();
  window.iconData = { blue: [], yellow: [] };
  window.countNum = { blue: {可用: 0, 分档未测: 0, 维修: 0, 不存在: 0}, yellow: {可用: 0, 分档未测: 0, 维修: 0, 不存在: 0} };

  data.forEach(item => {
    window.iconData[item.color][item.number] = {
      status: item.status,
      note: item.note
    };
    window.countNum[item.color][item.status]++;
    console.info(item.color+' '+window.countNum[item.color][item.status]+' '+item.number+item.status);
  });

  createCircles();
}

// 更新图标视觉状态
async function updateStatusVisual(icon, flag) {
  const color = icon.dataset.color;
  const id = icon.dataset.id;
  const status = window.iconData[color][id].status;
  const note = window.iconData[color][id].note;
  if (flag === 1) {
    window.countNum[color][icon.querySelector('.status-dot').dataset.status]--;
    window.countNum[color][status]++;
  }
  updateCountNum();

  icon.querySelector('.status-dot').dataset.status = status;

  if (status === '不存在') {
    icon.style.backgroundColor = '#424242';
    icon.style.boxShadow = `0 0 0px ${'#FFFFFF00'}`;
  } else {
    icon.style.backgroundColor = color === 'blue' ? '#2196F3' : '#FFC107';
    icon.style.boxShadow = `0 0 8px ${color === 'blue' ? '#2196f366' : '#ffc10766'}`;
  }
  icon.querySelector('.status-dot').dataset.note = note;
}

//
function updateCountNum() {
  const iconcol = document.querySelector('.icon-columns');
  iconcol.children[0].children[1].textContent = `可用 蓝:${window.countNum['blue']['可用']} 黄:${window.countNum['yellow']['可用']}`;
  iconcol.children[0].children[3].textContent = `分档未测 蓝:${window.countNum['blue']['分档未测']} 黄:${window.countNum['yellow']['分档未测']}`;
  iconcol.children[0].children[5].textContent = `维修 蓝:${window.countNum['blue']['维修']} 黄:${window.countNum['yellow']['维修']}`;
  
}

// 关闭浮窗相关函数
function closeCurrentPopover() {
  if (currentPopover) {
    currentPopover.element.remove();
    currentPopover = null;
  }
}

function addOutsideClickListener() {
  const listener = (e) => {
    if (!e.target.closest('.icon-popover') && 
        !e.target.closest('.circle-column div')) {
      closeCurrentPopover();
      document.removeEventListener('click', listener);
    }
  };
  document.addEventListener('click', listener);
}

// 动态定位函数
function positionPopover(iconElement, popover) {
  const iconRect = iconElement.getBoundingClientRect();
  const popoverWidth = 280;
  const popoverHeight = 200;
  
  // 计算初始位置
  let left = iconRect.right + 10;
  let top = iconRect.top;

  // 右侧空间检测
  if (left + popoverWidth > window.innerWidth) {
    left = iconRect.left - popoverWidth - 10;
  }

  // 底部空间检测
  if (top + popoverHeight > window.innerHeight - 100) {
    top = window.innerHeight - popoverHeight - 100;
  }

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}


function showStatusTooltip(e) {
  const status = e.target.dataset.status;
  const tooltip = document.createElement('div');
  tooltip.textContent = `当前状态：${status}`;
  // ...定位工具提示...
}