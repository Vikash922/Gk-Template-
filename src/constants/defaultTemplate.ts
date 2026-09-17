/**
 * Default GK Card Frame Template
 * Contains only the outer background canvas and the crisp green outer card frame.
 * All question boxes, options (A, B, C, D), text, and images are drawn dynamically
 * so they can be repositioned, nudged, or styled freely without ghost background boxes.
 */

function createSvgTemplateUri(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <!-- 1. Pure White Canvas Outer Background -->
  <rect x="0" y="0" width="1920" height="1080" fill="#ffffff" />

  <!-- 2. Outer Card Body with Thick Vivid Green Border -->
  <rect x="42" y="24" width="1836" height="1032" rx="44" ry="44" fill="#ffffff" stroke="#15803d" stroke-width="14" />
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_TEMPLATE_DATA_URI = createSvgTemplateUri();
