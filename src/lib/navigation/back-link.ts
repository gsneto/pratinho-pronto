/**
 * Rótulo do link "voltar" na página de detalhe da receita.
 *
 * A receita pode ser aberta de vários lugares (catálogo, semana, despensa,
 * início). O rótulo precisa corresponder ao destino real — antes, quem vinha da
 * despensa via "Voltar para receitas" apontando para `/app/pantry`.
 */
export function recipeBackLinkLabel(returnTo: string): string {
  if (returnTo.startsWith('/app/week')) return 'Voltar para minha semana'
  if (returnTo.startsWith('/app/pantry')) return 'Voltar para a despensa'
  if (returnTo.startsWith('/app/recipes')) return 'Voltar para receitas'
  if (returnTo === '/app' || returnTo.startsWith('/app?')) return 'Voltar para o início'
  return 'Voltar para receitas'
}
