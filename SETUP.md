# Project setup and release checks

## Install and run

Use Node.js `^22.13.0` or `>=24.0.0`.

```bash
npm ci
npm run dev
```

Open `http://localhost:4173/`. Vite also prints network URLs when the development server starts.

## Verify a change

```bash
npm run typecheck
npm test
npm run build
```

These checks cover TypeScript, strict config parsing, all eight SVG variants, reduced-motion output, README-to-asset references, deterministic ZIP contents, unsafe input handling, public GitHub import errors, cache validation, and the WebMCP contract.

The v3 verification matrix must also cover:

- Quality Control, Classic Terminal, Retro Arcade, Anime HUD, Bento Grid, Signal Poster, and Custom Canvas.
- Every supported responsive composition in desktop and mobile output, including constrained alignment, spacing, and placement boundary values.
- Two-step and six-step workflows, every allowlisted per-step shape, ordering, and text-fit limits.
- Decorative shapes at their count and numeric boundaries, plus rejection of unknown primitives, excessive values, raw SVG, arbitrary path data, and CSS injection.
- Every curated font preset and rejection of arbitrary font-family values or remote font references.
- Migration of valid v1 and v2 drafts to v3, with user content and existing visual choices preserved.
- Structured remote-media validation and attribution, rejection of unsafe media URLs, and confirmation that media remains separate HTTPS README content rather than hero SVG content.
- Preservation of profile text, repositories, links, sections, and media when applying a template. Loading a complete sample must remain a separate confirmed replacement action.

For a release, inspect all seven templates with representative and maximum-length content in desktop/mobile, dark/light, and animated/static previews. Confirm that compositions are visibly distinct, remain within the SVG viewBox, and adapt safely between desktop and mobile. Design warnings are advisory because fixed SVG artwork cannot measure browser font metrics during generation.

Exercise the constrained custom layout controls at minimum and maximum values, then verify that the visible preview, downloaded current SVG, and matching ZIP asset render the same configuration. Check workflows with two and six steps and mix every safe step shape. Decorative-shape tests must confirm that generated primitives remain bounded and cannot obscure required text or controls.

The preview toolbar can download its currently selected SVG by itself. Use the Export panel's complete ZIP when publishing the full README and all responsive theme variants.

When changing the editor layout, inspect 1440 px, 1180 px, 900 px, 620 px, and 320 px viewport widths. Confirm that navigation and export actions remain reachable, keyboard focus remains visible, remote media stays within the preview, and no horizontal page overflow is introduced.

Custom Canvas is constrained despite its name. Do not add arbitrary raw CSS, SVG markup, SVG path input, or remote fonts. Layouts, workflow shapes, and decorative shapes must be selected or composed through validated controls and code-generated renderer primitives.

## Production output

`npm run build` creates the static site in `dist/`. The build uses relative asset paths and can be hosted at a domain root or a project subpath.

The `.openai/hosting.json` file connects this repository to its Sites project. Publishing the Studio site and publishing a generated GitHub profile are separate operations.

## Publish a generated GitHub profile

The editor's ZIP contains its own profile-specific `SETUP.md`. In summary:

1. Create or open the public repository `<username>/<username>`.
2. Upload the generated `README.md` and complete `assets/` directory at its root.
3. Keep `profile.config.json` privately or in the repository if you want the profile to remain easy to edit.
4. Commit, visit the GitHub profile, and verify links, text wrapping, theme selection, and reduced motion.

Structured remote media is referenced by HTTPS URL and is not bundled in the ZIP. Previewing or viewing it can send a request to its host, and the content can later disappear or change. The user must own the media or hold the permissions needed to publish it; attribution alone does not grant permission. Adding media does not imply affiliation with or endorsement by a creator, platform, game, studio, publisher, or franchise. Review [USER_CONTENT_NOTICE.md](./USER_CONTENT_NOTICE.md) before publishing third-party material.

The animated terminal is decorative. It does not execute code or report live checks.

## License and release files

- Keep the standard [MIT License](./LICENSE) text unchanged.
- Keep [USER_CONTENT_NOTICE.md](./USER_CONTENT_NOTICE.md) with the release so the software license is not confused with rights to user-selected or third-party material.
- Built-in presets should use generic original design elements. Do not add third-party artwork or fonts without compatible permission and required notices.
