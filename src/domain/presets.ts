import type { ProfileConfig, TemplateId } from "./profile";

export type DesignPresetId = TemplateId;

export interface DesignPreset {
  readonly id: DesignPresetId;
  readonly name: string;
  readonly description: string;
  readonly template: ProfileConfig["template"];
  readonly appearance: ProfileConfig["appearance"];
}

export const designPresets = [
  {
    id: "quality-control",
    name: "Quality Control",
    description: "The original engineering dashboard with a crisp modern type system.",
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
  },
  {
    id: "classic-terminal",
    name: "Classic Terminal",
    description: "A compact phosphor-green terminal treatment with restrained corners.",
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
  },
  {
    id: "retro-arcade",
    name: "Retro Arcade",
    description: "Warm arcade highlights, deep violet panels, and a bold classic display face.",
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
  },
  {
    id: "anime-hud",
    name: "Anime HUD",
    description: "A high-energy cyan and magenta interface inspired by futuristic HUD graphics.",
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
  },
] as const satisfies readonly DesignPreset[];

export function applyDesignPreset(
  config: ProfileConfig,
  presetId: DesignPresetId,
): ProfileConfig {
  const preset = designPresets.find((candidate) => candidate.id === presetId);
  if (!preset) throw new Error(`Unknown design preset: ${String(presetId)}.`);

  const next = structuredClone(config);
  next.template = structuredClone(preset.template);
  next.appearance = structuredClone(preset.appearance);
  return next;
}
