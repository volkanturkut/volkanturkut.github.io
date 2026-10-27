# Volkan Turkut

A minimal, free-to-host personal website using a performance-adapted version of the original *Entangled* visual renderer.

## Active visual experience

The original renderer remains the basis of the visual, but the active `bundle.min.js` has intentional changes for a lightweight single-window portfolio:

- Particle workload adapts to hardware: 16,384 particles on low-resource devices (about 98.9% fewer than original) and 65,536 on standard devices (about 95.6% fewer).
- WebGL pixel ratio capped at 1.0 on low-resource devices and 1.25 on standard devices, with an adaptive render area budget of about 1.5 million pixels.
- Render loop limited to 30 FPS normally and 15 FPS when the operating system requests reduced motion.
- Multi-window and multi-display synchronization disabled.
- Mouse, touch, wheel, and keyboard shortcuts removed; the artwork remains an animated visual rather than an interactive tool.
- If WebGL is unavailable or fails to initialize, a very low-cost CSS fallback illustration is shown.
- No runtime CDN, external fonts, bundler, paid service, analytics, or third-party UI libraries.

The preserved upstream source bundle and support files remain untouched under [original-source/versions/v0-original-entangled](./original-source/versions/v0-original-entangled). The optimized root bundle is a derivative copy; it is not byte-for-byte identical to the upstream bundle.

## Compatibility and performance checks

The page is designed for modern WebGL-capable browsers on desktop and mobile. Automated GitHub Actions tests cover desktop, phone, small Android-sized, tablet, and large-monitor viewport profiles, including simulated low- and standard-resource hardware profiles. The browser tests check asset loading, JavaScript exceptions, actual visible artwork pixels, render pixel budgeting, window-sharing storage, footer links, and the render-loop cap.

No website can guarantee a perfect frame rate on every GPU, browser, thermal state, accessibility setting, or power-saving mode. WebGL-disabled devices show the CSS fallback instead of requiring the renderer to run.

- [Original source audit](./ORIGINAL_SOURCE_AUDIT.md)
- [Third-party notices](./THIRD_PARTY_NOTICES.md)
- [Browser smoke workflow](./.github/workflows/browser-smoke.yml)
- [Source verification workflow](./.github/workflows/verify-original-source.yml)

## Credits and rights

The original artwork and production bundle are © Bjørn Staal (@nonfigurativ), *Entangled*, fxhash VERTEX (2024). All rights remain with the artist. The upstream preservation repository describes its copy as preservation/study material and asks users to confirm VERTEX open-source terms before public redistribution. This personal site does not claim authorship or ownership of the Entangled artwork. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Free hosting with GitHub Pages

This repository is named `volkanturkut.github.io`, so the site URL is:

**https://volkanturkut.github.io/**

GitHub Pages publishes the static files from this repository; no build step is needed for the source itself.

## Customize

Edit `index.html` for the footer or performance profile. The tuned renderer is `bundle.min.js`; the pristine source copy is kept separately under `original-source/`.
