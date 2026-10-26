# Volkan Turkut

A minimal, free-to-host personal landing page with an Entangled-inspired GPU particle simulation.

## Renderer

- GPU-computed particle positions, velocity, and acceleration
- Up to 1,048,576 particles on larger displays; a smaller workload on narrow or short screens
- Green particle shell with a red core; paired browser windows share a screen-coordinate world and form a flowing particle tether
- Additive blending and persistent trails, using locally hosted Three.js
- Name and ArtStation → itch.io → GitHub links remain above the canvas
- No paid service, bundler, runtime CDN, or external font required

## Credits and licensing

The renderer adapts the MIT-licensed GPU recreation from [fire17/entangled-grail](https://github.com/fire17/entangled-grail/tree/main/versions/v2-entangled-gpu) and uses Three.js. Third-party copyright and license notes are in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

This is a close recreation, not the original production bundle from Bjørn Staal's fxhash artwork.

## Free hosting with GitHub Pages

This repository is named `volkanturkut.github.io`, so the site URL is:

**https://volkanturkut.github.io/**

The current GitHub Pages workflow publishes the static files from this repository. No build step is needed.

## Customize

Edit `index.html` to change the footer name or profile links. Particle simulation settings such as the resolution are in `main.js`.
