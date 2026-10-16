# Roteiros de demonstração (QA local)

Ambiente: prévia local de fixtures, sem produção e sem dados reais.

```bash
npm run qa:build
npm run qa:serve
# abra http://127.0.0.1:4178/app
```

- Dados fictícios ("Alice"), estado em memória, banner de demonstração.
- Reiniciar o estado: `curl -X POST http://127.0.0.1:4178/__qa/reset?scenario=full`
- Nenhum acesso real é liberado e nenhuma permissão é alterada.
- Todos os valores citados abaixo foram observados nesta execução.

## 1. Cardápio semanal

1. Abra **Semana** (`/app/week`).
2. Observe o destaque do dia e o bloco **Sua semana atual** com 7 dias × 4
   refeições (28 refeições).
3. Clique em outro dia no seletor; o destaque muda e o mapa permanece.

Resultado esperado: 7 dias, "HOJE" marcado em 16 de set., cada dia com 4
refeições nomeadas.

## 2. Troca de refeição

1. Em **Semana**, no destaque do dia, clique em **Trocar**.
2. No diálogo "Outras ideias compatíveis", escolha uma opção.
3. Observe a faixa de status: "<anterior> virou <nova>." e o card atualizado.

Resultado esperado: a refeição muda imediatamente e o mapa da semana reflete a
troca. Alternativas são filtradas por idade e restrições do bebê.

## 3. Despensa

1. Abra **Despensa** (`/app/pantry`).
2. Marque um ingrediente (ex.: **Banana**) e clique em **Encontrar ideias**.
3. Veja **Dá para fazer agora** e **Falta pouco**, com "Você tem X de Y
   ingredientes" e "Falta comprar: …".

Resultado esperado: as receitas compatíveis aparecem ranqueadas; as incompletas
listam os ingredientes que faltam.

## 4. Lista de compras

1. Abra **Compras** (`/app/shopping-list?week=2026-09-14`).
2. Veja os itens agrupados por seção do mercado, com progresso "0 de N itens
   marcados" e quantidades em português ("3 unidades", "6 colheres de sopa",
   "0,5 unidade").
3. Toque em itens para marcar como comprados; a barra de progresso avança.
4. Opcional: na **Despensa**, use **Adicionar faltantes à lista**; ao voltar, a
   quantidade do item existente é **somada** (não substituída).

Resultado esperado: quantidades coerentes com o cardápio; a mesma informação no
PDF.

## 5. PDF do cardápio

1. Em **Semana**, clique em **Imprimir cardápio** (ou **Receitas em PDF** /
   **Imprimir lista de compras**).
2. O arquivo é baixado (ex.: `imprimir-cardapio-alice-2026-09-14.pdf`).

Resultado esperado: PDF A4 com título, dias, refeições e rodapé educativo.
Receitas: 2 colunas (ingredientes/preparo) e "como servir". Lista: agrupada por
categoria com checkbox impresso.

## Limitações

- Persistência real depende do Supabase de produção (não exercitada aqui).
- Autenticação real não é validada nesta prévia.
