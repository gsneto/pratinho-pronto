-- Ajusta o texto editorial visível sem alterar o conteúdo ou a compatibilidade das receitas.
update public.recipes
set description = trim(regexp_replace(description, '\mdemonstrativo\M\s*', '', 'gi'))
where description ~* '\mdemonstrativo\M';
