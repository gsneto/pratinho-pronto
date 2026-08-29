export const offerConfig = {
  productName: 'Pratinho Pronto',
  price: 67,
  priceLabel: 'R$ 67',
  referenceValue: 147,
  totalValue: 237,
  savings: 170,
  billingType: 'one_time' as const,
  checkoutUrl: import.meta.env.VITE_CHECKOUT_URL ?? '',
  guaranteeDays: 7,
  urgency: {
    enabled: false,
    endsAt: null as string | null,
    message: 'Condição especial disponível até',
  },
}

export const landingVariant = 'A' as const
