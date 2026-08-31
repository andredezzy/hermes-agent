/** The one heading scale every markdown surface in the app renders with.
 *
 *  Chat headings are not document headings. The browser default puts h1 at 2em
 *  — against chat body text that reads as a title dropped into a message, so
 *  every surface here shrinks them and leans on weight and colour instead.
 *
 *  Sizes are ABSOLUTE, not ratios of each surface's body text. Ratios do not
 *  transport: the group room's body is 12px against the main thread's 14px, and
 *  re-basing the same 1.14x ratio onto it produced a 14px h1 — a smaller
 *  heading for the same content one pane over. A reader recognises a heading by
 *  how big it actually is, so the sizes stay fixed and each surface's ratio
 *  lands where its own body text puts it.
 *
 *  This module exists because the scale was previously written out three times
 *  — main thread, group room, tool output — and drifted. Change a size here and
 *  every surface moves together.
 */

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4'

/** Font size per level, as a Tailwind class. */
export const HEADING_SIZES: Record<HeadingLevel, string> = {
  h1: 'text-[1rem] tracking-tight',
  h2: 'text-[0.9375rem] tracking-tight',
  h3: 'text-[0.875rem]',
  h4: 'text-[0.8125rem]'
}

/** Font size per level in rem, for surfaces that need the number rather than
 *  the class (and for tests asserting the scale holds its shape). */
export const HEADING_REM: Record<HeadingLevel, number> = {
  h1: 1,
  h2: 0.9375,
  h3: 0.875,
  h4: 0.8125
}

/** Spacing per level: air above a heading, not below, so the label stays
 *  attached to the text it introduces. Level 1–2 get a fuller gap than 3–4. */
export const HEADING_SPACING: Record<HeadingLevel, string> = {
  h1: 'mt-4 mb-1.5 first:mt-0',
  h2: 'mt-4 mb-1.5 first:mt-0',
  h3: 'mt-3 mb-1 first:mt-0',
  h4: 'mt-3 mb-1 first:mt-0'
}

/** Everything a heading needs: size, spacing, and the weight that carries the
 *  hierarchy once the sizes sit this close together. */
export function headingClass(level: HeadingLevel): string {
  return `${HEADING_SPACING[level]} ${HEADING_SIZES[level]} font-semibold`
}

/** The same scale as `[&_hN]:` variants, for a surface that styles a markdown
 *  subtree from the outside instead of supplying element components.
 *
 *  Written as one literal per level on purpose: Tailwind scans source text, so
 *  a class assembled by concatenation never reaches the stylesheet. */
export const HEADING_DESCENDANT_CLASS =
  '[&_h1]:text-[1rem] [&_h2]:text-[0.9375rem] [&_h3]:text-[0.875rem] [&_h4]:text-[0.8125rem] [&_h1]:tracking-tight [&_h2]:tracking-tight [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_h1]:mt-4 [&_h2]:mt-4 [&_h3]:mt-3 [&_h4]:mt-3 [&_h1]:mb-1.5 [&_h2]:mb-1.5 [&_h3]:mb-1 [&_h4]:mb-1 [&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0 [&_h4:first-child]:mt-0'
