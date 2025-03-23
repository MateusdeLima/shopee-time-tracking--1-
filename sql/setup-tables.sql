-- Script para criar as tabelas no Supabase
-- Execute este script no SQL Editor do Supabase Studio

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de feriados
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  deadline DATE NOT NULL,
  max_hours INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de registros de horas extras
CREATE TABLE IF NOT EXISTS overtime_records (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  holiday_id INTEGER NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
  holiday_name TEXT NOT NULL,
  date DATE NOT NULL,
  option_id TEXT NOT NULL,
  option_label TEXT NOT NULL,
  hours INTEGER NOT NULL,
  start_time TEXT,
  end_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de registros de ponto
CREATE TABLE IF NOT EXISTS time_clock_records (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  holiday_id INTEGER NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
  overtime_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de registros de ausências
CREATE TABLE IF NOT EXISTS absence_records (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  custom_reason TEXT,
  dates TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'approved')),
  proof_document TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range JSONB
);

-- Inserir feriados iniciais se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM holidays LIMIT 1) THEN
    INSERT INTO holidays (name, date, active, deadline, max_hours)
    VALUES
      ('Natal', '2023-12-25', true, '2024-01-10', 2),
      ('Ano Novo', '2024-01-01', true, '2024-01-15', 2),
      ('Carnaval', '2024-02-13', true, '2024-02-28', 2);
  END IF;
END $$; 