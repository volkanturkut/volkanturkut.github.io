# Original Entangled source comparison

Compared against [fire17/entangled-grail/versions/v0-original-entangled](https://github.com/fire17/entangled-grail/tree/main/versions/v0-original-entangled) on 2026-10-27.

## Exact runtime asset matches

| Upstream file | SHA-1 Git blob ID | Present in site root | Result |
|---|---|---|---|
| `bundle.min.js` | `a554a6a3046692c50125decc6b094238598535f8` | `bundle.min.js` | Exact blob match |
| `fxhash.min.js` | `8a91ebf2f97f6c30496aae43b90c01141a0de2df` | `fxhash.min.js` | Exact blob match |
| `three.r157.min.js` | `7a384bfb1b51375a18e6480b984e0834f5525d1c` | `three.r157.min.js` | Exact blob match |

**Core runtime result: 3/3 (100%) exact source-file identity.**

## Other files from the original source folder

| Upstream file | Preserved here |
|---|---|
| `bundle.beautified.js` | `original-source/versions/v0-original-entangled/bundle.beautified.js` |
| `ITERATION_COLORS.txt` | `original-source/versions/v0-original-entangled/ITERATION_COLORS.txt` |
| `scheme_map.js` | `original-source/versions/v0-original-entangled/scheme_map.js` |
| `scheme_slice.js` | `original-source/versions/v0-original-entangled/scheme_slice.js` |
| `index.html` | `original-source/versions/v0-original-entangled/index.html` |

**Original source-folder coverage: 8/8 files (100%)** when combined with the three exact runtime files in the site root. The five added references were copied from the upstream paths listed above; they are preserved in the GitHub repository, are not loaded by the portfolio page, and are excluded from the published Pages output.

## Differences from the upstream experience

- The site's root `index.html` is intentionally customized: portfolio metadata, responsive footer, and the ArtStation / itch.io / GitHub links are additions. The custom favicon was removed during cleanup.
- The root page follows the original runtime script order (Three.js module, fxhash runtime, then Entangled bundle). The custom footer is intentionally retained from the portfolio requirement.
- The original renderer is active, but a customized page shell and differing browser, viewport, GPU, or WebGL behavior mean pixel-identical rendering cannot be inferred from source hashes alone.
- The previous custom recreation modules were removed, leaving the original runtime files and the preserved reference source.
- The preserved upstream bundle's redistribution rights are not independently established by this comparison. The upstream notice says all rights remain with Bjørn Staal and asks users to confirm VERTEX terms before public redistribution.

## What the percentage means

- **Original core runtime files:** 100% exact file identity (3 of 3).
- **Files in the preserved original source folder:** 100% represented (8 of 8).
- **Whole website / visual output:** no honest percentage can be assigned from file inventory alone. The page shell remains customized for the portfolio, so whole-page pixel parity is intentionally not 100%. The artwork-renderer source files are exact matches.

## Automated checks

The workflow at `.github/workflows/verify-original-source.yml` verifies the Git blob IDs for all eight source-folder files, checks the runtime script order, confirms local assets exist, confirms the requested footer links, and fails if any former recreation module is reintroduced. Its result is tracked in GitHub Actions. A successful static-source check does not replace a live browser/WebGL screenshot test; this environment could not directly fetch the GitHub Pages URL for visual inspection.
