import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { GROUP_MESSAGE_PROSE_CLASS } from './group-chat-view'

/** Every `[&_hN]:text-[...]` size the class declares, keyed by tag. */
function headingSizes(className: string): Record<string, number> {
  const sizes: Record<string, number> = {}

  for (const match of className.matchAll(/\[&_(h[1-4])\]:text-\[([0-9.]+)rem\]/g)) {
    sizes[match[1]] = Number(match[2])
  }

  return sizes
}

/** The `text-*` size the body itself renders at, in rem. */
function bodySize(className: string): number {
  const explicit = /(?:^|\s)text-\[([0-9.]+)rem\]/.exec(className)

  if (explicit) {
    return Number(explicit[1])
  }

  // Tailwind's named scale, for the sizes this surface actually uses.
  const named: Record<string, number> = { 'text-xs': 0.75, 'text-sm': 0.875, 'text-base': 1 }
  const hit = Object.keys(named).find(name => new RegExp(`(?:^|\\s)${name}(?:\\s|$)`).test(className))

  return hit ? named[hit] : Number.NaN
}

describe('group message prose', () => {
  it('sizes every heading level it renders', () => {
    // Without an explicit rule a heading falls back to the browser default —
    // h1 at 2em, which is twice the body on this surface. The main thread
    // solved this with a calibrated scale; the room has to carry one too.
    const sizes = headingSizes(GROUP_MESSAGE_PROSE_CLASS)

    expect(Object.keys(sizes).sort()).toEqual(['h1', 'h2', 'h3', 'h4'])
  })

  it('gives headings the same absolute size they get in the main thread', () => {
    // Ratio does not transport between surfaces. Basing these on the main
    // thread's 1.14x produced a 14px h1 against a 12px body — a smaller heading
    // than the same text gets one pane over, and too faint to scan. A reader
    // recognises a heading by its actual size, so match the sizes, and let the
    // ratio land where the smaller body puts it.
    const sizes = headingSizes(GROUP_MESSAGE_PROSE_CLASS)

    expect(sizes.h1).toBe(1)
    expect(sizes.h2).toBe(0.9375)
    expect(sizes.h3).toBe(0.875)
  })

  it('keeps a heading from reading as a document title', () => {
    // The browser default is 2em. That is the failure this class exists to fix,
    // and the ceiling that keeps a future edit from drifting back to it.
    const body = bodySize(GROUP_MESSAGE_PROSE_CLASS)
    const sizes = headingSizes(GROUP_MESSAGE_PROSE_CLASS)

    expect(body).toBeGreaterThan(0)
    expect(sizes.h1 / body).toBeLessThan(1.6)
    expect(sizes.h1 / body).toBeGreaterThan(1)
  })

  it('orders the levels largest to smallest', () => {
    const { h1, h2, h3, h4 } = headingSizes(GROUP_MESSAGE_PROSE_CLASS)

    expect(h1).toBeGreaterThanOrEqual(h2)
    expect(h2).toBeGreaterThanOrEqual(h3)
    expect(h3).toBeGreaterThanOrEqual(h4)
  })

  it('carries heading weight, since size alone no longer separates them', () => {
    // Once a heading is only ~15% larger than the body, weight is what makes it
    // read as a heading at all.
    expect(GROUP_MESSAGE_PROSE_CLASS).toContain('font-semibold')
  })

  it('declares its classes where Tailwind can find them', () => {
    // Tailwind v4 scans source text: a class built by concatenation or template
    // interpolation is invisible to the scanner and silently never reaches the
    // stylesheet. The first version of this constant was assembled with `+` and
    // every assertion above still passed while the page rendered unstyled.
    const source = readFileSync(
      resolve(process.cwd(), 'src/plugins/hermes-bots/group-chat-view.tsx'),
      'utf8'
    )
    const declaration = /export const GROUP_MESSAGE_PROSE_CLASS\s*=([^\n]*\n[^\n]*)/.exec(source)

    expect(declaration).not.toBeNull()
    expect(declaration![1]).not.toContain('+')
    expect(declaration![1]).not.toContain('${')
  })
})
