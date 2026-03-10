import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

// 邮件转运器配置
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
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
        durationMinutes INT DEFAULT 60,
        category VARCHAR(50) NOT NULL,
        notes TEXT,
        completed BOOLEAN DEFAULT FALSE,
        createdAt VARCHAR(50) NOT NULL,
        reminder_enabled BOOLEAN DEFAULT FALSE,
        reminder_email VARCHAR(255),
        reminder_leadTimeMinutes INT,
        reminder_sent BOOLEAN DEFAULT FALSE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 检查列是否存在，如果不存在则添加
    const [columns] = await connection.query('SHOW COLUMNS FROM schedules LIKE "durationMinutes"');
    if (columns.length === 0) {
      await connection.query('ALTER TABLE schedules ADD COLUMN durationMinutes INT DEFAULT 60 AFTER dateTime');
    }
    
    // 强制修改现有表的字符集，以防表已存在但字符集不对
    await connection.query(`ALTER TABLE schedules CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
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
      `INSERT INTO schedules (id, title, dateTime, durationMinutes, category, notes, completed, createdAt, reminder_enabled, reminder_email, reminder_leadTimeMinutes, reminder_sent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.title, s.dateTime, s.durationMinutes || 60, s.category, s.notes, s.completed, s.createdAt, s.reminder.enabled, s.reminder.email, s.reminder.leadTimeMinutes, s.reminder.sent || false]
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
      `UPDATE schedules SET title=?, dateTime=?, durationMinutes=?, category=?, notes=?, completed=?, reminder_enabled=?, reminder_email=?, reminder_leadTimeMinutes=?, reminder_sent=? 
       WHERE id=?`,
      [s.title, s.dateTime, s.durationMinutes || 60, s.category, s.notes, s.completed, s.reminder.enabled, s.reminder.email, s.reminder.leadTimeMinutes, s.reminder.sent, id]
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

// 邮件发送逻辑
async function sendReminderEmail(schedule) {
  const mailOptions = {
    from: `"张鑫个人日历" <${process.env.EMAIL_USER}>`,
    to: schedule.reminder_email,
    subject: `日程提醒: ${schedule.title}`,
    text: `您好！提醒您有一个日程即将开始：\n\n标题：${schedule.title}\n时间：${schedule.dateTime}\n备注：${schedule.notes || '无'}\n\n请准时参加！`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #7c3aed;">日程提醒</h2>
        <p>您好！提醒您有一个日程即将开始：</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>标题：</strong> ${schedule.title}</p>
          <p><strong>时间：</strong> ${schedule.dateTime}</p>
          <p><strong>备注：</strong> ${schedule.notes || '无'}</p>
        </div>
        <p style="color: #666; font-size: 12px;">此邮件由张鑫个人日历自动发送，请勿直接回复。</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`已向 ${schedule.reminder_email} 发送日程提醒: ${schedule.title}`);
    return true;
  } catch (err) {
    console.error('发送邮件失败:', err);
    return false;
  }
}

// 定时任务：每 10 秒检查一次待发送的提醒
async function checkReminders() {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM schedules 
       WHERE reminder_enabled = TRUE 
       AND reminder_sent = FALSE 
       AND completed = FALSE`
    );

    const now = new Date();
    console.log(`[${now.toLocaleTimeString()}] 正在检查提醒任务... (待处理日程数: ${rows.length})`);
    
    for (const schedule of rows) {
      const scheduleTime = new Date(schedule.dateTime);
      const leadTimeMs = (schedule.reminder_leadTimeMinutes || 0) * 60 * 1000;
      const reminderTime = new Date(scheduleTime.getTime() - leadTimeMs);

      console.log(`- 检查日程: "${schedule.title}"`);
      console.log(`  设定时间: ${scheduleTime.toLocaleString()}`);
      console.log(`  提前分钟: ${schedule.reminder_leadTimeMinutes}`);
      console.log(`  提醒时间: ${reminderTime.toLocaleString()}`);
      console.log(`  当前时间: ${now.toLocaleString()}`);

      // 如果当前时间已经到了或过了提醒时间，且距离日程开始时间还没超过1小时（避免补发太久的提醒）
      if (now >= reminderTime && now < new Date(scheduleTime.getTime() + 60 * 60 * 1000)) {
        console.log(`  触发提醒！正在发送邮件至 ${schedule.reminder_email}...`);
        const success = await sendReminderEmail(schedule);
        if (success) {
          await pool.query(
            'UPDATE schedules SET reminder_sent = TRUE WHERE id = ?',
            [schedule.id]
          );
          console.log(`  提醒已标记为已发送。`);
        }
      } else {
        console.log(`  未到提醒时间。`);
      }
    }
  } catch (err) {
    console.error('检查提醒任务出错:', err);
  }
}

// 每 10 秒运行一次检查，更灵敏
setInterval(checkReminders, 10000);
console.log(`[${new Date().toLocaleTimeString()}] 邮件提醒定时任务已启动，扫描间隔: 10秒`);
// 启动时立即运行一次
checkReminders();

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
