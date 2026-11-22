-- Applied to Supabase project uotcoobumftugaprnhso on 2026-11-19.
-- Idempotent permission hardening: do not expose the admin predicate to anonymous callers.
-- The authenticated role can invoke this predicate, but the function checks
-- auth.uid(), role='admin' and status='active' before returning true.
REVOKE EXECUTE ON FUNCTION public.vp_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vp_is_admin() TO authenticated, service_role;

-- Verification (read-only):
-- SELECT has_function_privilege('anon','public.vp_is_admin()','EXECUTE') AS anon_execute,
--        has_function_privilege('authenticated','public.vp_is_admin()','EXECUTE') AS authenticated_execute,
--        has_function_privilege('service_role','public.vp_is_admin()','EXECUTE') AS service_execute;
