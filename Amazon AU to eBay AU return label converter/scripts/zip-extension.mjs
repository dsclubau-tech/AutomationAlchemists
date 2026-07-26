import { ZipArchive } from "archiver";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const extensionDistDir = path.join(projectRoot, "extension", "dist");
const outputDir = path.join(projectRoot, "public", "downloads");

function getExtensionVersion() {
  const manifestPath = path.join(extensionDistDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  return manifest.version;
}

async function zipExtension() {
  if (!fs.existsSync(extensionDistDir)) {
    console.error("extension/dist not found — run build:extension first.");
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const version = getExtensionVersion();
  const versionedName = `cp-bot-extension-v${version}.zip`;
  const latestName = "cp-bot-extension-latest.zip";

  const versionedPath = path.join(outputDir, versionedName);
  const latestPath = path.join(outputDir, latestName);

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(versionedPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(extensionDistDir, false);
    archive.finalize();
  });

  fs.copyFileSync(versionedPath, latestPath);

  // Write a small metadata file the web app can read for version + timestamp
  const metadata = {
    version,
    builtAt: new Date().toISOString(),
    filename: latestName,
  };
  fs.writeFileSync(
    path.join(outputDir, "metadata.json"),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`Zipped extension v${version} -> ${latestName}`);
}

zipExtension().catch((err) => {
  console.error("Failed to zip extension:", err);
  process.exit(1);
});
