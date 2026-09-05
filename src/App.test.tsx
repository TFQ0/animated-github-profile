import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { cloneDefaultConfig } from "./domain/profile";

describe("Profile Studio workspace", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(<App />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("uses simple step navigation and labels the focused inspector", () => {
    const navigation = container.querySelector<HTMLElement>(".step-rail")!;
    const profileStep = container.querySelector<HTMLButtonElement>("#step-profile")!;

    expect(navigation.getAttribute("aria-label")).toBe("Profile builder steps");
    expect(navigation.querySelector("[role='tab']")).toBeNull();
    expect(container.querySelector("#step-design")?.getAttribute("aria-current")).toBe("step");

    act(() => profileStep.click());

    expect(profileStep.getAttribute("aria-current")).toBe("step");
    expect(container.querySelector("#editor-heading")?.textContent).toBe("Profile");
    expect(container.querySelector("#panel-profile")?.getAttribute("aria-labelledby")).toBe(
      "editor-heading",
    );
  });

  it("keeps edit and preview panes connected to the responsive switch", () => {
    const previewSwitch = Array.from(container.querySelectorAll<HTMLButtonElement>(".mobile-view-switch button"))
      .find((button) => button.textContent === "Preview")!;

    expect(previewSwitch.getAttribute("aria-controls")).toBe("preview-pane");
    act(() => previewSwitch.click());

    expect(previewSwitch.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("main")?.classList.contains("mobile-pane-preview")).toBe(true);
    expect(container.querySelector("#preview-pane")?.getAttribute("aria-labelledby")).toBe(
      "preview-heading",
    );
  });

  it("applies seven content-safe presets, customizes layout, and grows a six-step workflow", () => {
    const presetCards = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".preset-card"),
    );
    expect(presetCards).toHaveLength(7);
    expect(presetCards.map((card) => card.querySelector("strong")?.textContent)).toEqual([
      "Quality Control",
      "Classic Terminal",
      "Retro Arcade",
      "Anime HUD",
      "Bento Grid",
      "Signal Poster",
      "Custom Canvas",
    ]);
    expect(container.querySelector(".generated-hero")?.textContent).toContain("FICTIONAL SAMPLE");

    const bento = presetCards.find((card) => card.textContent?.includes("Bento Grid"))!;
    act(() => bento.click());

    expect(bento.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector(".generated-hero")?.textContent).toContain("FICTIONAL SAMPLE");
    expect(container.querySelector(".generated-hero svg")?.getAttribute("data-composition")).toBe(
      "bento",
    );

    const compositionLabel = Array.from(container.querySelectorAll("label")).find(
      (label) => label.querySelector(".field-label-row > span")?.textContent === "Composition",
    )!;
    const composition = compositionLabel.querySelector("select")!;
    act(() => {
      composition.value = "poster";
      composition.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(composition.value).toBe("poster");
    expect(bento.getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelector(".generated-hero svg")?.getAttribute("data-composition")).toBe(
      "poster",
    );

    act(() => container.querySelector<HTMLButtonElement>("#step-hero")!.click());
    const workflowCard = Array.from(container.querySelectorAll<HTMLElement>(".editor-card")).find(
      (card) => card.querySelector("h3")?.textContent === "Workflow",
    )!;
    for (let count = 4; count < 6; count += 1) {
      const addStep = Array.from(workflowCard.querySelectorAll<HTMLButtonElement>("button")).find(
        (button) => button.textContent?.trim() === "Add step",
      )!;
      act(() => addStep.click());
    }

    expect(workflowCard.querySelector(".list-heading span")?.textContent).toBe("6/6");
    expect(workflowCard.querySelectorAll("input[maxlength='12']")).toHaveLength(6);
    expect(
      Array.from(workflowCard.querySelectorAll("button")).some(
        (button) => button.textContent?.trim() === "Add step",
      ),
    ).toBe(false);
  });

  it("bundles a clearly fictional sample with reserved example links", () => {
    const sample = cloneDefaultConfig();

    expect(sample.identity).toMatchObject({
      username: "sample-builder",
      displayName: "Sample Builder",
      eyebrow: "FICTIONAL SAMPLE",
    });
    expect(sample.about.paragraphs.join(" ")).toContain("fictional profile");
    expect([...sample.repositories, ...sample.links].every(({ url }) => {
      return new URL(url).hostname === "example.com";
    })).toBe(true);
  });

  it("preserves an unrelated saved profile draft", () => {
    act(() => root.unmount());
    const saved = cloneDefaultConfig();
    saved.identity.username = "saved-user";
    saved.identity.displayName = "Saved User";
    saved.identity.eyebrow = "SAVED DRAFT";
    saved.identity.brandMark = "SAVE";
    localStorage.setItem("animated-profile-studio:config:v3", JSON.stringify(saved));

    root = createRoot(container);
    act(() => root.render(<App />));

    expect(container.querySelector(".generated-hero")?.textContent).toContain("SAVED DRAFT");
  });
});
