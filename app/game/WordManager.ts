import type { AsteroidKind } from '../types/game'
import { EASY, MID, HARD } from '../data/words'
import { pick } from '../utils/random'

export class WordManager {
  private recent: string[] = []

  private poolFor(kind: AsteroidKind, level: number): string[] {
    const r = Math.random()
    if (kind === 'armored') return HARD
    if (kind === 'bonus') return EASY
    if (kind === 'fast') return level < 4 ? EASY : MID
    if (kind === 'danger' || kind === 'fighter' || kind === 'shield' || kind === 'crate') return MID
    if (kind === 'gunship') return HARD
    if (level < 3) return EASY
    if (level < 6) return r < 0.35 ? EASY : MID
    return r < 0.2 ? EASY : r < 0.65 ? MID : HARD
  }

  next(kind: AsteroidKind, level: number, takenFirst: Set<string>): string {
    const pool = this.poolFor(kind, level)
    const fresh = pool.filter((w) => !takenFirst.has(w[0] ?? '') && !this.recent.includes(w))
    const word = pick(fresh.length ? fresh : pool)
    this.recent.push(word)
    if (this.recent.length > 12) this.recent.shift()
    return word
  }
}
