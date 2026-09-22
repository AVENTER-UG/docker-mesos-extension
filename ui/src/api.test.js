import { buildBasicAuthHeader, fetchJson } from "./api";

describe("ClusterD API client", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("builds a Basic authorization header without persisting credentials", () => {
    expect(buildBasicAuthHeader("mesos", "test")).toBe("Basic bWVzb3M6dGVzdA==");
  });

  test("sends authenticated same-origin requests", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ cluster: "devtest" }),
    });

    await expect(fetchJson("/master/state-summary", "Basic token")).resolves.toEqual({
      cluster: "devtest",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/master/state-summary",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Basic token" }),
      }),
    );
  });

  test("turns rejected credentials into a useful authentication error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "",
    });

    await expect(fetchJson("/master/state-summary", "Basic bad")).rejects.toMatchObject({
      status: 401,
      message: "Authentication failed",
    });
  });
});
