# Animated GitHub Profile Studio

A browser-based editor for creating a personal GitHub profile README from one reusable configuration. Customize the design, fonts, text, animated terminal, featured repositories, images, GIFs, links, section order, colors, and motion settings, then export a ready-to-upload ZIP.

The built-in TFQ0 design remains the canonical example, but users no longer need to edit eight SVG files by hand.

## Design and media customization

Configuration v2 adds three focused customization systems:

- Four ready-made visual presets: Quality Control, Classic Terminal, Retro Arcade, and Anime HUD. They use generic interface elements and include no franchise characters, logos, or copied artwork.
- Curated font presets that map to controlled, SVG-safe font stacks rather than accepting arbitrary CSS.
- Structured remote media entries for images and GIFs referenced by HTTPS URL, with accessibility and attribution information kept alongside each entry.

Applying a visual preset changes presentation without replacing a user's profile text, repositories, links, or media. Loading a complete sample is a separate, confirmed action. Valid v1 configurations migrate automatically when imported or restored from browser storage.

## What it includes

- Live desktop and mobile preview in dark and light themes.
- Animated and reduced-motion/static SVG variants.
- Design, font, profile, hero, project, skill, link, structured media, palette, section, Markdown, and footer editing.
- Optional public GitHub repository import with no login or token.
- Local autosave of the last valid configuration.
- Versioned `profile.config.json` import/export.
- One-click download of the currently previewed SVG variant without creating a ZIP.
- Deterministic ZIP generation containing `README.md`, setup guidance, the saved config, and all eight SVG assets.
- Strict runtime validation, HTTPS-only generated links, contextual XML/Markdown escaping, and self-contained SVG output.
- WebMCP tools for agents to read or stage the same configuration used by the visible editor.

## Use the studio

1. Open the app, choose a design, then select **Start a blank profile** or customize the TFQ0 example.
2. Work through Profile, Hero, Projects, Skills, Links, Media, Colors, and Sections.
3. Check the desktop/mobile, dark/light, and animated/static previews.
4. Resolve validation errors and review any design warnings in Export.
5. To keep only the image, choose its desktop/mobile, dark/light, and animated/static options, then select **Download SVG**.
6. To publish the complete profile, download the ZIP instead.
7. Upload its `README.md` and `assets/` directory to the public GitHub repository whose name exactly matches your username.

Keep the exported `profile.config.json`; importing it later restores an editable profile instead of requiring manual SVG changes.

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

The production site is written to `dist/`. Vite uses relative asset URLs, so the build works at a root domain or a GitHub Pages project subpath.

## Architecture

```text
src/
├── domain/profile.ts       # strict versioned config and template metadata
├── generator/
│   ├── svg.ts              # pure eight-variant SVG renderer
│   ├── readme.ts           # GitHub README renderer
│   ├── escape.ts           # XML/Markdown/URL safety boundaries
│   └── artifacts.ts        # deterministic file and ZIP assembly
├── services/github.ts      # optional public repository import
├── components/             # editor fields and GitHub-like preview
├── webmcp.ts               # agent-facing read/stage actions
└── App.tsx                 # editor state and workflows
```

`ProfileConfig` is the single source of truth. The visible preview, README source, SVG files, saved config, and ZIP are all produced from the same validated object. Imported GitHub data becomes an editable snapshot; it is never a hidden dependency of later exports.

## Privacy and output safety

- The editor has no backend and requests no GitHub token.
- Drafts and the short-lived public repository cache stay in browser storage.
- Only public repository metadata is fetched directly from GitHub's public API.
- Generated SVGs contain no scripts, event handlers, remote fonts, external images, tracking, or live CI claims.
- User-selected media is referenced by HTTPS URL in the README rather than copied into the ZIP or embedded in the generated hero SVG.
- Previewing or viewing remote media may send an ordinary request to its third-party host. Remote content can disappear or change independently of the Studio.
- Static fallbacks are generated for visitors who prefer reduced motion.
- Custom Markdown blocks raw HTML and neutralizes non-HTTPS link destinations in generated output.

Users must own or hold permission for any media they add. Attribution alone does not grant permission, and adding media does not imply affiliation with or endorsement by its creator or rights holder. See [User content and third-party media notice](./USER_CONTENT_NOTICE.md).

## Legacy reference

The original hand-authored TFQ0 SVGs, screenshots, GIF, and `preview.html` remain in `assets/` and `preview/` as visual references. They are not used by the Studio build. New custom profiles should be generated through the editor so all responsive, theme, and reduced-motion variants stay synchronized.

## License

Animated GitHub Profile Studio is released under the [MIT License](./LICENSE).

The MIT License does not grant rights to user-supplied content or third-party media. See [User content and third-party media notice](./USER_CONTENT_NOTICE.md).
