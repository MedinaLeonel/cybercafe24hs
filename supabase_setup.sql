-- Tabla usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- Note: Supabase Auth handles passwords, but this table might be for extra user data or legacy if not using Auth fully. If using Supabase Auth, ‘profiles’ is better linked to auth.users. Following user prompt exactly though.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla registros de presencia
CREATE TABLE IF NOT EXISTS presence_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  actividad TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla servicios/rituales
CREATE TABLE IF NOT EXISTS servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  nombre TEXT NOT NULL,
  fecha_programada DATE NOT NULL,
  notas TEXT,
  completado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla torneos
CREATE TABLE IF NOT EXISTS torneos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  juego TEXT NOT NULL,
  fecha DATE NOT NULL,
  participantes TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
