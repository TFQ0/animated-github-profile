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

For the v2 configuration, verification also covers every design and font preset, migration of valid v1 drafts, structured remote-media validation and attribution, rejection of unsafe media URLs, and preservation of user content when applying a visual preset.

For a release, also inspect representative long content in desktop/mobile and dark/light previews. Design warnings are advisory because fixed SVG artwork cannot measure browser font metrics during generation.

The preview toolbar can download its currently selected SVG by itself. Use the Export panel's complete ZIP when publishing the full README and all responsive theme variants.

When changing the editor layout, inspect 1440 px, 1180 px, 900 px, 620 px, and 320 px viewport widths. Confirm that navigation and export actions remain reachable, keyboard focus remains visible, remote media stays within the preview, and no horizontal page overflow is introduced.

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
