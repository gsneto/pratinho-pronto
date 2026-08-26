const showcaseRecipeImages: Record<string, string> = {
  'Aveia cremosa com manga': '/images/recipes/aveia-cremosa-com-manga.webp',
  'Bolinho macio de banana e aveia': '/images/recipes/bolinho-macio-de-banana-e-aveia.webp',
  'Carne com mandioca e abóbora': '/images/recipes/carne-com-mandioca-e-abobora.webp',
  'Cuscuz macio com ovo': '/images/recipes/cuscuz-macio-com-ovo.webp',
  'Frango com arroz e brócolis': '/images/recipes/frango-com-arroz-e-brocolis.webp',
  'Lentilha com batata-doce e couve': '/images/recipes/lentilha-com-batata-doce-e-couve.webp',
  'Mamão com pêssego': '/images/recipes/mamao-com-pessego.webp',
  'Panquequinha de banana': '/images/recipes/panquequinha-de-banana.webp',
  'Peixe com abóbora e quinoa': '/images/recipes/peixe-com-abobora-e-quinoa.webp',
  'Peixe com arroz e cenoura': '/images/recipes/peixe-com-arroz-e-cenoura.webp',
}

export function getRecipeImageUrl(name: string, imageUrl: string | null) {
  return imageUrl || showcaseRecipeImages[name] || null
}

