# Animated GitHub Profile Studio

A browser-based editor for creating a personal GitHub profile README from one reusable configuration. Customize the design, fonts, text, animated terminal, featured repositories, images, GIFs, links, section order, colors, and motion settings, then export a ready-to-upload ZIP.

The built-in sample is intentionally fictional and fully replaceable, so no maintainer profile, repository, or personal identity is used as the starting point.

After GitHub Pages is enabled, the hosted Studio is available at:

**[Open the hosted Studio](https://tfq0.github.io/animated-github-profile/)**

## Templates, layout, and media customization

Configuration v3 provides seven templates: Quality Control, Classic Terminal, Retro Arcade, Anime HUD, Bento Grid, Signal Poster, and Custom Canvas. The templates use generic, original interface elements and include no franchise characters, logos, or copied artwork.

The templates are more than palette swaps: they provide structurally distinct desktop compositions. Custom Canvas uses the same validated rendering system and offers constrained layout controls rather than unrestricted canvas editing.

The customization contract includes:

- Desktop composition, alignment, spacing, and placement choices within safe layout bounds.
- Two to six workflow steps, with an allowlisted safe shape selected for each step.
- Decorative shapes described through a bounded SVG-safe DSL. The renderer converts validated shape data into SVG; users cannot insert arbitrary SVG elements or path commands.
- Curated font presets that map to controlled, SVG-safe system font stacks.
- Structured remote media entries for images and GIFs referenced by HTTPS URL, with accessibility and attribution information kept alongside each entry. Media remains separate README content and is not inserted into the generated hero canvas.

Applying a template changes its visual system and layout defaults without replacing the user's profile text, repositories, links, sections, or media. Loading a complete sample is a separate, confirmed action that replaces profile content. Valid v1 and v2 configurations migrate automatically when imported or restored from browser storage.

The editor does not accept arbitrary raw CSS, SVG markup, SVG paths, or remote fonts. Decorative elements are code-generated from allowlisted primitives and bounded numeric values.

## What it includes

- Live desktop preview in dark and light themes.
- Animated and reduced-motion/static SVG variants.
- Seven structurally distinct desktop templates plus constrained custom layout controls.
- Design, font, profile, hero, workflow-step shape, decorative shape, project, skill, link, structured media, palette, section, Markdown, and footer editing.
- Optional public GitHub repository import with no login or token.
- Local autosave of the last valid configuration.
- Versioned `profile.config.json` import/export.
- One-click download of the currently previewed SVG variant without creating a ZIP.
- Deterministic ZIP generation containing `README.md`, setup guidance, the saved config, and all four desktop SVG assets.
- Strict runtime validation, HTTPS-only generated links, contextual XML/Markdown escaping, and self-contained SVG output.
- WebMCP tools for agents to read or stage the same configuration used by the visible editor.

The Studio targets desktop browser widths of 1180 px or wider. Every generated hero variant uses a fixed 1200 × 610 desktop canvas.

## Use the studio

1. Open the app and choose one of the seven templates, then adjust its constrained layout controls if desired.
2. Select **Start a blank profile** or customize the clearly labeled fictional sample.
3. Work through Profile, Hero, workflow steps and shapes, Projects, Skills, Links, Media, Colors, and Sections.
4. Check the desktop preview in dark/light and animated/static modes.
5. Resolve validation errors and review any design warnings in Export.
6. To keep only the image, choose its dark/light and animated/static options, then select **Download SVG**.
7. To publish the complete profile, download the ZIP instead.
8. Upload its `README.md` and `assets/` directory to the public GitHub repository whose name exactly matches your username.

Keep the exported `profile.config.json`; importing it later restores an editable profile instead of requiring manual SVG changes.

## Deploy the Studio with GitHub Pages

This repository includes [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml). The workflow runs the type-checker and tests, builds the Vite application with the repository's GitHub Pages base path, and publishes the generated `dist/` directory whenever a commit is pushed to `main`. A failed check stops the deployment.

Complete this one-time setup after pushing the repository to GitHub:

1. Open the repository on GitHub.
2. Select **Settings**, then **Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the **Actions** tab and run **Deploy to GitHub Pages**, or push another commit to `main`.
5. Wait for the workflow to finish, then open `https://tfq0.github.io/animated-github-profile/`.

No deployment branch, generated `dist/` commit, server, API key, or repository secret is required. The published Studio is a public static website and stores editable drafts in each visitor's browser.

The `animated-github-profile` repository publishes the Studio itself. It is separate from a generated profile repository named `<username>/<username>`: use **Download complete ZIP** inside the Studio when you want to publish a generated profile.

To publish a later update, verify it locally and push it to `main`. GitHub Actions will replace the hosted version automatically:

```bash
npm run typecheck
npm test
npm run build
git push origin main
```

## Local development

Requirements: Node.js `^22.13.0` or `>=24.0.0` and npm.

```bash
npm ci
npm run dev
```

The local app is served at `http://localhost:4173/`.

```bash
npm run typecheck
npm test
npm run build
```

The production site is written to `dist/`. Local builds keep portable relative asset URLs; the Pages workflow supplies the repository path during its production build.

## Architecture

```text
src/
├── domain/profile.ts       # strict v3 config plus v1/v2 migration
├── domain/presets.ts       # trusted template defaults and visual presets
├── generator/
│   ├── svg.ts              # pure four-variant desktop SVG renderer
│   ├── readme.ts           # GitHub README renderer
│   ├── escape.ts           # XML/Markdown/URL safety boundaries
│   └── artifacts.ts        # deterministic file and ZIP assembly
├── services/github.ts      # optional public repository import
├── components/             # editor fields and GitHub-like preview
├── webmcp.ts               # agent-facing read/stage actions
└── App.tsx                 # editor state and workflows
```

`ProfileConfig` is the single source of truth. The visible preview, README source, SVG files, saved config, and ZIP are all produced from the same validated object. Template, desktop layout, workflow-shape, and decorative-shape values are resolved through trusted renderer registries. Imported GitHub data becomes an editable snapshot; it is never a hidden dependency of later exports.

## Privacy and output safety

- The editor has no backend and requests no GitHub token.
- Drafts and the short-lived public repository cache stay in browser storage.
- Only public repository metadata is fetched directly from GitHub's public API.
- Generated SVGs contain no scripts, event handlers, remote fonts, external images, tracking, or live CI claims.
- Layout and decorative SVG output is generated only from validated, bounded controls and allowlisted shape primitives; raw CSS, SVG markup, and path data are not accepted.
- User-selected media is referenced by HTTPS URL in the README rather than copied into the ZIP or embedded in the generated hero SVG.
- Previewing or viewing remote media may send an ordinary request to its third-party host. Remote content can disappear or change independently of the Studio.
- Static fallbacks are generated for visitors who prefer reduced motion.
- Custom Markdown blocks raw HTML and neutralizes non-HTTPS link destinations in generated output.

Users must own or hold permission for any media they add. Attribution alone does not grant permission, and adding media does not imply affiliation with or endorsement by its creator or rights holder. See [User content and third-party media notice](./USER_CONTENT_NOTICE.md).

## License

Animated GitHub Profile Studio is released under the [MIT License](./LICENSE).

The MIT License does not grant rights to user-supplied content or third-party media. See [User content and third-party media notice](./USER_CONTENT_NOTICE.md).
