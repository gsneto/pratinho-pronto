# Design e experiência de compra do Pratinho Pronto

## Recomendação

Implementar a evolução visual diretamente no React existente, depois de comparar três propostas para uma mesma tela principal. Usar Claude Code com orientação específica de design e referências selecionadas. Uma ferramenta visual é opcional: Stitch facilita explorar propostas no navegador; Pencil/pen.dev é a alternativa a experimentar quando se deseja um canvas instalado e próximo do código. Figma é particularmente útil se houver revisão manual frequente ou colaboração com designer.

Esta é uma recomendação de adequação ao projeto, não um ranking universal de qualidade. A pesquisa consultou documentação oficial e publicações de UX em 13/09/2026. Não foram instaladas ferramentas nem realizadas provas comparativas executando o mesmo briefing em cada produto. Preços, limites de planos e disponibilidade na conta devem ser conferidos antes de contratar.

## Base do projeto

A inspeção local de package.json e src/index.css confirmou React, TypeScript, Vite, Tailwind, Supabase, React PDF, Lucide, Karla e Fraunces. O CSS define creme esverdeado, sálvia, vinho e laranja, com variáveis para tema escuro. Isso permite melhorar o acabamento sem introduzir outra plataforma de aplicação.

Não foi realizada nesta pesquisa uma auditoria visual da versão autenticada atual. Problemas e mudanças abaixo são critérios e propostas para avaliar depois que a estrutura estiver concluída; não devem ser apresentados como defeitos já comprovados.

## O papel do visual na venda

Interfaces atraentes podem ser percebidas como mais fáceis de usar. O efeito estético-usabilidade descrito pela Nielsen Norman Group sustenta investir em apresentação, mas também alerta que beleza pode mascarar problemas. Não demonstra que qualquer redesign aumentará as compras deste produto.[1]

A consequência comercial mais importante é tornar a utilidade visível antes da compra. Se o app só aparece depois do pagamento, seu redesign pode melhorar satisfação e uso, mas o efeito direto na aquisição depende de atualizar a demonstração, imagens e explicação da oferta. A candidata deve conseguir entender como o planejamento se transforma em refeição, lista e impressão.

Proposta de demonstração: mostrar uma semana preenchida, abrir o preparo de uma refeição, trocar essa refeição, mostrar a lista correspondente e finalizar com o PDF. Um vídeo curto pode percorrer esse fluxo com legendas. Duração de 20–35 segundos é uma hipótese de produção para testar, não uma regra comprovada.

Uma prévia interativa pública pode ser testada posteriormente com dados fictícios e funcionalidades delimitadas. Ela não deve ser confundida com liberar acesso pago. Antes de implementá-la, comparar o esforço com a alternativa mais simples de vídeo e capturas reais.

## Referências de produto

### Mealime

O guia oficial organiza o uso em planejamento, compras e preparo; descreve lista gerada a partir das refeições, agrupamento de ingredientes e impressão/compartilhamento.[2] O aprendizado aplicável é continuidade: uma ação produz algo útil na próxima etapa. Aproveitar essa organização sem copiar marca, receitas ou telas. As páginas foram usadas como referência de fluxo, não como confirmação de operação comercial atual de todos os serviços.

### Solid Starts

A apresentação oficial dá destaque a imagens, orientações sobre alimentos e experiências guiadas.[3] O aprendizado é aproximar conteúdo e ação: a imagem deve ajudar a entender o que será preparado. A autoridade clínica da empresa não pode ser transferida ao Pratinho Pronto por aparência ou redação. Fotografias e dados de preparo devem corresponder ao conteúdo real do catálogo.

### Princípios visuais

A NN/g descreve escala, hierarquia, equilíbrio, contraste e agrupamento como princípios relevantes.[4] Para o app, isso significa uma ação principal reconhecível, informações relacionadas próximas e uma diferença clara entre título, descrição, metadados e controles. Encher a tela de cartões de mesma importância elimina essa hierarquia.

## Direção visual proposta

Conceito: cozinha acolhedora, organizada e contemporânea. Deve transmitir praticidade e cuidado, com maturidade suficiente para parecer um produto pago.

Preservar inicialmente as fontes existentes: Fraunces nos títulos principais e Karla nas instruções, formulários e controles. Não aplicar a serifada a todo texto pequeno. Reservar vinho para a ação principal, sálvia para seleção e estados de apoio, creme para base e superfícies claras para conteúdo. Validar contraste de cada combinação, inclusive no tema escuro.

Especificações iniciais para prototipar: corpo de 16px, títulos de página na faixa de 26–32px, botões principais de 48–52px, escala de espaçamento de 4/8/12/16/24/32px, raio de cartões de 16–20px. Esses números são escolhas de projeto ajustáveis, não evidência de aumento de conversão.

Fotos merecem prioridade sobre decoração. Manter proporção, enquadramento e iluminação consistentes; evitar uma mistura de imagens de banco, ilustrações e fotos com estilos incompatíveis. Imagem de receita precisa representar ingredientes e preparo. Conteúdo de alimentação infantil requer revisão apropriada; imagem gerada não serve como evidência de segurança de cortes ou textura.

Movimento deve confirmar ações: seleção, salvamento e troca. Animações breves e discretas, sem atrasar o uso, respeitando redução de movimento. Não adicionar efeitos de vidro, brilho ou fundos animados apenas para parecer moderno.

## Três propostas antes de implementar

Criar três variações da mesma tela semanal, usando exatamente os mesmos dados, marca e funções:

1. Editorial acolhedora: maior presença de fotos, títulos expressivos e bastante espaço.
2. Planejador prático: semana e refeições mais compactas, foco em leitura rápida.
3. Híbrida: refeição do dia em destaque com foto e restante da semana organizado de forma compacta.

A terceira é a candidata inicial recomendada. O destaque visual dá força à apresentação comercial, enquanto a semana continua útil para quem já comprou. A escolha deve considerar a execução real em celular e a compreensão do fluxo, não apenas uma imagem de portfólio.

## Tela a tela

| Área | Proposta | Critério de validação |
|---|---|---|
| Entrada | Mostrar semana ativa e próxima ação | A usuária identifica onde começar |
| Semana | Seletor de dias, refeição em destaque, ações distintas | Abre preparo e volta à semana exata |
| Receita | Foto relevante, ingredientes e passos separados | Encontra preparo sem procurar em blocos longos |
| Troca | Alternativas comparáveis e confirmação de atualização | Entende qual refeição foi substituída |
| Despensa | Ingredientes selecionados visíveis e explicação do resultado | Entende o que tem e o que falta |
| Compras | Grupos claros e itens marcáveis | Lista corresponde à semana escolhida |
| PDF | Semana legível, identidade consistente e impressão econômica | Sem cortes, páginas inúteis ou texto pequeno |
| Estados vazios | Explicação curta e uma ação útil | Nenhuma tela termina em um beco sem saída |

Evitar colocar indicadores, boas-vindas longas e atalhos acima da tarefa principal. Navegação inferior pode reunir Semana, Receitas, Despensa e Compras, desde que esse arranjo seja compatível com as rotas atuais. Perfil pode ocupar posição secundária. Validar barra fixa com teclado aberto e áreas seguras do celular.

## Comparação de ferramentas

| Opção | Capacidade documentada | Adequação ao projeto | Limitação relevante |
|---|---|---|---|
| Código atual + Claude Code | Plugin oficial Frontend Design orienta estética e geração de frontend | Principal opção para integrar o visual ao comportamento existente | Exige briefing visual e inspeção no navegador |
| Pencil/pen.dev | Desktop Windows, extensão e fluxo entre design e código | Experimento indicado para quem quer instalar uma ferramenta visual | Integração e fidelidade precisam de teste no projeto |
| Figma | MCP fornece contexto de design e integração com componentes | Bom para design manual, componentes e revisão colaborativa | Acrescenta uma etapa; condições de plano variam |
| Google Stitch | Canvas de UI com imagens, texto, código e regras DESIGN.md | Bom para explorar alternativas antes da implementação | Exportar tela não comprova integração com autenticação e dados |
| v0 | Importação GitHub e edição visual com reflexo no código | Alternativa para trabalhar no repositório com preview | Conferir Vite e dependências; controlar branches e integração |
| Penpot | Código aberto, tokens, protótipos e inspeção CSS/HTML/SVG | Alternativa de design com formatos abertos | Autohospedagem cria trabalho operacional desnecessário neste caso |
| Builder Visual Copilot | Conversão de Figma e uso de componentes existentes | Faz sentido em fluxo já centrado em Figma | Mais uma camada de ferramenta e revisão |
| Lovable | Documentação consultada informa não importar repositório existente como novo projeto | Baixa prioridade para este app pronto | Exportação para GitHub não equivale a importação do app atual |

Fontes: Claude [5–6], Pencil [7–8], Figma [9], Stitch [10–11], v0 [12–13], Penpot [14], Builder [15], Lovable [16].

Não é necessário baixar software para obter um bom resultado: CSS, componentes, imagens e decisões de layout determinam o visual entregue. Uma ferramenta baixada pode melhorar a edição e comparação; ela não elimina a implementação e os testes.

O plugin Frontend Design é a primeira extensão a avaliar no ambiente Claude Code. É uma capacidade documentada pela Anthropic, não uma garantia estética. Suas sugestões gerais de ousadia e animação devem ser subordinadas à praticidade deste público.[5–6]

## Processo recomendado depois da estrutura

1. Registrar a versão estável: capturas das principais telas e verificação dos fluxos críticos.
2. Fazer três propostas da tela semanal em ambiente isolado, com conteúdo idêntico.
3. Escolher uma e consolidar cores, tipografia, espaçamento, imagens, botões e estados em DESIGN.md.
4. Aplicar a direção a receita, troca, despensa, compras e PDF.
5. Verificar mobile, desktop, temas, toque, foco, carregamento e dados longos ou vazios.
6. Produzir capturas e vídeo reais para a página de venda.
7. Medir comportamento e vendas antes de concluir que a alteração melhorou conversão.

Teste qualitativo sugerido: apresentar as propostas a algumas mães do público e pedir tarefas concretas — encontrar o almoço, abrir preparo, trocar e localizar compras. Perguntar o que entenderam que receberiam ao comprar. Uma rodada pequena identifica confusões, mas não mede estatisticamente aumento de vendas.

## Medição e critérios de qualidade

Separar aquisição e uso. Na aquisição, acompanhar visitantes, interação com a demonstração, cliques no checkout e compras aprovadas. No uso, acompanhar primeira semana criada, abertura de receitas, troca, lista e exportação. Medir também tempo e falhas até a primeira semana concluída.

Contagens de eventos não são automaticamente pessoas únicas. Atribuição publicitária não reconstrói necessariamente o grupo exato de visitantes da página. Um traço em InitiateCheckout não demonstra que ninguém clicou; pode haver ausência de registro, configuração, bloqueio ou atraso. A decisão de redesign não deve se apoiar em uma inferência que o rastreamento não sustenta.

Para legibilidade, usar WCAG como referência: contraste de texto comum de pelo menos 4,5:1 e atenção a controles, foco e alvos. O mínimo AA de alvo em WCAG 2.2 é 24 por 24 pixels CSS, com exceções; 44–48px é a meta de conforto sugerida aqui, não o mínimo AA universal.[17–18]

Para desempenho, as metas de referência dos Core Web Vitals são LCP até 2,5s, INP até 200ms e CLS até 0,1 no percentil 75. Medição local ajuda a detectar regressões, mas não substitui dados de uso real.[19]

Não prometer taxa de conversão, receita ou redução de reembolso a partir de beleza. Para testar resultado comercial, manter comparáveis preço, público, criativo e período ou registrar explicitamente suas mudanças. Com pouco volume, priorizar conclusão de tarefas e relatos sobre clareza enquanto acumula evidência de vendas.

## Briefing que deverá alimentar o próximo prompt

O próximo prompt deve receber screenshots da estrutura final, proposta visual escolhida, DESIGN.md, exemplos reais de conteúdo e limites funcionais. Exigir uma tela de referência aprovada antes de aplicar o estilo ao restante, uso dos componentes existentes e comparação visual antes/depois.

O objetivo de design deve ser específico: em poucos segundos, reconhecer a refeição do dia, entender que pode abrir preparo ou trocar e perceber que a semana gera compras e PDF. Termos vagos como “premium” e “irresistível” não bastam para orientar composição.

## Fontes

1. Nielsen Norman Group. [The Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/).
2. Mealime. [Getting Started Guide](https://support.mealime.com/article/151-getting-started-guide).
3. Solid Starts. [The Solid Starts App](https://solidstarts.com/app/?flow=register).
4. Nielsen Norman Group. [5 Principles of Visual Design in UX](https://www.nngroup.com/articles/principles-visual-design/).
5. Anthropic. [Frontend Design Plugin](https://claude.com/plugins/frontend-design).
6. Anthropic. [Improving frontend design through Skills](https://claude.com/blog/improving-frontend-design-through-skills), 12/11/2025.
7. Pencil/pen.dev. [Installation](https://docs.pencil.dev/getting-started/installation).
8. Pencil/pen.dev. [Design and Code](https://docs.pencil.dev/design-and-code/design-to-code).
9. Figma. [MCP Server Introduction](https://developers.figma.com/docs/figma-mcp-server/).
10. Google. [Introducing vibe design with Stitch](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/), 18/03/2026.
11. Google. [Design in real time with Stitch](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-updates/), 19/05/2026.
12. v0. [Git Import](https://v0.app/docs/git-import).
13. v0. [Design Mode](https://v0.app/docs/design-mode). Conteúdo disponível na indexação; abertura direta falhou durante a consulta.
14. Penpot. [Design and Code](https://penpot.app/code).
15. Builder. [Code faster with AI](https://www.builder.io/ai).
16. Lovable. [GitHub Integration](https://docs.lovable.dev/integrations/github).
17. W3C. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
18. W3C. [Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum).
19. Google web.dev. [Web Vitals](https://web.dev/articles/vitals?hl=en).
