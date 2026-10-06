# Cicero website

The Cicero marketing site, restyled in the Cicero visual language (black stage, white bands, light grotesk headlines, burgundy accents, pill buttons). Copy, pages and behaviour are unchanged from the previous version.

## What's here

- `index.html` – the whole site: every page (home, platform, languages, security, pricing, insights, articles, demo request), the styles, the scripts and the seven translations (EN, AR, FR, DE, ES, IT, PT). Pages are switched by the URL hash (`#platform`, `#pricing`, …).
- `images/` – the black-and-white photography.
- `film/` – the hero film (`cicero-strait-final.mp4`, 1600px H.264) and its poster frame.

Keep `images/` and `film/` next to `index.html` when deploying.

## Notes for development

- The redesign lives in the `<style id="cicero-visual-language">` block, after the original stylesheet, so it is easy to see what changed.
- Headline font: `General Sans` if available, otherwise `Hanken Grotesk` from Google Fonts. Self-host General Sans to match the design file exactly.
- The hero film is fetched into memory and played from a blob URL, because the original host could not serve byte-range requests (which iPhones need). On a normal web server you can point the `<video>` straight at `film/cicero-strait-final.mp4` instead.
- The demo request form and briefing signup are front-end only; they build the request text but do not send it anywhere yet.
