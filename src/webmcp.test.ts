import { afterEach, describe, expect, it, vi } from "vitest";
import { cloneDefaultConfig } from "./domain/profile";
import { registerProfileWebMcpTools, type WebMcpTool } from "./webmcp";

afterEach(() => {
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: undefined,
  });
});

describe("Profile Studio WebMCP contract", () => {
  it("registers read and stage tools against the same draft actions", async () => {
    const tools = new Map<string, WebMcpTool>();
    const signals: AbortSignal[] = [];
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }) {
          tools.set(tool.name, tool);
          if (options?.signal) signals.push(options.signal);
        },
      },
    });
    const current = cloneDefaultConfig();
    const stageConfig = vi.fn();
    const cleanup = registerProfileWebMcpTools({
      readDraft: () => ({ config: current, valid: true, issues: [], generatedFiles: ["README.md"] }),
      stageConfig,
    });

    expect([...tools.keys()]).toEqual(["read_profile_draft", "stage_profile_configuration"]);
    expect(tools.get("read_profile_draft")?.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: true,
    });
    expect(await tools.get("read_profile_draft")?.execute({})).toMatchObject({
      valid: true,
      config: current,
    });

    const next = cloneDefaultConfig();
    next.identity.username = "octocat";
    await expect(
      tools.get("stage_profile_configuration")?.execute({ config: next }),
    ).resolves.toMatchObject({ status: "staged", username: "octocat" });
    expect(stageConfig).toHaveBeenCalledWith(next);

    cleanup?.();
    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it("rejects invalid staged configuration without changing state", async () => {
    const tools = new Map<string, WebMcpTool>();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool: WebMcpTool) {
          tools.set(tool.name, tool);
        },
      },
    });
    const stageConfig = vi.fn();
    registerProfileWebMcpTools({
      readDraft: () => ({
        config: cloneDefaultConfig(),
        valid: true,
        issues: [],
        generatedFiles: [],
      }),
      stageConfig,
    });

    await expect(
      tools.get("stage_profile_configuration")?.execute({ config: { schemaVersion: 999 } }),
    ).rejects.toBeInstanceOf(Error);
    expect(stageConfig).not.toHaveBeenCalled();
  });
});
