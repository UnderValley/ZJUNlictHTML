const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 3000;

// 允许跨域请求（局域网内其他设备访问）
app.use(cors());
app.use(express.json());

// 连接 SQLite 数据库（自动创建文件）
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to SQLite database.');
});

// 创建任务表
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      time TEXT NOT NULL,
      leader TEXT NOT NULL,
      progress TEXT NOT NULL,
      category TEXT NOT NULL,
      isEditing BOOLEAN DEFAULT FALSE
    )
  `);
});

// 获取所有任务
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 添加任务
app.post('/api/tasks', (req, res) => {
  const { name, time, leader, progress, category, isEditing } = req.body;
  db.run(
    'INSERT INTO tasks (name, time, leader, progress, category, isEditing) VALUES (?, ?, ?, ?, ?, ?)',
    [name, time, leader, progress, category, isEditing],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// 更新任务
app.put('/api/tasks/:id', (req, res) => {
  const { name, time, leader, progress, category, isEditing } = req.body;
  const id = req.params.id;
  db.run(
    'UPDATE tasks SET name = ?, time = ?, leader = ?, progress = ?, category = ?, isEditing = ? WHERE id = ?',
    [name, time, leader, progress, category, isEditing, id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// 删除任务
app.delete('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});


// 连接 SQLite 数据库（自动创建文件）
const db2 = new sqlite3.Database('./robot_status.db', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to SQLite database.');
});

// 创建图标数据表
db2.serialize(() => {
  db2.run(`CREATE TABLE IF NOT EXISTS robot_status (
    id INTEGER PRIMARY KEY,
    color TEXT CHECK(color IN ('blue', 'yellow')),
    number INTEGER,
    status TEXT,
    note TEXT,
    UNIQUE(color, number)
  )`);
});

// 新增 API 端点
app.get('/api/robot_status', (req, res) => {
  db2.all('SELECT * FROM robot_status', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/robot_status', (req, res) => {
  const { color, number, status, note } = req.body;
  db2.run(
    `INSERT OR REPLACE INTO robot_status (color, number, status, note) 
     VALUES (?, ?, ?, ?)`,
    [color, number, status, note],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// 启动服务
app.listen(port, '0.0.0.0', () => {
    console.log(`API server running at http://0.0.0.0:${port}`);
  });