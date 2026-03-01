-- ============================================================
-- UMS Pro — Database Setup Script
-- Запустите в pgAdmin Query Tool после создания базы "ums_pro"
-- ============================================================

-- Таблицы создаёт бэкенд автоматически при запуске.
-- Этот скрипт только создаёт базу данных если нужно.

-- Если вы хотите пересоздать таблицы вручную:
DROP TABLE IF EXISTS refresh_tokens   CASCADE;
DROP TABLE IF EXISTS activity_log     CASCADE;
DROP TABLE IF EXISTS notifications    CASCADE;
DROP TABLE IF EXISTS tasks            CASCADE;
DROP TABLE IF EXISTS users            CASCADE;
DROP TABLE IF EXISTS departments      CASCADE;

-- После выполнения просто запустите бэкенд — он создаст всё сам.
-- Тестовые данные будут вставлены автоматически при первом запуске.

-- Тестовые аккаунты (после запуска бэкенда):
-- admin@demo.com    / admin123    (Admin)
-- manager@demo.com  / manager123  (Manager)
-- james@demo.com    / user123     (User)
-- + 7 других пользователей
