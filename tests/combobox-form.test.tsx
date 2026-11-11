// @vitest-environment jsdom
/**
 * Combobox in a form: the selection submits under `name`, and a disabled
 * Combobox submits nothing, like any disabled control.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import * as RadixCombobox from "@/registry/radix/combobox";
import * as BaseCombobox from "@/registry/base/combobox";

afterEach(cleanup);

const items = [
  { value: "tokyo", label: "Tokyo" },
  { value: "paris", label: "Paris" },
];

describe.each([
  ["radix", RadixCombobox],
  ["base", BaseCombobox],
] as const)("%s Combobox", (_name, C) => {
  function submitted(props: { multiple?: boolean; disabled?: boolean }) {
    const { container } = render(
      <form>
        <C.Combobox
          items={items}
          name="city"
          defaultValue={props.multiple ? ["tokyo", "paris"] : "tokyo"}
          {...props}
        >
          <C.ComboboxInput />
        </C.Combobox>
      </form>
    );
    return new FormData(container.querySelector("form")!).getAll("city");
  }

  it.each([false, true])("multiple: %s", (multiple) => {
    expect(submitted({ multiple })).toEqual(multiple ? ["tokyo", "paris"] : ["tokyo"]);
    cleanup();
    expect(submitted({ multiple, disabled: true })).toEqual([]);
  });
});
