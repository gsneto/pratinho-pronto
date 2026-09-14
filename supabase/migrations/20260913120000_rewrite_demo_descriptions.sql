-- Reescreve as descrições que ainda carregavam a marca "demonstrativo/a"
-- diretamente na origem. A migration anterior (20260827103000) só removia a
-- forma masculina singular via regex, deixando o feminino intacto — e
-- publicRecipeText() em runtime só disfarça o resíduo.
--
-- Aqui cada receita recebe uma descrição curta, editorial e natural, sem
-- promessa de saúde nem prescrição pediátrica. O objetivo é falar da técnica
-- de cozinha e do resultado no prato, não recomendar a receita a uma idade
-- específica. publicRecipeText() permanece como rede de segurança para
-- qualquer texto novo que ainda contenha a marca antiga.

update public.recipes as r
set description = new_description
from (
  values
    -- Café da manhã
    ('Mingau de banana e aveia', 'Mingau cremoso de aveia finalizado com banana amassada.'),
    ('Creme de maçã com aveia', 'Creme morno de maçã cozida misturada à aveia.'),
    ('Mamão com aveia macia', 'Mamão amassado com aveia hidratada, pronto rápido.'),
    ('Panquequinha de abóbora', 'Panquequinhas macias de abóbora, ovo e aveia, feitas na frigideira.'),
    ('Pão macio com abacate', 'Pão macio com uma camada fina de abacate amassado.'),
    ('Quinoa cremosa com pera', 'Quinoa cozida em ponto cremoso, finalizada com pera amassada.'),
    -- Almoço
    ('Frango com batata e cenoura', 'Frango desfiado servido com batata e cenoura bem cozidas.'),
    ('Arroz com lentilha e abóbora', 'Combinação sem carne de arroz, lentilha e abóbora cozidos até macios.'),
    ('Peixe com batata-doce e abobrinha', 'Peixe totalmente cozido acompanhado de batata-doce e abobrinha macias.'),
    ('Carne com polenta e espinafre', 'Carne desfiada com polenta cremosa e espinafre picado.'),
    ('Grão-de-bico com brócolis', 'Purê rústico de grão-de-bico bem cozido com brócolis.'),
    ('Peru com arroz e beterraba', 'Peru desfiado com arroz e beterraba macia.'),
    -- Lanche
    ('Banana com abacate', 'Lanche cremoso de dois ingredientes: banana e abacate amassados.'),
    ('Maçã assada com aveia', 'Maçã assada até ficar macia, finalizada com aveia hidratada.'),
    ('Mamão com iogurte natural', 'Mamão amassado misturado ao iogurte natural sem açúcar.'),
    ('Manga com chia hidratada', 'Manga amassada com uma porção de chia previamente hidratada.'),
    ('Panquequinha de pera', 'Panquequinhas macias de pera ralada, ovo e aveia.'),
    ('Melão com banana amassada', 'Lanche fresco de melão maduro com banana amassada.'),
    -- Jantar
    ('Creme de abóbora com arroz', 'Creme espesso de abóbora e arroz, amassado sem liquidificar.'),
    ('Frango com mandioca', 'Frango desfiado servido com mandioca cozida e sem fibras duras.'),
    ('Feijão com cenoura e arroz', 'Feijão amassado com cenoura e arroz cozidos até macios.'),
    ('Omelete macia de abobrinha', 'Omelete bem cozida com abobrinha ralada.'),
    ('Sopa rústica de batata e ervilha', 'Sopa espessa de batata e ervilha, com pedaços macios preservados.'),
    ('Quinoa com legumes macios', 'Quinoa cozida com cenoura e brócolis em textura macia.')
) as replacements(recipe_name, new_description)
where r.name = replacements.recipe_name;

-- Sentinela: garante que nenhuma variante da palavra "demonstrativo/a/os/as"
-- sobreviva em descrições após a migration. Se sobrar, a migration falha em
-- vez de deixar o resíduo passar despercebido.
do $$
declare
  leftover integer;
begin
  select count(*) into leftover
  from public.recipes
  where description ~* '\mdemonstrativ[oa]s?\M';

  if leftover > 0 then
    raise exception 'Ainda restam % descrições com linguagem demonstrativa', leftover;
  end if;
end
$$;
