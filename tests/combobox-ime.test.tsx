// @vitest-environment jsdom
/**
 * Keys inside an IME composition belong to the composer: Enter commits the
 * candidate, it doesn't pick a Combobox row. Browsers send keyCode 229 while
 * composing, and Safari after compositionend too.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import * as RadixCombobox from "@/registry/radix/combobox";
import * as BaseCombobox from "@/registry/base/combobox";

afterEach(cleanup);

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};
window.matchMedia ??= ((query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList) as typeof window.matchMedia;

const composing = [
  ["during composition", { isComposing: true, keyCode: 229 }],
  ["after compositionend", { keyCode: 229 }],
] as const;

describe.each([
  ["radix", RadixCombobox],
  ["base", BaseCombobox],
] as const)("%s Combobox", (_name, C) => {
  async function open(onValueChange: (v: unknown) => void) {
    const { getByRole, findByRole } = render(
      <C.Combobox items={[{ value: "tokyo", label: "東京" }]} onValueChange={onValueChange}>
        <C.ComboboxInput />
        <C.ComboboxContent>
          <C.ComboboxList>
            {(item: string | { value: string; label: string }) =>
              typeof item === "string" ? null : (
                <C.ComboboxItem key={item.value} value={item.value}>
                  {item.label}
                </C.ComboboxItem>
              )}
          </C.ComboboxList>
        </C.ComboboxContent>
      </C.Combobox>
    );
    const input = getByRole("combobox");
    await act(async () => {
      input.focus();
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.change(input, { target: { value: "東" } });
    });
    await findByRole("option", { name: "東京" });
    return input;
  }

  it.each(composing)("Enter %s keeps the selection", async (_label, init) => {
    const onValueChange = vi.fn();
    const input = await open(onValueChange);
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", ...init });
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("plain Enter still selects", async () => {
    const onValueChange = vi.fn();
    const input = await open(onValueChange);
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(onValueChange).toHaveBeenCalledWith("tokyo");
  });
});
