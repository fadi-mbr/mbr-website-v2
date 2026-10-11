# Restored Dev design: text contrast

Fadi accepted the restored Dev direction on 2026-10-11 and requested a check of text, especially text over images. This is a targeted correction, not a redesign.

## Corrections

- Separate the body text color from the font-size custom property: both previously used `--text-body`, invalidating color declarations.
- Brighten muted text and bronze labels; remove extra opacity from the small hero ticker.
- Place gallery captions, photo badges, service numbers and footer map captions on 85% black backing. Strengthen the photographic section-break overlay and video status/review badges.
- Keep primary CTA gradients dark enough for white text in normal and hover states.
- Replace small brand-red step numbers on About/Workshop: measured 3.77:1 on their card background before correction.

## Measured color pairs

Ratios use sRGB relative luminance. A pure-white image behind 85% black is conservatively rounded up to #272727.

| Text / background | Contrast |
| --- | ---: |
| Bronze #c49a68 / worst-case photo backing #272727 | 5.81:1 |
| Body #d4d4d8 / worst-case photo backing #272727 | 10.11:1 |
| Muted #a1a1aa / elevated surface #1c1c1c | 6.65:1 |
| White / brightest primary gradient stop #cf0612 | 5.69:1 |
| White / brightest hover stop #bd0510 | 6.58:1 |
| Step number #f87171 / card #141414 | 6.66:1 |

Reference: [W3C contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), 4.5:1 for normal text and 3:1 for large text. Ratios are not rounded down to pass.

## Verification and limits

Production build/typecheck and affected-file lint pass. Browser regression covers caption colors over a theoretical pure-white image at 390px and 1440px on Home, About and Workshop. The wider browser suite passed 17 checks before final badge/number refinements; focused caption checks are rerun on the final build. The issue document holds final results and screenshots.

Axe color-contrast scans cover Home, About, Workshop and Privacy at 390px and 1440px. Background gradients and pseudo-elements leave manual-review cases; zero automated failures is not a complete accessibility certification. Rendered-background sampling was used to locate photo issues, then source/compositing checks distinguish actual text from clipped screen-reader content, decorative separators and overlapping fixed controls. Logos embedded in images and every possible video frame are not independently certified. Fixed backing is intended to make caption contrast independent of imagery.

Review data in screenshots is synthetic staging data. No production release is authorized by this review.
