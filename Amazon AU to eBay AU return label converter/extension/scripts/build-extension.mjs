import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const extensionDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(extensionDir, "..");
const distDir = path.join(extensionDir, "dist");

function parseEnv(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .reduce((env, line) => {
      const index = line.indexOf("=");
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = value;
      return env;
    }, {});
}

async function readEnvFile(filePath) {
  try {
    return parseEnv(await readFile(filePath, "utf8"));
  } catch {
    return {};
  }
}

const localEnv = await readEnvFile(path.join(repoRoot, ".env.local"));
const exampleEnv = await readEnvFile(path.join(repoRoot, ".env.example"));
const env = {
  ...exampleEnv,
  ...localEnv,
  ...process.env,
};

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const webAppUrl = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const isProdBuild = env.VERCEL === "1" || env.CP_BOT_BUILD_MODE === "production";

await rm(distDir, { recursive: true, force: true });
await mkdir(path.join(distDir, "background"), { recursive: true });
await mkdir(path.join(distDir, "content-scripts"), { recursive: true });
await mkdir(path.join(distDir, "popup"), { recursive: true });
await mkdir(path.join(distDir, "icons"), { recursive: true });

// --- Manifest: strip localhost entries for production builds ---
if (isProdBuild) {
  const manifest = JSON.parse(await readFile(path.join(extensionDir, "manifest.json"), "utf8"));

  // Remove localhost from host_permissions
  if (Array.isArray(manifest.host_permissions)) {
    manifest.host_permissions = manifest.host_permissions.filter(
      (hp) => !hp.includes("localhost")
    );
  }

  // Remove localhost from each content_scripts[].matches and drop empty entries
  if (Array.isArray(manifest.content_scripts)) {
    manifest.content_scripts = manifest.content_scripts
      .map((cs) => ({
        ...cs,
        matches: Array.isArray(cs.matches)
          ? cs.matches.filter((m) => !m.includes("localhost"))
          : cs.matches,
      }))
      .filter((cs) => Array.isArray(cs.matches) && cs.matches.length > 0);
  }

  await writeFile(path.join(distDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log("Production build: stripped localhost entries from manifest.json");
} else {
  await copyFile(path.join(extensionDir, "manifest.json"), path.join(distDir, "manifest.json"));
}
await copyFile(path.join(extensionDir, "popup", "popup.html"), path.join(distDir, "popup", "popup.html"));
for (const size of [16, 32, 48, 128]) {
  await copyFile(path.join(extensionDir, "icons", `icon-${size}.png`), path.join(distDir, "icons", `icon-${size}.png`));
}
await copyFile(path.join(extensionDir, "icons", "logo-38.png"), path.join(distDir, "icons", "logo-38.png"));

const common = {
  bundle: true,
  target: ["chrome120"],
  platform: "browser",
  sourcemap: true,
  legalComments: "none",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(supabaseUrl),
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
    "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseAnonKey),
    "process.env.NEXT_PUBLIC_SITE_URL": JSON.stringify(webAppUrl),
    "__CP_BOT_DEBUG__": JSON.stringify(!isProdBuild),
    global: "globalThis"
  },
  logLevel: "info",
};

await Promise.all([
  build({
    ...common,
    entryPoints: [path.join(extensionDir, "background", "service-worker.ts")],
    outfile: path.join(distDir, "background", "service-worker.js"),
    format: "esm",
  }),
  build({
    ...common,
    entryPoints: [path.join(extensionDir, "content-scripts", "ebay-scraper.ts")],
    outfile: path.join(distDir, "content-scripts", "ebay-scraper.js"),
    format: "iife",
  }),
  build({
    ...common,
    entryPoints: [path.join(extensionDir, "content-scripts", "amazon-autofill.ts")],
    outfile: path.join(distDir, "content-scripts", "amazon-autofill.js"),
    format: "iife",
  }),
  build({
    ...common,
    entryPoints: [path.join(extensionDir, "content-scripts", "amazon-account-check.ts")],
    outfile: path.join(distDir, "content-scripts", "amazon-account-check.js"),
    format: "iife",
  }),
  build({
    ...common,
    entryPoints: [path.join(extensionDir, "content-scripts", "webapp-bridge.ts")],
    outfile: path.join(distDir, "content-scripts", "webapp-bridge.js"),
    format: "iife",
  }),
  build({
    ...common,
    entryPoints: [path.join(extensionDir, "content-scripts", "inject.ts")],
    outfile: path.join(distDir, "content-scripts", "inject.js"),
    format: "iife",
  }),
  build({
    ...common,
    entryPoints: [path.join(extensionDir, "popup", "popup.tsx")],
    outfile: path.join(distDir, "popup", "popup.js"),
    format: "iife",
  }),
]);

await writeFile(
  path.join(distDir, "BUILD_INFO.txt"),
  [
    "CP Bot by Automation Alchemists",
    `Built at: ${new Date().toISOString()}`,
    `Supabase configured: ${Boolean(supabaseUrl && supabaseAnonKey)}`,
    `Web app URL: ${webAppUrl}`,
    ""
  ].join("\n"),
  "utf8",
);

console.log(`CP Bot extension built to ${path.relative(repoRoot, distDir)}`);
