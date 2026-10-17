# Atribuições de código open source

Registro de proveniência do código de terceiros estudado e/ou reutilizado no
Pratinho Pronto. O objetivo é duplo: cumprir as obrigações de atribuição das
licenças permissivas e deixar explícito o que é código nosso.

> Regra deste arquivo: **só entra na seção "Código reutilizado" o que foi
> efetivamente copiado ou derivado de forma substancial.** Ideias, padrões e
> comportamentos estudados ficam na seção "Referências estudadas".

## Código reutilizado

Nenhum arquivo foi copiado literalmente nesta rodada.

A implementação de unidades (`src/lib/units/`) e a consolidação da lista de
compras (`src/lib/shopping-list/consolidate.ts`) foram **escritas para o
Pratinho Pronto**, com vocabulário de cozinha em português, tipos do nosso
domínio e testes próprios. Dois projetos MIT foram estudados e influenciaram as
decisões de arquitetura (ver abaixo). Nenhuma linha de código deles foi
reproduzida; por isso não há aviso de copyright a preservar aqui.

Se em uma rodada futura algum trecho for copiado, ele deve ser registrado nesta
seção com: repositório, URL, commit, caminho original, caminho final, licença,
copyright preservado, modificações e justificativa.

## Referências estudadas (influência de arquitetura, sem cópia)

| Repositório | Licença | Commit analisado | Módulo estudado | O que foi aproveitado |
| --- | --- | --- | --- | --- |
| [craigcossairt/hestia](https://github.com/craigcossairt/hestia) | MIT | `a3288d93d94dbbd3c18222147f472cd5dd07098a` | `lib/grocery/units.ts`, `lib/grocery/singularize.ts` | Separação entre **categoria** (volume/peso/contagem/pacote) e **unidade canônica**; conversão só dentro da categoria; nunca converter contagem entre si. Implementação própria, sem as regras de inglês (singularização, onças, galões). |
| [jpdevries/pantry-host](https://github.com/jpdevries/pantry-host) | MIT | `a01fa95ed790c06bfc8722f2a7914e506098acd3` | `packages/shared/src/units.ts`, `packages/shared/src/grocery-status.ts` | Padrão de tabela de aliases + `normalizeUnit` antes da comparação; `unitsComparable` como pré-checagem. Implementação própria em pt-BR, sem o modelo de despensa/PLU. |
| [ethancstuart/family-planner-app](https://github.com/ethancstuart/family-planner-app) | MIT | `c44ca553ac43766ad1c7907247ed693369af7172` | `src/app/api/grocery/generate/route.ts` | Apenas comparação: a consolidação dele é acoplada ao Supabase e casa por nome, sem normalização de unidade. **Não reutilizado** — a nossa já era superior. |
| [ldodev/meal-planner](https://github.com/ldodev/meal-planner) | MIT | `b94a1fd317184f9199031b992afd1ca61fd4f116` | Estrutura geral (`components/`, `hooks/`) | Nada aproveitado: planejamento estático, sem consolidação nem persistência. |

### Repositórios avaliados e descartados

| Repositório | Situação | Motivo do descarte |
| --- | --- | --- |
| [tijoba7/meal-planner-pwa](https://github.com/tijoba7/meal-planner-pwa) | **Sem licença** | Sem licença explícita não há autorização de cópia. Referência apenas. |
| [adrianstier/meal-planning](https://github.com/adrianstier/meal-planning) | **Sem licença** | Mesmo motivo. |
| [alissapaluska/hearth](https://github.com/alissapaluska/hearth) | **Sem licença** | Mesmo motivo. Modelagem de unidades não superior à adotada. |
| [erikasboy/checkoffs-list](https://github.com/erikasboy/checkoffs-list) | **Sem licença** | Mesmo motivo; estrutura de lista já coberta pelo nosso código. |
| [mealie-recipes/mealie](https://github.com/mealie-recipes/mealie) | **AGPL-3.0** | Copiar AGPL em produto comercial exigiria avaliação jurídica específica. Usado só como referência conceitual, sem código. |

## Dependências

Nenhuma dependência nova foi adicionada nesta rodada. O módulo de unidades usa
apenas JavaScript padrão (`String.prototype.normalize`), sem bibliotecas
externas.
