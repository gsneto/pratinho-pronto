-- Expande o catálogo demonstrativo para 72 receitas (18 por tipo de refeição).
-- Conteúdo editorial baseado em alimentos in natura ou minimamente processados.
-- Não substitui avaliação individual nem revisão de nutricionista infantil.

insert into public.ingredients (name, category) values
  ('Couve', 'vegetable'),
  ('Flocão de milho', 'grain'),
  ('Pêssego', 'fruit')
on conflict (name) do update set category = excluded.category;

create temporary table catalog_expansion (
  name text primary key,
  description text not null,
  min_age_months integer not null,
  meal_type public.meal_type not null,
  prep_time_minutes integer not null,
  instructions text not null,
  serving_notes text,
  storage_notes text,
  substitutions text,
  ingredients jsonb not null,
  allergens text[] not null default '{}'
) on commit drop;

insert into catalog_expansion values
  ('Cuscuz macio com ovo', 'Café da manhã macio com milho e ovo completamente cozido.', 8, 'breakfast', 15,
   'Hidrate o flocão com a água e cozinhe no vapor até ficar macio. Cozinhe o ovo mexido até não restar parte líquida e sirva junto ao cuscuz.',
   'Umedeça o cuscuz e ajuste o tamanho dos pedaços à fase do bebê.', 'Refrigerar por até 24 horas.', 'Troque o ovo por abacate se já fizer parte da alimentação.',
   $json$[{"name":"Flocão de milho","quantity":3,"unit":"colher de sopa"},{"name":"Água","quantity":45,"unit":"ml"},{"name":"Ovo","quantity":1,"unit":"unidade"}]$json$, array['ovo']),
  ('Cuscuz macio com banana', 'Cuscuz úmido servido com banana madura.', 8, 'breakfast', 15,
   'Hidrate o flocão com a água e cozinhe no vapor até ficar macio. Esfarele, umedeça se necessário e sirva com a banana amassada.',
   'Evite servir o cuscuz seco ou solto demais.', 'Preparar no momento de servir.', 'Use mamão no lugar da banana.',
   $json$[{"name":"Flocão de milho","quantity":3,"unit":"colher de sopa"},{"name":"Banana","quantity":1,"unit":"unidade"},{"name":"Água","quantity":50,"unit":"ml"}]$json$, '{}'),
  ('Creme de mamão com banana', 'Combinação rápida de duas frutas maduras.', 6, 'breakfast', 5,
   'Amasse o mamão e a banana separadamente e misture apenas na hora de servir.',
   'Ajuste a consistência à fase do bebê.', 'Preparar no momento de servir.', 'Use manga madura no lugar do mamão.',
   $json$[{"name":"Mamão","quantity":0.5,"unit":"unidade"},{"name":"Banana","quantity":1,"unit":"unidade"}]$json$, '{}'),
  ('Batata-doce amassada com ovo', 'Preparação macia com batata-doce e ovo.', 8, 'breakfast', 20,
   'Cozinhe a batata-doce até ficar macia e amasse. Cozinhe o ovo completamente, pique ou amasse e sirva ao lado.',
   'Confirme que o ovo esteja totalmente cozido.', 'Refrigerar por até 24 horas.', 'Use abóbora no lugar da batata-doce.',
   $json$[{"name":"Batata-doce","quantity":1,"unit":"unidade"},{"name":"Ovo","quantity":1,"unit":"unidade"}]$json$, array['ovo']),
  ('Aveia cremosa com manga', 'Aveia cozida finalizada com manga madura.', 6, 'breakfast', 12,
   'Cozinhe a aveia na água até ficar macia. Desligue o fogo, espere amornar e misture a manga amassada.',
   'Sirva sem açúcar e em consistência espessa.', 'Refrigerar por até 24 horas.', 'Use mamão no lugar da manga.',
   $json$[{"name":"Aveia","quantity":2,"unit":"colher de sopa"},{"name":"Manga","quantity":0.5,"unit":"unidade"},{"name":"Água","quantity":120,"unit":"ml"}]$json$, '{}'),
  ('Abacate com banana e aveia', 'Creme de frutas com aveia previamente hidratada.', 6, 'breakfast', 7,
   'Hidrate a aveia em água quente até amaciar. Espere esfriar e misture ao abacate e à banana amassados.',
   'Sirva logo após o preparo.', 'Não recomendado para congelamento.', 'Use mamão no lugar da banana.',
   $json$[{"name":"Abacate","quantity":2,"unit":"colher de sopa"},{"name":"Banana","quantity":1,"unit":"unidade"},{"name":"Aveia","quantity":1,"unit":"colher de sopa"}]$json$, '{}'),
  ('Creme de abóbora com aveia', 'Creme salgado de abóbora com aveia macia.', 6, 'breakfast', 18,
   'Cozinhe a abóbora até ficar macia. Amasse e misture à aveia cozida em água até formar um creme espesso.',
   'Sirva morno e sem temperos ultraprocessados.', 'Refrigerar por até 24 horas.', 'Use batata-doce no lugar da abóbora.',
   $json$[{"name":"Abóbora","quantity":4,"unit":"colher de sopa"},{"name":"Aveia","quantity":2,"unit":"colher de sopa"},{"name":"Água","quantity":100,"unit":"ml"}]$json$, '{}'),
  ('Panquequinha de banana', 'Panquequinha macia de banana, ovo e aveia.', 8, 'breakfast', 15,
   'Misture banana amassada, ovo e aveia. Cozinhe pequenas porções em frigideira antiaderente até firmarem completamente dos dois lados.',
   'Corte em formato adequado e confirme o cozimento do centro.', 'Refrigerar por até 24 horas.', 'Use pera madura no lugar da banana.',
   $json$[{"name":"Banana","quantity":1,"unit":"unidade"},{"name":"Ovo","quantity":1,"unit":"unidade"},{"name":"Aveia","quantity":1,"unit":"colher de sopa"}]$json$, array['ovo']),
  ('Cuscuz macio com abacate', 'Cuscuz hidratado servido com abacate amassado.', 8, 'breakfast', 15,
   'Hidrate o flocão com a água e cozinhe no vapor. Esfarele, umedeça se necessário e sirva com o abacate amassado.',
   'Evite servir o cuscuz seco ou solto demais.', 'Preparar no momento de servir.', 'Use banana no lugar do abacate.',
   $json$[{"name":"Flocão de milho","quantity":3,"unit":"colher de sopa"},{"name":"Água","quantity":50,"unit":"ml"},{"name":"Abacate","quantity":2,"unit":"colher de sopa"}]$json$, '{}'),
  ('Pera cozida com chia hidratada', 'Pera macia com pequena porção de chia hidratada.', 8, 'breakfast', 12,
   'Hidrate a chia na água até formar gel. Cozinhe a pera até ficar macia, amasse e misture a chia hidratada.',
   'Não ofereça a chia seca.', 'Refrigerar por até 12 horas.', 'Use maçã no lugar da pera.',
   $json$[{"name":"Pera","quantity":1,"unit":"unidade"},{"name":"Chia","quantity":1,"unit":"colher de chá"},{"name":"Água","quantity":30,"unit":"ml"}]$json$, '{}'),
  ('Quinoa cremosa com banana', 'Quinoa bem cozida com banana madura.', 7, 'breakfast', 20,
   'Cozinhe a quinoa na água até ficar muito macia. Espere amornar e misture a banana amassada.',
   'Ajuste com pouca água se necessário.', 'Refrigerar por até 24 horas.', 'Use manga no lugar da banana.',
   $json$[{"name":"Quinoa","quantity":3,"unit":"colher de sopa"},{"name":"Banana","quantity":1,"unit":"unidade"},{"name":"Água","quantity":150,"unit":"ml"}]$json$, '{}'),
  ('Omelete macia de espinafre', 'Omelete totalmente cozida com espinafre picado.', 8, 'breakfast', 15,
   'Cozinhe o espinafre e pique bem. Misture ao ovo e cozinhe em frigideira antiaderente até não restar parte líquida.',
   'Corte em tiras ou pedaços adequados.', 'Refrigerar por até 24 horas.', 'Use couve bem picada no lugar do espinafre.',
   $json$[{"name":"Ovo","quantity":1,"unit":"unidade"},{"name":"Espinafre","quantity":1,"unit":"colher de sopa"}]$json$, array['ovo']),

  ('Carne com mandioca e abóbora', 'Almoço com carne macia, tubérculo e legume.', 7, 'lunch', 38,
   'Cozinhe a carne completamente até ficar macia. Cozinhe mandioca e abóbora, retire fibras duras e amasse ou pique os componentes.',
   'Sirva os alimentos separados ou combinados, conforme a fase.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use batata no lugar da mandioca.',
   $json$[{"name":"Carne bovina","quantity":80,"unit":"g"},{"name":"Mandioca","quantity":80,"unit":"g"},{"name":"Abóbora","quantity":3,"unit":"colher de sopa"}]$json$, '{}'),
  ('Frango com arroz e brócolis', 'Combinação cotidiana de frango, cereal e legume.', 6, 'lunch', 32,
   'Cozinhe o frango completamente e desfie. Cozinhe arroz e brócolis até ficarem macios e ajuste a textura antes de servir.',
   'Confira se não há pedaços duros ou ossos.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use quinoa no lugar do arroz.',
   $json$[{"name":"Frango","quantity":80,"unit":"g"},{"name":"Arroz","quantity":3,"unit":"colher de sopa"},{"name":"Brócolis","quantity":2,"unit":"colher de sopa"}]$json$, '{}'),
  ('Peixe com arroz e cenoura', 'Peixe completamente cozido com arroz e cenoura.', 8, 'lunch', 30,
   'Cozinhe o peixe completamente e retire pele e todas as espinhas. Sirva com arroz e cenoura bem macios.',
   'Revise cuidadosamente cada porção antes de oferecer.', 'Refrigerar por até 24 horas.', 'Use frango no lugar do peixe se já introduzido.',
   $json$[{"name":"Peixe","quantity":80,"unit":"g"},{"name":"Arroz","quantity":3,"unit":"colher de sopa"},{"name":"Cenoura","quantity":0.5,"unit":"unidade"}]$json$, array['peixe']),
  ('Lentilha com batata-doce e couve', 'Refeição sem carne com leguminosa, tubérculo e folha.', 7, 'lunch', 32,
   'Cozinhe a lentilha e a batata-doce até ficarem macias. Cozinhe a couve, pique bem e misture ou sirva separadamente.',
   'Amasse levemente, mantendo textura adequada.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use espinafre no lugar da couve.',
   $json$[{"name":"Lentilha","quantity":3,"unit":"colher de sopa"},{"name":"Batata-doce","quantity":1,"unit":"unidade"},{"name":"Couve","quantity":1,"unit":"colher de sopa"}]$json$, '{}'),
  ('Feijão com abóbora e arroz', 'Prato simples com feijão, arroz e abóbora.', 6, 'lunch', 30,
   'Cozinhe o feijão até ficar macio e amasse parte dos grãos. Sirva com arroz e abóbora bem cozidos.',
   'Ajuste a textura sem peneirar ou liquidificar.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use lentilha no lugar do feijão.',
   $json$[{"name":"Feijão","quantity":3,"unit":"colher de sopa"},{"name":"Abóbora","quantity":3,"unit":"colher de sopa"},{"name":"Arroz","quantity":2,"unit":"colher de sopa"}]$json$, '{}'),
  ('Grão-de-bico com cenoura e quinoa', 'Almoço vegetal com grão-de-bico bem cozido.', 8, 'lunch', 35,
   'Cozinhe o grão-de-bico até ficar muito macio e retire peles soltas. Sirva amassado com cenoura e quinoa cozidas.',
   'Ajuste a umidade com água do cozimento.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use lentilha no lugar do grão-de-bico.',
   $json$[{"name":"Grão-de-bico","quantity":3,"unit":"colher de sopa"},{"name":"Cenoura","quantity":0.5,"unit":"unidade"},{"name":"Quinoa","quantity":3,"unit":"colher de sopa"}]$json$, '{}'),
  ('Frango com polenta e abobrinha', 'Frango desfiado com polenta cremosa e abobrinha.', 7, 'lunch', 32,
   'Cozinhe o frango completamente e desfie. Prepare a polenta macia e cozinhe a abobrinha até ficar tenra.',
   'Sirva a polenta úmida, sem formar blocos firmes.', 'Refrigerar por até 24 horas.', 'Use arroz no lugar da polenta.',
   $json$[{"name":"Frango","quantity":80,"unit":"g"},{"name":"Polenta","quantity":3,"unit":"colher de sopa"},{"name":"Abobrinha","quantity":0.5,"unit":"unidade"}]$json$, '{}'),
  ('Carne com batata e beterraba', 'Carne macia acompanhada de batata e beterraba.', 8, 'lunch', 38,
   'Cozinhe a carne completamente até ficar macia e desfie. Cozinhe a batata e a beterraba até aceitarem pressão do garfo.',
   'Pique ou amasse conforme as habilidades do bebê.', 'Refrigerar por até 24 horas.', 'Use mandioca no lugar da batata.',
   $json$[{"name":"Carne bovina","quantity":80,"unit":"g"},{"name":"Batata","quantity":1,"unit":"unidade"},{"name":"Beterraba","quantity":0.5,"unit":"unidade"}]$json$, '{}'),
  ('Peixe com mandioca e espinafre', 'Peixe cozido com mandioca macia e espinafre.', 9, 'lunch', 34,
   'Cozinhe o peixe completamente e elimine todas as espinhas. Cozinhe a mandioca, retire fibras e sirva com espinafre cozido e picado.',
   'Revise o peixe e ajuste a textura de cada componente.', 'Refrigerar por até 24 horas.', 'Use batata-doce no lugar da mandioca.',
   $json$[{"name":"Peixe","quantity":80,"unit":"g"},{"name":"Mandioca","quantity":90,"unit":"g"},{"name":"Espinafre","quantity":1,"unit":"colher de sopa"}]$json$, array['peixe']),
  ('Peru com quinoa e brócolis', 'Peru macio com quinoa e brócolis.', 9, 'lunch', 34,
   'Cozinhe o peru completamente até ficar macio e desfie. Cozinhe quinoa e brócolis até atingirem textura macia.',
   'Sirva em pequenas porções e ajuste a textura.', 'Refrigerar por até 24 horas.', 'Use frango no lugar do peru.',
   $json$[{"name":"Peru","quantity":80,"unit":"g"},{"name":"Quinoa","quantity":3,"unit":"colher de sopa"},{"name":"Brócolis","quantity":2,"unit":"colher de sopa"}]$json$, '{}'),
  ('Lentilha com arroz e beterraba', 'Lentilha macia com arroz e beterraba.', 7, 'lunch', 32,
   'Cozinhe lentilha, arroz e beterraba até ficarem macios. Amasse levemente a lentilha e pique a beterraba.',
   'Sirva os componentes juntos ou separados.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use feijão no lugar da lentilha.',
   $json$[{"name":"Lentilha","quantity":3,"unit":"colher de sopa"},{"name":"Arroz","quantity":2,"unit":"colher de sopa"},{"name":"Beterraba","quantity":0.5,"unit":"unidade"}]$json$, '{}'),
  ('Ovo com batata e brócolis', 'Ovo completamente cozido com batata e brócolis.', 8, 'lunch', 22,
   'Cozinhe o ovo até gema e clara ficarem firmes. Cozinhe batata e brócolis até ficarem macios e sirva na textura adequada.',
   'Amasse ou corte os ingredientes e confirme o cozimento do ovo.', 'Refrigerar por até 24 horas.', 'Use abóbora no lugar da batata.',
   $json$[{"name":"Ovo","quantity":1,"unit":"unidade"},{"name":"Batata","quantity":1,"unit":"unidade"},{"name":"Brócolis","quantity":2,"unit":"colher de sopa"}]$json$, array['ovo']),

  ('Pera com abacate', 'Lanche cremoso de pera madura e abacate.', 6, 'snack', 5,
   'Amasse a pera madura e o abacate e misture na hora de servir.',
   'Use frutas macias e ajuste a textura.', 'Preparar no momento de servir.', 'Use banana no lugar da pera.',
   $json$[{"name":"Pera","quantity":1,"unit":"unidade"},{"name":"Abacate","quantity":2,"unit":"colher de sopa"}]$json$, '{}'),
  ('Manga com banana', 'Lanche rápido com frutas maduras.', 6, 'snack', 5,
   'Amasse a manga e a banana separadamente e misture antes de servir.',
   'Retire fibras duras da manga.', 'Preparar no momento de servir.', 'Use mamão no lugar da manga.',
   $json$[{"name":"Manga","quantity":0.5,"unit":"unidade"},{"name":"Banana","quantity":1,"unit":"unidade"}]$json$, '{}'),
  ('Iogurte natural com banana e aveia', 'Iogurte natural sem açúcar com fruta e aveia macia.', 7, 'snack', 7,
   'Hidrate a aveia até amaciar. Misture ao iogurte natural sem açúcar e à banana amassada.',
   'Mantenha refrigerado e sirva logo após misturar.', 'Consumir no mesmo dia.', 'Use mamão no lugar da banana.',
   $json$[{"name":"Iogurte natural","quantity":3,"unit":"colher de sopa"},{"name":"Banana","quantity":1,"unit":"unidade"},{"name":"Aveia","quantity":1,"unit":"colher de sopa"}]$json$, array['leite']),
  ('Maçã cozida com chia', 'Maçã macia com chia completamente hidratada.', 8, 'snack', 15,
   'Hidrate a chia na água até formar gel. Cozinhe a maçã até ficar macia, amasse e misture a chia.',
   'Não ofereça sementes secas.', 'Refrigerar por até 12 horas.', 'Use pera no lugar da maçã.',
   $json$[{"name":"Maçã","quantity":1,"unit":"unidade"},{"name":"Chia","quantity":1,"unit":"colher de chá"},{"name":"Água","quantity":30,"unit":"ml"}]$json$, '{}'),
  ('Mamão com pêssego', 'Combinação simples de mamão e pêssego maduros.', 7, 'snack', 6,
   'Amasse as frutas separadamente e misture na hora de servir.',
   'Retire o caroço e confira se não há partes duras.', 'Preparar no momento de servir.', 'Use pera no lugar do pêssego.',
   $json$[{"name":"Mamão","quantity":0.5,"unit":"unidade"},{"name":"Pêssego","quantity":1,"unit":"unidade"}]$json$, '{}'),
  ('Abacate com manga', 'Creme de abacate e manga madura.', 6, 'snack', 5,
   'Amasse o abacate e a manga até atingir a textura desejada.',
   'Retire fibras duras da manga.', 'Preparar no momento de servir.', 'Use banana no lugar da manga.',
   $json$[{"name":"Abacate","quantity":2,"unit":"colher de sopa"},{"name":"Manga","quantity":0.5,"unit":"unidade"}]$json$, '{}'),
  ('Pera com iogurte natural', 'Pera madura com iogurte natural sem açúcar.', 7, 'snack', 6,
   'Amasse a pera e misture ao iogurte natural sem açúcar imediatamente antes de servir.',
   'Mantenha o iogurte refrigerado.', 'Consumir no mesmo dia.', 'Use mamão no lugar da pera.',
   $json$[{"name":"Pera","quantity":1,"unit":"unidade"},{"name":"Iogurte natural","quantity":3,"unit":"colher de sopa"}]$json$, array['leite']),
  ('Bolinho macio de banana e aveia', 'Bolinho sem açúcar com banana, aveia e ovo.', 9, 'snack', 25,
   'Misture banana amassada, aveia e ovo. Distribua em pequenas formas e asse até o centro ficar completamente cozido.',
   'Parta ao meio para conferir o cozimento e corte adequadamente.', 'Refrigerar por até 24 horas.', 'Use pera madura no lugar da banana.',
   $json$[{"name":"Banana","quantity":1,"unit":"unidade"},{"name":"Aveia","quantity":2,"unit":"colher de sopa"},{"name":"Ovo","quantity":1,"unit":"unidade"}]$json$, array['ovo']),
  ('Pêssego cozido com banana', 'Pêssego cozido e macio combinado com banana.', 7, 'snack', 12,
   'Retire o caroço e cozinhe o pêssego com a água até ficar macio. Espere esfriar, amasse e misture à banana amassada.',
   'Confira se não restaram partes duras.', 'Refrigerar por até 24 horas.', 'Use pera no lugar do pêssego.',
   $json$[{"name":"Pêssego","quantity":1,"unit":"unidade"},{"name":"Banana","quantity":1,"unit":"unidade"},{"name":"Água","quantity":40,"unit":"ml"}]$json$, '{}'),
  ('Melão com mamão', 'Lanche fresco de frutas macias.', 7, 'snack', 5,
   'Retire sementes e partes firmes, amasse o melão e o mamão e sirva imediatamente.',
   'Use apenas frutas maduras e macias.', 'Preparar no momento de servir.', 'Use banana no lugar do melão.',
   $json$[{"name":"Melão","quantity":1,"unit":"fatia"},{"name":"Mamão","quantity":0.5,"unit":"unidade"}]$json$, '{}'),
  ('Maçã com quinoa macia', 'Maçã cozida misturada à quinoa bem macia.', 8, 'snack', 22,
   'Cozinhe a quinoa na água até ficar muito macia. Cozinhe e amasse a maçã e misture as duas preparações.',
   'Sirva morno ou em temperatura ambiente.', 'Refrigerar por até 24 horas.', 'Use pera no lugar da maçã.',
   $json$[{"name":"Maçã","quantity":1,"unit":"unidade"},{"name":"Quinoa","quantity":2,"unit":"colher de sopa"},{"name":"Água","quantity":120,"unit":"ml"}]$json$, '{}'),
  ('Pêssego cozido com aveia', 'Pêssego macio com aveia hidratada.', 7, 'snack', 12,
   'Retire o caroço, cozinhe o pêssego até ficar macio e amasse. Misture à aveia previamente hidratada.',
   'Confira se não restaram partes duras.', 'Refrigerar por até 24 horas.', 'Use pera no lugar do pêssego.',
   $json$[{"name":"Pêssego","quantity":1,"unit":"unidade"},{"name":"Aveia","quantity":1,"unit":"colher de sopa"},{"name":"Água","quantity":40,"unit":"ml"}]$json$, '{}'),

  ('Carne com abóbora e arroz', 'Jantar com carne macia, abóbora e arroz.', 7, 'dinner', 36,
   'Cozinhe a carne completamente até ficar macia e desfie. Cozinhe abóbora e arroz e ajuste a textura antes de servir.',
   'Sirva em pequenas porções, juntas ou separadas.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use frango no lugar da carne.',
   $json$[{"name":"Carne bovina","quantity":80,"unit":"g"},{"name":"Abóbora","quantity":3,"unit":"colher de sopa"},{"name":"Arroz","quantity":2,"unit":"colher de sopa"}]$json$, '{}'),
  ('Frango com batata-doce e couve', 'Frango desfiado com batata-doce e couve.', 7, 'dinner', 32,
   'Cozinhe o frango completamente e desfie. Cozinhe a batata-doce e a couve, picando a folha antes de servir.',
   'Ajuste a textura e confira se não há talos duros.', 'Refrigerar por até 24 horas.', 'Use espinafre no lugar da couve.',
   $json$[{"name":"Frango","quantity":80,"unit":"g"},{"name":"Batata-doce","quantity":1,"unit":"unidade"},{"name":"Couve","quantity":1,"unit":"colher de sopa"}]$json$, '{}'),
  ('Arroz com lentilha e cenoura', 'Jantar vegetal com arroz, lentilha e cenoura.', 6, 'dinner', 30,
   'Cozinhe arroz, lentilha e cenoura até ficarem macios. Amasse parte da lentilha e pique ou amasse a cenoura.',
   'Mantenha a preparação úmida e com textura.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use feijão no lugar da lentilha.',
   $json$[{"name":"Arroz","quantity":2,"unit":"colher de sopa"},{"name":"Lentilha","quantity":3,"unit":"colher de sopa"},{"name":"Cenoura","quantity":0.5,"unit":"unidade"}]$json$, '{}'),
  ('Peixe com abóbora e quinoa', 'Peixe completamente cozido com abóbora e quinoa.', 9, 'dinner', 32,
   'Cozinhe o peixe completamente e retire pele e espinhas. Cozinhe abóbora e quinoa até ficarem macias.',
   'Revise cuidadosamente o peixe antes de servir.', 'Refrigerar por até 24 horas.', 'Use frango no lugar do peixe se já introduzido.',
   $json$[{"name":"Peixe","quantity":80,"unit":"g"},{"name":"Abóbora","quantity":3,"unit":"colher de sopa"},{"name":"Quinoa","quantity":3,"unit":"colher de sopa"}]$json$, array['peixe']),
  ('Omelete de espinafre com batata', 'Omelete bem cozida com espinafre e batata macia.', 8, 'dinner', 22,
   'Cozinhe e amasse a batata. Cozinhe o espinafre, pique e misture ao ovo. Cozinhe a omelete completamente.',
   'Confirme que o centro não está líquido.', 'Refrigerar por até 24 horas.', 'Use abobrinha no lugar do espinafre.',
   $json$[{"name":"Ovo","quantity":1,"unit":"unidade"},{"name":"Espinafre","quantity":1,"unit":"colher de sopa"},{"name":"Batata","quantity":1,"unit":"unidade"}]$json$, array['ovo']),
  ('Feijão com mandioca e brócolis', 'Feijão amassado com mandioca e brócolis macios.', 7, 'dinner', 34,
   'Cozinhe o feijão até ficar macio e amasse parte dos grãos. Cozinhe a mandioca e o brócolis, retirando fibras duras.',
   'Ajuste a umidade com caldo do próprio cozimento.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use batata no lugar da mandioca.',
   $json$[{"name":"Feijão","quantity":3,"unit":"colher de sopa"},{"name":"Mandioca","quantity":80,"unit":"g"},{"name":"Brócolis","quantity":2,"unit":"colher de sopa"}]$json$, '{}'),
  ('Grão-de-bico com abóbora e arroz', 'Jantar vegetal com grão-de-bico bem cozido.', 8, 'dinner', 35,
   'Cozinhe o grão-de-bico até ficar muito macio e retire peles soltas. Amasse e sirva com abóbora e arroz cozidos.',
   'Mantenha a preparação úmida.', 'Refrigerar por até 24 horas ou congelar em porções.', 'Use lentilha no lugar do grão-de-bico.',
   $json$[{"name":"Grão-de-bico","quantity":3,"unit":"colher de sopa"},{"name":"Abóbora","quantity":3,"unit":"colher de sopa"},{"name":"Arroz","quantity":2,"unit":"colher de sopa"}]$json$, '{}'),
  ('Sopa espessa de lentilha e batata', 'Sopa espessa com lentilha e batata macias.', 7, 'dinner', 32,
   'Cozinhe lentilha e batata na água até ficarem macias. Amasse parte dos ingredientes, mantendo consistência espessa.',
   'Sirva morna, não quente, e evite consistência líquida.', 'Refrigerar por até 24 horas.', 'Use feijão no lugar da lentilha.',
   $json$[{"name":"Lentilha","quantity":3,"unit":"colher de sopa"},{"name":"Batata","quantity":1,"unit":"unidade"},{"name":"Água","quantity":180,"unit":"ml"}]$json$, '{}'),
  ('Frango com quinoa e abobrinha', 'Frango desfiado com quinoa e abobrinha.', 8, 'dinner', 32,
   'Cozinhe o frango completamente e desfie. Cozinhe a quinoa e a abobrinha até ficarem macias.',
   'Ajuste a textura à fase do bebê.', 'Refrigerar por até 24 horas.', 'Use arroz no lugar da quinoa.',
   $json$[{"name":"Frango","quantity":80,"unit":"g"},{"name":"Quinoa","quantity":3,"unit":"colher de sopa"},{"name":"Abobrinha","quantity":0.5,"unit":"unidade"}]$json$, '{}'),
  ('Peru com polenta e cenoura', 'Peru macio com polenta cremosa e cenoura.', 9, 'dinner', 34,
   'Cozinhe o peru completamente até ficar macio e desfie. Prepare polenta úmida e cozinhe a cenoura até amaciar.',
   'Não sirva a polenta em blocos firmes.', 'Refrigerar por até 24 horas.', 'Use frango no lugar do peru.',
   $json$[{"name":"Peru","quantity":80,"unit":"g"},{"name":"Polenta","quantity":3,"unit":"colher de sopa"},{"name":"Cenoura","quantity":0.5,"unit":"unidade"}]$json$, '{}'),
  ('Carne com arroz e abobrinha', 'Carne macia com arroz e abobrinha cozida.', 8, 'dinner', 36,
   'Cozinhe a carne completamente até ficar macia e desfie. Sirva com arroz e abobrinha bem cozidos.',
   'Pique ou amasse conforme as habilidades do bebê.', 'Refrigerar por até 24 horas.', 'Use frango no lugar da carne.',
   $json$[{"name":"Carne bovina","quantity":80,"unit":"g"},{"name":"Arroz","quantity":2,"unit":"colher de sopa"},{"name":"Abobrinha","quantity":0.5,"unit":"unidade"}]$json$, '{}'),
  ('Creme espesso de ervilha e batata-doce', 'Creme espesso de ervilha e batata-doce.', 8, 'dinner', 28,
   'Cozinhe a ervilha e a batata-doce até ficarem macias. Amasse com pequena quantidade da água do cozimento.',
   'Mantenha textura espessa e sirva morno.', 'Refrigerar por até 24 horas.', 'Use abóbora no lugar da batata-doce.',
   $json$[{"name":"Ervilha","quantity":3,"unit":"colher de sopa"},{"name":"Batata-doce","quantity":1,"unit":"unidade"},{"name":"Água","quantity":120,"unit":"ml"}]$json$, '{}');

insert into public.recipes (
  name, description, min_age_months, meal_type, prep_time_minutes,
  instructions, serving_notes, storage_notes, substitutions, is_demo, is_active
)
select
  name, description, min_age_months, meal_type, prep_time_minutes,
  instructions, serving_notes, storage_notes, substitutions, true, true
from catalog_expansion
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

insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional)
select
  r.id,
  i.id,
  (ingredient ->> 'quantity')::numeric,
  ingredient ->> 'unit',
  false
from catalog_expansion c
join public.recipes r on r.name = c.name
cross join lateral jsonb_array_elements(c.ingredients) ingredient
join public.ingredients i on i.name = ingredient ->> 'name'
on conflict (recipe_id, ingredient_id, unit) do update
set quantity = excluded.quantity, is_optional = false;

insert into public.recipe_allergens (recipe_id, allergen)
select r.id, allergen
from catalog_expansion c
join public.recipes r on r.name = c.name
cross join lateral unnest(c.allergens) allergen
on conflict (recipe_id, allergen) do nothing;

do $$
declare
  catalog_total integer;
  missing_required integer;
  unbalanced_types integer;
begin
  select count(*) into catalog_total
  from public.recipes
  where is_demo and is_active;

  if catalog_total < 72 then
    raise exception 'Catálogo incompleto: esperadas ao menos 72 receitas, encontradas %', catalog_total;
  end if;

  select count(*) into missing_required
  from public.recipes r
  where r.is_demo
    and r.is_active
    and not exists (
      select 1 from public.recipe_ingredients ri
      where ri.recipe_id = r.id and not ri.is_optional
    );

  if missing_required > 0 then
    raise exception 'Catálogo inválido: % receitas sem ingrediente obrigatório', missing_required;
  end if;

  select count(*) into unbalanced_types
  from (
    select meal_type
    from public.recipes
    where is_demo and is_active
    group by meal_type
    having count(*) < 18
  ) insufficient;

  if unbalanced_types > 0 then
    raise exception 'Catálogo desequilibrado: há tipos de refeição com menos de 18 receitas';
  end if;
end
$$;
