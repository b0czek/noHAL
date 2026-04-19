import { describe, expect, it, vi } from "vitest";
import { handleRotateShortcut } from "./useEditorShortcuts";

function createKeyboardEvent(
  overrides: Partial<KeyboardEvent> & { key?: string } = {},
): KeyboardEvent {
  return {
    key: "r",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    target: null,
    preventDefault: vi.fn(),
    ...overrides,
  } as KeyboardEvent;
}

describe("useEditorShortcuts", () => {
  it("rotates the current eligible selection when pressing r", () => {
    const evt = createKeyboardEvent();
    const actions = {
      rotateSelectionClockwise: vi.fn(() => true),
    };

    expect(handleRotateShortcut(evt, actions as never)).toBe(true);
    expect(actions.rotateSelectionClockwise).toHaveBeenCalledTimes(1);
    expect(evt.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("ignores r when there is no eligible selection to rotate", () => {
    const evt = createKeyboardEvent();
    const actions = {
      rotateSelectionClockwise: vi.fn(() => false),
    };

    expect(handleRotateShortcut(evt, actions as never)).toBe(false);
    expect(actions.rotateSelectionClockwise).toHaveBeenCalledTimes(1);
    expect(evt.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores r when a primary modifier is pressed", () => {
    const evt = createKeyboardEvent({ ctrlKey: true });
    const actions = {
      rotateSelectionClockwise: vi.fn(() => true),
    };

    expect(handleRotateShortcut(evt, actions as never)).toBe(false);
    expect(actions.rotateSelectionClockwise).not.toHaveBeenCalled();
    expect(evt.preventDefault).not.toHaveBeenCalled();
  });
});
