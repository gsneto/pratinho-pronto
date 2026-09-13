export const offerConfig = {
  productName: 'Pratinho Pronto',
  price: 47,
  priceLabel: 'R$ 47',
  referenceValue: 147,
  totalValue: 237,
  savings: 190,
  billingType: 'one_time' as const,
  checkoutUrl: import.meta.env.VITE_CHECKOUT_URL || 'https://pay.cakto.com.br/aaft2rb_1070871',
  guaranteeDays: 7,
  urgency: {
    enabled: false,
    endsAt: null as string | null,
    message: 'Condição especial disponível até',
  },
}

export const landingVariant = 'A' as const
