/**
 * Divide o modo de preparo em passos legíveis.
 * As instruções vêm do catálogo como um parágrafo único; quebrar em frases
 * deixa o preparo escaneável no celular sem alterar o conteúdo original.
 * Aceita valores ausentes para nunca derrubar a tela da receita.
 */
export function splitInstructions(instructions: string | null | undefined): string[] {
  if (typeof instructions !== 'string') return []

  const normalized = instructions.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const lineSteps = instructions
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[).:-]|[-•*])\s*/, '').trim())
    .filter(Boolean)

  if (lineSteps.length > 1) return lineSteps

  const sentences = normalized.match(/[^.!?]+[.!?]*/g)
  if (!sentences) return [normalized]

  return sentences.map((sentence) => sentence.trim()).filter(Boolean)
}
