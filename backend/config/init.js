import { pool } from './database.js';
import bcrypt from 'bcryptjs';

export const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Departments ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        color       VARCHAR(7) DEFAULT '#6366f1',
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Users ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        password      VARCHAR(255) NOT NULL,
        role          VARCHAR(20)  DEFAULT 'user' CHECK (role IN ('admin','manager','user')),
        status        VARCHAR(20)  DEFAULT 'active' CHECK (status IN ('active','inactive','banned')),
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        avatar_color  VARCHAR(7)   DEFAULT '#6366f1',
        bio           TEXT,
        phone         VARCHAR(30),
        position      VARCHAR(100),
        last_login    TIMESTAMP,
        login_count   INTEGER DEFAULT 0,
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Activity Log ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action      VARCHAR(100) NOT NULL,
        entity      VARCHAR(50),
        entity_id   INTEGER,
        details     JSONB,
        ip_address  VARCHAR(45),
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Notifications ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title      VARCHAR(200) NOT NULL,
        message    TEXT NOT NULL,
        type       VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
        is_read    BOOLEAN DEFAULT FALSE,
        link       VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Tasks ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id           SERIAL PRIMARY KEY,
        title        VARCHAR(255) NOT NULL,
        description  TEXT,
        status       VARCHAR(30) DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done')),
        priority     VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
        assigned_to  INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        due_date     DATE,
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Refresh Tokens ────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token      VARCHAR(500) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');

    // ── Seed data ─────────────────────────────────────────────────
    const { rows: existing } = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existing[0].count) > 0) {
      console.log('✅ Database initialized (seed skipped)');
      return;
    }

    // Departments
    const deptResult = await client.query(`
      INSERT INTO departments (name, description, color) VALUES
        ('Engineering',  'Software development & infrastructure', '#6366f1'),
        ('Design',       'UI/UX and product design',             '#ec4899'),
        ('Marketing',    'Growth, content and campaigns',        '#f59e0b'),
        ('Management',   'Executive and leadership team',        '#10b981'),
        ('Support',      'Customer success and help desk',       '#3b82f6')
      RETURNING id, name;
    `);
    const deptMap = Object.fromEntries(deptResult.rows.map(d => [d.name, d.id]));

    // Users with hashed passwords
    const adminPwd   = await bcrypt.hash('admin123',   10);
    const managerPwd = await bcrypt.hash('manager123', 10);
    const userPwd    = await bcrypt.hash('user123',    10);

    const colors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6'];

    const usersData = [
      ['Alex Johnson',   'admin@demo.com',    adminPwd,   'admin',   'active', deptMap['Management'], '#6366f1', 'CTO & Platform Admin',    '+1-555-0001', 'Chief Technology Officer'],
      ['Maria Garcia',   'manager@demo.com',  managerPwd, 'manager', 'active', deptMap['Engineering'],'#10b981', 'Engineering Manager',      '+1-555-0002', 'Engineering Manager'],
      ['James Wilson',   'james@demo.com',    userPwd,    'user',    'active', deptMap['Engineering'],'#3b82f6', 'Full-stack developer',     '+1-555-0003', 'Senior Developer'],
      ['Sofia Chen',     'sofia@demo.com',    userPwd,    'user',    'active', deptMap['Design'],     '#ec4899', 'Passionate about UX',      '+1-555-0004', 'Lead Designer'],
      ['Liam Brown',     'liam@demo.com',     userPwd,    'user',    'active', deptMap['Marketing'],  '#f59e0b', 'Growth hacker mindset',    '+1-555-0005', 'Marketing Specialist'],
      ['Emma Davis',     'emma@demo.com',     userPwd,    'user',    'active', deptMap['Engineering'],'#8b5cf6', 'Backend systems expert',   '+1-555-0006', 'Backend Engineer'],
      ['Noah Martinez',  'noah@demo.com',     userPwd,    'user',    'inactive',deptMap['Support'],   '#14b8a6', 'Customer success focused', '+1-555-0007', 'Support Lead'],
      ['Olivia Taylor',  'olivia@demo.com',   userPwd,    'user',    'active', deptMap['Design'],     '#ef4444', 'Visual storyteller',       '+1-555-0008', 'UI Designer'],
      ['Ethan White',    'ethan@demo.com',    userPwd,    'manager', 'active', deptMap['Marketing'],  '#f59e0b', 'Data-driven marketer',     '+1-555-0009', 'Marketing Manager'],
      ['Ava Harris',     'ava@demo.com',      userPwd,    'user',    'banned', deptMap['Support'],    '#6366f1', 'Support specialist',       '+1-555-0010', 'Support Agent'],
    ];

    const userIds = [];
    for (const u of usersData) {
      const { rows } = await client.query(
        `INSERT INTO users (name,email,password,role,status,department_id,avatar_color,bio,phone,position,login_count,last_login)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()-INTERVAL '${Math.floor(Math.random()*30)} days')
         RETURNING id`,
        [...u, Math.floor(Math.random() * 200)]
      );
      userIds.push(rows[0].id);
    }

    // Tasks
    const taskData = [
      ['Redesign dashboard UI',       'Complete overhaul of the admin dashboard', 'done',       'high',     userIds[3], userIds[0], '2025-02-15'],
      ['Set up CI/CD pipeline',       'GitHub Actions for auto deployment',        'in_progress','critical', userIds[2], userIds[1], '2025-03-20'],
      ['Q1 marketing campaign',       'Plan and execute Q1 growth campaign',       'todo',       'high',     userIds[4], userIds[8], '2025-03-31'],
      ['Database optimization',       'Index tuning and query optimization',       'review',     'medium',   userIds[5], userIds[1], '2025-03-10'],
      ['Customer onboarding flow',    'Streamline new user onboarding',            'in_progress','medium',   userIds[6], userIds[0], '2025-03-25'],
      ['Mobile responsive fixes',     'Fix layout issues on mobile breakpoints',   'todo',       'low',      userIds[3], userIds[1], '2025-04-05'],
      ['Security audit',              'Full penetration testing and OWASP review', 'todo',       'critical', userIds[2], userIds[0], '2025-04-10'],
      ['API documentation',           'Swagger/OpenAPI docs for all endpoints',    'in_progress','medium',   userIds[2], userIds[1], '2025-03-18'],
      ['User feedback analysis',      'Analyze last quarter support tickets',      'done',       'low',      userIds[6], userIds[8], '2025-02-28'],
      ['Analytics integration',       'Implement event tracking across app',       'review',     'high',     userIds[4], userIds[0], '2025-03-22'],
    ];

    for (const t of taskData) {
      await client.query(
        `INSERT INTO tasks (title,description,status,priority,assigned_to,created_by,due_date) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        t
      );
    }

    // Notifications
    for (const uid of userIds.slice(0, 5)) {
      await client.query(
        `INSERT INTO notifications (user_id,title,message,type,is_read) VALUES
         ($1,'Welcome to UMS Pro!','Your account has been set up successfully.','success',false),
         ($1,'Security reminder','Please review your account security settings.','warning',false)`,
        [uid]
      );
    }

    // Activity log
    const actions = ['user.login','user.updated','task.created','task.updated','user.created','notification.read'];
    for (let i = 0; i < 30; i++) {
      const uid = userIds[Math.floor(Math.random() * userIds.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      await client.query(
        `INSERT INTO activity_log (user_id,action,entity,details,created_at)
         VALUES ($1,$2,'user','{"source":"seed"}'::jsonb, NOW()-INTERVAL '${i * 2} hours')`,
        [uid, action]
      );
    }

    console.log('✅ Database initialized with seed data');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
