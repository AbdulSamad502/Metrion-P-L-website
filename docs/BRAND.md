# Brand tokens (sampled from the Metrion logo)

Source of truth is the logo image supplied by the Metrion team (`tools/logo-source.webp`), **not** the Metrion app's dark theme (its `#3ECF74` accent is a minty green; the logo is a lime-leaning green).

Green pixels were sampled from the logo mark (percentiles of luminance):

| Role | Hex | Note |
|---|---|---|
| Deep green (edge of the swoosh) | `#31AC2F` | contrast on white 2.97 — fills/graphics only |
| Mid green | `#53BB3E` | gradient middle |
| Light green | `#7ECC45` | |
| Lime (main highlight) | `#9BDE43` | black text on it = 12.2:1 |
| Pale lime | `#C0EC7B` | highlights, soft fills |
| Black | `#0A0A0A` | logo background, ink |
| White | `#FFFFFF` | page |

Derived for a light theme (all in `src/app/globals.css`):

| Token | Hex | Use |
|---|---|---|
| `--green-text` | `#1B7A28` | green text and links on white (5.44:1, passes WCAG AA) |
| `--green-grad` | `#9BDE43 → #31AC2F` | brand gradient (accents, bars) |
| `--bg-soft` | `#F5FAF1` | alternate sections |
| `--ink` | `#0A0A0A` | text, primary buttons, footer |
| `--loss` | `#B42318` | loss figures (semantic, not brand) |
| `--warn` | `#92400E` on `#FFF4D6` | provisional / example-data notices |

Rules: bright greens are never used for body text on white. Primary buttons are black with white text; hover uses the lime gradient with black text. Logo: `public/metrion-mark-transparent.png` (alpha derived from the logo), wordmark set as live text.

All colours are CSS variables so the brand can be changed in one place.
