import type {
  ProfileConfig,
  TemplateId,
  WorkflowStyle,
} from "./profile";

export type DesignPresetId = TemplateId;

export interface DesignPreset {
  readonly id: DesignPresetId;
  readonly name: string;
  readonly description: string;
  readonly template: ProfileConfig["template"];
  readonly appearance: ProfileConfig["appearance"];
  readonly layout: ProfileConfig["layout"];
  readonly workflowStyle: WorkflowStyle;
}

export const designPresets: readonly DesignPreset[] = [
  {
    id: "quality-control",
    name: "Quality Control",
    description:
      "The original balanced engineering dashboard with precise signal accents.",
    template: { id: "quality-control", version: 1 },
    appearance: {
      dark: {
        background: "#0C1418",
        surface: "#111E24",
        terminal: "#0A1216",
        line: "#26383E",
        text: "#ECF1ED",
        muted: "#97ACAF",
        accent: "#ACF5C6",
        accentSoft: "#173B31",
      },
      light: {
        background: "#F3F5EE",
        surface: "#E8EEE5",
        terminal: "#FAFBF6",
        line: "#CED7CC",
        text: "#172A25",
        muted: "#586D63",
        accent: "#24734D",
        accentSoft: "#DCEBDA",
      },
      cornerRadius: 18,
      fontId: "modern",
    },
    layout: {
      composition: "split",
      contentOrder: "identity-first",
      density: "comfortable",
      shapeSystem: "rounded",
      pattern: "dots",
      terminalStyle: "window",
      textAlign: "start",
      decorations: [],
    },
    workflowStyle: "timeline",
  },
  {
    id: "classic-terminal",
    name: "Classic Terminal",
    description:
      "A terminal-first stack with phosphor color, scanlines, and compact rhythm.",
    template: { id: "classic-terminal", version: 1 },
    appearance: {
      dark: {
        background: "#090D0A",
        surface: "#0F1711",
        terminal: "#050806",
        line: "#29402E",
        text: "#EFF7EF",
        muted: "#9CAF9E",
        accent: "#7EF29A",
        accentSoft: "#15331E",
      },
      light: {
        background: "#F2F5ED",
        surface: "#E7EDE2",
        terminal: "#FBFCF8",
        line: "#C8D2C5",
        text: "#1B2A1E",
        muted: "#607064",
        accent: "#236C39",
        accentSoft: "#D4E8D8",
      },
      cornerRadius: 8,
      fontId: "mono",
    },
    layout: {
      composition: "stacked",
      contentOrder: "terminal-first",
      density: "compact",
      shapeSystem: "terminal",
      pattern: "scanlines",
      terminalStyle: "panel",
      textAlign: "start",
      decorations: [],
    },
    workflowStyle: "command-chain",
  },
  {
    id: "retro-arcade",
    name: "Retro Arcade",
    description:
      "A terminal-focused arcade board with sharp pixels and a playful level track.",
    template: { id: "retro-arcade", version: 1 },
    appearance: {
      dark: {
        background: "#170E2B",
        surface: "#21133A",
        terminal: "#0D0718",
        line: "#4C3568",
        text: "#FFF3D6",
        muted: "#C0A8CF",
        accent: "#FFCB58",
        accentSoft: "#4A214D",
      },
      light: {
        background: "#FFF5D8",
        surface: "#F4E4BE",
        terminal: "#FFFDF3",
        line: "#C7A96F",
        text: "#3D244A",
        muted: "#684E6E",
        accent: "#8B2F68",
        accentSoft: "#F1CCE0",
      },
      cornerRadius: 4,
      fontId: "classic",
    },
    layout: {
      composition: "terminal-focus",
      contentOrder: "identity-first",
      density: "comfortable",
      shapeSystem: "pixel",
      pattern: "grid",
      terminalStyle: "panel",
      textAlign: "start",
      decorations: [
        {
          id: "arcade-diamond",
          shape: "diamond",
          x: 8,
          y: 18,
          size: 20,
          rotation: 0,
          tone: "accent",
          style: "outline",
          opacity: 0.55,
        },
        {
          id: "arcade-cross",
          shape: "cross",
          x: 92,
          y: 80,
          size: 18,
          rotation: 0,
          tone: "muted",
          style: "outline",
          opacity: 0.45,
        },
      ],
    },
    workflowStyle: "arcade-track",
  },
  {
    id: "anime-hud",
    name: "Anime HUD",
    description:
      "An asymmetric telemetry interface with angular rails and luminous cyan signals.",
    template: { id: "anime-hud", version: 1 },
    appearance: {
      dark: {
        background: "#071524",
        surface: "#0C2234",
        terminal: "#050E18",
        line: "#27506B",
        text: "#EEF9FF",
        muted: "#93B7CB",
        accent: "#64E8FF",
        accentSoft: "#173A52",
      },
      light: {
        background: "#F1F8FC",
        surface: "#E2F0F7",
        terminal: "#FBFDFF",
        line: "#B6D4E3",
        text: "#142B3D",
        muted: "#45677B",
        accent: "#A42E75",
        accentSoft: "#F3D5E7",
      },
      cornerRadius: 24,
      fontId: "rounded",
    },
    layout: {
      composition: "hud-grid",
      contentOrder: "terminal-first",
      density: "comfortable",
      shapeSystem: "hud",
      pattern: "circuit",
      terminalStyle: "window",
      textAlign: "start",
      decorations: [
        {
          id: "hud-orbit",
          shape: "circle",
          x: 90,
          y: 18,
          size: 42,
          rotation: 0,
          tone: "accent",
          style: "outline",
          opacity: 0.4,
        },
        {
          id: "hud-rail",
          shape: "line",
          x: 12,
          y: 84,
          size: 72,
          rotation: -12,
          tone: "line",
          style: "outline",
          opacity: 0.65,
        },
      ],
    },
    workflowStyle: "telemetry",
  },
  {
    id: "bento-grid",
    name: "Bento Grid",
    description:
      "A spacious modular grid with card-like regions and warm product-design color.",
    template: { id: "bento-grid", version: 1 },
    appearance: {
      dark: {
        background: "#11151C",
        surface: "#1A202A",
        terminal: "#0D1117",
        line: "#354052",
        text: "#F4F7FB",
        muted: "#A8B2C2",
        accent: "#FFB86B",
        accentSoft: "#49301F",
      },
      light: {
        background: "#F7F3EC",
        surface: "#EEE7DC",
        terminal: "#FFFCF7",
        line: "#D4C9BA",
        text: "#27231F",
        muted: "#6C6258",
        accent: "#9A4E18",
        accentSoft: "#F3D8C1",
      },
      cornerRadius: 22,
      fontId: "modern",
    },
    layout: {
      composition: "bento",
      contentOrder: "identity-first",
      density: "spacious",
      shapeSystem: "rounded",
      pattern: "grid",
      terminalStyle: "panel",
      textAlign: "start",
      decorations: [
        {
          id: "bento-square",
          shape: "square",
          x: 92,
          y: 14,
          size: 18,
          rotation: 0,
          tone: "accent-soft",
          style: "fill",
          opacity: 0.8,
        },
        {
          id: "bento-circle",
          shape: "circle",
          x: 7,
          y: 86,
          size: 14,
          rotation: 0,
          tone: "accent",
          style: "fill",
          opacity: 0.5,
        },
      ],
    },
    workflowStyle: "cards",
  },
  {
    id: "signal-poster",
    name: "Signal Poster",
    description:
      "A centered editorial poster with bold typography and minimal terminal chrome.",
    template: { id: "signal-poster", version: 1 },
    appearance: {
      dark: {
        background: "#171512",
        surface: "#211E19",
        terminal: "#0E0D0B",
        line: "#4A4338",
        text: "#FFF8E8",
        muted: "#BDB19D",
        accent: "#FF654F",
        accentSoft: "#4A251F",
      },
      light: {
        background: "#FFF8E7",
        surface: "#F3E9D4",
        terminal: "#FFFCF4",
        line: "#D6C7AA",
        text: "#2D2922",
        muted: "#706655",
        accent: "#B52F24",
        accentSoft: "#F4D3C8",
      },
      cornerRadius: 0,
      fontId: "classic",
    },
    layout: {
      composition: "poster",
      contentOrder: "identity-first",
      density: "spacious",
      shapeSystem: "pixel",
      pattern: "scanlines",
      terminalStyle: "minimal",
      textAlign: "center",
      decorations: [
        {
          id: "poster-rule",
          shape: "line",
          x: 50,
          y: 12,
          size: 96,
          rotation: 0,
          tone: "accent",
          style: "outline",
          opacity: 0.75,
        },
        {
          id: "poster-cross",
          shape: "cross",
          x: 88,
          y: 84,
          size: 24,
          rotation: 45,
          tone: "muted",
          style: "outline",
          opacity: 0.45,
        },
      ],
    },
    workflowStyle: "minimal",
  },
  {
    id: "custom-canvas",
    name: "Custom Canvas",
    description:
      "A flexible terminal-led canvas with a quiet base for personal combinations.",
    template: { id: "custom-canvas", version: 1 },
    appearance: {
      dark: {
        background: "#101021",
        surface: "#19192E",
        terminal: "#0A0A16",
        line: "#39395C",
        text: "#F3F1FF",
        muted: "#AAA5C7",
        accent: "#8FE7FF",
        accentSoft: "#203D54",
      },
      light: {
        background: "#F7F5FF",
        surface: "#ECE9F8",
        terminal: "#FCFBFF",
        line: "#CCC5E0",
        text: "#29243D",
        muted: "#68617F",
        accent: "#316D88",
        accentSoft: "#D7EDF5",
      },
      cornerRadius: 14,
      fontId: "modern",
    },
    layout: {
      composition: "split",
      contentOrder: "terminal-first",
      density: "compact",
      shapeSystem: "hud",
      pattern: "none",
      terminalStyle: "minimal",
      textAlign: "start",
      decorations: [
        {
          id: "canvas-orb",
          shape: "circle",
          x: 8,
          y: 18,
          size: 26,
          rotation: 0,
          tone: "accent-soft",
          style: "fill",
          opacity: 0.65,
        },
        {
          id: "canvas-diamond",
          shape: "diamond",
          x: 91,
          y: 82,
          size: 22,
          rotation: 0,
          tone: "accent",
          style: "outline",
          opacity: 0.5,
        },
      ],
    },
    workflowStyle: "cards",
  },
];

export function getDesignPreset(presetId: DesignPresetId): DesignPreset {
  const preset = designPresets.find((candidate) => candidate.id === presetId);
  if (!preset) throw new Error(`Unknown design preset: ${String(presetId)}.`);
  return preset;
}

export function applyDesignPreset(
  config: ProfileConfig,
  presetId: DesignPresetId,
): ProfileConfig {
  const preset = getDesignPreset(presetId);
  const next = structuredClone(config);
  next.template = structuredClone(preset.template);
  next.appearance = structuredClone(preset.appearance);
  next.layout = structuredClone(preset.layout);
  next.hero.workflow = {
    ...next.hero.workflow,
    style: preset.workflowStyle,
  };
  return next;
}

export function isDesignPresetActive(
  config: ProfileConfig,
  presetId: DesignPresetId,
): boolean {
  const preset = getDesignPreset(presetId);
  return (
    config.template.id === preset.template.id &&
    config.template.version === preset.template.version &&
    config.hero.workflow.style === preset.workflowStyle &&
    JSON.stringify(config.appearance) === JSON.stringify(preset.appearance) &&
    JSON.stringify(config.layout) === JSON.stringify(preset.layout)
  );
}
