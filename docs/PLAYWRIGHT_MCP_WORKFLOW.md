# Playwright MCP — fluxo de inspeção por navegador (Pratinho Pronto)

Documento operacional para usar o navegador real (Playwright MCP) na inspeção e
teste do app, sem depender de dezenas de capturas de tela.

## 1. O que já está configurado

O ambiente **já possui um servidor Playwright MCP funcional**, registrado no
`opencode.jsonc` global sob o nome **`browser`**. Ele executa o pacote oficial
`@playwright/mcp`:

- Pacote: `@playwright/mcp` **0.0.80** (Playwright **1.63.0**) em
  `C:\Users\anton\Documents\OpenCode-PC\runtime\browser\node_modules\@playwright\mcp\cli.js`.
- Chromium: `C:\Users\anton\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe`.
- Perfil dedicado (não é o Chrome pessoal): `...\OpenCode-PC\browser-profile`.
- Saída de estado (snapshots/console): `...\OpenCode-PC\state\browser`.
- `--image-responses omit` (evita trafegar imagens; a inspeção é estrutural).

As ferramentas ficam disponíveis na sessão como `browser_*`
(`browser_browser_navigate`, `browser_browser_snapshot`, `browser_browser_find`,
`browser_browser_click`, `browser_browser_console_messages`, etc.).

> **Por que não existe um servidor chamado `playwright`.**
> A regra é não duplicar um servidor funcional. Renomear `browser` para
> `playwright` quebraria referências em `PC-INSTRUCTIONS.md`, no `AGENTS.md`
> (roteamento de MCP) e na permissão `"browser_*": "allow"`. Por isso o servidor
> existente foi **validado**, não recriado. Em outra máquina, sem servidor
> prévio, a entrada equivalente seria:

```jsonc
"mcp": {
  "playwright": {
    "type": "local",
    "command": ["npx", "-y", "@playwright/mcp@latest", "--isolated"],
    "enabled": true
  }
}
```

## 2. Confirmar que o MCP está conectado

Na raiz do projeto:

```bash
opencode mcp list
```

Espera-se ver `✓ browser connected` com o comando do `@playwright/mcp`. Se
aparecer `disconnected`, reinicie o OpenCode (ver §8).

Requisito de runtime: Node.js ≥ 18 (aqui: **v24.19.0**).

## 3. Iniciar o ambiente de QA (fixtures locais)

O app **não** é testado contra o Supabase de produção. Use a prévia de fixtures:

```bash
npm run qa:build      # build isolado em tmp/ui-qa-dist (não lê .env.local)
npm run qa:serve      # servidor de fixtures em primeiro plano
```

- URL: **http://127.0.0.1:4178/app**
- Health check: `curl http://127.0.0.1:4178/__qa/health`
  → `{"mode":"local-fixtures","recipes":72,"production":false}`
- Reiniciar o estado: `curl -X POST "http://127.0.0.1:4178/__qa/reset?scenario=full"`
- Cenários: `full` (padrão), `empty` (bebê sem semana), `onboarding` (sem bebê).
- Dados fictícios ("Alice"), banner de demonstração, estado em memória.
- O servidor aceita apenas loopback; nenhuma compra, login real ou escrita em
  produção.

`qa:serve` roda em primeiro plano: inicie-o em um job/terminal separado e siga
com a inspeção no navegador.

## 4. Navegar e inspecionar sem prints

Fluxo padrão (usar a árvore de acessibilidade, não imagem):

1. `browser_navigate` para a URL (ex.: `http://127.0.0.1:4178/app/week`).
2. O app tem um estado de *loading* (Suspense). Aguarde o shell com
   `browser_wait_for` (~2 s) antes de inspecionar.
3. `browser_snapshot` retorna um **arquivo YAML** com a árvore de elementos
   (papéis, nomes, refs, níveis de título, `aria-*`). O caminho é mostrado como
   link, ex.: `Documents\OpenCode-PC\state\browser\page-<timestamp>.yml` — leia o
   arquivo (ferramenta `read`) para obter os `ref`s.
4. `browser_find` (texto ou regex) localiza elementos específicos e devolve só os
   trechos relevantes — mais barato que o snapshot inteiro.
5. Interaja com **refs estáveis e semânticos** (`browser_click` com `target: f<..>e<..>`).
   Evite seletores por posição/CSS frágil.
6. Verifique o resultado com novo `browser_find`/`browser_snapshot` (ex.: uma
   região de `status` com a mensagem de confirmação).
7. `browser_console_messages` (nível `error`) para erros de console.

Exemplo de laço (sem prints): `navigate → wait_for → find → click → find`.

## 5. Quando usar captura de tela

Só quando o objetivo for **visual**: cor, contraste, espaçamento, alinhamento,
proporção, qualidade de imagem, antes/depois de uma mudança de estilo. Para
inspecionar estrutura, estado, textos e resultados de interação, use a árvore de
acessibilidade. Salve capturas em `entregaveis/capturas/<rodada>/` (pasta
ignorada pelo Git).

Importante: **inspeção estrutural não é avaliação visual completa.** Sem um
recurso de visão adequado, não afirme que os pixels foram avaliados.

## 6. Investigar falhas de interação

- Elemento não encontrado → re-`snapshot` (os `ref` mudam a cada navegação; não
  reutilize refs antigos).
- Clique sem efeito → confirme se o alvo está `disabled` ou coberto; re-inspecione
  após a ação.
- Estado "Carregando…" → aguarde e re-snapshot.
- Erro de rede/console → `browser_console_messages` e `browser_network_requests`.
- Dado ausente → confirme se a fixture foi resetada (§3).

## 7. QA local × produção

- A prévia em `127.0.0.1:4178` usa **fixtures** e nunca o Supabase/Cakto reais.
- Não faça login real, compras ou escrita em produção por este fluxo.
- Fixtures **não** representam o banco real: persistência e RLS só se verificam
  no ambiente real, o que exige credenciais e autorização.

## 8. Se precisar reiniciar o OpenCode

Alterar `opencode.jsonc` (ex.: adicionar um servidor) só tem efeito **após
reiniciar** o OpenCode. Ao reiniciar:

1. Não encerre outros processos; feche apenas a sessão do OpenCode.
2. Ao reabrir, rode `opencode mcp list` e confirme `✓ browser connected`.
3. Refaça `npm run qa:build && npm run qa:serve` se o servidor de fixtures não
   estiver ativo.
4. Retome a inspeção em `http://127.0.0.1:4178/app`.

Não é necessário reiniciar para usar o servidor `browser` atual (já conectado).

## 9. Fluxos verificados neste ambiente

Todos validados via `browser_*` em `127.0.0.1:4178`, com fixtures:

1. Home (`/app`) — ações principais.
2. Semana (`/app/week`) — refeições do dia e mapa da semana.
3. Modal de troca — diálogo "Outras ideias compatíveis".
4. Troca de refeição — status "X virou Y" e atualização do cardápio.
5. Detalhe da receita — ingredientes, alergênicos, etapas, servir, conservação.
6. Despensa — seleção de ingrediente e resultados ("Falta comprar: …").
7. Lista de compras — categorias e quantidades ("6 colheres de sopa", "3 unidades").
8. Perfil (`/app/profile`) — estrutura do formulário.

Console: 0 erros em todos os passos.
