-- Restores unauthenticated reading of published partner terms.
-- Do not grant anonymous EXECUTE on vp_is_admin().
-- Previously the public policy called vp_is_admin() for anon, causing 42501.
drop policy if exists vp_terms_read on public.vp_terms;
create policy vp_terms_published_read on public.vp_terms
  for select to anon, authenticated using (status = 'published');
create policy vp_terms_admin_read on public.vp_terms
  for select to authenticated using (public.vp_is_admin());
