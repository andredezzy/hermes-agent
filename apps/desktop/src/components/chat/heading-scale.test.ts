import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  HEADING_DESCENDANT_CLASS,
  HEADING_REM,
  HEADING_SIZES,
  headingClass,
  type HeadingLevel
} from './heading-scale'

const LEVELS: HeadingLevel[] = ['h1', 'h2', 'h3', 'h4']

/** Every markdown surface that renders message or tool content. If a new one
 *  appears, it belongs on this list — and must source its scale from here. */
const MARKDOWN_SURFACES = [
  'src/components/assistant-ui/markdown-text.tsx',
  'src/components/chat/compact-markdown.tsx',
  'src/plugins/hermes-bots/group-chat-view.tsx'
]

function sourceOf(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('heading scale', () => {
  it('orders the levels largest to smallest', () => {
    expect(HEADING_REM.h1).toBeGreaterThan(HEADING_REM.h2)
    expect(HEADING_REM.h2).toBeGreaterThan(HEADING_REM.h3)
    expect(HEADING_REM.h3).toBeGreaterThan(HEADING_REM.h4)
  })

  it('keeps a heading from reading as a document title', () => {
    // The browser default is 2em against body text. That is the failure this
    // scale exists to prevent, on every surface at once.
    const smallestBody = 0.75 // the group room, the tightest surface we render

    expect(HEADING_REM.h1 / smallestBody).toBeLessThan(1.6)
    expect(HEADING_REM.h1 / smallestBody).toBeGreaterThan(1)
  })

  it('agrees between the class table and the rem table', () => {
    // Two representations of one decision drift unless something checks.
    for (const level of LEVELS) {
      expect(HEADING_SIZES[level]).toContain(`text-[${HEADING_REM[level]}rem]`)
    }
  })

  it('agrees between the element classes and the descendant variants', () => {
    for (const level of LEVELS) {
      expect(HEADING_DESCENDANT_CLASS).toContain(`[&_${level}]:text-[${HEADING_REM[level]}rem]`)
    }
  })

  it('carries weight at every level', () => {
    // Once headings sit within ~1.3x of body text, weight is what marks them.
    for (const level of LEVELS) {
      expect(headingClass(level)).toContain('font-semibold')
    }
  })

  it('spaces a heading above rather than below', () => {
    // The gap belongs between a section and the one before it, so a label stays
    // attached to its own text.
    for (const level of LEVELS) {
      expect(headingClass(level)).toMatch(/\bmt-\d/)
      expect(headingClass(level)).toContain('first:mt-0')
    }
  })

  it('is the only place a markdown surface sizes a heading', () => {
    // The scale used to be written out once per surface and drifted: tool
    // output rendered h1 at 0.875rem while the main thread used 1rem. A surface
    // that hardcodes its own size is how that comes back.
    const offenders: string[] = []

    for (const surface of MARKDOWN_SURFACES) {
      const source = sourceOf(surface)

      const declaresOwnSize =
        /\bh[1-4]:\s*'[^']*text-\[/.test(source) || /\[&_h[1-4]\]:text-\[/.test(source)

      const importsScale = /from '@?\/?[^']*heading-scale'/.test(source)

      if (declaresOwnSize && !importsScale) {
        offenders.push(surface)
      }
    }

    expect(offenders).toEqual([])
  })
})
