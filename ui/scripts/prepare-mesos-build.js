const fs = require("fs");
const path = require("path");

function prepareMesosBuild(buildDir = path.join(__dirname, "..", "build")) {
  const staticDir = path.join(buildDir, "static");
  const appDir = path.join(buildDir, "app");
  const appStaticDir = path.join(appDir, "static");

  if (!fs.statSync(staticDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Expected CRA assets at ${staticDir}`);
  }

  fs.mkdirSync(appDir, { recursive: true });
  fs.rmSync(appStaticDir, { recursive: true, force: true });
  fs.renameSync(staticDir, appStaticDir);
}

if (require.main === module) {
  try {
    prepareMesosBuild();
    console.log("Prepared Mesos WebUI assets under build/app/static.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { prepareMesosBuild };
