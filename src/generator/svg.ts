import type {
  Composition,
  Decoration,
  FontId,
  Palette,
  ProfileConfig,
  ShapeSystem,
  WorkflowShape,
} from "../domain/profile";
import { escapeXml } from "./escape";

export type HeroTheme = "dark" | "light";
export type HeroViewport = "desktop" | "mobile";
export type HeroMotion = "animated" | "static";

export interface HeroVariant {
  theme: HeroTheme;
  viewport: HeroViewport;
  motion: HeroMotion;
}

interface Layout {
  width: number;
  height: number;
  identityLeft: number;
  identityWidth: number;
  identityAnchor: "start" | "middle" | "end";
  nameY: number;
  headlineY: [number, number, number];
  headlineSize: number;
  headlineSpacing: number;
  roleY: number;
  roleSize: number;
  secondaryRoleY: number;
  secondaryRoleSize: number;
  terminalX: number;
  terminalY: number;
  terminalWidth: number;
  terminalHeight: number;
  commandSize: number;
  commandCharWidth: number;
  checkSize: number;
  workflowY: number;
  workflowStartX: number;
  workflowEndX: number;
  workflowLabelY: number;
  contentDividerY: number;
  footerDividerY: number;
  footerY: number;
}

type LayoutInput = Omit<Layout, "identityAnchor">;

const sharedDesktop = {
  width: 1200,
  height: 610,
  commandSize: 16,
  commandCharWidth: 9.6,
  checkSize: 16,
  footerDividerY: 567,
  footerY: 592,
} as const;

const sharedMobile = {
  width: 620,
  height: 930,
  commandSize: 18,
  commandCharWidth: 10.8,
  checkSize: 18,
  footerDividerY: 887,
  footerY: 912,
} as const;

const compositionLayouts = {
  split: {
    desktop: {
      ...sharedDesktop,
      identityLeft: 42, identityWidth: 548, nameY: 129,
      headlineY: [206, 275, 344], headlineSize: 64, headlineSpacing: -2.9,
      roleY: 397, roleSize: 21, secondaryRoleY: 427, secondaryRoleSize: 17,
      terminalX: 632, terminalY: 112, terminalWidth: 528, terminalHeight: 342,
      workflowY: 513, workflowStartX: 232, workflowEndX: 997, workflowLabelY: 551,
      contentDividerY: 477,
    },
    mobile: {
      ...sharedMobile,
      identityLeft: 30, identityWidth: 560, nameY: 113,
      headlineY: [181, 244, 307], headlineSize: 60, headlineSpacing: -2.7,
      roleY: 352, roleSize: 21, secondaryRoleY: 382, secondaryRoleSize: 18,
      terminalX: 30, terminalY: 415, terminalWidth: 560, terminalHeight: 342,
      workflowY: 811, workflowStartX: 58, workflowEndX: 562, workflowLabelY: 849,
      contentDividerY: 775,
    },
  },
  stacked: {
    desktop: {
      ...sharedDesktop,
      identityLeft: 126, identityWidth: 948, nameY: 96,
      headlineY: [139, 181, 223], headlineSize: 39, headlineSpacing: -1.6,
      roleY: 252, roleSize: 18, secondaryRoleY: 276, secondaryRoleSize: 14,
      terminalX: 90, terminalY: 294, terminalWidth: 1020, terminalHeight: 190,
      workflowY: 522, workflowStartX: 160, workflowEndX: 1040, workflowLabelY: 550,
      contentDividerY: 497,
    },
    mobile: {
      ...sharedMobile,
      identityLeft: 42, identityWidth: 536, nameY: 105,
      headlineY: [153, 201, 249], headlineSize: 44, headlineSpacing: -1.8,
      roleY: 282, roleSize: 18, secondaryRoleY: 308, secondaryRoleSize: 15,
      terminalX: 30, terminalY: 337, terminalWidth: 560, terminalHeight: 350,
      workflowY: 808, workflowStartX: 58, workflowEndX: 562, workflowLabelY: 850,
      contentDividerY: 716,
    },
  },
  "terminal-focus": {
    desktop: {
      ...sharedDesktop,
      identityLeft: 768, identityWidth: 365, nameY: 122,
      headlineY: [174, 227, 280], headlineSize: 49, headlineSpacing: -2,
      roleY: 323, roleSize: 18, secondaryRoleY: 350, secondaryRoleSize: 14,
      terminalX: 45, terminalY: 100, terminalWidth: 665, terminalHeight: 352,
      workflowY: 513, workflowStartX: 214, workflowEndX: 1015, workflowLabelY: 551,
      contentDividerY: 477,
    },
    mobile: {
      ...sharedMobile,
      identityLeft: 34, identityWidth: 552, nameY: 101,
      headlineY: [148, 195, 242], headlineSize: 43, headlineSpacing: -1.8,
      roleY: 275, roleSize: 18, secondaryRoleY: 301, secondaryRoleSize: 15,
      terminalX: 30, terminalY: 329, terminalWidth: 560, terminalHeight: 408,
      workflowY: 811, workflowStartX: 58, workflowEndX: 562, workflowLabelY: 850,
      contentDividerY: 757,
    },
  },
  "hud-grid": {
    desktop: {
      ...sharedDesktop,
      identityLeft: 55, identityWidth: 520, nameY: 116,
      headlineY: [169, 223, 277], headlineSize: 50, headlineSpacing: -2.1,
      roleY: 318, roleSize: 19, secondaryRoleY: 346, secondaryRoleSize: 15,
      terminalX: 650, terminalY: 100, terminalWidth: 500, terminalHeight: 360,
      workflowY: 517, workflowStartX: 195, workflowEndX: 1020, workflowLabelY: 551,
      contentDividerY: 477,
    },
    mobile: {
      ...sharedMobile,
      identityLeft: 34, identityWidth: 552, nameY: 102,
      headlineY: [151, 201, 251], headlineSize: 46, headlineSpacing: -1.9,
      roleY: 286, roleSize: 18, secondaryRoleY: 312, secondaryRoleSize: 15,
      terminalX: 50, terminalY: 350, terminalWidth: 520, terminalHeight: 375,
      workflowY: 807, workflowStartX: 60, workflowEndX: 560, workflowLabelY: 850,
      contentDividerY: 747,
    },
  },
  bento: {
    desktop: {
      ...sharedDesktop,
      identityLeft: 70, identityWidth: 470, nameY: 121,
      headlineY: [181, 241, 301], headlineSize: 54, headlineSpacing: -2.2,
      roleY: 342, roleSize: 19, secondaryRoleY: 370, secondaryRoleSize: 15,
      terminalX: 610, terminalY: 105, terminalWidth: 530, terminalHeight: 272,
      workflowY: 423, workflowStartX: 620, workflowEndX: 1130, workflowLabelY: 455,
      contentDividerY: 477,
    },
    mobile: {
      ...sharedMobile,
      identityLeft: 48, identityWidth: 524, nameY: 111,
      headlineY: [160, 211, 262], headlineSize: 47, headlineSpacing: -2,
      roleY: 299, roleSize: 18, secondaryRoleY: 325, secondaryRoleSize: 15,
      terminalX: 42, terminalY: 374, terminalWidth: 536, terminalHeight: 320,
      workflowY: 806, workflowStartX: 58, workflowEndX: 562, workflowLabelY: 850,
      contentDividerY: 724,
    },
  },
  poster: {
    desktop: {
      ...sharedDesktop,
      identityLeft: 86, identityWidth: 500, nameY: 122,
      headlineY: [193, 271, 349], headlineSize: 72, headlineSpacing: -3,
      roleY: 400, roleSize: 19, secondaryRoleY: 430, secondaryRoleSize: 15,
      terminalX: 630, terminalY: 150, terminalWidth: 500, terminalHeight: 240,
      workflowY: 516, workflowStartX: 675, workflowEndX: 1110, workflowLabelY: 550,
      contentDividerY: 477,
    },
    mobile: {
      ...sharedMobile,
      identityLeft: 42, identityWidth: 536, nameY: 111,
      headlineY: [190, 269, 348], headlineSize: 67, headlineSpacing: -2.9,
      roleY: 400, roleSize: 19, secondaryRoleY: 429, secondaryRoleSize: 15,
      terminalX: 60, terminalY: 483, terminalWidth: 500, terminalHeight: 225,
      workflowY: 807, workflowStartX: 66, workflowEndX: 554, workflowLabelY: 850,
      contentDividerY: 738,
    },
  },
} satisfies Record<Composition, Record<HeroViewport, LayoutInput>>;

function resolveLayout(config: ProfileConfig, viewport: HeroViewport): Layout {
  const layout: Layout = {
    ...compositionLayouts[config.layout.composition][viewport],
    identityAnchor: "start",
  };
  const terminalFirst = config.layout.contentOrder === "terminal-first";

  if (config.layout.density === "compact") {
    const first = layout.headlineY[0];
    const gap = (layout.headlineY[1] - first) * .82;
    layout.headlineY = [first, first + gap, first + gap * 2];
    layout.headlineSize = Math.max(34, Math.round(layout.headlineSize * .9));
    layout.roleY = layout.headlineY[2] + 34;
    layout.secondaryRoleY = layout.roleY + 24;
    layout.terminalHeight = Math.max(185, layout.terminalHeight - 16);
  } else if (config.layout.density === "spacious") {
    const first = layout.headlineY[0];
    const gap = (layout.headlineY[1] - first) * 1.06;
    layout.headlineY = [first, first + gap, first + gap * 2];
    layout.roleY = layout.headlineY[2] + 44;
    layout.secondaryRoleY = layout.roleY + 29;
    layout.identityLeft += 10;
    layout.identityWidth = Math.max(240, layout.identityWidth - 20);
    layout.terminalX += 8;
    layout.terminalWidth = Math.max(360, layout.terminalWidth - 16);
    layout.terminalHeight = Math.min(
      layout.terminalHeight + 12,
      layout.contentDividerY - layout.terminalY - 10,
    );
  }

  if (terminalFirst && viewport === "desktop") {
    if (["split", "hud-grid", "bento", "terminal-focus"].includes(config.layout.composition)) {
      layout.identityLeft = layout.width - layout.identityLeft - layout.identityWidth;
      layout.terminalX = layout.width - layout.terminalX - layout.terminalWidth;
      layout.identityAnchor = "end";
    } else if (config.layout.composition === "stacked") {
      layout.terminalY = 88;
      layout.terminalHeight = 205;
      layout.nameY = 327;
      layout.headlineY = [365, 403, 441];
      layout.headlineSize = 35;
      layout.roleY = 471;
      layout.secondaryRoleY = 494;
      layout.contentDividerY = 505;
    } else if (config.layout.composition === "poster") {
      layout.terminalY = 92;
      layout.terminalHeight = 190;
      layout.nameY = 319;
      layout.headlineY = [358, 400, 442];
      layout.headlineSize = 39;
      layout.roleY = 473;
      layout.secondaryRoleY = 497;
      layout.contentDividerY = 505;
    }
  }

  if (terminalFirst && viewport === "mobile") {
    const terminalHeight = Math.min(342, layout.terminalHeight);
    layout.terminalY = 92;
    layout.terminalHeight = terminalHeight;
    layout.nameY = layout.terminalY + terminalHeight + 34;
    const firstHeadlineY = layout.nameY + 50;
    layout.headlineY = [firstHeadlineY, firstHeadlineY + 51, firstHeadlineY + 102];
    layout.headlineSize = Math.min(layout.headlineSize, 46);
    layout.roleY = firstHeadlineY + 138;
    layout.secondaryRoleY = layout.roleY + 27;
    layout.contentDividerY = Math.min(767, layout.secondaryRoleY + 29);
    layout.workflowY = 811;
    layout.workflowLabelY = 850;
  }

  if (config.layout.textAlign === "center") {
    layout.identityAnchor = "middle";
  }
  return layout;
}

export const heroVariants: HeroVariant[] = [
  { viewport: "desktop", theme: "dark", motion: "animated" },
  { viewport: "desktop", theme: "light", motion: "animated" },
  { viewport: "mobile", theme: "dark", motion: "animated" },
  { viewport: "mobile", theme: "light", motion: "animated" },
  { viewport: "desktop", theme: "dark", motion: "static" },
  { viewport: "desktop", theme: "light", motion: "static" },
  { viewport: "mobile", theme: "dark", motion: "static" },
  { viewport: "mobile", theme: "light", motion: "static" },
];

export function heroFilename(variant: HeroVariant): string {
  const mobile = variant.viewport === "mobile" ? "-mobile" : "";
  const reduced = variant.motion === "static" ? "-static" : "";
  return `profile-header${mobile}-${variant.theme}${reduced}.svg`;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const fontStacks: Record<FontId, { display: string; mono: string }> = {
  modern: {
    display: "'Segoe UI',Arial,Helvetica,sans-serif",
    mono: "'SFMono-Regular',Consolas,'Liberation Mono','Courier New',monospace",
  },
  mono: {
    display: "'SFMono-Regular',Consolas,'Liberation Mono','Courier New',monospace",
    mono: "'SFMono-Regular',Consolas,'Liberation Mono','Courier New',monospace",
  },
  classic: {
    display: "Georgia,'Times New Roman',serif",
    mono: "'Courier New',Courier,monospace",
  },
  rounded: {
    display: "'Trebuchet MS','Arial Rounded MT Bold',Arial,sans-serif",
    mono: "'Lucida Console',Monaco,Consolas,monospace",
  },
};

function patternMarkup(pattern: ProfileConfig["layout"]["pattern"], id: string, palette: Palette): string {
  switch (pattern) {
    case "scanlines":
      return `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 17.5H18" stroke="${palette.line}" opacity=".2"/></pattern>`;
    case "grid":
      return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 .5H8M.5 0V8" stroke="${palette.muted}" stroke-width=".5" opacity=".13"/></pattern>`;
    case "circuit":
      return `<pattern id="${id}" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M0 .5H32M.5 0V32" stroke="${palette.line}" opacity=".2"/><path d="M24 0l8 8M0 24l8 8" stroke="${palette.accent}" opacity=".1"/></pattern>`;
    case "dots":
      return `<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="${palette.muted}" opacity=".12"/></pattern>`;
    case "none":
      return `<pattern id="${id}" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="${palette.surface}" opacity="0"/></pattern>`;
  }
}

function framePath(width: number, height: number, shape: ShapeSystem, inset = 0.5): string {
  const left = inset;
  const top = inset;
  const right = width - inset;
  const bottom = height - inset;
  if (shape === "hud") {
    return `M${left + 22} ${top}H${right - 46}L${right} ${top + 46}V${bottom - 22}L${right - 22} ${bottom}H${left + 46}L${left} ${bottom - 46}V${top + 22}Z`;
  }
  if (shape === "pixel") {
    return `M${left + 12} ${top}H${right - 12}V${top + 12}H${right}V${bottom - 12}H${right - 12}V${bottom}H${left + 12}V${bottom - 12}H${left}V${top + 12}H${left + 12}Z`;
  }
  return `M${left} ${top}H${right}V${bottom}H${left}Z`;
}

function frameAccents(composition: Composition, layout: Layout, palette: Palette): string {
  switch (composition) {
    case "split":
      return "";
    case "stacked":
      return `<path d="M30 82H145M${layout.width - 145} 82H${layout.width - 30}" stroke="${palette.accent}" opacity=".55"/><path d="M30 ${layout.contentDividerY}H${layout.width - 30}" stroke="${palette.line}"/>`;
    case "terminal-focus":
      return `<path d="M14 78h34M14 78v34M${layout.width - 14} 78h-34M${layout.width - 14} 78v34" stroke="${palette.accent}" stroke-width="3"/><path d="M14 ${layout.footerDividerY - 14}h22M${layout.width - 14} ${layout.footerDividerY - 14}h-22" stroke="${palette.accent}" stroke-width="3"/>`;
    case "hud-grid":
      return `<g fill="none" stroke="${palette.accent}"><path d="M18 92h78l18-18h92" opacity=".72"/><path d="M${layout.width - 18} ${layout.footerDividerY - 22}h-92l-18 18h-78" opacity=".5"/><path d="M${layout.width - 104} 76h34l16 16" stroke-width="2"/><path d="M${Math.round(layout.width * .47)} 76l48 ${layout.contentDividerY - 94}" opacity=".24"/></g>`;
    case "bento":
      return `<rect x="42" y="88" width="${layout.width === 1200 ? 520 : 536}" height="${layout.width === 1200 ? 302 : 250}" rx="${Math.min(18, layout.width === 1200 ? 18 : 14)}" fill="${palette.accentSoft}" opacity=".22" stroke="${palette.line}"/><path d="M42 ${layout.contentDividerY}H${layout.width - 42}" stroke="${palette.line}"/>`;
    case "poster":
      return `<path d="M${layout.width === 1200 ? 602 : 30} 86V${layout.contentDividerY - 18}" stroke="${palette.line}"/><circle cx="${layout.width - 76}" cy="128" r="48" fill="none" stroke="${palette.accent}" opacity=".22" stroke-width="12"/><text x="${layout.width - 40}" y="${layout.contentDividerY - 30}" class="mono soft" font-size="${layout.width === 1200 ? 92 : 64}" text-anchor="end" opacity=".5">01</text>`;
  }
}

function compositionPanels(config: ProfileConfig, layout: Layout, palette: Palette): string {
  if (config.layout.composition === "bento" && layout.width === 1200) {
    return `<rect x="600" y="94" width="550" height="294" rx="${config.layout.shapeSystem === "rounded" ? Math.min(20, config.appearance.cornerRadius) : 2}" fill="${palette.terminal}" opacity=".18" stroke="${palette.line}"/><rect x="600" y="399" width="550" height="65" rx="${config.layout.shapeSystem === "rounded" ? 12 : 2}" fill="${palette.accentSoft}" opacity=".22" stroke="${palette.line}"/>`;
  }
  if (config.layout.composition === "terminal-focus") {
    return `<path d="M${layout.terminalX - 14} ${layout.terminalY - 14}H${layout.terminalX + layout.terminalWidth + 14}" stroke="${palette.accent}" stroke-width="3"/><text x="${layout.terminalX}" y="${layout.terminalY - 24}" class="mono accent" font-size="11" letter-spacing="2">SYSTEM SCOREBOARD</text>`;
  }
  if (config.layout.composition === "hud-grid") {
    return `<path d="M${layout.identityLeft + layout.identityWidth + 16} 88L${layout.terminalX - 18} ${layout.contentDividerY - 18}" fill="none" stroke="${palette.accent}" opacity=".25"/><circle cx="${layout.width * .5}" cy="${layout.contentDividerY * .5}" r="54" fill="none" stroke="${palette.accent}" stroke-dasharray="4 10" opacity=".2"/>`;
  }
  return "";
}

function textFitAttributes(
  value: string,
  fontSize: number,
  maxWidth: number,
  options: { mono?: boolean; letterSpacing?: number } = {},
): string {
  const characters = Array.from(value);
  const estimatedWidth = characters.reduce((width, character) => {
    if (options.mono) return width + fontSize * 0.63;
    if (/\s/.test(character)) return width + fontSize * 0.32;
    if (/[MW@#%&]/.test(character)) return width + fontSize * 0.9;
    if (/[ilI1.,'|]/.test(character)) return width + fontSize * 0.32;
    return width + fontSize * (character.codePointAt(0)! > 0x2fff ? 1 : 0.59);
  }, 0) + Math.max(0, characters.length - 1) * (options.letterSpacing ?? 0);

  return estimatedWidth > maxWidth
    ? ` textLength="${Math.max(1, Math.round(maxWidth))}" lengthAdjust="spacingAndGlyphs"`
    : "";
}

function animationStyles(
  config: ProfileConfig,
  prefix: string,
  commandWidth: number,
): string {
  const duration = `${config.hero.animationDuration}s`;
  const stepCount = Math.max(1, Array.from(config.hero.command).length);
  const lastPass = 14 + config.hero.checks.length * 10;
  const completeStart = Math.min(82, lastPass + 4);
  const keyframes: string[] = [];
  const assignments: string[] = [];

  for (let index = 0; index < config.hero.checks.length; index += 1) {
    const item = index + 1;
    const runStart = 14 + index * 10;
    const runEnd = runStart + 9.5;
    const passStart = runStart + 10;
    assignments.push(
      `.wait-${item}{animation:${prefix}-wait-${item} ${duration} linear infinite}`,
      `.run-${item}{animation:${prefix}-run-${item} ${duration} linear infinite}`,
      `.pass-${item}{animation:${prefix}-pass-${item} ${duration} linear infinite}`,
      `.rail-${item}{animation:${prefix}-rail-${item} ${duration} ease-in-out infinite}`,
    );
    keyframes.push(
      `@keyframes ${prefix}-wait-${item}{0%,${formatPercent(runStart - 0.5)}%{opacity:1}${formatPercent(runStart)}%,96%{opacity:0}99%,100%{opacity:1}}`,
      `@keyframes ${prefix}-run-${item}{0%,${formatPercent(runStart - 0.5)}%{opacity:0}${formatPercent(runStart)}%,${formatPercent(runEnd)}%{opacity:1}${formatPercent(passStart)}%,100%{opacity:0}}`,
      `@keyframes ${prefix}-pass-${item}{0%,${formatPercent(runEnd)}%{opacity:0}${formatPercent(passStart)}%,96%{opacity:1}99%,100%{opacity:0}}`,
      `@keyframes ${prefix}-rail-${item}{0%,${formatPercent(runStart)}%{transform:scaleX(0);opacity:0}${formatPercent(runStart + 0.5)}%{opacity:1}${formatPercent(passStart)}%,96%{transform:scaleX(1);opacity:1}99%,100%{transform:scaleX(0);opacity:0}}`,
    );
  }

  return `
    @media (prefers-reduced-motion:no-preference){
      .typed{animation:${prefix}-type-in ${duration} steps(${stepCount},end) infinite}
      .type-cursor{animation:${prefix}-cursor-position ${duration} steps(${stepCount},end) infinite}
      .caret{animation:${prefix}-blink 1s steps(1,end) infinite}
      .complete{animation:${prefix}-complete ${duration} linear infinite}
      .boot-label{animation:${prefix}-boot ${duration} linear infinite}
      .trail{animation:${prefix}-travel ${duration} linear infinite}
      .signal{animation:${prefix}-breathe 4s ease-in-out infinite}
      ${assignments.join("\n      ")}
    }
    @keyframes ${prefix}-type-in{0%,3%{transform:scaleX(0)}13%,96%{transform:scaleX(1)}99%,100%{transform:scaleX(0)}}
    @keyframes ${prefix}-cursor-position{0%,3%{opacity:1;transform:translateX(0)}13%,14%{opacity:1;transform:translateX(${commandWidth}px)}15%,100%{opacity:0;transform:translateX(${commandWidth}px)}}
    @keyframes ${prefix}-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
    @keyframes ${prefix}-breathe{0%,100%{opacity:.45}50%{opacity:1}}
    @keyframes ${prefix}-complete{0%,${formatPercent(completeStart - 1)}%{opacity:0}${formatPercent(completeStart)}%,96%{opacity:1}99%,100%{opacity:0}}
    @keyframes ${prefix}-boot{0%,${formatPercent(completeStart - 2)}%{opacity:1}${formatPercent(completeStart)}%,96%{opacity:0}99%,100%{opacity:1}}
    @keyframes ${prefix}-travel{0%,4%{opacity:0;stroke-dashoffset:1000}6%{opacity:.8}94%{opacity:.8;stroke-dashoffset:0}96%,100%{opacity:0;stroke-dashoffset:0}}
    ${keyframes.join("\n    ")}
    @media print{*{animation:none!important}.pending,.running,.type-cursor,.trail,.boot-label{opacity:0!important}.pass,.complete{opacity:1!important}}`;
}

function styles(
  config: ProfileConfig,
  palette: Palette,
  variant: HeroVariant,
  prefix: string,
  commandWidth: number,
): string {
  const fonts = fontStacks[config.appearance.fontId];
  const animation =
    variant.motion === "animated"
      ? animationStyles(config, prefix, commandWidth)
      : "";
  return `<style>
    .bg{fill:${palette.background}} .surface{fill:${palette.surface}} .inner{fill:${palette.terminal}}
    .line{stroke:${palette.line};stroke-width:1} .ink{fill:${palette.text}}
    .muted{fill:${palette.muted}} .accent{fill:${palette.accent}} .soft{fill:${palette.accentSoft}}
    .mono{font-family:${fonts.mono}}
    .sans{font-family:${fonts.display}}
    .pending,.running,.type-cursor,.trail,.boot-label{opacity:0}
    .pass,.complete{opacity:1}
    .typed{transform:scaleX(1);transform-origin:0 0}
    ${animation}
  </style>`;
}

function panelFrameMarkup(config: ProfileConfig, width: number, height: number): string {
  if (config.layout.shapeSystem === "rounded") {
    return `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${Math.min(22, config.appearance.cornerRadius)}" class="inner line"/>`;
  }
  if (config.layout.shapeSystem === "terminal") {
    return `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="2" class="inner line"/><rect x="5.5" y="5.5" width="${width - 11}" height="${height - 11}" fill="none" class="line" opacity=".35"/>`;
  }
  return `<path d="${framePath(width, height, config.layout.shapeSystem)}" class="inner line"/>`;
}

function terminalMarkup(
  config: ProfileConfig,
  layout: Layout,
  palette: Palette,
  commandWidth: number,
  clipId: string,
): string {
  const statusEnd = layout.terminalWidth - 23;
  const checkMarkX = statusEnd - 65;
  const railWidth = layout.terminalWidth - 80;
  const headerHeight = config.layout.terminalStyle === "window" ? 43 : config.layout.terminalStyle === "panel" ? 34 : 27;
  const commandBaseline = headerHeight + 41;
  const footerDividerY = layout.terminalHeight - 44;
  const desiredRowStart = headerHeight + (config.layout.terminalStyle === "window" ? 92 : 64);
  const rowStart = Math.min(desiredRowStart, footerDividerY - 14 - (config.hero.checks.length - 1) * 12);
  const availableRowSpan = Math.max(0, footerDividerY - rowStart - 13);
  const rowGap = config.hero.checks.length > 1
    ? Math.min(41, availableRowSpan / (config.hero.checks.length - 1))
    : 0;
  const checkFontSize = Math.min(layout.checkSize, Math.max(11, rowGap ? rowGap - 2 : layout.checkSize));
  const checkRows = config.hero.checks
    .map((label, index) => {
      const item = index + 1;
      const y = rowStart + index * rowGap;
      const railY = y + Math.min(12, Math.max(5, rowGap * .42));
      return `<text x="21" y="${y}" class="mono muted" font-size="12">${String(item).padStart(2, "0")}</text>
<text x="58" y="${y}" class="mono ink" font-size="${checkFontSize}"${textFitAttributes(label, checkFontSize, checkMarkX - 76, { mono: true })}>${escapeXml(label)}</text>
<text x="${statusEnd}" y="${y}" class="mono muted pending wait-${item}" font-size="11" text-anchor="end"${textFitAttributes(config.hero.labels.queued, 11, 58, { mono: true })}>${escapeXml(config.hero.labels.queued)}</text>
<text x="${statusEnd}" y="${y}" class="mono accent running run-${item}" font-size="11" text-anchor="end"${textFitAttributes(config.hero.labels.running, 11, 58, { mono: true })}>${escapeXml(config.hero.labels.running)}</text>
<g class="pass pass-${item}"><path d="M${checkMarkX} ${y - 6}l4 4 8-9" stroke="${palette.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="${statusEnd}" y="${y}" class="mono accent" font-size="12" text-anchor="end"${textFitAttributes(config.hero.labels.passed, 12, 48, { mono: true })}>${escapeXml(config.hero.labels.passed)}</text></g>
<path d="M58 ${railY}H${layout.terminalWidth - 22}" stroke="${palette.line}" stroke-width="1"/>
<g transform="translate(58 ${railY})"><rect width="${railWidth}" height="1" class="accent rail-${item}" style="transform-origin:0 0"/></g>`;
    })
    .join("\n");

  const header = config.layout.terminalStyle === "window"
    ? `<path d="M0 ${headerHeight}H${layout.terminalWidth}" class="line"/>
<circle cx="21" cy="22" r="4" fill="${palette.muted}" opacity=".9"/>
<circle cx="36" cy="22" r="4" fill="${palette.muted}" opacity=".68"/>
<circle cx="51" cy="22" r="4" fill="${palette.muted}" opacity=".46"/>
<text x="79" y="27" class="mono muted" font-size="13"${textFitAttributes(`${config.identity.username}@${config.hero.labels.host}:~`, 13, statusEnd - 180, { mono: true })}>${escapeXml(config.identity.username.toLowerCase())}@${escapeXml(config.hero.labels.host.toLowerCase())}:~</text>
<text x="${statusEnd}" y="27" class="mono muted" font-size="11" text-anchor="end" letter-spacing=".5"${textFitAttributes(config.hero.labels.demoRun, 11, 92, { mono: true, letterSpacing: 0.5 })}>${escapeXml(config.hero.labels.demoRun)}</text>`
    : config.layout.terminalStyle === "panel"
      ? `<path d="M0 ${headerHeight}H${layout.terminalWidth}" class="line"/><path d="M0 0H110L126 ${headerHeight}H0Z" class="soft" opacity=".7"/>
<text x="16" y="23" class="mono accent" font-size="11" letter-spacing="1">CONSOLE</text>
<text x="${statusEnd}" y="23" class="mono muted" font-size="11" text-anchor="end">${escapeXml(config.hero.labels.demoRun)}</text>`
      : `<path d="M0 ${headerHeight}H${layout.terminalWidth}" class="line"/><text x="2" y="18" class="mono muted" font-size="11">${escapeXml(config.identity.username)} / ${escapeXml(config.hero.labels.host)}</text>`;

  return `<g transform="translate(${layout.terminalX} ${layout.terminalY})" data-terminal-style="${config.layout.terminalStyle}">
${panelFrameMarkup(config, layout.terminalWidth, layout.terminalHeight)}
${header}
<text x="21" y="${commandBaseline}" class="mono accent" font-size="${layout.commandSize}">$</text>
<g transform="translate(46 ${commandBaseline - 21})"><g clip-path="url(#${clipId})"><text x="0" y="21" class="mono ink" font-size="${layout.commandSize}">${escapeXml(config.hero.command)}</text></g><g class="type-cursor"><rect x="0" y="5" width="${layout.commandCharWidth}" height="20" class="accent caret"/></g></g>
${checkRows}
<path d="M0 ${footerDividerY}H${layout.terminalWidth}" class="line"/>
<g class="complete"><text x="22" y="${layout.terminalHeight - 17}" class="mono accent" font-size="17">↳</text><text x="47" y="${layout.terminalHeight - 17}" class="mono accent" font-size="13"${textFitAttributes(config.hero.completionMessage, 13, layout.terminalWidth - 72, { mono: true })}>${escapeXml(config.hero.completionMessage)}</text></g>
<g class="boot-label"><text x="22" y="${layout.terminalHeight - 17}" class="mono muted" font-size="17">↳</text><text x="47" y="${layout.terminalHeight - 17}" class="mono muted" font-size="13"${textFitAttributes(config.hero.idleMessage, 13, layout.terminalWidth - 72, { mono: true })}>${escapeXml(config.hero.idleMessage)}</text></g>
</g>`;
}

function resolvedWorkflowShape(shape: WorkflowShape, system: ShapeSystem): Exclude<WorkflowShape, "auto"> {
  if (shape !== "auto") return shape;
  if (system === "terminal") return "square";
  if (system === "pixel") return "diamond";
  if (system === "hud") return "hexagon";
  return "circle";
}

function nodeShapeMarkup(
  x: number,
  y: number,
  size: number,
  shape: Exclude<WorkflowShape, "auto">,
  className = "bg line",
): string {
  const half = size / 2;
  if (shape === "circle") return `<circle cx="${x}" cy="${y}" r="${half}" class="${className}"/>`;
  if (shape === "square") return `<rect x="${x - half}" y="${y - half}" width="${size}" height="${size}" rx="2" class="${className}"/>`;
  if (shape === "diamond") return `<path d="M${x} ${y - half}L${x + half} ${y}L${x} ${y + half}L${x - half} ${y}Z" class="${className}"/>`;
  const inset = half * .56;
  return `<path d="M${x - inset} ${y - half}H${x + inset}L${x + half} ${y}L${x + inset} ${y + half}H${x - inset}L${x - half} ${y}Z" class="${className}"/>`;
}

function workflowMarkup(config: ProfileConfig, layout: Layout, palette: Palette): string {
  const { steps, style } = config.hero.workflow;
  const availableWidth = layout.workflowEndX - layout.workflowStartX;
  const twoRows = layout.width === 620 && steps.length > 4;
  const rowSize = twoRows ? Math.ceil(steps.length / 2) : steps.length;
  const fontSize = layout.width === 620 ? 12 : 11;
  const entries = steps.map((step, index) => {
    const row = twoRows ? Math.floor(index / rowSize) : 0;
    const indexInRow = twoRows ? index % rowSize : index;
    const itemsInRow = twoRows ? Math.min(rowSize, steps.length - row * rowSize) : steps.length;
    const x = itemsInRow === 1
      ? layout.workflowStartX + availableWidth / 2
      : layout.workflowStartX + (availableWidth * indexInRow) / (itemsInRow - 1);
    const y = twoRows ? layout.workflowY - 23 + row * 48 : layout.workflowY;
    const maxLabelWidth = Math.max(58, availableWidth / Math.max(1, itemsInRow) - 14);
    const shape = resolvedWorkflowShape(step.shape, config.layout.shapeSystem);

    if (style === "cards") {
      const cardWidth = Math.min(twoRows ? 148 : 176, Math.max(74, availableWidth / itemsInRow - 10));
      return `<g data-workflow-shape="${shape}"><rect x="${x - cardWidth / 2}" y="${y - 16}" width="${cardWidth}" height="34" rx="${config.layout.shapeSystem === "rounded" ? 9 : 1}" class="soft line"/><text x="${x - cardWidth / 2 + 12}" y="${y + 5}" class="mono accent" font-size="10">${String(index + 1).padStart(2, "0")}</text><text x="${x + 7}" y="${y + 5}" class="mono ink" font-size="${fontSize}" text-anchor="middle"${textFitAttributes(step.label, fontSize, cardWidth - 42, { mono: true })}>${escapeXml(step.label)}</text></g>`;
    }
    if (style === "command-chain") {
      const pillWidth = Math.min(154, Math.max(68, availableWidth / itemsInRow - 12));
      return `<g data-workflow-shape="${shape}"><rect x="${x - pillWidth / 2}" y="${y - 14}" width="${pillWidth}" height="28" rx="2" class="inner line"/><text x="${x}" y="${y + 4}" class="mono ink" font-size="${fontSize}" text-anchor="middle"${textFitAttributes(step.label, fontSize, pillWidth - 16, { mono: true })}>${escapeXml(step.label)}</text>${indexInRow < itemsInRow - 1 ? `<text x="${x + pillWidth / 2 + 5}" y="${y + 4}" class="mono accent" font-size="12">›</text>` : ""}</g>`;
    }
    if (style === "minimal") {
      return `<g data-workflow-shape="${shape}"><path d="M${x} ${y - 10}V${y + 10}" stroke="${palette.accent}" stroke-width="2"/><text x="${x}" y="${y + 27}" class="mono ink" font-size="${fontSize}" text-anchor="middle"${textFitAttributes(step.label, fontSize, maxLabelWidth, { mono: true })}>${escapeXml(step.label)}</text></g>`;
    }

    const nodeSize = style === "arcade-track" ? 28 : style === "telemetry" ? 24 : 26;
    const connectorClass = style === "telemetry" ? "accent" : "ink";
    return `<g data-workflow-shape="${shape}">${nodeShapeMarkup(x, y, nodeSize, shape)}<text x="${x}" y="${y + 4}" class="mono ${connectorClass}" font-size="10" text-anchor="middle">${index + 1}</text><text x="${x}" y="${y + 29}" class="mono ink" font-size="${fontSize}" text-anchor="middle" letter-spacing=".8"${textFitAttributes(step.label, fontSize, maxLabelWidth, { mono: true, letterSpacing: .8 })}>${escapeXml(step.label)}</text></g>`;
  }).join("\n");

  const connectors = Array.from({ length: twoRows ? 2 : 1 }, (_, row) => {
    const rowStartIndex = row * rowSize;
    const rowItems = Math.min(rowSize, steps.length - rowStartIndex);
    if (rowItems < 2 || ["cards", "command-chain", "minimal"].includes(style)) return "";
    const y = twoRows ? layout.workflowY - 23 + row * 48 : layout.workflowY;
    const dash = style === "telemetry" ? ` stroke-dasharray="5 7"` : "";
    const width = style === "arcade-track" ? 3 : 1.5;
    return `<path d="M${layout.workflowStartX} ${y}H${layout.workflowEndX}" stroke="${palette.line}" stroke-width="${width}"${dash}/><path d="M${layout.workflowStartX} ${y}H${layout.workflowEndX}" stroke="${palette.accent}" stroke-width="2" stroke-dasharray="60 940" pathLength="1000" class="trail"/>`;
  }).join("\n");
  const heading = layout.width === 1200
    ? `<text x="42" y="${layout.workflowY + 4}" class="mono muted" font-size="12" letter-spacing="1"${textFitAttributes(config.hero.labels.workflow, 12, 150, { mono: true, letterSpacing: 1 })}>${escapeXml(config.hero.labels.workflow)}</text>`
    : "";

  return `<g data-workflow-style="${style}">${heading}${connectors}${entries}</g>`;
}

function decorationColor(decoration: Decoration, palette: Palette): string {
  if (decoration.tone === "accent") return palette.accent;
  if (decoration.tone === "accent-soft") return palette.accentSoft;
  if (decoration.tone === "line") return palette.line;
  return palette.muted;
}

function decorationsMarkup(config: ProfileConfig, layout: Layout, clipId: string, palette: Palette): string {
  const contentHeight = layout.footerDividerY - 64;
  const markup = config.layout.decorations.map((decoration) => {
    const x = (layout.width * decoration.x) / 100;
    const y = 64 + (contentHeight * decoration.y) / 100;
    const half = decoration.size / 2;
    const color = decorationColor(decoration, palette);
    const paint = decoration.style === "fill"
      ? `fill="${color}" stroke="none"`
      : `fill="none" stroke="${color}" stroke-width="2"`;
    const transform = `rotate(${decoration.rotation} ${x} ${y})`;
    if (decoration.shape === "circle") return `<circle cx="${x}" cy="${y}" r="${half}" ${paint} opacity="${decoration.opacity}" transform="${transform}"/>`;
    if (decoration.shape === "square") return `<rect x="${x - half}" y="${y - half}" width="${decoration.size}" height="${decoration.size}" ${paint} opacity="${decoration.opacity}" transform="${transform}"/>`;
    if (decoration.shape === "diamond") return `<path d="M${x} ${y - half}L${x + half} ${y}L${x} ${y + half}L${x - half} ${y}Z" ${paint} opacity="${decoration.opacity}" transform="${transform}"/>`;
    if (decoration.shape === "cross") return `<path d="M${x - half} ${y}H${x + half}M${x} ${y - half}V${y + half}" fill="none" stroke="${color}" stroke-width="${decoration.style === "fill" ? 5 : 2}" opacity="${decoration.opacity}" transform="${transform}"/>`;
    return `<path d="M${x - half} ${y}H${x + half}" fill="none" stroke="${color}" stroke-width="${decoration.style === "fill" ? 5 : 2}" opacity="${decoration.opacity}" transform="${transform}"/>`;
  }).join("\n");
  return markup ? `<g clip-path="url(#${clipId})" aria-hidden="true">${markup}</g>` : "";
}

export function renderHeroSvg(config: ProfileConfig, variant: HeroVariant): string {
  const layout = resolveLayout(config, variant.viewport);
  const palette = config.appearance[variant.theme];
  const prefix = `profile-${config.template.id}-${config.layout.composition}-${variant.theme}-${variant.viewport}`;
  const patternId = `${prefix}-grid`;
  const clipId = `${prefix}-command`;
  const contentClipId = `${prefix}-content`;
  const frameClipId = `${prefix}-frame`;
  const commandWidth = Math.min(
    layout.terminalWidth - 86,
    Math.max(layout.commandCharWidth, Array.from(config.hero.command).length * layout.commandCharWidth),
  );
  const titleId = `${prefix}-title`;
  const descId = `${prefix}-desc`;
  const motionDescription =
    variant.motion === "animated"
      ? config.accessibility.animatedDescription ||
        "The terminal types a command, completes demo checks, and repeats. Motion stops when reduced motion is preferred."
      : config.accessibility.staticDescription ||
        "A static completed illustration of the configured demo checks.";
  const contentHeight = layout.footerDividerY - 64;
  const headerSignalX = variant.viewport === "desktop" ? 1073 : 493;
  const profileTextX = layout.width - 30;
  const headlineMaxWidth = layout.identityWidth;
  const identityX = layout.identityAnchor === "middle"
    ? layout.identityLeft + layout.identityWidth / 2
    : layout.identityAnchor === "end"
      ? layout.identityLeft + layout.identityWidth
      : layout.identityLeft;
  const identityAnchor = layout.identityAnchor === "start" ? "" : ` text-anchor="${layout.identityAnchor}"`;
  const headline = config.hero.headline
    .map(
      (line, index) =>
        `<text x="${identityX}" y="${layout.headlineY[index]}" class="sans ${index === 2 ? "accent" : "ink"}" font-size="${layout.headlineSize}" font-weight="700" letter-spacing="${layout.headlineSpacing}"${identityAnchor}${textFitAttributes(line, layout.headlineSize, headlineMaxWidth, { letterSpacing: layout.headlineSpacing })}>${escapeXml(line)}</text>`,
    )
    .join("\n");
  const frameClip = config.layout.shapeSystem === "rounded"
    ? `<rect width="${layout.width}" height="${layout.height}" rx="${config.appearance.cornerRadius}"/>`
    : config.layout.shapeSystem === "terminal"
      ? `<rect width="${layout.width}" height="${layout.height}" rx="2"/>`
      : `<path d="${framePath(layout.width, layout.height, config.layout.shapeSystem, 0)}"/>`;
  const outerFrame = config.layout.shapeSystem === "rounded"
    ? `<rect x=".5" y=".5" width="${layout.width - 1}" height="${layout.height - 1}" rx="${config.appearance.cornerRadius}" class="bg line"/>`
    : config.layout.shapeSystem === "terminal"
      ? `<rect x=".5" y=".5" width="${layout.width - 1}" height="${layout.height - 1}" rx="2" class="bg line"/>`
      : `<path d="${framePath(layout.width, layout.height, config.layout.shapeSystem)}" class="bg line"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" fill="none" role="img" lang="${escapeXml(config.accessibility.language)}" dir="${config.accessibility.direction}" aria-labelledby="${titleId} ${descId}" data-template="${config.template.id}" data-composition="${config.layout.composition}" data-shape-system="${config.layout.shapeSystem}" data-density="${config.layout.density}">
  <title id="${titleId}">${escapeXml(config.accessibility.svgTitle || `${config.identity.displayName} | ${config.identity.headerLabel}`)}</title>
  <desc id="${descId}">${escapeXml(config.identity.primaryRole)}. ${escapeXml(config.hero.headline.join(" "))} ${escapeXml(motionDescription)} Decorative demonstration; not live results.</desc>
  <defs>
    ${patternMarkup(config.layout.pattern, patternId, palette)}
    <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect class="typed" width="${commandWidth}" height="30"/></clipPath>
    <clipPath id="${contentClipId}" clipPathUnits="userSpaceOnUse"><rect x="1" y="64" width="${layout.width - 2}" height="${contentHeight}"/></clipPath>
    <clipPath id="${frameClipId}" clipPathUnits="userSpaceOnUse">${frameClip}</clipPath>
  </defs>
  ${styles(config, palette, variant, prefix, commandWidth)}
  ${outerFrame}
  <g clip-path="url(#${frameClipId})">
    <rect x="1" y="64" width="${layout.width - 2}" height="${contentHeight}" class="surface"/>
    <rect x="1" y="64" width="${layout.width - 2}" height="${contentHeight}" fill="url(#${patternId})"/>
  </g>
  ${decorationsMarkup(config, layout, contentClipId, palette)}
  ${compositionPanels(config, layout, palette)}
  ${frameAccents(config.layout.composition, layout, palette)}
  <path d="M1 64H${layout.width - 1}" class="line"/>
  <rect x="30" y="19" width="27" height="27" rx="5" class="soft"/>
  <path d="M36 27l5 5-5 5m9 0h6" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="70" y="38" class="mono ink" font-size="17" font-weight="700"${textFitAttributes(config.identity.brandMark, 17, 50, { mono: true })}>${escapeXml(config.identity.brandMark)}</text>
  <text x="131" y="38" class="mono muted" font-size="13"${textFitAttributes(`/ ${config.identity.headerLabel}`, 13, headerSignalX - 153, { mono: true })}>/ ${escapeXml(config.identity.headerLabel)}</text>
  <circle cx="${headerSignalX}" cy="33" r="4" class="accent signal"/>
  <text x="${profileTextX}" y="38" class="mono muted" font-size="11" text-anchor="end"${textFitAttributes(config.identity.profileLabel, 11, profileTextX - headerSignalX - 14, { mono: true })}>${escapeXml(config.identity.profileLabel)}</text>
  <text x="${identityX}" y="${layout.nameY}" class="mono accent" font-size="${variant.viewport === "mobile" ? 16 : 15}" letter-spacing="${variant.viewport === "mobile" ? 2 : 2.4}"${identityAnchor}${textFitAttributes(config.identity.eyebrow, variant.viewport === "mobile" ? 16 : 15, headlineMaxWidth, { mono: true, letterSpacing: variant.viewport === "mobile" ? 2 : 2.4 })}>${escapeXml(config.identity.eyebrow)}</text>
  ${headline}
  <text x="${identityX}" y="${layout.roleY}" class="sans ink" font-size="${layout.roleSize}"${identityAnchor}${textFitAttributes(config.identity.primaryRole, layout.roleSize, headlineMaxWidth)}>${escapeXml(config.identity.primaryRole)}</text>
  <text x="${identityX}" y="${layout.secondaryRoleY}" class="sans muted" font-size="${layout.secondaryRoleSize}"${identityAnchor}${textFitAttributes(config.identity.secondaryRole, layout.secondaryRoleSize, headlineMaxWidth)}>${escapeXml(config.identity.secondaryRole)}</text>
  ${terminalMarkup(config, layout, palette, commandWidth, clipId)}
  <path d="M30 ${layout.contentDividerY}H${layout.width - 30}" class="line"/>
  ${workflowMarkup(config, layout, palette)}
  <path d="M30 ${layout.footerDividerY}H${layout.width - 30}" class="line"/>
  <text x="30" y="${layout.footerY}" class="mono muted" font-size="${variant.viewport === "mobile" ? 10 : 11}" letter-spacing=".9"${textFitAttributes(config.hero.footerLeft, variant.viewport === "mobile" ? 10 : 11, layout.width / 2 - 48, { mono: true, letterSpacing: 0.9 })}>${escapeXml(config.hero.footerLeft)}</text>
  <text x="${layout.width - 30}" y="${layout.footerY}" class="mono muted" font-size="${variant.viewport === "mobile" ? 9 : 11}" text-anchor="end" letter-spacing=".3"${textFitAttributes(config.hero.footerRight, variant.viewport === "mobile" ? 9 : 11, layout.width / 2 - 48, { mono: true, letterSpacing: 0.3 })}>${escapeXml(config.hero.footerRight)}</text>
</svg>
`;
}
