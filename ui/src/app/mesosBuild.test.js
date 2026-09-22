const fs = require("fs");
const os = require("os");
const path = require("path");
const { prepareMesosBuild } = require("../../scripts/prepare-mesos-build");

describe("Mesos production build layout", () => {
  let buildDir;

  beforeEach(() => {
    buildDir = fs.mkdtempSync(path.join(os.tmpdir(), "clusterd-webui-build-"));
  });

  afterEach(() => {
    fs.rmSync(buildDir, { recursive: true, force: true });
  });

  test("uses the Mesos /app route only for production builds", () => {
    const productionEnvironment = fs.readFileSync(
      path.join(__dirname, "..", "..", ".env.production"),
      "utf8",
    );
    expect(productionEnvironment.trim()).toBe("PUBLIC_URL=/app");
  });

  test("moves nested CRA assets below the Mesos /app route", () => {
    const source = path.join(buildDir, "static", "js");
    const stale = path.join(buildDir, "app", "static");
    fs.mkdirSync(source, { recursive: true });
    fs.mkdirSync(stale, { recursive: true });
    fs.writeFileSync(path.join(source, "main.js"), "production bundle");
    fs.writeFileSync(path.join(stale, "stale.js"), "stale bundle");

    prepareMesosBuild(buildDir);

    expect(fs.readFileSync(path.join(buildDir, "app", "static", "js", "main.js"), "utf8"))
      .toBe("production bundle");
    expect(fs.existsSync(path.join(buildDir, "app", "static", "stale.js"))).toBe(false);
    expect(fs.existsSync(path.join(buildDir, "static"))).toBe(false);
  });

  test("fails when CRA did not create a static asset directory", () => {
    expect(() => prepareMesosBuild(buildDir)).toThrow(/Expected CRA assets/);
  });
});
