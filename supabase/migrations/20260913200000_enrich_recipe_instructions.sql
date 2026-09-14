-- Enriquecimento do modo de preparo das receitas.
--
-- Antes desta migration, o campo `instructions` continha 1 ou 2 frases
-- genéricas ("Cozinhe os ingredientes até ficarem macios. Ajuste a textura à
-- fase do bebê."). O util splitInstructions no frontend só consegue produzir
-- passos numerados se o texto original for uma sequência de frases; com 1 ou 2
-- frases, o preparo aparece pobre para uma cliente pagante.
--
-- Cada receita abaixo recebe um preparo em 3 a 5 frases terminadas em ponto,
-- na ordem em que a cozinha realmente acontece: preparo dos ingredientes,
-- ponto de cozimento, montagem e temperatura de servir. As frases estão em
-- uma coluna só; o splitInstructions cuida da quebra em passos numerados.
--
-- REGRAS OBSERVADAS AO ESCREVER:
-- 1. Nenhuma orientação médica, nutricional ou de desenvolvimento infantil é
--    inventada. Só há descrição de técnica de cozinha.
-- 2. Não há promessa de benefício de saúde.
-- 3. Não afirmamos que uma textura, corte ou tempo é seguro para uma idade
--    específica: a idade mínima cadastrada em `min_age_months` continua sendo
--    a fonte de verdade para exibição de compatibilidade.
-- 4. Onde a receita já traz instruções específicas do catálogo (por exemplo,
--    "misture o ovo", "cozinhe até o feijão desmanchar"), reescrevemos com o
--    mesmo sentido, mais detalhado. Nada foi inferido a partir do nome sem
--    correspondência com o texto original ou com a lista de ingredientes.
-- 5. Substituições, conservação e serving_notes continuam nos campos próprios;
--    aqui só descrevemos como cozinhar.

update public.recipes as r
set instructions = new_instructions
from (
  values
    -- Café da manhã
    ('Mingau de banana e aveia',
     'Leve a aveia com água em fogo baixo, mexendo até engrossar e ficar sem grumos. Retire do fogo e amasse a banana com um garfo. Misture a banana ao mingau ainda morno. Sirva quando estiver na temperatura de comer.'),
    ('Creme de maçã com aveia',
     'Descasque a maçã, retire o miolo e corte em cubos pequenos. Cozinhe com um pouco de água em fogo baixo até ficar bem macia e a água praticamente secar. Amasse a maçã com um garfo e misture à aveia já cozida em água. Sirva morno.'),
    ('Mamão com aveia macia',
     'Hidrate a aveia em fio com água morna até absorver e ficar cremosa. Amasse o mamão bem maduro com um garfo. Misture os dois em um bowl. Sirva na hora, sem deixar descansar.'),
    ('Panquequinha de abóbora',
     'Cozinhe a abóbora em água ou vapor até um garfo entrar sem esforço. Amasse até virar purê e misture com o ovo e a aveia até formar uma massa consistente. Cozinhe pequenas porções em frigideira antiaderente em fogo baixo, virando quando a base firmar. Sirva morno.'),
    ('Pão macio com abacate',
     'Amasse a polpa do abacate com um garfo até ficar cremosa e sem pedaços. Espalhe uma camada fina sobre o pão macio. Corte no formato desejado antes de servir.'),
    ('Quinoa cremosa com pera',
     'Lave bem a quinoa em água corrente para tirar o amargor. Cozinhe em água em fogo baixo por cerca de 15 minutos, até os grãos abrirem e a mistura ficar cremosa. Cozinhe a pera descascada em pouca água até desmanchar com o garfo. Misture os dois e sirva morno.'),
    ('Abacate com banana e aveia',
     'Amasse a polpa do abacate e a banana madura com um garfo, separadamente. Hidrate a aveia em fio com água morna até absorver. Junte tudo em um bowl e misture até ficar cremoso e uniforme. Sirva na hora.'),
    ('Aveia cremosa com manga',
     'Cozinhe a aveia com água em fogo baixo, mexendo até engrossar. Descasque a manga madura e amasse com um garfo. Misture a manga à aveia depois que o mingau amornar. Sirva na sequência.'),
    ('Batata-doce amassada com ovo',
     'Cozinhe a batata-doce descascada em água até ficar bem macia. Amasse com um garfo até virar purê. Cozinhe o ovo em água fervente até a gema ficar bem firme (cerca de 10 minutos), descasque e amasse com a batata-doce. Sirva morno.'),
    ('Creme de abóbora com aveia',
     'Cozinhe a abóbora em cubos com pouca água em fogo baixo até desmanchar ao toque do garfo. Amasse até formar um creme liso. Misture a aveia previamente cozida em água e mexa até incorporar. Sirva morno.'),
    ('Creme de mamão com banana',
     'Amasse a banana madura e o mamão maduro com um garfo, separadamente. Misture os dois em um bowl até formar um creme homogêneo. Sirva na hora, sem deixar oxidar.'),
    ('Cuscuz macio com abacate',
     'Prepare o cuscuz seguindo a proporção de água indicada na embalagem, deixando hidratar até ficar solto. Amasse a polpa do abacate com um garfo até virar creme. Misture os dois e sirva morno.'),
    ('Cuscuz macio com banana',
     'Hidrate o cuscuz com água até ficar solto e macio. Amasse a banana madura com um garfo. Junte a banana ao cuscuz morno e misture bem. Sirva na sequência.'),
    ('Cuscuz macio com ovo',
     'Prepare o cuscuz com água até ficar solto. Cozinhe o ovo em água fervente até a gema firmar completamente e amasse com um garfo. Misture o ovo ao cuscuz morno. Sirva na hora.'),
    ('Omelete macia de espinafre',
     'Lave bem as folhas de espinafre, refogue rapidamente em fogo baixo até murcharem e pique em pedaços pequenos. Bata o ovo levemente com um garfo e misture o espinafre picado. Cozinhe em frigideira antiaderente em fogo baixo, virando quando a base firmar. Sirva morno.'),
    ('Panquequinha de banana',
     'Amasse a banana madura com um garfo até virar purê. Misture com o ovo batido e a aveia até formar uma massa homogênea. Cozinhe pequenas porções em frigideira antiaderente em fogo baixo, virando quando a base firmar dos dois lados. Sirva morno.'),
    ('Pera cozida com chia hidratada',
     'Descasque a pera, retire o miolo e cozinhe em pouca água em fogo baixo até desmanchar ao garfo. Hidrate a chia em água por 15 minutos até formar um gel. Misture a pera cozida amassada com a chia hidratada. Sirva morno.'),
    ('Quinoa cremosa com banana',
     'Lave a quinoa em água corrente. Cozinhe em água em fogo baixo por cerca de 15 minutos, até os grãos abrirem e ficarem cremosos. Amasse a banana madura com um garfo. Misture a banana à quinoa amornada e sirva.'),

    -- Almoço
    ('Frango com batata e cenoura',
     'Cozinhe o filé de frango em água ou caldo caseiro até ficar totalmente cozido no centro. Descasque a batata e a cenoura, corte em cubos e cozinhe em água até um garfo entrar sem esforço. Desfie o frango bem fininho. Amasse cada legume com um garfo, mantendo separado do frango no prato. Sirva morno.'),
    ('Arroz com lentilha e abóbora',
     'Cozinhe a lentilha em água em fogo baixo até ficar macia (cerca de 25 minutos), sem sal. Cozinhe o arroz separadamente até ficar bem soltinho e macio. Cozinhe a abóbora em cubos em pouca água até desmanchar e amasse com um garfo. Misture os três em porções iguais no prato e sirva morno.'),
    ('Peixe com batata-doce e abobrinha',
     'Cozinhe o filé de peixe branco no vapor ou em água até a carne ficar opaca e se desfazer com um garfo. Confira e retire com atenção qualquer espinha. Cozinhe a batata-doce e a abobrinha em cubos em água até ficarem macias. Amasse cada legume com um garfo. Sirva morno, com o peixe desfiado ao lado.'),
    ('Carne com polenta e espinafre',
     'Cozinhe o pedaço de carne magra em água em fogo baixo até ficar bem macio e soltar fibras (aproximadamente 40 minutos em panela comum). Desfie fininho. Prepare a polenta cozinhando o fubá em água aos poucos, mexendo até ficar cremoso. Refogue o espinafre lavado em fogo baixo até murchar e pique. Monte no prato e sirva morno.'),
    ('Grão-de-bico com brócolis',
     'Deixe o grão-de-bico de molho de véspera para reduzir o tempo de cozimento. Cozinhe em água em fogo baixo até ficar bem macio (cerca de 40 minutos em panela comum). Cozinhe as flores de brócolis no vapor até ficarem macias. Amasse o grão-de-bico com um garfo e pique o brócolis. Misture e sirva morno.'),
    ('Peru com arroz e beterraba',
     'Cozinhe o peito de peru em água em fogo baixo até ficar totalmente cozido no centro. Desfie fininho. Cozinhe o arroz separadamente até ficar soltinho. Cozinhe a beterraba descascada em cubos em água até um garfo entrar com facilidade e amasse com um garfo. Sirva morno, com os componentes separados no prato.'),
    ('Arroz com lentilha e cenoura',
     'Cozinhe a lentilha em água em fogo baixo até ficar macia, sem sal. Cozinhe o arroz separadamente até ficar soltinho. Cozinhe a cenoura em cubos em água até ficar macia e amasse com um garfo. Misture porções iguais no prato e sirva morno.'),
    ('Carne com abóbora e arroz',
     'Cozinhe o pedaço de carne magra em água em fogo baixo até ficar macio e soltar fibras. Desfie fininho. Cozinhe a abóbora em cubos em pouca água até desmanchar e amasse com um garfo. Cozinhe o arroz separadamente até ficar soltinho. Sirva morno.'),
    ('Carne com arroz e abobrinha',
     'Cozinhe o pedaço de carne magra em água até ficar bem macio. Desfie em fios finos. Cozinhe o arroz separadamente. Cozinhe a abobrinha em cubos em pouca água até ficar bem macia e amasse levemente com um garfo. Sirva morno.'),
    ('Carne com batata e beterraba',
     'Cozinhe a carne magra em água em fogo baixo até ficar macia e soltar fibras. Desfie fininho. Cozinhe a batata e a beterraba descascadas e em cubos em água até um garfo entrar sem esforço. Amasse cada legume separado com um garfo. Sirva morno.'),
    ('Carne com mandioca e abóbora',
     'Cozinhe a mandioca descascada em água até um garfo entrar com facilidade e remova as fibras centrais duras. Cozinhe o pedaço de carne magra em água em fogo baixo até desmanchar e desfie. Cozinhe a abóbora em pouca água até amaciar e amasse. Sirva morno com os componentes separados no prato.'),
    ('Feijão com abóbora e arroz',
     'Cozinhe o feijão previamente demolhado em água em fogo baixo até os grãos ficarem bem macios. Cozinhe a abóbora em cubos em pouca água até desmanchar e amasse com um garfo. Cozinhe o arroz separadamente até ficar soltinho. Sirva morno com os componentes separados no prato.'),
    ('Frango com arroz e brócolis',
     'Cozinhe o filé de frango em água ou caldo caseiro até ficar totalmente cozido no centro e desfie fininho. Cozinhe o arroz separadamente. Cozinhe as flores de brócolis no vapor até ficarem macias e pique. Sirva morno com os componentes separados no prato.'),
    ('Frango com polenta e abobrinha',
     'Cozinhe o filé de frango em água até ficar totalmente cozido e desfie fininho. Prepare a polenta cozinhando o fubá em água aos poucos, mexendo até ficar cremoso. Cozinhe a abobrinha em cubos em pouca água até amaciar e amasse levemente. Monte no prato e sirva morno.'),
    ('Grão-de-bico com abóbora e arroz',
     'Deixe o grão-de-bico de molho de véspera. Cozinhe em água em fogo baixo até ficar bem macio e amasse com um garfo. Cozinhe a abóbora em cubos em pouca água até desmanchar e amasse. Cozinhe o arroz separadamente. Sirva morno.'),
    ('Grão-de-bico com cenoura e quinoa',
     'Cozinhe o grão-de-bico previamente demolhado até ficar bem macio e amasse com um garfo. Lave a quinoa e cozinhe em água em fogo baixo até os grãos abrirem. Cozinhe a cenoura em cubos em água até ficar macia e amasse. Misture os três com atenção para manter texturas distintas e sirva morno.'),
    ('Lentilha com arroz e beterraba',
     'Cozinhe a lentilha em água em fogo baixo até ficar macia, sem sal. Cozinhe o arroz separadamente. Cozinhe a beterraba descascada em cubos em água até ficar macia e amasse com um garfo. Sirva morno com os componentes separados no prato.'),
    ('Lentilha com batata-doce e couve',
     'Cozinhe a lentilha em água em fogo baixo até ficar macia. Cozinhe a batata-doce em cubos em água até desmanchar e amasse com um garfo. Refogue a couve fatiada bem fina em fogo baixo até murchar. Sirva morno com os componentes separados no prato.'),
    ('Ovo com batata e brócolis',
     'Cozinhe o ovo em água fervente até a gema firmar por completo (cerca de 10 minutos), descasque e amasse. Cozinhe a batata descascada em cubos em água até ficar bem macia e amasse com um garfo. Cozinhe as flores de brócolis no vapor até ficarem macias e pique. Sirva morno.'),
    ('Peixe com arroz e cenoura',
     'Cozinhe o filé de peixe branco no vapor ou em água até desfiar com o garfo. Confira e remova cuidadosamente qualquer espinha. Cozinhe o arroz separadamente. Cozinhe a cenoura em cubos em água até ficar macia e amasse. Sirva morno com o peixe desfiado ao lado.'),
    ('Peixe com mandioca e espinafre',
     'Cozinhe o filé de peixe branco no vapor até se desfazer com o garfo. Confira e remova as espinhas com atenção. Cozinhe a mandioca em água até um garfo entrar com facilidade e remova as fibras centrais duras. Refogue o espinafre lavado em fogo baixo até murchar e pique. Sirva morno.'),
    ('Peru com quinoa e brócolis',
     'Cozinhe o peito de peru em água até ficar totalmente cozido no centro e desfie fininho. Lave a quinoa e cozinhe em água até os grãos abrirem. Cozinhe as flores de brócolis no vapor até ficarem macias e pique. Sirva morno.'),

    -- Lanche
    ('Banana com abacate',
     'Amasse a banana madura e a polpa do abacate com um garfo, separadamente. Misture os dois em um bowl até formar um creme homogêneo. Sirva na hora para não escurecer.'),
    ('Maçã assada com aveia',
     'Descasque a maçã, retire o miolo e corte em pedaços. Asse em forno em temperatura média até ficar bem macia e soltar líquido. Amasse com um garfo e misture com a aveia hidratada em água morna. Sirva morno.'),
    ('Mamão com iogurte natural',
     'Amasse o mamão maduro com um garfo. Misture ao iogurte natural sem açúcar em um bowl até formar um creme. Sirva na sequência.'),
    ('Manga com chia hidratada',
     'Hidrate a chia em água por cerca de 15 minutos até formar um gel. Descasque a manga madura e amasse a polpa com um garfo. Misture os dois em um bowl. Sirva na hora.'),
    ('Panquequinha de pera',
     'Descasque a pera e rale em ralo fino. Misture com o ovo batido e a aveia até formar uma massa consistente. Cozinhe pequenas porções em frigideira antiaderente em fogo baixo, virando quando a base firmar. Sirva morno.'),
    ('Melão com banana amassada',
     'Corte o melão maduro em cubos pequenos e amasse levemente com um garfo. Amasse a banana madura separadamente. Misture os dois em um bowl e sirva na hora.'),
    ('Abacate com manga',
     'Amasse a polpa do abacate com um garfo até ficar cremosa. Amasse a manga madura separadamente. Misture os dois em um bowl até formar um creme. Sirva na hora.'),
    ('Bolinho macio de banana e aveia',
     'Amasse a banana madura com um garfo. Misture com a aveia e o ovo batido até formar uma massa consistente. Modele em bolinhos pequenos e asse em forno em temperatura média até dourar levemente. Sirva morno.'),
    ('Iogurte natural com banana e aveia',
     'Amasse a banana madura com um garfo. Hidrate a aveia em água morna até absorver. Misture a banana, a aveia e o iogurte natural sem açúcar em um bowl. Sirva na sequência.'),
    ('Maçã com quinoa macia',
     'Lave a quinoa e cozinhe em água em fogo baixo até os grãos abrirem. Descasque a maçã e cozinhe em pouca água até desmanchar ao garfo. Amasse a maçã e misture à quinoa amornada. Sirva morno.'),
    ('Maçã cozida com chia',
     'Descasque a maçã, retire o miolo e cozinhe em pouca água em fogo baixo até desmanchar ao garfo. Hidrate a chia em água por 15 minutos até formar um gel. Amasse a maçã e misture à chia hidratada. Sirva morno.'),
    ('Mamão com pêssego',
     'Amasse o mamão maduro com um garfo. Descasque o pêssego maduro, remova o caroço e amasse a polpa separadamente. Misture os dois em um bowl. Sirva na hora.'),
    ('Manga com banana',
     'Descasque a manga madura e amasse a polpa com um garfo. Amasse a banana madura separadamente. Misture os dois em um bowl e sirva na hora.'),
    ('Melão com mamão',
     'Corte o melão maduro em cubos pequenos e amasse levemente. Amasse o mamão maduro separadamente. Misture os dois em um bowl. Sirva na hora.'),
    ('Pera com abacate',
     'Descasque a pera bem madura e amasse a polpa com um garfo. Amasse a polpa do abacate separadamente. Misture os dois até formar um creme homogêneo. Sirva na hora.'),
    ('Pera com iogurte natural',
     'Descasque a pera madura e amasse a polpa com um garfo, ou cozinhe rapidamente em pouca água se estiver firme. Misture ao iogurte natural sem açúcar. Sirva na hora.'),
    ('Pêssego cozido com aveia',
     'Descasque o pêssego, retire o caroço e cozinhe em pouca água em fogo baixo até desmanchar ao garfo. Hidrate a aveia em água morna até absorver. Misture o pêssego amassado à aveia. Sirva morno.'),
    ('Pêssego cozido com banana',
     'Descasque o pêssego, remova o caroço e cozinhe em pouca água até desmanchar. Amasse a banana madura com um garfo. Misture os dois em um bowl. Sirva morno.'),

    -- Jantar
    ('Creme de abóbora com arroz',
     'Cozinhe a abóbora em cubos em pouca água em fogo baixo até desmanchar ao toque do garfo. Amasse até formar um creme liso. Cozinhe o arroz separadamente até ficar soltinho. Misture o arroz ao creme de abóbora com o garfo, sem liquidificar, para manter alguma textura. Sirva morno.'),
    ('Frango com mandioca',
     'Cozinhe o filé de frango em água ou caldo caseiro até ficar totalmente cozido no centro e desfie fininho. Cozinhe a mandioca descascada em água até um garfo entrar com facilidade e remova as fibras centrais duras. Amasse a mandioca com um garfo. Sirva morno com o frango desfiado ao lado.'),
    ('Feijão com cenoura e arroz',
     'Cozinhe o feijão previamente demolhado em água em fogo baixo até os grãos desmancharem ao toque do garfo. Amasse levemente para deixar o caldo mais espesso. Cozinhe a cenoura em cubos em água até ficar macia e amasse. Cozinhe o arroz separadamente até ficar soltinho. Sirva morno.'),
    ('Omelete macia de abobrinha',
     'Rale a abobrinha em ralo grosso e refogue rapidamente em fogo baixo até perder a água. Bata o ovo levemente com um garfo e misture a abobrinha. Cozinhe em frigideira antiaderente em fogo baixo, virando quando a base firmar. Sirva morno.'),
    ('Sopa rústica de batata e ervilha',
     'Descasque a batata e corte em cubos pequenos. Cozinhe em água com a ervilha em fogo baixo até ficarem macias. Amasse parte dos vegetais com um garfo, deixando alguns pedaços inteiros para textura. Sirva morno.'),
    ('Quinoa com legumes macios',
     'Lave a quinoa em água corrente. Cozinhe em água em fogo baixo por cerca de 15 minutos, até os grãos abrirem. Cozinhe cenoura e brócolis em pequenos pedaços no vapor até ficarem macios. Misture os legumes à quinoa e sirva morno.'),
    ('Feijão com mandioca e brócolis',
     'Cozinhe o feijão previamente demolhado até os grãos ficarem bem macios. Cozinhe a mandioca descascada em água até um garfo entrar com facilidade e remova as fibras centrais duras. Cozinhe as flores de brócolis no vapor até ficarem macias e pique. Amasse o feijão e a mandioca com um garfo. Sirva morno.'),
    ('Frango com batata-doce e couve',
     'Cozinhe o filé de frango em água até ficar totalmente cozido no centro e desfie fininho. Cozinhe a batata-doce em cubos em água até desmanchar ao garfo e amasse. Refogue a couve fatiada bem fina em fogo baixo até murchar. Sirva morno.'),
    ('Frango com quinoa e abobrinha',
     'Cozinhe o filé de frango em água até ficar totalmente cozido e desfie fininho. Lave a quinoa e cozinhe em água até os grãos abrirem. Cozinhe a abobrinha em cubos em pouca água até amaciar e amasse levemente. Sirva morno.'),
    ('Omelete de espinafre com batata',
     'Cozinhe a batata descascada em cubos em água até ficar macia e amasse. Refogue o espinafre lavado em fogo baixo até murchar e pique. Bata o ovo levemente e misture com a batata e o espinafre. Cozinhe em frigideira antiaderente em fogo baixo, virando quando firmar. Sirva morno.'),
    ('Peixe com abóbora e quinoa',
     'Cozinhe o filé de peixe branco no vapor até se desfazer com o garfo. Confira e remova cuidadosamente qualquer espinha. Cozinhe a abóbora em cubos em pouca água até desmanchar e amasse. Lave a quinoa e cozinhe em água até os grãos abrirem. Sirva morno com o peixe desfiado ao lado.'),
    ('Peru com polenta e cenoura',
     'Cozinhe o peito de peru em água até ficar totalmente cozido e desfie fininho. Prepare a polenta cozinhando o fubá em água aos poucos, mexendo até ficar cremoso. Cozinhe a cenoura em cubos em água até ficar macia e amasse. Sirva morno.'),
    ('Sopa espessa de lentilha e batata',
     'Cozinhe a lentilha em água em fogo baixo até ficar macia. Cozinhe a batata descascada em cubos em água até desmanchar. Junte os dois e amasse parte com um garfo, deixando alguns pedaços inteiros para textura. Sirva morno.'),
    ('Creme espesso de ervilha e batata-doce',
     'Cozinhe a batata-doce descascada em cubos em água até um garfo entrar sem esforço. Cozinhe a ervilha separadamente até ficar macia. Amasse os dois juntos com um garfo até formar um creme espesso, deixando alguma textura. Sirva morno.')
) as replacements(recipe_name, new_instructions)
where r.name = replacements.recipe_name;

-- Sentinela: nenhuma das receitas que acabamos de reescrever pode conter
-- linguagem prescritiva sobre idade. A checagem falha a migration em vez de
-- deixar passar. Não impomos regra sobre receitas fora desta lista para não
-- interferir em conteúdo administrado por outra migration.
do $$
declare
  clinical integer;
begin
  select count(*) into clinical
  from public.recipes
  where instructions ~* '\m(seguro para|indicado para|recomendad[oa] para|apropriado para)\s+(bebês?|criança)';

  if clinical > 0 then
    raise exception 'Ainda restam % instructions com linguagem prescritiva de idade', clinical;
  end if;
end
$$;
