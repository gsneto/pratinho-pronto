-- Rastreia a revisão profissional do conteúdo editorial do catálogo.
--
-- Esta migração NÃO altera `is_demo` nem `is_active`. A apresentação ao
-- usuário continua governada por `is_active`; `is_demo` segue marcando o
-- material de demonstração/fixture usado no ambiente de QA. Nenhuma receita é
-- publicada, ocultada ou promovida aqui.
--
-- O campo abaixo apenas registra que idade mínima, texturas, cortes e
-- alergênicos ainda dependem de revisão por profissional qualificado. Assim a
-- operação pode distinguir "publicado" de "revisado", sem confundir as duas
-- coisas nem esconder a pendência.
alter table public.recipes
  add column if not exists content_review_status text not null
  default 'pending_professional_review'
  check (content_review_status in ('pending_professional_review', 'reviewed'));

comment on column public.recipes.content_review_status is
  'Status de revisão profissional (idade, textura, cortes, alergênicos). Não implica publicação.';

-- Nenhum UPDATE é executado: todos os registros existentes permanecem
-- explicitamente pendentes de revisão profissional.
