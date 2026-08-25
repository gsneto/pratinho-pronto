-- Dados exclusivamente demonstrativos para o MVP.
-- Não representam prescrição ou recomendação profissional individual.

insert into public.ingredients (name, category) values
  ('Abacate', 'fruit'), ('Arroz', 'grain'), ('Aveia', 'grain'),
  ('Banana', 'fruit'), ('Batata', 'vegetable'), ('Batata-doce', 'vegetable'),
  ('Beterraba', 'vegetable'), ('Brócolis', 'vegetable'), ('Carne bovina', 'protein'),
  ('Cenoura', 'vegetable'), ('Chia', 'grain'), ('Ervilha', 'vegetable'),
  ('Espinafre', 'vegetable'), ('Feijão', 'protein'), ('Frango', 'protein'),
  ('Grão-de-bico', 'protein'), ('Iogurte natural', 'dairy'), ('Lentilha', 'protein'),
  ('Maçã', 'fruit'), ('Mamão', 'fruit'), ('Manga', 'fruit'),
  ('Mandioca', 'vegetable'), ('Melão', 'fruit'), ('Ovo', 'protein'),
  ('Pão integral', 'grain'), ('Pera', 'fruit'), ('Peixe', 'protein'),
  ('Polenta', 'grain'), ('Quinoa', 'grain'), ('Abóbora', 'vegetable'),
  ('Abobrinha', 'vegetable'), ('Peru', 'protein'), ('Água', 'other')
on conflict (name) do update set category = excluded.category;

insert into public.recipes (
  name, description, min_age_months, meal_type, prep_time_minutes,
  instructions, serving_notes, storage_notes, substitutions, is_demo
) values
  ('Mingau de banana e aveia', 'Mingau cremoso demonstrativo com banana amassada.', 6, 'breakfast', 12, 'Cozinhe a aveia com água até ficar macia. Desligue e misture a banana amassada.', 'Ajuste a textura à fase do bebê.', 'Refrigerar por até 24 horas.', 'A banana pode ser trocada por pera madura.', true),
  ('Creme de maçã com aveia', 'Creme morno demonstrativo de maçã cozida.', 6, 'breakfast', 15, 'Cozinhe a maçã em pouca água. Amasse e misture com a aveia já cozida.', 'Sirva morno e em textura adequada.', 'Refrigerar por até 24 horas.', 'Use pera no lugar da maçã.', true),
  ('Mamão com aveia macia', 'Combinação demonstrativa rápida para a manhã.', 6, 'breakfast', 5, 'Amasse o mamão e misture a aveia previamente hidratada.', 'Sirva logo após o preparo.', 'Não recomendado para congelamento.', 'Use banana madura no lugar do mamão.', true),
  ('Panquequinha de abóbora', 'Panquequinha demonstrativa macia de abóbora e ovo.', 8, 'breakfast', 18, 'Misture a abóbora amassada com ovo e aveia. Cozinhe pequenas porções em frigideira antiaderente até firmar dos dois lados.', 'Corte conforme a forma de oferta escolhida.', 'Refrigerar por até 24 horas.', 'Use batata-doce cozida no lugar da abóbora.', true),
  ('Pão macio com abacate', 'Opção demonstrativa simples com abacate amassado.', 9, 'breakfast', 5, 'Amasse o abacate e espalhe uma camada fina no pão macio.', 'Ofereça em formato e textura adequados.', 'Preparar no momento de servir.', 'O pão pode ser substituído conforme as restrições da família.', true),
  ('Quinoa cremosa com pera', 'Creme demonstrativo de quinoa e pera cozida.', 8, 'breakfast', 20, 'Cozinhe a quinoa até ficar muito macia. Misture a pera cozida e amassada.', 'Ajuste com água se necessário.', 'Refrigerar por até 24 horas.', 'Use maçã no lugar da pera.', true),

  ('Frango com batata e cenoura', 'Prato demonstrativo com ingredientes cotidianos.', 6, 'lunch', 30, 'Cozinhe o frango, a batata e a cenoura até ficarem macios. Desfie e amasse separadamente antes de servir.', 'Mantenha os alimentos reconhecíveis quando possível.', 'Refrigerar por até 24 horas ou congelar em porções.', 'A batata pode ser trocada por mandioca.', true),
  ('Arroz com lentilha e abóbora', 'Refeição demonstrativa sem carne.', 7, 'lunch', 35, 'Cozinhe arroz, lentilha e abóbora até ficarem macios. Amasse levemente, sem liquidificar.', 'Sirva os componentes juntos ou separados.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use feijão no lugar da lentilha.', true),
  ('Peixe com batata-doce e abobrinha', 'Prato demonstrativo de peixe e legumes.', 8, 'lunch', 28, 'Cozinhe o peixe completamente e retire todas as espinhas. Cozinhe os legumes e amasse conforme necessário.', 'Confira cuidadosamente a ausência de espinhas.', 'Refrigerar por até 24 horas.', 'Use frango no lugar do peixe se já introduzido.', true),
  ('Carne com polenta e espinafre', 'Combinação demonstrativa de carne desfiada e polenta.', 8, 'lunch', 35, 'Cozinhe a carne até ficar macia e desfie. Prepare a polenta e junte o espinafre picado no final.', 'Sirva em pequenas porções.', 'Refrigerar por até 24 horas.', 'Use frango desfiado no lugar da carne.', true),
  ('Grão-de-bico com brócolis', 'Purê rústico demonstrativo com grão-de-bico.', 8, 'lunch', 30, 'Cozinhe bem o grão-de-bico e retire peles soltas. Amasse com brócolis cozido.', 'Ajuste a consistência com água do cozimento.', 'Refrigerar por até 24 horas.', 'Use lentilha bem cozida no lugar do grão-de-bico.', true),
  ('Peru com arroz e beterraba', 'Refeição demonstrativa colorida e simples.', 9, 'lunch', 32, 'Cozinhe o peru, desfie e sirva com arroz e beterraba bem macios.', 'Amasse cada componente conforme necessário.', 'Refrigerar por até 24 horas.', 'Use frango no lugar do peru.', true),

  ('Banana com abacate', 'Lanche demonstrativo de dois ingredientes.', 6, 'snack', 5, 'Amasse banana e abacate até obter a textura desejada.', 'Sirva imediatamente.', 'Não recomendado para armazenamento.', 'Use mamão no lugar da banana.', true),
  ('Maçã assada com aveia', 'Lanche demonstrativo macio e aromático.', 7, 'snack', 20, 'Asse ou cozinhe a maçã até ficar macia. Amasse e finalize com aveia hidratada.', 'Espere amornar antes de servir.', 'Refrigerar por até 24 horas.', 'Use pera no lugar da maçã.', true),
  ('Mamão com iogurte natural', 'Lanche demonstrativo cremoso.', 7, 'snack', 5, 'Amasse o mamão e misture com iogurte natural sem açúcar.', 'Sirva logo após misturar.', 'Manter refrigerado e consumir no mesmo dia.', 'Use banana no lugar do mamão.', true),
  ('Manga com chia hidratada', 'Lanche demonstrativo de manga amassada.', 8, 'snack', 10, 'Hidrate a chia em água. Misture uma pequena porção à manga bem amassada.', 'Verifique a textura antes de servir.', 'Refrigerar por até 12 horas.', 'Use mamão no lugar da manga.', true),
  ('Panquequinha de pera', 'Panquequinha demonstrativa macia para o lanche.', 8, 'snack', 18, 'Misture pera ralada, ovo e aveia. Cozinhe pequenas porções dos dois lados.', 'Corte conforme a forma de oferta.', 'Refrigerar por até 24 horas.', 'Use maçã no lugar da pera.', true),
  ('Melão com banana amassada', 'Lanche demonstrativo fresco e rápido.', 7, 'snack', 5, 'Amasse o melão macio com banana até a textura desejada.', 'Sirva no momento do preparo.', 'Não recomendado para armazenamento.', 'Use mamão no lugar do melão.', true),

  ('Creme de abóbora com arroz', 'Jantar demonstrativo cremoso sem liquidificar.', 6, 'dinner', 25, 'Cozinhe a abóbora e o arroz até ficarem bem macios. Amasse e misture.', 'Ajuste a textura com água do cozimento.', 'Refrigerar por até 24 horas.', 'Use batata no lugar da abóbora.', true),
  ('Frango com mandioca', 'Combinação demonstrativa simples para o jantar.', 7, 'dinner', 32, 'Cozinhe a mandioca até ficar macia. Cozinhe e desfie o frango, misturando apenas ao servir.', 'Retire qualquer fibra dura da mandioca.', 'Refrigerar por até 24 horas.', 'Use batata-doce no lugar da mandioca.', true),
  ('Feijão com cenoura e arroz', 'Jantar demonstrativo com feijão amassado.', 7, 'dinner', 30, 'Cozinhe os ingredientes até ficarem macios. Amasse o feijão e a cenoura e sirva com arroz.', 'Ajuste a textura à fase do bebê.', 'Refrigerar por até 24 horas.', 'Use lentilha no lugar do feijão.', true),
  ('Omelete macia de abobrinha', 'Omelete demonstrativa com abobrinha ralada.', 8, 'dinner', 15, 'Misture ovo e abobrinha ralada. Cozinhe completamente em frigideira antiaderente.', 'Corte em tiras ou pedaços adequados.', 'Refrigerar por até 24 horas.', 'Use cenoura ralada no lugar da abobrinha.', true),
  ('Sopa rústica de batata e ervilha', 'Sopa demonstrativa espessa com pedaços macios.', 8, 'dinner', 28, 'Cozinhe batata e ervilha até ficarem macias. Amasse parte dos ingredientes, mantendo textura.', 'Sirva morna, não quente.', 'Refrigerar por até 24 horas.', 'Use abóbora no lugar da batata.', true),
  ('Quinoa com legumes macios', 'Jantar demonstrativo de quinoa, cenoura e brócolis.', 9, 'dinner', 30, 'Cozinhe a quinoa e os legumes até ficarem bem macios. Pique ou amasse conforme necessário.', 'Sirva em pequenas porções.', 'Refrigerar por até 24 horas.', 'Use arroz no lugar da quinoa.', true)
on conflict (name) do update set
  description = excluded.description,
  min_age_months = excluded.min_age_months,
  meal_type = excluded.meal_type,
  prep_time_minutes = excluded.prep_time_minutes,
  instructions = excluded.instructions,
  serving_notes = excluded.serving_notes,
  storage_notes = excluded.storage_notes,
  substitutions = excluded.substitutions,
  is_demo = true,
  is_active = true;

with recipe_data(recipe_name, ingredient_name, quantity, unit, is_optional) as (
  values
    ('Mingau de banana e aveia', 'Banana', 1, 'unidade', false), ('Mingau de banana e aveia', 'Aveia', 2, 'colher de sopa', false), ('Mingau de banana e aveia', 'Água', 120, 'ml', false),
    ('Creme de maçã com aveia', 'Maçã', 1, 'unidade', false), ('Creme de maçã com aveia', 'Aveia', 2, 'colher de sopa', false), ('Creme de maçã com aveia', 'Água', 120, 'ml', false),
    ('Mamão com aveia macia', 'Mamão', 0.5, 'unidade', false), ('Mamão com aveia macia', 'Aveia', 1, 'colher de sopa', false),
    ('Panquequinha de abóbora', 'Abóbora', 3, 'colher de sopa', false), ('Panquequinha de abóbora', 'Ovo', 1, 'unidade', false), ('Panquequinha de abóbora', 'Aveia', 1, 'colher de sopa', false),
    ('Pão macio com abacate', 'Pão integral', 1, 'fatia', false), ('Pão macio com abacate', 'Abacate', 2, 'colher de sopa', false),
    ('Quinoa cremosa com pera', 'Quinoa', 3, 'colher de sopa', false), ('Quinoa cremosa com pera', 'Pera', 1, 'unidade', false), ('Quinoa cremosa com pera', 'Água', 150, 'ml', false),
    ('Frango com batata e cenoura', 'Frango', 80, 'g', false), ('Frango com batata e cenoura', 'Batata', 1, 'unidade', false), ('Frango com batata e cenoura', 'Cenoura', 0.5, 'unidade', false),
    ('Arroz com lentilha e abóbora', 'Arroz', 3, 'colher de sopa', false), ('Arroz com lentilha e abóbora', 'Lentilha', 2, 'colher de sopa', false), ('Arroz com lentilha e abóbora', 'Abóbora', 3, 'colher de sopa', false),
    ('Peixe com batata-doce e abobrinha', 'Peixe', 80, 'g', false), ('Peixe com batata-doce e abobrinha', 'Batata-doce', 1, 'unidade', false), ('Peixe com batata-doce e abobrinha', 'Abobrinha', 0.5, 'unidade', false),
    ('Carne com polenta e espinafre', 'Carne bovina', 80, 'g', false), ('Carne com polenta e espinafre', 'Polenta', 3, 'colher de sopa', false), ('Carne com polenta e espinafre', 'Espinafre', 1, 'colher de sopa', false),
    ('Grão-de-bico com brócolis', 'Grão-de-bico', 3, 'colher de sopa', false), ('Grão-de-bico com brócolis', 'Brócolis', 3, 'colher de sopa', false),
    ('Peru com arroz e beterraba', 'Peru', 80, 'g', false), ('Peru com arroz e beterraba', 'Arroz', 3, 'colher de sopa', false), ('Peru com arroz e beterraba', 'Beterraba', 0.5, 'unidade', false),
    ('Banana com abacate', 'Banana', 1, 'unidade', false), ('Banana com abacate', 'Abacate', 2, 'colher de sopa', false),
    ('Maçã assada com aveia', 'Maçã', 1, 'unidade', false), ('Maçã assada com aveia', 'Aveia', 1, 'colher de sopa', false),
    ('Mamão com iogurte natural', 'Mamão', 0.5, 'unidade', false), ('Mamão com iogurte natural', 'Iogurte natural', 3, 'colher de sopa', false),
    ('Manga com chia hidratada', 'Manga', 0.5, 'unidade', false), ('Manga com chia hidratada', 'Chia', 1, 'colher de chá', false), ('Manga com chia hidratada', 'Água', 30, 'ml', false),
    ('Panquequinha de pera', 'Pera', 1, 'unidade', false), ('Panquequinha de pera', 'Ovo', 1, 'unidade', false), ('Panquequinha de pera', 'Aveia', 1, 'colher de sopa', false),
    ('Melão com banana amassada', 'Melão', 1, 'fatia', false), ('Melão com banana amassada', 'Banana', 1, 'unidade', false),
    ('Creme de abóbora com arroz', 'Abóbora', 4, 'colher de sopa', false), ('Creme de abóbora com arroz', 'Arroz', 2, 'colher de sopa', false), ('Creme de abóbora com arroz', 'Água', 150, 'ml', false),
    ('Frango com mandioca', 'Frango', 80, 'g', false), ('Frango com mandioca', 'Mandioca', 100, 'g', false),
    ('Feijão com cenoura e arroz', 'Feijão', 3, 'colher de sopa', false), ('Feijão com cenoura e arroz', 'Cenoura', 0.5, 'unidade', false), ('Feijão com cenoura e arroz', 'Arroz', 2, 'colher de sopa', false),
    ('Omelete macia de abobrinha', 'Ovo', 1, 'unidade', false), ('Omelete macia de abobrinha', 'Abobrinha', 0.5, 'unidade', false),
    ('Sopa rústica de batata e ervilha', 'Batata', 1, 'unidade', false), ('Sopa rústica de batata e ervilha', 'Ervilha', 3, 'colher de sopa', false), ('Sopa rústica de batata e ervilha', 'Água', 180, 'ml', false),
    ('Quinoa com legumes macios', 'Quinoa', 3, 'colher de sopa', false), ('Quinoa com legumes macios', 'Cenoura', 0.5, 'unidade', false), ('Quinoa com legumes macios', 'Brócolis', 2, 'colher de sopa', false)
)
insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional)
select r.id, i.id, d.quantity, d.unit, d.is_optional
from recipe_data d
join public.recipes r on r.name = d.recipe_name
join public.ingredients i on i.name = d.ingredient_name
on conflict (recipe_id, ingredient_id, unit) do update
set quantity = excluded.quantity, is_optional = excluded.is_optional;

with allergen_data(recipe_name, allergen) as (
  values
    ('Panquequinha de abóbora', 'ovo'),
    ('Pão macio com abacate', 'glúten'),
    ('Mamão com iogurte natural', 'leite'),
    ('Panquequinha de pera', 'ovo'),
    ('Omelete macia de abobrinha', 'ovo'),
    ('Peixe com batata-doce e abobrinha', 'peixe')
)
insert into public.recipe_allergens (recipe_id, allergen)
select r.id, a.allergen
from allergen_data a
join public.recipes r on r.name = a.recipe_name
on conflict (recipe_id, allergen) do nothing;
