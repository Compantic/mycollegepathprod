import {
  RateLimitError,
  ServiceUnavailableError,
  getApiErrorStatus,
} from "@/lib/errors/api";

describe("RateLimitError", () => {
  it("sets name and statusCode", () => {
    const err = new RateLimitError("Slow down", 429);
    expect(err.name).toBe("RateLimitError");
    expect(err.statusCode).toBe(429);
    expect(err.message).toBe("Slow down");
  });
});

describe("ServiceUnavailableError", () => {
  it("sets name and statusCode", () => {
    const err = new ServiceUnavailableError("Down", 503);
    expect(err.name).toBe("ServiceUnavailableError");
    expect(err.statusCode).toBe(503);
  });
});

describe("getApiErrorStatus", () => {
  it("returns statusCode for RateLimitError", () => {
    expect(getApiErrorStatus(new RateLimitError("x", 429))).toBe(429);
  });

  it("returns statusCode for ServiceUnavailableError", () => {
    expect(getApiErrorStatus(new ServiceUnavailableError("x", 503))).toBe(503);
  });

  it("returns null for generic Error", () => {
    expect(getApiErrorStatus(new Error("unknown"))).toBe(null);
  });
});
