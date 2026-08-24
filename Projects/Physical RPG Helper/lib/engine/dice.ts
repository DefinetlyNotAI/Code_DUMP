// Dice engine: supports standard dice and arbitrary notation like "3d8+5", "2d6", "1d100-2".
// Deterministic when supplied an RNG; defaults to Math.random.

export type Rng = () => number // returns [0,1)

export const STANDARD_DICE = [4, 6, 8, 10, 12, 20, 100] as const
export type StandardDie = (typeof STANDARD_DICE)[number]

export interface DiceTerm {
  count: number
  sides: number
}

export interface ParsedDice {
  terms: DiceTerm[]
  modifier: number
  raw: string
}

export interface DiceRollResult {
  notation: string
  rolls: { sides: number; value: number }[]
  modifier: number
  diceTotal: number // sum of rolls only
  total: number // diceTotal + modifier
}

const DICE_RE = /^\s*([+-]?\d*d\d+|[+-]?\d+)(\s*[+-]\s*(\d*d\d+|\d+))*\s*$/i
const TOKEN_RE = /([+-]?)\s*(\d*)d(\d+)|([+-]?)\s*(\d+)/gi

export function isValidNotation(notation: string): boolean {
  if (!notation || !notation.trim()) return false
  return DICE_RE.test(notation.replace(/\s+/g, ""))
}

export function parseDice(notation: string): ParsedDice {
  const raw = notation.trim()
  const terms: DiceTerm[] = []
  let modifier = 0
  const cleaned = raw.replace(/\s+/g, "")
  let match: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  let matched = false
  while ((match = TOKEN_RE.exec(cleaned)) !== null) {
    matched = true
    if (match[3] !== undefined) {
      // dice term
      const sign = match[1] === "-" ? -1 : 1
      const count = match[2] === "" ? 1 : Number.parseInt(match[2], 10)
      const sides = Number.parseInt(match[3], 10)
      terms.push({ count: sign * count, sides })
    } else if (match[5] !== undefined) {
      const sign = match[4] === "-" ? -1 : 1
      modifier += sign * Number.parseInt(match[5], 10)
    }
  }
  if (!matched) throw new Error(`Invalid dice notation: ${notation}`)
  return { terms, modifier, raw }
}

export function rollDie(sides: number, rng: Rng = Math.random): number {
  return Math.floor(rng() * sides) + 1
}

export function rollNotation(notation: string, rng: Rng = Math.random): DiceRollResult {
  const parsed = parseDice(notation)
  const rolls: { sides: number; value: number }[] = []
  let diceTotal = 0
  for (const term of parsed.terms) {
    const sign = term.count < 0 ? -1 : 1
    const n = Math.abs(term.count)
    for (let i = 0; i < n; i++) {
      const value = rollDie(term.sides, rng)
      rolls.push({ sides: term.sides, value: sign * value })
      diceTotal += sign * value
    }
  }
  return {
    notation: parsed.raw,
    rolls,
    modifier: parsed.modifier,
    diceTotal,
    total: diceTotal + parsed.modifier,
  }
}
