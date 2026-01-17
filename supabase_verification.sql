-- SCRIPT DE VERIFICACIÓN DE RLS
-- Ejecutar después de las políticas

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('presence_logs', 'servicios', 'torneos');

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('presence_logs', 'servicios', 'torneos')
ORDER BY tablename, policyname;
