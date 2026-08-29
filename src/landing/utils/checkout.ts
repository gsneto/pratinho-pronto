import { offerConfig } from '../config/offer'
import { track } from '../analytics'
import { appendAttribution } from './utm'

export function goToCheckout(source = 'landing') {
  track('checkout_click', { source, value: offerConfig.price, currency: 'BRL' })
  if (!offerConfig.checkoutUrl) {
    window.alert('O checkout será liberado em breve. Configure VITE_CHECKOUT_URL para ativar o botão.')
    return
  }
  window.location.assign(appendAttribution(offerConfig.checkoutUrl))
}
