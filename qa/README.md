# QA local do Pratinho Pronto

## Ambiente e limites

Esta demonstração executa os componentes reais contra um servidor de fixtures
local. Não substitui teste de integração com Supabase, autenticação real ou RLS.

- Endereço: **http://127.0.0.1:4178/app**.
- Build: `tmp/ui-qa-dist`, separado de `dist` e sem leitura de `.env.local`.
- Servidor: bind em `127.0.0.1`; valida Host e Origin; não aceita acesso de rede.
- Dados: Alice fictícia, relógio de fixture e estado em memória. `catalog.mjs`
  lê as receitas demonstrativas do SQL do projeto, sem gerar instruções novas.
- Analytics fica desativado; CSP e rotas Playwright bloqueiam rede externa.
- `qa/`, `tmp/` e `output/` não entram no upload configurado em `.vercelignore`.
- A rota `/preview` é o comparador histórico A/B/C, não este ambiente funcional.

## Executar a prévia

Na raiz do projeto, com as dependências do lockfile instaladas:

```bash
npm run qa:build
npm run qa:serve
```

O servidor permanece em primeiro plano. Em outro terminal:

```bash
curl --fail http://127.0.0.1:4178/__qa/health
```

A resposta identifica `mode: local-fixtures`, o tamanho do catálogo e
`production: false`. Abrir `/app` mostra o banner de demonstração. `/login`
mostra o formulário; o servidor não envia magic links nem valida senhas reais.

Ações da demonstração são compartilhadas entre abas e desaparecem quando o
servidor é reiniciado. Para reiniciar apenas a fixture:

```bash
curl --fail -X POST 'http://127.0.0.1:4178/__qa/reset?scenario=full'
```

Outros cenários: `empty` (bebê sem semana) e `onboarding` (sem bebê cadastrado).
Usar somente dados fictícios neste ambiente.

## Executar a validação

Os três engines do Playwright precisam estar instalados. Quando necessário:

```bash
npx playwright install chromium firefox webkit
```

Com o servidor de fixtures ativo, executar **sequencialmente**:

```bash
npm test
npm run build
npm run lint
npm run design:lint
npm run qa:regressions
node qa/brand.mjs
# Bash/git-bash: cada engine usa o mesmo servidor, um por vez.
for engine in chromium firefox webkit; do
  QA_BROWSER=$engine npm run qa:audit || break
  QA_BROWSER=$engine npm run qa:flows || break
  QA_BROWSER=$engine npm run qa:dialogs || break
done
```

As suítes de navegador reiniciam o mesmo estado antes de cada caso. Não rodar
`qa:audit`, `qa:flows`, `qa:dialogs` ou `qa:regressions` em paralelo entre si, nem enquanto
alguém estiver editando a demonstração no preview.

Sem argumento, audit/flows criam diretórios com timestamp. Para uma execução
nomeada, escolher um nome novo para preservar evidências anteriores:

```bash
npm run qa:audit -- revisao-visual
npm run qa:flows -- revisao-fluxos
```

Filtragem opcional em bash/git-bash:

```bash
QA_BROWSER=firefox QA_PROFILE=mobile-dark QA_PAGE=week npm run qa:audit
QA_BROWSER=webkit QA_PROFILE=desktop-light QA_FLOW=week-replacement,shopping npm run qa:flows
```

Uma execução filtrada não valida toda a matriz. Conferir `expected`,
`completed`, `failed`/`passed` e os registros, não apenas o código de saída.

## Cobertura

- `catalog.test.ts`: catálogo local extraído do seed e da expansão SQL.
- `store.test.ts`: persistência em memória, resposta a consultas e isolamento
  explícito das fixtures.
- `regressions.mjs`: largura do documento da Semana, saída da conta e label /
  contraste do Perfil em 320, 390, 768 e 1440 px.
- `brand.mjs`: caixa da marca dentro do contêiner e contraste mensurável
  no login, em seis combinações de largura/tema no Chromium.
- `audit.mjs`: nove rotas × seis perfis por engine, com axe, limites
  horizontais, imagens, erros JavaScript/console/HTTP, rede externa e captura.
- `flows.mjs`: doze fluxos em desktop claro e mobile escuro, incluindo foco,
  tema persistido, favoritos, filtros, etapas, planejamento, troca com retry,
  geração/cópia da semana, despensa, compras, PDFs, perfil e onboarding.
- Login: validações locais, troca de modo e visibilidade do campo de senha;
  nenhuma senha é digitada ou autenticada por esta suíte.
- Falhas 503 são injetadas nos cenários de recuperação. A suíte registra essas
  respostas esperadas e reprova erros JavaScript ou requisições externas.

## Evidências e interpretação

- Matrizes: `output/ui-qa/v2-{chromium,firefox,webkit}-final/audit.json`.
- Fluxos v3: `output/ui-qa/v3-{chromium,firefox,webkit}-flows-verified/flows.json`.
- Diálogos v3: `output/ui-qa/v3-{chromium,firefox,webkit}-dialogs-verified/dialogs.json`.
- Axe integral, sem edição: `axe-raw/` dentro de cada execução de diálogos.
- As chaves acima indicam três diretórios separados, não um nome literal.
- Cada suíte salva `cases.jsonl` progressivamente para sobreviver a interrupções.
- Capturas: `screenshots/` dentro de cada execução.
- Downloads pelos botões: `pdf/` dentro de cada execução de fluxos.
- Relatório atual: `output/ui-qa/report-v3.md`; as rodadas anteriores permanecem
  preservadas em `output/ui-qa/report-v2.md` e `output/ui-qa/report.md`.

`violations: []` significa ausência de violações detectadas pelas regras
executadas, não certificação de acessibilidade. `incomplete` permanece nos
JSONs, inclusive nos estados interativos dos fluxos. A revisão específica
dos três vídeos foi dispensada por solicitação explícita: não publicar
transcrições automáticas nem tratá-los como conteúdo auditado.

O Firefox recebe viewport e toque, mas não `isMobile`, opção que esse engine
não suporta. WebKit no Windows não equivale a Safari/iOS em aparelho real.
Testes de DOM/contraste não equivalem a revisão humana de pixels.

Fora do escopo: autenticação real, pagamento, Supabase/RLS, upload real de
foto, instalação/offline PWA, Safari/iOS nativo e aparelho físico. Nenhum
deploy é parte deste roteiro.

## Regressões de compatibilidade

- Schemas importam `src/lib/schemas/zod.ts`, que ativa `jitless` antes de
  construí-los. A CSP continua bloqueando JavaScript dinâmico; não adicionar
  `unsafe-eval` para ocultar o alerta do Firefox.
- O skip link usa `tabIndex={0}` explícito para entrar na sequência de Tab
  também no WebKit. A suíte exige foco real e ativação até o main.
- Os diálogos recebem referência do botão que os abriu. Cliques no WebKit
  nem sempre mudam `document.activeElement`; o retorno não depende disso.
- Filtros aguardam a lista renderizada depois da transição do Router. Ler
  `count()` imediatamente após `fill()` produzia falha falsa no WebKit.

## Medição complementar dos diálogos

`qa:dialogs` abre planejador e troca em seis combinações de viewport/tema,
para o engine indicado por `QA_BROWSER`. Salva o retorno integral do axe,
resolve cada seletor `color-contrast` indeterminado e registra uma medição
CSS/DOM separada. Também verifica títulos, parágrafos, labels e botões com
texto; rola o painel quando necessário, sem forçar foco.

```bash
QA_BROWSER=webkit npm run qa:dialogs
QA_BROWSER=firefox QA_PROFILE=narrow-light QA_DIALOG=planner npm run qa:dialogs
npm test -- qa/rendered-contrast.test.ts
npx tsc --ignoreConfig --noEmit --allowJs --checkJs --target ES2023 --module NodeNext --skipLibCheck --lib ES2023,DOM,DOM.Iterable qa/rendered-contrast.mjs qa/rendered-contrast.test.ts
```

`rendered-contrast.mjs` calcula luminância sRGB a partir dos estilos efetivos,
compõe canais alpha até um fundo opaco e não arredonda antes de comparar o
limiar. Examina nove pontos por retângulo de texto com `elementFromPoint`.
Retorna indeterminado para fundos não sólidos, cores não suportadas, efeitos
como opacidade de grupo ou falha na amostragem. Cada nó tem chave DOM estável
para deduplicação entre um parágrafo e seus filhos.

A amostragem **não** é análise de pixels nem um detector completo de oclusão:
sobreposições com `pointer-events:none`, pseudo-elementos e pinturas entre
pontos amostrados exigem revisão adicional. Valores de controles nativos,
conteúdo gerado por CSS, canvas e shadow DOM não fazem parte dessa medição.
Os valores nativos do formulário continuam abrangidos pelas regras do axe.

`incomplete` do axe nunca é apagado ou convertido em `passed`. O suplemento
mostra a medição dos alvos concretos em paralelo. A comparação geométrica
registrada em `v3-axe-grid.json` encontrou diferenças no conteúdo **atrás**
do painel opaco entre linhas do mesmo botão; não foi alterado o layout,
o empilhamento ou a versão do axe para forçar um relatório limpo.

A suíte reprova qualquer alvo indeterminado não resolvido, qualquer medição
sem texto, razão abaixo do limiar, amostra encoberta, erro de console/página,
HTTP inesperado ou tentativa de rede externa. JSONL e agregado precisam ter
as mesmas linhas e o conjunto exato de chaves esperado. Rótulos existentes
são recusados para não substituir evidências.

`verify-v3.py` é o runner de entrega desta rodada, com rótulos exclusivos e
logs por gate; ele recusa substituir `v3-verification`. Para rodadas futuras,
use os comandos públicos acima com novos rótulos. A matriz de rotas v2 é
histórica; a v3 executa novamente os fluxos e a matriz específica dos diálogos.

## Convite de instalação PWA

`qa:pwa` testa a interface real e o store compartilhado do convite com eventos
**sintéticos**, sem abrir um instalador do sistema. O init script bloqueia eventos
nativos `beforeinstallprompt`; service workers e rede externa permanecem bloqueados.

```bash
npm run qa:build
# Com qa:serve ativo; escolher um rótulo que ainda não exista para cada engine.
for engine in chromium firefox webkit; do
  QA_BROWSER=$engine npm run qa:pwa -- revisao-convite-pwa || break
done
npm test -- src/lib/pwa-install.test.tsx src/components/ui/InstallAppCard.test.tsx
```

Cobertura: instruções com Enter/Espaço e `aria-expanded`/`aria-controls`, variante
iOS por user agent sintético, rejeição com recuperação, cancelamento, aceite sem
confundir com instalação concluída, evento `appinstalled`, prompt pendente durante
troca de rota e dispensa do convite da Home sem remover o acesso pelo Perfil.
Os perfis são desktop claro (1440 px), mobile escuro (390 px) e estreito claro
(320 px). Firefox não recebe `isMobile`; WebKit/UA sintético não é Safari/iOS real.

Filtrar com `QA_PROFILE` e `QA_PWA_CASE` reduz a cobertura; valores de caso aceitam
lista separada por vírgulas. Evidências ficam em
`output/ui-qa/<rótulo>/browsers/<engine>/`, com JSONL progressivo, agregado,
capturas do cartão e resultado integral do axe. O runner recusa sobrescrever
um diretório de engine existente, exige o conjunto exato de casos e preserva
`incomplete` separadamente de `violations`.

Após clicar em um link interno, o harness aguarda um elemento exclusivo da rota
de destino antes de medir o cartão. O Router pode atualizar a URL enquanto o
cartão de mesmo nome da rota anterior ainda está montado; uma checagem de URL
sozinha não é uma barreira suficiente.

Esta suíte não verifica instalação nativa, persistência da instalação entre
sessões, modo offline, leitor de tela real ou aparelho físico. A dispensa da
revisão dos vídeos permanece inalterada. A rodada PWA é complementar à v3.

