# Volkan Turkut

A minimal, free-to-host personal landing page featuring the original *Entangled* production renderer by Bjørn Staal.

## Original renderer and source comparison

The live page loads the original Entangled runtime files locally:

- `bundle.min.js` — original production generator.
- `fxhash.min.js` — original fxhash runtime.
- `three.r157.min.js` — Three.js r157 used by the original project.

All three files have the same Git blob SHA as the corresponding files in [fire17/entangled-grail's preserved original source folder](https://github.com/fire17/entangled-grail/tree/main/versions/v0-original-entangled). The additional original source and reference files from that folder are preserved under [original-source/versions/v0-original-entangled](./original-source/versions/v0-original-entangled), including the beautified bundle, original HTML shell, and palette-analysis references.

**Comparison result:** 3/3 core runtime files are exact blob matches; 8/8 files from the preserved original source folder are represented in this repository. This is source-file coverage, not a claim of pixel-identical output on every browser or screen.

## What is customized here

- The page shell and responsive styling are adapted for a minimal personal portfolio.
- The footer shows Volkan Turkut and links to ArtStation, itch.io, and GitHub.
- The original runtime assets are served locally; no paid hosting, bundler, CDN, or external font is required.
- The original artwork runtime remains the active renderer. The previous custom recreation modules have been removed to avoid confusing them with the original source.

## Credits and rights

The Entangled artwork and original production bundle are © Bjørn Staal (@nonfigurativ), *Entangled*, fxhash VERTEX (2024). All rights remain with the artist. The upstream preservation repository describes its copy as preservation/study material and asks users to confirm VERTEX open-source terms before public redistribution. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) and the [upstream preservation repository](https://github.com/fire17/entangled-grail).

## Free hosting with GitHub Pages

This repository is named `volkanturkut.github.io`, so the site URL is:

**https://volkanturkut.github.io/**

GitHub Pages publishes the static files from this repository. No build step is needed.

## Customize

Edit `index.html` to change the footer name or profile links. The original renderer is loaded from `bundle.min.js`; avoid changing the original runtime files if you want to keep the preserved source intact.
