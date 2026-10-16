# Instruções para agentes — Pratinho Pronto

Leia **`docs/DEVELOPMENT_WORKFLOW.md`** antes de qualquer tarefa. Ele define o
fluxo obrigatório de Git, branches, testes e limites de publicação.

Resumo operacional:

1. `git status` + `git fetch origin`; confirmar a branch.
2. Trabalhar em `feat/*`; consolidar em `integration/*`.
3. **Nunca** mergear em `design/maternal-ui-refresh` (branch padrão, candidata a
   produção) sem antes confirmar se o push dispara deploy de produção.
4. Implementar, testar (`npm test`, `lint`, `build`, `design:lint` e as suítes
   `qa:*` quando aplicável), revisar o diff.
5. Commitar em unidades lógicas, fazer push, confirmar que o hash remoto
   corresponde ao local e atualizar o PR.
6. Toda tarefa concluída termina com **commit + push confirmado + estado remoto
   documentado**. Nunca declarar entrega completa com trabalho pendente de envio.

Proibido sem autorização explícita: deploy de produção, alteração de domínio ou
da Vercel, migrações no Supabase de produção, alteração de dados de produção,
`force push`, e adicionar segredos/`.env` reais ao Git.

Ver `docs/DEVELOPMENT_WORKFLOW.md` para detalhes e para o funcionamento do
ambiente de QA (backend simulado em memória — não comprova persistência real).
