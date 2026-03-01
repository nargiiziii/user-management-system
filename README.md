# UMS Pro — User Management System v2.0

Полноценная enterprise-уровня платформа управления пользователями.
React 18 + Vite + Node.js + Express + PostgreSQL.

---

## Функциональность

### Backend (Node.js + Express)
- **JWT аутентификация** с refresh-токенами (8ч access / 7д refresh)
- **3 роли**: Admin / Manager / User — разные права доступа
- **Rate limiting** — защита от brute-force атак
- **Helmet** — HTTP security headers
- **Полный CRUD** для пользователей с пагинацией, поиском, сортировкой, фильтрами
- **Bulk actions** — массовые операции (activate/ban/delete)
- **Tasks API** — создание, обновление, удаление задач
- **Departments API** — управление отделами
- **Notifications API** — уведомления для пользователей
- **Activity Log** — полный аудит всех действий
- **Dashboard Stats** — агрегированная аналитика

### Frontend (React 18 + Vite)
- **Тёмная тема** с профессиональным enterprise-дизайном
- **Dashboard** с живыми графиками (Recharts): Area, Bar, Pie charts
- **Users Table** — поиск, фильтры, сортировка, bulk select, пагинация
- **Kanban board** для задач + List view
- **User Profile** с вкладками (Overview, Tasks, Activity)
- **Departments** в виде карточек с прогресс-барами
- **Activity Log** с пагинацией
- **Settings** — смена пароля, уведомления, тема
- **Notifications panel** — подтверждения, отметка прочитанных
- **Auto refresh-токен** — автоматическое обновление сессии

---

## Требования

| Инструмент | Версия |
|---|---|
| Node.js | 18+ |
| npm     | 9+  |
| PostgreSQL | 14+ |
| pgAdmin 4 | любая |

---

## Шаг 1 — Создание базы данных

1. Откройте **pgAdmin 4**
2. Правая кнопка на **Databases → Create → Database**
3. Имя базы: `ums_pro`
4. Нажмите **Save**

> ℹ️ Таблицы создаются бэкендом автоматически. pgAdmin нужен только для создания базы.

---

## Шаг 2 — Настройка и запуск бэкенда

```bash
cd backend
npm install
```

Создайте файл `.env` (скопируйте из `.env.example`):
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Откройте `.env` и заполните:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ums_pro
DB_USER=postgres
DB_PASSWORD=ВАШ_ПАРОЛЬ
JWT_SECRET=придумайте-длинную-строку-32-символа-минимум
JWT_REFRESH_SECRET=другая-длинная-строка-для-refresh-токенов
NODE_ENV=development
```

Запустите:
```bash
npm run dev
```

Ожидаемый вывод:
```
✅ Database initialized with seed data
🚀 UMS Pro Server running on http://localhost:3000
```

---

## Шаг 3 — Запуск фронтенда

Откройте **новый терминал**:
```bash
cd frontend
npm install
npm run dev
```

Откройте браузер: **http://localhost:5173**

---

## Тестовые аккаунты

| Email | Пароль | Роль | Доступ |
|---|---|---|---|
| admin@demo.com | admin123 | **Admin** | Полный доступ |
| manager@demo.com | manager123 | **Manager** | Пользователи, задачи, активность |
| james@demo.com | user123 | **User** | Задачи, свой профиль |
| alice... | ... | + 7 других пользователей | — |

---

## Структура проекта

```
ums-pro/
├── backend/
│   ├── config/
│   │   ├── database.js     # Pool соединений PostgreSQL
│   │   └── init.js         # Инициализация таблиц + seed data
│   ├── controllers/
│   │   ├── authController.js         # login, register, refresh, me
│   │   ├── usersController.js        # CRUD + bulk actions
│   │   ├── tasksController.js        # Task management
│   │   ├── departmentsController.js  # Department CRUD
│   │   ├── notificationsController.js# Notifications
│   │   └── dashboardController.js    # Stats + activity log
│   ├── middleware/
│   │   ├── auth.js          # JWT verify + role guards
│   │   ├── rateLimiter.js   # express-rate-limit
│   │   └── errorHandler.js  # Global error handler
│   ├── routes/              # Маршруты для каждого ресурса
│   ├── utils/
│   │   └── activityLogger.js# Логирование действий
│   ├── index.js             # Точка входа
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js     # Axios + JWT interceptor + auto-refresh
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Пользователь, токен
│   │   │   └── NotifContext.jsx # Уведомления
│   │   ├── components/
│   │   │   ├── ui/          # Avatar, Badge, ConfirmModal, NotifPanel
│   │   │   ├── layout/      # Sidebar, Topbar, AppShell, ProtectedRoute
│   │   │   └── modals/      # UserModal, TaskModal
│   │   ├── pages/
│   │   │   ├── Login, Register
│   │   │   ├── Dashboard    # Charts, stats
│   │   │   ├── Users        # Table, bulk, pagination
│   │   │   ├── UserProfile  # Tabs: overview/tasks/activity
│   │   │   ├── Tasks        # Kanban + List view
│   │   │   ├── Departments  # Cards
│   │   │   ├── ActivityLog  # Full audit table
│   │   │   └── Settings     # Password, notifications
│   │   ├── utils/helpers.js
│   │   ├── App.jsx
│   │   └── index.css        # Dark theme design system
│   ├── index.html
│   └── vite.config.js       # Proxy → localhost:3000
│
├── database_setup.sql       # Optional reset script
└── README.md
```

---

## API Endpoints

### Auth
| Метод | URL | Описание |
|---|---|---|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход, получить токены |
| POST | /api/auth/refresh | Обновить access token |
| POST | /api/auth/logout | Выход |
| GET  | /api/auth/me | Текущий пользователь |
| PUT  | /api/auth/change-password | Смена пароля |

### Users (Admin/Manager)
| Метод | URL | Описание |
|---|---|---|
| GET    | /api/users?search=&role=&status=&department=&sort=&order=&page=&limit= | Список с фильтрами |
| GET    | /api/users/:id | Один пользователь |
| POST   | /api/users | Создать (Admin) |
| PUT    | /api/users/:id | Обновить (Admin/Manager) |
| DELETE | /api/users/:id | Удалить (Admin) |
| POST   | /api/users/bulk | Массовые действия |
| PUT    | /api/users/me/profile | Обновить свой профиль |

### Tasks
| Метод | URL | Описание |
|---|---|---|
| GET    | /api/tasks | Список задач |
| POST   | /api/tasks | Создать |
| PUT    | /api/tasks/:id | Обновить |
| DELETE | /api/tasks/:id | Удалить (Manager+) |

### Departments (Admin)
| Метод | URL | Описание |
|---|---|---|
| GET    | /api/departments | Список с кол-вом участников |
| POST   | /api/departments | Создать |
| PUT    | /api/departments/:id | Обновить |
| DELETE | /api/departments/:id | Удалить |

### Notifications
| Метод | URL | Описание |
|---|---|---|
| GET    | /api/notifications | Мои уведомления |
| PUT    | /api/notifications/:id/read | Отметить прочитанным |
| PUT    | /api/notifications/read-all | Все прочитаны |
| DELETE | /api/notifications/:id | Удалить |
| POST   | /api/notifications/send | Отправить (Admin) |

### Dashboard (Admin/Manager)
| Метод | URL | Описание |
|---|---|---|
| GET | /api/dashboard/stats | Агрегированная статистика |
| GET | /api/dashboard/activity | Лог активности |

---

## Возможные ошибки

**ECONNREFUSED при запуске**
→ PostgreSQL не запущен. Запустите службу PostgreSQL.

**password authentication failed**
→ Неверный DB_PASSWORD в `.env`

**database "ums_pro" does not exist**
→ Создайте базу данных в pgAdmin (Шаг 1)

**Port 5173 in use**
→ Измените порт: `vite --port 3001` или закройте конфликтующий процесс

---

## Безопасность

- Пароли хешируются bcrypt (saltRounds=10)
- JWT access токен — 8 часов
- JWT refresh токен — 7 дней, хранится в БД
- Rate limiting: 20 auth запросов / 15 мин, 200 API запросов / мин
- Helmet — security headers (CSP, HSTS, etc.)
- CORS — только localhost:5173 и localhost:4173
- Роли проверяются на бэкенде и фронтенде



## deploy link: https://user-management-system-chi-inky.vercel.app