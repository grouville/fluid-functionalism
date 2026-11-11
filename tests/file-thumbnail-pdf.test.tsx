// @vitest-environment jsdom
/**
 * FileThumbnail PDFs: a failed render doesn't keep the previous file's
 * preview on screen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

const pdfjs = vi.hoisted(() => ({
  version: "9.9.9",
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(),
}));
vi.mock("pdfjs-dist", () => pdfjs);

import { FileThumbnail } from "@/registry/default/file-thumbnail";

function mockTask(fails = false) {
  const page = {
    getViewport: ({ scale }: { scale: number }) => ({ width: 100 * scale, height: 100 * scale }),
    render: () => ({ promise: Promise.resolve() }),
  };
  const promise = fails
    ? Promise.reject(new Error("load"))
    : Promise.resolve({ getPage: () => Promise.resolve(page) });
  promise.catch(() => {});
  return { promise, destroy: () => Promise.resolve() };
}

function pdfFile(name: string) {
  const file = new File(["%PDF"], name, { type: "application/pdf" });
  file.arrayBuffer = () => Promise.resolve(new ArrayBuffer(4));
  return file;
}

beforeEach(() => {
  pdfjs.getDocument.mockReset();
  HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,";
});
afterEach(cleanup);

describe("FileThumbnail", () => {
  it("drops the previous preview when the next PDF fails", async () => {
    pdfjs.getDocument.mockReturnValueOnce(mockTask());
    const { container, rerender, getByRole } = render(
      <FileThumbnail file={pdfFile("a.pdf")} size={48} />
    );
    await waitFor(() => expect(container.querySelector("img")).not.toBeNull());

    pdfjs.getDocument.mockReturnValueOnce(mockTask(true));
    rerender(<FileThumbnail file={pdfFile("b.pdf")} size={48} />);
    await waitFor(() => expect(getByRole("img", { name: "b.pdf" }).tagName).toBe("DIV"));
  });
});
