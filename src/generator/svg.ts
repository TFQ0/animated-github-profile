import type {
  FontId,
  Palette,
  ProfileConfig,
  TemplateId,
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
  nameX: number;
  nameY: number;
  headlineX: number;
  headlineY: [number, number, number];
  headlineSize: number;
  headlineSpacing: number;
  roleX: number;
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
  footerDividerY: number;
  footerY: number;
}

const layouts: Record<HeroViewport, Layout> = {
  desktop: {
    width: 1200,
    height: 610,
    nameX: 42,
    nameY: 129,
    headlineX: 38,
    headlineY: [206, 275, 344],
    headlineSize: 64,
    headlineSpacing: -2.9,
    roleX: 42,
    roleY: 397,
    roleSize: 21,
    secondaryRoleY: 427,
    secondaryRoleSize: 17,
    terminalX: 632,
    terminalY: 112,
    terminalWidth: 528,
    terminalHeight: 342,
    commandSize: 16,
    commandCharWidth: 9.6,
    checkSize: 16,
    workflowY: 513,
    workflowStartX: 232,
    workflowEndX: 997,
    workflowLabelY: 551,
    footerDividerY: 567,
    footerY: 592,
  },
  mobile: {
    width: 620,
    height: 930,
    nameX: 30,
    nameY: 113,
    headlineX: 28,
    headlineY: [181, 244, 307],
    headlineSize: 60,
    headlineSpacing: -2.7,
    roleX: 30,
    roleY: 352,
    roleSize: 21,
    secondaryRoleY: 382,
    secondaryRoleSize: 18,
    terminalX: 30,
    terminalY: 415,
    terminalWidth: 560,
    terminalHeight: 342,
    commandSize: 18,
    commandCharWidth: 10.8,
    checkSize: 18,
    workflowY: 811,
    workflowStartX: 58,
    workflowEndX: 562,
    workflowLabelY: 849,
    footerDividerY: 887,
    footerY: 912,
  },
};

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

function patternMarkup(templateId: TemplateId, id: string, palette: Palette): string {
  switch (templateId) {
    case "classic-terminal":
      return `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 17.5H18" stroke="${palette.line}" opacity=".2"/></pattern>`;
    case "retro-arcade":
      return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 .5H8M.5 0V8" stroke="${palette.muted}" stroke-width=".5" opacity=".13"/></pattern>`;
    case "anime-hud":
      return `<pattern id="${id}" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M0 .5H32M.5 0V32" stroke="${palette.line}" opacity=".2"/><path d="M24 0l8 8M0 24l8 8" stroke="${palette.accent}" opacity=".1"/></pattern>`;
    case "quality-control":
      return `<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="${palette.muted}" opacity=".12"/></pattern>`;
  }
}

function frameAccents(templateId: TemplateId, layout: Layout, palette: Palette): string {
  switch (templateId) {
    case "classic-terminal":
      return `<path d="M18 78V94M18 78H34M${layout.width - 18} 78V94M${layout.width - 18} 78H${layout.width - 34}" stroke="${palette.accent}" opacity=".55"/>`;
    case "retro-arcade":
      return `<path d="M14 78h34M14 78v34M${layout.width - 14} 78h-34M${layout.width - 14} 78v34" stroke="${palette.accent}" stroke-width="3"/><path d="M14 ${layout.footerDividerY - 14}h22M${layout.width - 14} ${layout.footerDividerY - 14}h-22" stroke="${palette.accent}" stroke-width="3"/>`;
    case "anime-hud":
      return `<g fill="none" stroke="${palette.accent}"><path d="M18 92h78l18-18h92" opacity=".72"/><path d="M${layout.width - 18} ${layout.footerDividerY - 22}h-92l-18 18h-78" opacity=".5"/><path d="M${layout.width - 104} 76l34 0 16 16" stroke-width="2"/></g><g fill="${palette.accent}"><circle cx="92" cy="92" r="3"/><circle cx="${layout.width - 104}" cy="${layout.footerDividerY - 22}" r="3"/></g>`;
    case "quality-control":
      return "";
  }
}

function terminalRadius(templateId: TemplateId): number {
  if (templateId === "retro-arcade") return 2;
  if (templateId === "classic-terminal") return 6;
  if (templateId === "anime-hud") return 16;
  return 12;
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
  const checkRows = config.hero.checks
    .map((label, index) => {
      const item = index + 1;
      const y = 135 + index * 41;
      return `<text x="21" y="${y}" class="mono muted" font-size="12">${String(item).padStart(2, "0")}</text>
<text x="58" y="${y}" class="mono ink" font-size="${layout.checkSize}"${textFitAttributes(label, layout.checkSize, checkMarkX - 76, { mono: true })}>${escapeXml(label)}</text>
<text x="${statusEnd}" y="${y}" class="mono muted pending wait-${item}" font-size="12" text-anchor="end"${textFitAttributes(config.hero.labels.queued, 12, 58, { mono: true })}>${escapeXml(config.hero.labels.queued.toUpperCase())}</text>
<text x="${statusEnd}" y="${y}" class="mono accent running run-${item}" font-size="12" text-anchor="end"${textFitAttributes(config.hero.labels.running, 12, 58, { mono: true })}>${escapeXml(config.hero.labels.running.toUpperCase())}</text>
<g class="pass pass-${item}"><path d="M${checkMarkX} ${y - 6}l4 4 8-9" stroke="${palette.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="${statusEnd}" y="${y}" class="mono accent" font-size="13" text-anchor="end"${textFitAttributes(config.hero.labels.passed, 13, 48, { mono: true })}>${escapeXml(config.hero.labels.passed.toUpperCase())}</text></g>
<path d="M58 ${y + 12}H${layout.terminalWidth - 22}" stroke="${palette.line}" stroke-width="1"/>
<g transform="translate(58 ${y + 12})"><rect width="${railWidth}" height="1" class="accent rail-${item}" style="transform-origin:0 0"/></g>`;
    })
    .join("\n");

  return `<g transform="translate(${layout.terminalX} ${layout.terminalY})">
<rect width="${layout.terminalWidth}" height="${layout.terminalHeight}" rx="${terminalRadius(config.template.id)}" class="inner line"/>
<path d="M0 43H${layout.terminalWidth}" class="line"/>
<circle cx="21" cy="22" r="4" fill="${palette.muted}" opacity=".9"/>
<circle cx="36" cy="22" r="4" fill="${palette.muted}" opacity=".68"/>
<circle cx="51" cy="22" r="4" fill="${palette.muted}" opacity=".46"/>
<text x="79" y="27" class="mono muted" font-size="13"${textFitAttributes(`${config.identity.username}@${config.hero.labels.host}:~`, 13, statusEnd - 180, { mono: true })}>${escapeXml(config.identity.username.toLowerCase())}@${escapeXml(config.hero.labels.host.toLowerCase())}:~</text>
<text x="${statusEnd}" y="27" class="mono muted" font-size="11" text-anchor="end" letter-spacing=".5"${textFitAttributes(config.hero.labels.demoRun, 11, 92, { mono: true, letterSpacing: 0.5 })}>${escapeXml(config.hero.labels.demoRun.toUpperCase())}</text>
<text x="21" y="84" class="mono accent" font-size="${layout.commandSize}">$</text>
<g transform="translate(46 63)"><g clip-path="url(#${clipId})"><text x="0" y="21" class="mono ink" font-size="${layout.commandSize}">${escapeXml(config.hero.command)}</text></g><g class="type-cursor"><rect x="0" y="5" width="${layout.commandCharWidth}" height="20" class="accent caret"/></g></g>
${checkRows}
<path d="M0 298H${layout.terminalWidth}" class="line"/>
<g class="complete"><text x="22" y="325" class="mono accent" font-size="17">↳</text><text x="47" y="325" class="mono accent" font-size="13"${textFitAttributes(config.hero.completionMessage, 13, layout.terminalWidth - 72, { mono: true })}>${escapeXml(config.hero.completionMessage)}</text></g>
<g class="boot-label"><text x="22" y="325" class="mono muted" font-size="17">↳</text><text x="47" y="325" class="mono muted" font-size="13"${textFitAttributes(config.hero.idleMessage, 13, layout.terminalWidth - 72, { mono: true })}>${escapeXml(config.hero.idleMessage)}</text></g>
</g>`;
}

function workflowMarkup(config: ProfileConfig, layout: Layout, palette: Palette): string {
  const labels = config.hero.workflow;
  const width = layout.workflowEndX - layout.workflowStartX;
  const positions = labels.map((_, index) =>
    labels.length === 1
      ? layout.workflowStartX
      : layout.workflowStartX + (width * index) / (labels.length - 1),
  );
  const steps = labels
    .map((label, index) => {
      const x = positions[index] ?? layout.workflowStartX;
      return `<circle cx="${x}" cy="${layout.workflowY}" r="13" class="bg line"/>
<text x="${x}" y="${layout.workflowY + 4}" class="mono accent" font-size="11" text-anchor="middle">${index + 1}</text>
<text x="${x}" y="${layout.workflowLabelY}" class="mono ink" font-size="${layout.width === 620 ? 14 : 12}" text-anchor="middle" letter-spacing="1.2"${textFitAttributes(label, layout.width === 620 ? 14 : 12, Math.max(72, width / Math.max(1, labels.length - 1) - 28), { mono: true, letterSpacing: 1.2 })}>${escapeXml(label.toUpperCase())}</text>`;
    })
    .join("\n");
  const label =
    layout.width === 1200
      ? `<text x="42" y="518" class="mono muted" font-size="12" letter-spacing="1"${textFitAttributes(config.hero.labels.workflow, 12, 155, { mono: true, letterSpacing: 1 })}>${escapeXml(config.hero.labels.workflow.toUpperCase())}</text>`
      : "";
  return `${label}
<path d="M${layout.workflowStartX} ${layout.workflowY}H${layout.workflowEndX}" stroke="${palette.line}" stroke-width="1.5"/>
<path d="M${layout.workflowStartX} ${layout.workflowY}H${layout.workflowEndX}" stroke="${palette.accent}" stroke-width="2" stroke-dasharray="60 940" pathLength="1000" class="trail"/>
${steps}`;
}

export function renderHeroSvg(config: ProfileConfig, variant: HeroVariant): string {
  const layout = layouts[variant.viewport];
  const palette = config.appearance[variant.theme];
  const prefix = `profile-${variant.theme}-${variant.viewport}`;
  const patternId = `${prefix}-grid`;
  const clipId = `${prefix}-command`;
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
  const headlineMaxWidth = variant.viewport === "desktop"
    ? layout.terminalX - layout.headlineX - 42
    : layout.width - layout.headlineX - 28;
  const headline = config.hero.headline
    .map(
      (line, index) =>
        `<text x="${layout.headlineX}" y="${layout.headlineY[index]}" class="sans ${index === 2 ? "accent" : "ink"}" font-size="${layout.headlineSize}" font-weight="700" letter-spacing="${layout.headlineSpacing}"${textFitAttributes(line, layout.headlineSize, headlineMaxWidth, { letterSpacing: layout.headlineSpacing })}>${escapeXml(line)}</text>`,
    )
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" fill="none" role="img" lang="${escapeXml(config.accessibility.language)}" dir="${config.accessibility.direction}" aria-labelledby="${titleId} ${descId}">
  <title id="${titleId}">${escapeXml(config.accessibility.svgTitle || `${config.identity.displayName} | ${config.identity.headerLabel}`)}</title>
  <desc id="${descId}">${escapeXml(config.identity.primaryRole)}. ${escapeXml(config.hero.headline.join(" "))} ${escapeXml(motionDescription)} Decorative demonstration; not live results.</desc>
  <defs>
    ${patternMarkup(config.template.id, patternId, palette)}
    <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect class="typed" width="${commandWidth}" height="30"/></clipPath>
  </defs>
  ${styles(config, palette, variant, prefix, commandWidth)}
  <rect x=".5" y=".5" width="${layout.width - 1}" height="${layout.height - 1}" rx="${config.appearance.cornerRadius}" class="bg line"/>
  <rect x="1" y="64" width="${layout.width - 2}" height="${contentHeight}" class="surface"/>
  <rect x="1" y="64" width="${layout.width - 2}" height="${contentHeight}" fill="url(#${patternId})"/>
  ${frameAccents(config.template.id, layout, palette)}
  <path d="M1 64H${layout.width - 1}" class="line"/>
  <rect x="30" y="19" width="27" height="27" rx="5" class="soft"/>
  <path d="M36 27l5 5-5 5m9 0h6" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="70" y="38" class="mono ink" font-size="17" font-weight="700"${textFitAttributes(config.identity.brandMark, 17, 50, { mono: true })}>${escapeXml(config.identity.brandMark)}</text>
  <text x="131" y="38" class="mono muted" font-size="13"${textFitAttributes(`/ ${config.identity.headerLabel}`, 13, headerSignalX - 153, { mono: true })}>/ ${escapeXml(config.identity.headerLabel)}</text>
  <circle cx="${headerSignalX}" cy="33" r="4" class="accent signal"/>
  <text x="${profileTextX}" y="38" class="mono muted" font-size="11" text-anchor="end"${textFitAttributes(config.identity.profileLabel, 11, profileTextX - headerSignalX - 14, { mono: true })}>${escapeXml(config.identity.profileLabel)}</text>
  <text x="${layout.nameX}" y="${layout.nameY}" class="mono accent" font-size="${variant.viewport === "mobile" ? 16 : 15}" letter-spacing="${variant.viewport === "mobile" ? 2 : 2.4}"${textFitAttributes(config.identity.eyebrow, variant.viewport === "mobile" ? 16 : 15, headlineMaxWidth, { mono: true, letterSpacing: variant.viewport === "mobile" ? 2 : 2.4 })}>${escapeXml(config.identity.eyebrow)}</text>
  ${headline}
  <text x="${layout.roleX}" y="${layout.roleY}" class="sans ink" font-size="${layout.roleSize}"${textFitAttributes(config.identity.primaryRole, layout.roleSize, headlineMaxWidth)}>${escapeXml(config.identity.primaryRole)}</text>
  <text x="${layout.roleX}" y="${layout.secondaryRoleY}" class="sans muted" font-size="${layout.secondaryRoleSize}"${textFitAttributes(config.identity.secondaryRole, layout.secondaryRoleSize, headlineMaxWidth)}>${escapeXml(config.identity.secondaryRole)}</text>
  ${terminalMarkup(config, layout, palette, commandWidth, clipId)}
  <path d="M30 ${variant.viewport === "desktop" ? 477 : 775}H${layout.width - 30}" class="line"/>
  ${workflowMarkup(config, layout, palette)}
  <path d="M30 ${layout.footerDividerY}H${layout.width - 30}" class="line"/>
  <text x="30" y="${layout.footerY}" class="mono muted" font-size="${variant.viewport === "mobile" ? 10 : 11}" letter-spacing=".9"${textFitAttributes(config.hero.footerLeft, variant.viewport === "mobile" ? 10 : 11, layout.width / 2 - 48, { mono: true, letterSpacing: 0.9 })}>${escapeXml(config.hero.footerLeft.toUpperCase())}</text>
  <text x="${layout.width - 30}" y="${layout.footerY}" class="mono muted" font-size="${variant.viewport === "mobile" ? 9 : 11}" text-anchor="end" letter-spacing=".3"${textFitAttributes(config.hero.footerRight, variant.viewport === "mobile" ? 9 : 11, layout.width / 2 - 48, { mono: true, letterSpacing: 0.3 })}>${escapeXml(config.hero.footerRight.toUpperCase())}</text>
</svg>
`;
}
