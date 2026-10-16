# Fluxo de desenvolvimento e Git

Regras permanentes para qualquer tarefa neste repositório. O objetivo é que
**nenhuma entrega fique apenas na máquina local**: toda tarefa concluída termina
com commits, push confirmado e estado remoto documentado.

## 1. Branches e ambientes

| Branch | Papel |
|---|---|
| `design/maternal-ui-refresh` | **Branch padrão do GitHub.** É a candidata a branch de produção na Vercel. **Não mergear sem antes confirmar se o push dispara deploy de produção.** |
| `master` | Branch histórica, desatualizada. Não é usada no fluxo atual. |
| `feat/*` | Trabalho de uma funcionalidade ou versão. Base: a branch padrão ou a branch de integração em curso. |
| `integration/*` | Consolidação de vários PRs empilhados. Segura para receber merges porque **não é a branch padrão**. |
| PRs empilhados | Cada PR aponta para a base anterior da pilha, de modo que o diff mostre só o trabalho próprio. |

**Regra de ouro:** a branch padrão pode ser a branch de produção. Antes de
mergear nela, verifique (Vercel → Settings → Git → Production Branch, ou um
deploy observado). Se não for possível verificar, **consolide em uma branch
`integration/*` e documente o bloqueio** — nunca mergeie "às cegas" na padrão.

## 2. Ciclo obrigatório de cada tarefa

1. `git status` e `git fetch origin` — confirmar estado e branch atual.
2. Criar ou reutilizar uma branch de feature adequada à tarefa.
3. Não misturar mudanças sem relação entre si na mesma branch.
4. Implementar a alteração.
5. Executar os testes relevantes (ver §4).
6. Inspecionar o diff e conferir que não há segredos nem `.env` real.
7. Criar commits pequenos, com mensagens descritivas (ver §3).
8. Fazer push ao concluir a tarefa.
9. Confirmar que o hash local corresponde ao remoto.
10. Criar ou atualizar o PR, quando aplicável.
11. Informar explicitamente qualquer alteração ainda não commitada ou sem push.
12. Nunca declarar a entrega completa enquanto houver trabalho pertinente
    pendente de envio — salvo bloqueio documentado.

O versionamento ocorre em **unidades lógicas de trabalho**, nunca a cada
salvamento de arquivo. O histórico deve permanecer útil e revisável.

## 3. Commits e PRs

- Mensagem no imperativo, em português ou inglês, descrevendo o efeito
  (`fix:`, `feat:`, `docs:`, `test:`, `chore:`).
- Um commit por mudança coerente; não agrupar assuntos distintos.
- Preservar o histórico: sem `force push`, sem reescrever commits já publicados.
- Ao empilhar PRs, manter a base apontando para o PR anterior; ao integrar,
  retargetar a base para a branch de integração para o diff ficar limpo.

## 4. Verificação antes de concluir

```bash
npm test            # unitários (Vitest)
npm run lint        # oxlint
npm run build       # tsc -b && vite build
npm run design:lint # tokens de DESIGN.md
```

Com o ambiente de QA (`npm run qa:build` + `npm run qa:serve`, em
`http://127.0.0.1:4178`):

```bash
npm run qa:flows       # fluxos de UI
npm run qa:audit       # acessibilidade/axe + clipping
npm run qa:dialogs     # diálogos e foco
npm run qa:regressions # overflow/contraste
npm run qa:pwa         # convite de instalação
```

`npm run db:test` e `npm run db:e2e` exigem Docker/Supabase local. Quando não
estiverem disponíveis, **registre a limitação** em vez de simular aprovação.

Não reduzir asserções nem a cobertura para obter execução verde.

## 5. Limites de publicação

Autorizado no fluxo de trabalho: criar branches, commitar, fazer push, abrir e
atualizar PRs, mergear em branches de feature/integração.

**Proibido sem autorização explícita:**

- Merge na branch padrão quando houver risco de deploy de produção.
- Deploy de produção, alteração de domínio ou de configuração da Vercel.
- Migrações no Supabase de produção.
- Alteração ou exclusão de dados de produção.
- `force push`.
- Adicionar segredos, tokens ou arquivos `.env` reais ao Git (apenas
  `.env.example` com placeholders).

Integrar código **não** é autorização para publicar o aplicativo.

## 6. Como o ambiente de QA funciona

O app é validado contra um **backend simulado em memória**
(`qa/serve.mjs` + `qa/store.mjs`), que responde ao mesmo contrato do PostgREST.
Isso **não** comprova persistência real: o Supabase de produção não é
exercitado. Fixtures não são prova de integração real.

## 7. Ferramenta de visão (avaliação de UI)

Esta sessão roda um modelo de texto. Para avaliar capturas de tela existe
`runtime/vision_api.py` (modelo `zai/glm-4.6v`), documentado em
`runtime/VISION-README.md`.

Uso: a visão serve para **composição e estética** (hipóteses). Alegações
**numéricas** — contraste, tamanho, overflow — devem ser **medidas** com
DOM/axe/cálculo, nunca estimadas pela imagem. O modelo já alucinou contraste
(disse "insuficiente" para um botão de 7,74:1).
