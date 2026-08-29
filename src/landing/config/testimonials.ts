export interface Testimonial {
  id: string
  quote: string
  name: string
  detail?: string
}

// Só preencha com depoimentos autorizados e verificáveis.
export const testimonials: Testimonial[] = []
