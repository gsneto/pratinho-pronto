# Dependências comerciais (requerem confirmação do proprietário)

## Validade da oferta

- **Antes:** a barra superior mostrava "ACESSO VITALÍCIO POR R$47 ATÉ `<hoje>`",
  com a data calculada a partir do dia atual e renovada automaticamente a cada
  dia (urgência falsa).
- **Agora:** a data e o contador foram removidos. O texto é
  "ACESSO VITALÍCIO • PAGAMENTO ÚNICO DE R$47", sem prazo.
- **Pendente:** se houver um prazo comercial real, ele precisa ser informado e
  configurado como data fixa (não renovável). Não foi criada nova data.

## Preço

- **Landing (código, `src/landing/config/offer.ts`):** R$47 à vista,
  "ou 11x de R$5,24 no cartão", valor-âncora R$237, economia R$190.
- **Checkout (Cakto, externo):** na auditoria anterior a página de checkout
  exibiu **R$47,99**, incluindo **taxa de serviço de R$0,99**.
- **Ação tomada:** nenhuma alteração de preço ou de configuração da Cakto. Os
  textos da landing não foram alterados quanto a valores.
- **Pendente (proprietário):** confirmar o total real cobrado. Se a taxa de
  R$0,99 existir, alinhar a comunicação (ex.: informar "R$47 + taxa do meio de
  pagamento" ou ajustar a oferta). O valor de parcelamento (11x R$5,24) também
  depende da configuração da Cakto.

Nenhuma configuração de pagamento, checkout, Pixel ou campanha foi alterada
nesta rodada.
