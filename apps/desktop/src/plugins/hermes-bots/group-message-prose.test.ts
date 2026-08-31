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

  it('keeps headings within a chat-scale ratio of the body', () => {
    // The main thread runs h1 at 1.14x body. A heading is a label in a chat
    // message, not a page title — past ~1.3x it reads as a document.
    const body = bodySize(GROUP_MESSAGE_PROSE_CLASS)
    const sizes = headingSizes(GROUP_MESSAGE_PROSE_CLASS)

    expect(body).toBeGreaterThan(0)
    expect(sizes.h1 / body).toBeLessThanOrEqual(1.3)
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
})
