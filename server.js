import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database
async function initDb() {
  try {
    const connection = await pool.getConnection();
    console.log('已连接到 MySQL 数据库');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        dateTime VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        notes TEXT,
        completed BOOLEAN DEFAULT FALSE,
        createdAt VARCHAR(50) NOT NULL,
        reminder_enabled BOOLEAN DEFAULT FALSE,
        reminder_email VARCHAR(255),
        reminder_leadTimeMinutes INT,
        reminder_sent BOOLEAN DEFAULT FALSE
      )
    `);
    
    connection.release();
    console.log('数据库已初始化');
  } catch (err) {
    console.error('数据库初始化失败:', err);
  }
}

initDb();

// Routes
app.get('/api/schedules', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM schedules');
    const schedules = rows.map((row) => ({
      id: row.id,
      title: row.title,
      dateTime: row.dateTime,
      category: row.category,
      notes: row.notes,
      completed: !!row.completed,
      createdAt: row.createdAt,
      reminder: {
        enabled: !!row.reminder_enabled,
        email: row.reminder_email,
        leadTimeMinutes: row.reminder_leadTimeMinutes,
        sent: !!row.reminder_sent
      }
    }));
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取日程失败' });
  }
});

app.post('/api/schedules', async (req, res) => {
  const s = req.body;
  try {
    await pool.query(
      `INSERT INTO schedules (id, title, dateTime, category, notes, completed, createdAt, reminder_enabled, reminder_email, reminder_leadTimeMinutes, reminder_sent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.title, s.dateTime, s.category, s.notes, s.completed, s.createdAt, s.reminder.enabled, s.reminder.email, s.reminder.leadTimeMinutes, s.reminder.sent]
    );
    res.status(201).json(s);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建日程失败' });
  }
});

app.put('/api/schedules/:id', async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  try {
    await pool.query(
      `UPDATE schedules SET title=?, dateTime=?, category=?, notes=?, completed=?, reminder_enabled=?, reminder_email=?, reminder_leadTimeMinutes=?, reminder_sent=? 
       WHERE id=?`,
      [s.title, s.dateTime, s.category, s.notes, s.completed, s.reminder.enabled, s.reminder.email, s.reminder.leadTimeMinutes, s.reminder.sent, id]
    );
    res.json(s);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新日程失败' });
  }
});

app.delete('/api/schedules/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM schedules WHERE id=?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除日程失败' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
