import { describe, it, expect, vi } from "vitest";
import { initLightbox } from "./lightbox";

describe("lightbox helper", () => {
  it("init calls P.init and registers events", () => {
    const init = vi.fn();
    const on = vi.fn();
    (global as any).window = {
      P: { init, on }
    };
    initLightbox("https://checkout-test.placetopay.com/session/1", { backupTarget: "self" }, {
      response: () => {},
      close: () => {}
    });
    expect(init).toHaveBeenCalled();
    expect(on).toHaveBeenCalledWith("response", expect.any(Function));
    expect(on).toHaveBeenCalledWith("close", expect.any(Function));
  });
});
