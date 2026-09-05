const invalidXmlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

export function cleanText(value: string): string {
  const withoutControls = value.replace(invalidXmlCharacters, "");
  let result = "";
  for (let index = 0; index < withoutControls.length; index += 1) {
    const code = withoutControls.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = withoutControls.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += withoutControls.charAt(index) + withoutControls.charAt(index + 1);
        index += 1;
      }
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue;
    result += withoutControls.charAt(index);
  }
  return result.normalize("NFC");
}

export function escapeXml(value: string): string {
  return cleanText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function escapeMarkdownText(value: string): string {
  return cleanText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("*", "\\*")
    .replaceAll("_", "\\_")
    .replaceAll("`", "\\`")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function escapeTableCell(value: string): string {
  return escapeMarkdownText(value).replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");
}

export function inlineCode(value: string): string {
  return `\`${cleanText(value).replaceAll("`", "ˋ")}\``;
}

export function safeHttpsUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Only HTTPS URLs can be generated.");
  }
  return url.toString().replaceAll("(", "%28").replaceAll(")", "%29");
}

function safeMarkdownDestination(value: string): string {
  if (value.startsWith("#")) return value;
  try {
    return safeHttpsUrl(value);
  } catch {
    return "#";
  }
}

function sanitizeInlineDestinations(line: string): string {
  let output = "";
  let cursor = 0;

  while (cursor < line.length) {
    if (line[cursor] === "`") {
      let ticks = 1;
      while (line[cursor + ticks] === "`") ticks += 1;
      const marker = "`".repeat(ticks);
      const closing = line.indexOf(marker, cursor + ticks);
      if (closing === -1) return output + line.slice(cursor);
      output += line.slice(cursor, closing + ticks);
      cursor = closing + ticks;
      continue;
    }

    if (line.startsWith("](", cursor)) {
      output += "](";
      cursor += 2;
      while (line[cursor] === " " || line[cursor] === "\t") {
        output += line[cursor];
        cursor += 1;
      }

      if (line[cursor] === "<") {
        const end = line.indexOf(">", cursor + 1);
        if (end === -1) {
          output += "#";
          continue;
        }
        output += safeMarkdownDestination(line.slice(cursor + 1, end));
        cursor = end + 1;
        continue;
      }

      const start = cursor;
      let nested = 0;
      while (cursor < line.length) {
        const character = line[cursor];
        if ((character === " " || character === "\t") && nested === 0) break;
        if (character === "(") nested += 1;
        if (character === ")") {
          if (nested === 0) break;
          nested -= 1;
        }
        cursor += 1;
      }
      output += safeMarkdownDestination(line.slice(start, cursor));
      continue;
    }

    output += line[cursor];
    cursor += 1;
  }

  return output;
}

function escapeHtmlOutsideInlineCode(line: string): string {
  let output = "";
  let cursor = 0;
  while (cursor < line.length) {
    if (line[cursor] === "`") {
      let ticks = 1;
      while (line[cursor + ticks] === "`") ticks += 1;
      const marker = "`".repeat(ticks);
      const closing = line.indexOf(marker, cursor + ticks);
      if (closing === -1) return output + line.slice(cursor);
      output += line.slice(cursor, closing + ticks);
      cursor = closing + ticks;
      continue;
    }
    const nextCode = line.indexOf("`", cursor);
    const end = nextCode === -1 ? line.length : nextCode;
    output += line.slice(cursor, end).replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    cursor = end;
  }
  return output;
}

export function sanitizeMarkdown(value: string): string {
  const lines = cleanText(value).split(/\r\n|\r|\n/);
  let fence: "`" | "~" | null = null;

  return lines
    .map((line) => {
      const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (fenceMatch) {
        const marker = fenceMatch[1]![0] as "`" | "~";
        if (fence === marker) fence = null;
        else if (fence === null) fence = marker;
        return line;
      }
      if (fence) return line;

      const definition = line.match(/^(\s{0,3}\[[^\]]+\]:\s*)(<[^>]*>|\S+)(.*)$/);
      if (definition) {
        const rawDestination = definition[2]!;
        const destination = rawDestination.startsWith("<") && rawDestination.endsWith(">")
          ? rawDestination.slice(1, -1)
          : rawDestination;
        return escapeHtmlOutsideInlineCode(
          `${definition[1]}${safeMarkdownDestination(destination)}${definition[3]}`,
        );
      }

      return escapeHtmlOutsideInlineCode(sanitizeInlineDestinations(line));
    })
    .join("\n");
}
