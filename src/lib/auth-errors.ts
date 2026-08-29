export function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('rate limit')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
  }

  if (message.includes('invalid email')) {
    return 'Digite um endereço de e-mail válido.'
  }

  if (message.includes('signup') && message.includes('disabled')) {
    return 'Novos acessos estão temporariamente indisponíveis.'
  }

  if (message.includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos.'
  }

  if (message.includes('already registered') || message.includes('user already registered')) {
    return 'Este e-mail já possui acesso. Use a opção Entrar.'
  }

  if (message.includes('access_not_granted')) {
    return 'Não encontramos uma compra aprovada para este e-mail. Confira o e-mail usado no pagamento.'
  }

  return 'Não foi possível concluir seu acesso agora. Tente novamente em instantes.'
}
