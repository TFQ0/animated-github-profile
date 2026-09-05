import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  cloneDefaultConfig,
  parseProfileConfig,
  profileConfigV1Schema,
  profileConfigV2Schema,
  profileConfigSchema,
} from "../domain/profile";
import { applyDesignPreset, designPresets } from "../domain/presets";
import { generateArtifacts, generateHeroArtifact, generateZip } from "./artifacts";
import { cleanText, escapeTableCell, sanitizeMarkdown } from "./escape";
import { renderReadme } from "./readme";
import { heroVariants, renderHeroSvg } from "./svg";

function createV2Fixture() {
  const current = cloneDefaultConfig();
  const { layout: _layout, ...withoutLayout } = current;
  return profileConfigV2Schema.parse({
    ...withoutLayout,
    schemaVersion: 2,
    template: { id: "quality-control", version: 1 },
    hero: {
      ...current.hero,
      workflow: current.hero.workflow.steps.map((step) => step.label),
    },
  });
}

function createV1Fixture() {
  const current = createV2Fixture();
  const { media: _media, ...withoutMedia } = current;
  const { fontId: _fontId, ...appearance } = current.appearance;
  const { media: _mediaHeading, ...sectionHeadings } = current.sectionHeadings;
  return profileConfigV1Schema.parse({
    ...withoutMedia,
    schemaVersion: 1,
    template: { id: "quality-control", version: 1 },
    sections: current.sections.filter((section) => section !== "media"),
    sectionHeadings,
    appearance,
  });
}

function parseSvg(svg: string): XMLDocument {
  return new DOMParser().parseFromString(svg, "image/svg+xml");
}

function numericAttribute(element: Element, name: string): number {
  const value = Number(element.getAttribute(name));
  expect(Number.isFinite(value), `${name} should be numeric`).toBe(true);
  return value;
}

describe("profile artifact generation", () => {
  it("generates the complete deterministic profile bundle", () => {
    const config = cloneDefaultConfig();
    const first = generateArtifacts(config);
    const second = generateArtifacts(config);

    expect(first).toEqual(second);
    expect(first).toHaveLength(11);
    expect(new Set(first.map((artifact) => artifact.path)).size).toBe(11);
    expect(first.filter((artifact) => artifact.path.endsWith(".svg"))).toHaveLength(8);
    expect(first.map((artifact) => artifact.path)).toEqual([
      "README.md",
      "profile.config.json",
      "SETUP.md",
      "assets/profile-header-dark.svg",
      "assets/profile-header-light.svg",
      "assets/profile-header-mobile-dark.svg",
      "assets/profile-header-mobile-light.svg",
      "assets/profile-header-dark-static.svg",
      "assets/profile-header-light-static.svg",
      "assets/profile-header-mobile-dark-static.svg",
      "assets/profile-header-mobile-light-static.svg",
    ]);
  });

  it("emits parseable, self-contained SVG for every supported variant", () => {
    const config = cloneDefaultConfig();

    for (const variant of heroVariants) {
      const svg = renderHeroSvg(config, variant);
      const document = new DOMParser().parseFromString(svg, "image/svg+xml");

      expect(document.querySelector("parsererror"), JSON.stringify(variant)).toBeNull();
      expect(document.documentElement.tagName).toBe("svg");
      expect(svg).not.toMatch(/\b(?:undefined|null|NaN)\b/);
      expect(svg).not.toMatch(/<script|<foreignObject|\son[a-z]+=/i);
      expect(svg).not.toMatch(/(?:href|src)=["']https?:/i);

      if (variant.motion === "static") {
        expect(svg).not.toContain("@keyframes");
        expect(svg).not.toContain("animation:");
      } else {
        expect(svg).toContain("@keyframes");
        expect(svg).toContain("prefers-reduced-motion:no-preference");
      }
    }
  });

  it("exports any selected hero variant as the same standalone SVG used by the bundle", () => {
    const config = cloneDefaultConfig();
    const bundle = generateArtifacts(config);

    for (const variant of heroVariants) {
      const artifact = generateHeroArtifact(config, variant);
      expect(artifact.path).toMatch(/^assets\/profile-header.*\.svg$/);
      expect(artifact.content).toBe(renderHeroSvg(config, variant));
      expect(bundle).toContainEqual(artifact);
    }
  });

  it("fits schema-valid wide text inside fixed SVG regions", () => {
    const config = cloneDefaultConfig();
    config.identity.brandMark = "WWWWWWWWWWWW";
    config.identity.profileLabel = "WWWWWWWWWWWWWWWWWWWW";
    config.hero.headline = ["W".repeat(24), "W".repeat(24), "W".repeat(24)];
    const valid = profileConfigSchema.parse(config);
    const svg = renderHeroSvg(valid, {
      viewport: "mobile",
      theme: "dark",
      motion: "static",
    });

    expect(svg).toContain("textLength=");
    expect(new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror")).toBeNull();
  });

  it("keeps the content surface and footer inside each viewport", () => {
    const config = cloneDefaultConfig();

    for (const viewport of ["desktop", "mobile"] as const) {
      const document = parseSvg(renderHeroSvg(config, { viewport, theme: "dark", motion: "static" }));
      const root = document.documentElement;
      const surface = document.querySelector('[data-region="surface"]')!;
      const footer = document.querySelector('[data-region="footer"]')!;
      const width = numericAttribute(root, "width");
      const footerDivider = numericAttribute(root, "data-footer-divider");

      expect(numericAttribute(surface, "x")).toBe(1);
      expect(numericAttribute(surface, "y")).toBe(64);
      expect(numericAttribute(surface, "width")).toBe(width - 2);
      expect(numericAttribute(surface, "height")).toBe(footerDivider - 64);
      expect(footer.querySelectorAll("path")).toHaveLength(1);
      expect(footer.querySelectorAll("text")).toHaveLength(2);
    }
  });

  it("keeps README asset references in sync with the generated files", () => {
    const artifacts = generateArtifacts(cloneDefaultConfig());
    const paths = new Set(artifacts.map((artifact) => artifact.path));
    const readme = artifacts.find((artifact) => artifact.path === "README.md")!.content;
    const references = [...readme.matchAll(/(?:src|srcset)="\.\/([^"]+)"/g)].map(
      (match) => match[1]!,
    );

    expect(references).toHaveLength(9);
    expect(new Set(references).size).toBe(8);
    for (const reference of references) expect(paths.has(reference)).toBe(true);
  });

  it("escapes hostile XML, HTML attributes, and unsafe custom Markdown links", () => {
    const config = cloneDefaultConfig();
    config.identity.displayName = `A "quoted" <name>`;
    config.hero.checks[0] = `</text><script>x</script>`;
    config.custom = {
      heading: "Notes",
      markdown: `<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert(1))`,
    };
    config.sections.push("custom");

    const svg = renderHeroSvg(config, heroVariants[0]!);
    const readme = renderReadme(config);

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;/text&gt;&lt;script&gt;x&lt;/script&gt;");
    expect(readme).toContain("A &quot;quoted&quot; &lt;name&gt;");
    expect(readme).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(readme).not.toContain("](javascript:");
  });

  it("sanitizes reference links without rewriting code or balanced HTTPS links", () => {
    const markdown = [
      "[unsafe][target]",
      "[target]: javascript:alert(1)",
      "[safe](https://example.com/wiki/Function_(mathematics))",
      "`[code](javascript:example)`",
      "```md",
      "[fenced](javascript:example)",
      "```",
    ].join("\n");
    const sanitized = sanitizeMarkdown(markdown);

    expect(sanitized).toContain("[target]: #");
    expect(sanitized).toContain("[safe](https://example.com/wiki/Function_%28mathematics%29)");
    expect(sanitized).toContain("`[code](javascript:example)`");
    expect(sanitized).toContain("[fenced](javascript:example)");
  });

  it("normalizes table line endings and removes invalid Unicode surrogates", () => {
    expect(escapeTableCell("first\rsecond\nthird\r\nfourth")).toBe(
      "first second third fourth",
    );
    expect(cleanText(`safe\ud800 text \ud83d\ude80`)).toBe("safe text 🚀");
  });

  it("round-trips valid config and rejects unknown or unsafe values", () => {
    const config = cloneDefaultConfig();
    const roundTripped = parseProfileConfig(JSON.parse(JSON.stringify(config)));

    expect(roundTripped).toEqual(config);
    expect(profileConfigSchema.safeParse({ ...config, unexpected: true }).success).toBe(false);
    expect(
      profileConfigSchema.safeParse({
        ...config,
        identity: { ...config.identity, username: "bad--name" },
      }).success,
    ).toBe(false);
    expect(
      profileConfigSchema.safeParse({
        ...config,
        links: [{ id: "unsafe", label: "Unsafe", url: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
    expect(
      profileConfigSchema.safeParse({
        ...config,
        links: [{ id: "credentials", label: "Credentials", url: "https://user:pass@example.com" }],
      }).success,
    ).toBe(false);
    expect(
      profileConfigSchema.safeParse({
        ...config,
        links: [{ id: "broken", label: "Broken", url: "not a url" }],
      }).success,
    ).toBe(false);
    expect(() => parseProfileConfig({ schemaVersion: 4 })).toThrow(
      "Unsupported profile configuration version: 4",
    );

    const earlierV1 = JSON.parse(JSON.stringify(createV1Fixture())) as Record<string, unknown>;
    delete earlierV1.template;
    delete earlierV1.accessibility;
    delete (earlierV1.hero as Record<string, unknown>).labels;
    const migrated = parseProfileConfig(earlierV1);
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.template).toEqual({ id: "quality-control", version: 1 });
    expect(migrated.hero.labels.passed).toBe("PASS");
    expect(migrated.accessibility.language).toBe("en");
    expect(migrated.appearance.fontId).toBe("modern");
    expect(migrated.media).toEqual([]);
    expect(migrated.sections).not.toContain("media");

    const v2 = createV2Fixture();
    const migratedV2 = parseProfileConfig(JSON.parse(JSON.stringify(v2)));
    const migratedV2Again = parseProfileConfig(JSON.parse(JSON.stringify(v2)));
    expect(migratedV2).toEqual(migratedV2Again);
    expect(migratedV2.schemaVersion).toBe(3);
    expect(migratedV2.layout).toEqual({
      composition: "split",
      contentOrder: "identity-first",
      density: "comfortable",
      shapeSystem: "rounded",
      pattern: "dots",
      terminalStyle: "window",
      textAlign: "start",
      decorations: [],
    });
    expect(migratedV2.hero.workflow).toEqual({
      style: "timeline",
      steps: v2.hero.workflow.map((label, index) => ({
        id: `workflow-${index + 1}`,
        label,
        shape: "auto",
      })),
    });
  });

  it("applies every trusted design without replacing personal content", () => {
    const source = cloneDefaultConfig();
    source.identity.displayName = "Personal Name";
    source.custom = { heading: "Personal notes", markdown: "Keep this content." };
    const original = structuredClone(source);
    const originalWorkflowSteps = structuredClone(source.hero.workflow.steps);
    const expectedPresetNames = [
      "Quality Control",
      "Classic Terminal",
      "Retro Arcade",
      "Anime HUD",
      "Bento Grid",
      "Signal Poster",
      "Custom Canvas",
    ];
    const structuralSignatures = new Set<string>();

    expect(designPresets.map((preset) => preset.name)).toEqual(expectedPresetNames);
    expect(new Set(designPresets.map((preset) => preset.id)).size).toBe(designPresets.length);
    for (const preset of designPresets) {
      const applied = applyDesignPreset(source, preset.id);
      expect(applied).not.toBe(source);
      expect(applied.identity).toEqual(source.identity);
      expect(applied.hero.headline).toEqual(source.hero.headline);
      expect(applied.hero.checks).toEqual(source.hero.checks);
      expect(applied.hero.workflow.steps).toEqual(originalWorkflowSteps);
      expect(applied.hero.workflow.steps.map(({ id, label }) => ({ id, label }))).toEqual(
        originalWorkflowSteps.map(({ id, label }) => ({ id, label })),
      );
      expect(applied.about).toEqual(source.about);
      expect(applied.repositories).toEqual(source.repositories);
      expect(applied.skillGroups).toEqual(source.skillGroups);
      expect(applied.links).toEqual(source.links);
      expect(applied.media).toEqual(source.media);
      expect(applied.sections).toEqual(source.sections);
      expect(applied.custom).toEqual(source.custom);
      expect(applied.accessibility).toEqual(source.accessibility);
      expect(applied.footer).toEqual(source.footer);
      expect(applied.template.id).toBe(preset.id);
      expect(applied.layout).toEqual(preset.layout);
      expect(applied.hero.workflow.style).toBe(preset.workflowStyle);
      expect(profileConfigSchema.safeParse(applied).success).toBe(true);

      for (const variant of heroVariants) {
        const svg = renderHeroSvg(applied, variant);
        const document = new DOMParser().parseFromString(svg, "image/svg+xml");
        expect(document.querySelector("parsererror")).toBeNull();
        expect(document.documentElement.getAttribute("data-composition")).toBe(
          preset.layout.composition,
        );
        expect(svg).not.toMatch(/<script|<foreignObject|\son[a-z]+=/i);
        expect(svg).not.toMatch(/(?:href|src)=["']https?:/i);
      }
      const signatureSvg = renderHeroSvg(applied, {
        viewport: "desktop",
        theme: "dark",
        motion: "static",
      });
      const signatureDocument = new DOMParser().parseFromString(signatureSvg, "image/svg+xml");
      const identity = signatureDocument.querySelector('[data-region="identity"]')!;
      const terminal = signatureDocument.querySelector('[data-region="terminal"]')!;
      const workflow = signatureDocument.querySelector('[data-region="workflow"]')!;
      structuralSignatures.add(
        [
          identity.getAttribute("data-x"),
          identity.getAttribute("data-y"),
          identity.getAttribute("data-width"),
          terminal.getAttribute("data-x"),
          terminal.getAttribute("data-y"),
          terminal.getAttribute("data-width"),
          terminal.getAttribute("data-height"),
          workflow.getAttribute("data-workflow-style"),
        ].join(":"),
      );
    }
    expect(structuralSignatures.size).toBe(designPresets.length);
    expect(source).toEqual(original);
  });

  it("keeps boxed workflow items inside every custom layout", () => {
    const compositions = ["split", "stacked", "terminal-focus", "hud-grid", "bento", "poster"] as const;
    const densities = ["compact", "comfortable", "spacious"] as const;
    const contentOrders = ["identity-first", "terminal-first"] as const;
    const workflowStyles = ["cards", "command-chain"] as const;
    const viewports = ["desktop", "mobile"] as const;

    for (const composition of compositions) {
      for (const density of densities) {
        for (const contentOrder of contentOrders) {
          for (const style of workflowStyles) {
            for (const viewport of viewports) {
              for (let stepCount = 2; stepCount <= 6; stepCount += 1) {
                const config = cloneDefaultConfig();
                config.layout = { ...config.layout, composition, density, contentOrder };
                config.hero.workflow = {
                  style,
                  steps: Array.from({ length: stepCount }, (_, index) => ({
                    id: `workflow-${index + 1}`,
                    label: `STEP ${index + 1}`,
                    shape: "auto" as const,
                  })),
                };
                const valid = profileConfigSchema.parse(config);
                const document = parseSvg(renderHeroSvg(valid, { viewport, theme: "dark", motion: "static" }));
                const root = document.documentElement;
                const width = numericAttribute(root, "width");
                const footerDivider = numericAttribute(root, "data-footer-divider");
                const items = [...document.querySelectorAll('[data-workflow-width]')];

                expect(items, `${composition}/${density}/${contentOrder}/${style}/${viewport}/${stepCount}`).toHaveLength(stepCount);
                for (const item of items) {
                  const x = numericAttribute(item, "data-workflow-x");
                  const y = numericAttribute(item, "data-workflow-y");
                  const itemWidth = numericAttribute(item, "data-workflow-width");
                  const itemHeight = numericAttribute(item, "data-workflow-height");
                  expect(x).toBeGreaterThanOrEqual(30);
                  expect(x + itemWidth).toBeLessThanOrEqual(width - 30);
                  expect(y).toBeGreaterThanOrEqual(64);
                  expect(y + itemHeight).toBeLessThanOrEqual(footerDivider - 6);
                }
              }
            }
          }
        }
      }
    }
  }, 15_000);

  it("preserves safe terminal spacing across custom combinations", () => {
    const compositions = ["split", "stacked", "terminal-focus", "hud-grid", "bento", "poster"] as const;
    const densities = ["compact", "comfortable", "spacious"] as const;
    const contentOrders = ["identity-first", "terminal-first"] as const;
    const terminalStyles = ["window", "panel", "minimal"] as const;
    const viewports = ["desktop", "mobile"] as const;

    for (const composition of compositions) {
      for (const density of densities) {
        for (const contentOrder of contentOrders) {
          for (const terminalStyle of terminalStyles) {
            for (const viewport of viewports) {
              const config = cloneDefaultConfig();
              config.layout = { ...config.layout, composition, density, contentOrder, terminalStyle };
              const document = parseSvg(renderHeroSvg(config, { viewport, theme: "dark", motion: "static" }));
              const root = document.documentElement;
              const terminal = document.querySelector('[data-region="terminal"]')!;
              const width = numericAttribute(root, "width");
              const height = numericAttribute(root, "height");
              const x = numericAttribute(terminal, "data-x");
              const y = numericAttribute(terminal, "data-y");
              const terminalWidth = numericAttribute(terminal, "data-width");
              const terminalHeight = numericAttribute(terminal, "data-height");
              const commandBaseline = numericAttribute(terminal, "data-command-baseline");
              const rowStart = numericAttribute(terminal, "data-row-start");
              const footerDivider = numericAttribute(terminal, "data-footer-divider");
              const lastRow = document.querySelector('[data-terminal-row="3"]')!;
              const lastRail = numericAttribute(lastRow, "data-rail-y");

              expect(x).toBeGreaterThanOrEqual(0);
              expect(y).toBeGreaterThanOrEqual(64);
              expect(x + terminalWidth).toBeLessThanOrEqual(width);
              expect(y + terminalHeight).toBeLessThanOrEqual(height);
              expect(rowStart - commandBaseline).toBeGreaterThanOrEqual(22);
              expect(lastRail).toBeLessThanOrEqual(footerDivider - 5);
            }
          }
        }
      }
    }
  });

  it("keeps content order consistent and stacked content separated", () => {
    const horizontalCompositions = ["split", "terminal-focus", "hud-grid", "bento"] as const;

    for (const composition of horizontalCompositions) {
      for (const contentOrder of ["identity-first", "terminal-first"] as const) {
        const config = cloneDefaultConfig();
        config.layout = { ...config.layout, composition, contentOrder };
        const document = parseSvg(renderHeroSvg(config, { viewport: "desktop", theme: "dark", motion: "static" }));
        const identity = document.querySelector('[data-region="identity"]')!;
        const terminal = document.querySelector('[data-region="terminal"]')!;
        const identityX = numericAttribute(identity, "data-x");
        const terminalX = numericAttribute(terminal, "data-x");

        if (contentOrder === "identity-first") expect(identityX).toBeLessThan(terminalX);
        else expect(terminalX).toBeLessThan(identityX);
      }
    }

    for (const composition of ["split", "stacked", "terminal-focus", "hud-grid", "bento", "poster"] as const) {
      for (const contentOrder of ["identity-first", "terminal-first"] as const) {
        const config = cloneDefaultConfig();
        config.layout = { ...config.layout, composition, contentOrder };
        const document = parseSvg(renderHeroSvg(config, { viewport: "mobile", theme: "dark", motion: "static" }));
        const identityY = numericAttribute(document.querySelector('[data-region="identity"]')!, "data-y");
        const terminalY = numericAttribute(document.querySelector('[data-region="terminal"]')!, "data-y");

        if (contentOrder === "identity-first") expect(identityY).toBeLessThan(terminalY);
        else expect(terminalY).toBeLessThan(identityY);
      }
    }

    for (const density of ["compact", "comfortable", "spacious"] as const) {
      const config = cloneDefaultConfig();
      config.layout = { ...config.layout, composition: "stacked", contentOrder: "identity-first", density };
      const document = parseSvg(renderHeroSvg(config, { viewport: "desktop", theme: "dark", motion: "static" }));
      const identityBottom = numericAttribute(document.querySelector('[data-region="identity"]')!, "data-bottom");
      const terminalTop = numericAttribute(document.querySelector('[data-region="terminal"]')!, "data-y");
      expect(identityBottom).toBeLessThan(terminalTop);
    }
  });

  it("keeps HUD separators in desktop gaps and removes them from vertical mobile layouts", () => {
    for (const contentOrder of ["identity-first", "terminal-first"] as const) {
      const config = cloneDefaultConfig();
      config.layout = { ...config.layout, composition: "hud-grid", contentOrder };
      const desktop = parseSvg(renderHeroSvg(config, { viewport: "desktop", theme: "dark", motion: "static" }));
      const separator = desktop.querySelector('[data-hud-separator="true"]')!;
      const coordinates = separator.getAttribute("d")!.match(/M([\d.]+) 88L([\d.]+)/)!;
      expect(Math.abs(Number(coordinates[2]) - Number(coordinates[1]))).toBeLessThan(100);

      const mobile = parseSvg(renderHeroSvg(config, { viewport: "mobile", theme: "dark", motion: "static" }));
      expect(mobile.querySelector('[data-hud-separator="true"]')).toBeNull();
    }
  });

  it("validates and safely renders structured remote media without bundling it", () => {
    const config = cloneDefaultConfig();
    config.media = [
      {
        id: "featured-animation",
        kind: "gif",
        url: "https://cdn.example.com/scene.gif?first=1&second=2",
        reducedMotionUrl: "https://cdn.example.com/scene-still.png",
        alt: `A "neon" scene <without flashing>`,
        caption: "A custom visual & short caption.",
        widthPercent: 75,
        align: "center",
        attribution: {
          sourceLabel: "Original creator <studio>",
          sourceUrl: "https://example.com/source?first=1&second=2",
          licenseName: "Used with permission",
          licenseUrl: "https://example.com/terms",
        },
      },
    ];
    config.sections = ["media"];
    const valid = profileConfigSchema.parse(config);
    const readme = renderReadme(valid);

    expect(readme).toContain('<a id="media"></a>');
    expect(readme).toContain('media="(prefers-reduced-motion: reduce)"');
    expect(readme).toContain("scene.gif?first=1&amp;second=2");
    expect(readme).toContain('alt="A &quot;neon&quot; scene &lt;without flashing&gt;"');
    expect(readme).toContain("Original creator &lt;studio&gt;");
    expect(readme).toContain('width="75%"');

    const svg = renderHeroSvg(valid, heroVariants[0]!);
    expect(svg).not.toContain("cdn.example.com");
    const artifacts = generateArtifacts(valid);
    expect(artifacts).toHaveLength(11);
    expect(artifacts.some((artifact) => artifact.path.includes("featured-animation"))).toBe(false);
  });

  it("rejects unsafe media, invalid font IDs, and duplicate media IDs", () => {
    const config = cloneDefaultConfig();
    const media = {
      id: "media-one",
      kind: "image" as const,
      url: "https://example.com/image.png",
      reducedMotionUrl: "",
      alt: "Example artwork",
      caption: "",
      widthPercent: 100,
      align: "center" as const,
      attribution: { sourceLabel: "", sourceUrl: "", licenseName: "", licenseUrl: "" },
    };

    expect(profileConfigSchema.safeParse({ ...config, media: [{ ...media, url: "http://example.com/a.gif" }] }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, media: [{ ...media, url: "data:image/gif;base64,AA==" }] }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, media: [{ ...media, url: "https://user:pass@example.com/a.gif" }] }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, media: [{ ...media, alt: "" }] }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, appearance: { ...config.appearance, fontId: "url(https://evil.example/font)" } }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, media: [media, { ...media, id: "MEDIA-ONE" }] }).success).toBe(false);

    expect(
      profileConfigSchema.safeParse({
        ...config,
        layout: { ...config.layout, composition: "freeform" },
      }).success,
    ).toBe(false);

    const decoration = {
      id: "safe-shape",
      shape: "circle" as const,
      x: 50,
      y: 50,
      size: 32,
      rotation: 0,
      tone: "accent" as const,
      style: "outline" as const,
      opacity: 0.5,
    };
    for (const invalidPatch of [
      { x: 3 },
      { x: 97 },
      { y: 7 },
      { y: 93 },
      { size: 7 },
      { size: 121 },
      { rotation: -181 },
      { rotation: 181 },
      { opacity: 0.14 },
      { opacity: 1.01 },
    ]) {
      expect(
        profileConfigSchema.safeParse({
          ...config,
          layout: {
            ...config.layout,
            decorations: [{ ...decoration, ...invalidPatch }],
          },
        }).success,
        JSON.stringify(invalidPatch),
      ).toBe(false);
    }

    const duplicateWorkflowSteps = structuredClone(config.hero.workflow.steps);
    duplicateWorkflowSteps[1] = {
      ...duplicateWorkflowSteps[1]!,
      id: duplicateWorkflowSteps[0]!.id.toUpperCase(),
    };
    expect(
      profileConfigSchema.safeParse({
        ...config,
        hero: {
          ...config.hero,
          workflow: { ...config.hero.workflow, steps: duplicateWorkflowSteps },
        },
      }).success,
    ).toBe(false);
  });

  it("emits stable targets for every generated navigation link", () => {
    const config = cloneDefaultConfig();
    config.custom = { heading: "Anything you like", markdown: "Custom content." };
    config.sections.push("custom");
    const readme = renderReadme(config);
    const targets = [...readme.matchAll(/<a href="#([^"]+)">/g)].map((match) => match[1]!);

    expect(targets).toEqual(["about", "selected-work", "skills", "links", "custom"]);
    for (const target of targets) expect(readme).toContain(`<a id="${target}"></a>`);
  });

  it("creates a ZIP whose entries match the generated artifacts", async () => {
    const config = cloneDefaultConfig();
    const expected = generateArtifacts(config);
    const zipBlob = await generateZip(config);
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());

    for (const artifact of expected) {
      expect(await zip.file(artifact.path)?.async("string")).toBe(artifact.content);
    }
    expect(zip.files["assets/"]).toBeUndefined();

    const secondZipBlob = await generateZip(config);
    expect(new Uint8Array(await secondZipBlob.arrayBuffer())).toEqual(
      new Uint8Array(await zipBlob.arrayBuffer()),
    );
  });
});
