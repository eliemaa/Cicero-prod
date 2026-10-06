# Cicero website

The Cicero marketing site, restyled in the Cicero visual language (black stage, white bands, light grotesk headlines, burgundy accents, pill buttons). Copy, pages and behaviour are unchanged from the previous version.

## What's here

Each page is its own HTML file:

| File | Page |
| --- | --- |
| `index.html` | Home |
| `platform.html` | Platform |
| `languages.html` | Languages |
| `security.html` | Security |
| `pricing.html` | Pricing (with the price calculator) |
| `insights.html` | Insights |
| `post-matter-analysis.html`, `post-case-is-the-output.html`, `post-mostly-right.html`, `post-one-record.html` | Articles |
| `guide-twelve-questions.html` | Buyer's guide |
| `research-four-ways.html` | Research note |
| `case-late-production.html` | Case study |
| `demo.html` | Book a working session (request form) |

Shared files:

- `css/site.css` – all styles. The redesign is the second half of the file, after the original stylesheet.
- `js/i18n.js` – the seven translations (EN, AR, FR, DE, ES, IT, PT). The chosen language is remembered across pages.
- `js/site.js` – language switching, menus, the quote carousel, the pricing calculator, the accordion, tabs, the request form and the hero film.
- `js/ui.js` – the full-screen menu and swipe for the testimonials.
- `images/` – the black-and-white photography.
- `film/` – the hero film (`cicero-strait-final.mp4`, 1600px H.264) and its poster frame.

Links between pages carry context: "Talk to us about claims" opens `demo.html?topic=claims` with the form preselected, and the pricing calculator's button passes the chosen plan into the request message.

## Notes for development

- Headline font: `General Sans` if available, otherwise `Hanken Grotesk` from Google Fonts. Self-host General Sans to match the design file exactly.
- The hero film is fetched into memory and played from a blob URL, because the original host could not serve byte-range requests (which iPhones need). On a normal web server you can point the `<video>` straight at `film/cicero-strait-final.mp4` instead.
- The demo request form and briefing signup are front-end only; they build the request text but do not send it anywhere yet.
