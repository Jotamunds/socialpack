-- SocialPack — identidade visual e metadados de reprodução
-- O formato/seed ficam em posts.generation_config (jsonb já existente), para não
-- exigir backfill nem alterar posts legados. Apenas o logo é uma nova propriedade
-- persistente da empresa.

alter table public.companies
  add column if not exists logo_url text;

alter table public.companies
  drop constraint if exists companies_logo_url_length;

alter table public.companies
  add constraint companies_logo_url_length
  check (logo_url is null or char_length(logo_url) <= 2048);
