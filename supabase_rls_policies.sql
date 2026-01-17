-- POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- Ejecutar en Supabase SQL Editor

-- 1. presence_logs: Solo el usuario dueño puede hacer todo
ALTER TABLE presence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own presence logs" 
ON presence_logs 
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. servicios: Solo el usuario dueño puede hacer todo
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own services" 
ON servicios 
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. torneos: Lectura pública, escritura restringida
ALTER TABLE torneos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tournaments" 
ON torneos FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tournaments" 
ON torneos FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only creator can update tournaments" 
ON torneos FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only creator can delete tournaments" 
ON torneos FOR DELETE 
USING (auth.uid() = user_id);

-- 4. users (tabla de Supabase Auth): Solo lectura propia
-- Nota: Usualmente 'users' refiere a auth.users, la cual no gestionamos directamente con políticas SQL en 'public' 
-- a menos que hayamos creado una tabla public.users espejo. 
-- Si tienes una tabla public.users, descomenta lo siguiente:

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own profile" 
-- ON users FOR SELECT 
-- USING (auth.uid() = id);
