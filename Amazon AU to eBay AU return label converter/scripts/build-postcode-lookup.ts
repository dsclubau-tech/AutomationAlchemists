import { mkdirSync, writeFileSync } from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSV_URL =
  "https://raw.githubusercontent.com/matthewproctor/australianpostcodes/master/australian_postcodes.csv";

const VALID_STATES = new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);

const POSTCODE_RE = /^\d{4}$/;

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Fetch a URL and return the full response body as a string.
 */
function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirects
        fetchText(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/**
 * Parse a single CSV line, handling quoted fields.
 * Supports fields wrapped in double-quotes with escaped quotes ("").
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  const len = line.length;

  while (i <= len) {
    if (i === len) {
      // Trailing comma produced an empty field
      fields.push("");
      break;
    }

    if (line[i] === '"') {
      // Quoted field
      let value = "";
      i++; // skip opening quote
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') {
            // Escaped quote
            value += '"';
            i += 2;
          } else {
            // Closing quote
            i++; // skip closing quote
            break;
          }
        } else {
          value += line[i];
          i++;
        }
      }
      // Skip comma (or we're at end)
      if (i < len && line[i] === ",") {
        i++;
      }
      fields.push(value);
    } else {
      // Unquoted field
      const commaIdx = line.indexOf(",", i);
      if (commaIdx === -1) {
        fields.push(line.substring(i));
        break;
      } else {
        fields.push(line.substring(i, commaIdx));
        i = commaIdx + 1;
      }
    }
  }

  return fields;
}

interface PostcodeEntry {
  suburbs: string[];
  state: string;
}

(async () => {
  console.log("Fetching Australian postcodes CSV...");
  const csv = await fetchText(CSV_URL);

  const lines = csv.split(/\r?\n/);
  // Skip header row
  const dataLines = lines.slice(1).filter((l) => l.trim().length > 0);

  const lookup = new Map<string, { suburbsSet: Set<string>; suburbs: string[]; state: string }>();

  let skipped = 0;

  for (const line of dataLines) {
    const fields = parseCSVLine(line);

    const postcode = fields[1]?.trim();
    const locality = fields[2]?.trim();
    const state = fields[3]?.trim().toUpperCase();

    if (!postcode || !POSTCODE_RE.test(postcode)) {
      skipped++;
      continue;
    }

    if (!state || !VALID_STATES.has(state)) {
      skipped++;
      continue;
    }

    if (!locality) {
      skipped++;
      continue;
    }

    const titleCasedSuburb = toTitleCase(locality);
    const dedupeKey = titleCasedSuburb.toLowerCase();

    let entry = lookup.get(postcode);
    if (!entry) {
      entry = { suburbsSet: new Set(), suburbs: [], state };
      lookup.set(postcode, entry);
    }

    if (!entry.suburbsSet.has(dedupeKey)) {
      entry.suburbsSet.add(dedupeKey);
      entry.suburbs.push(titleCasedSuburb);
    }
  }

  // Sort postcodes numerically
  const sortedKeys = Array.from(lookup.keys()).sort((a, b) => Number(a) - Number(b));

  const result: Record<string, PostcodeEntry> = {};
  for (const key of sortedKeys) {
    const entry = lookup.get(key)!;
    result[key] = {
      suburbs: entry.suburbs,
      state: entry.state,
    };
  }

  // Write output
  const outDir = path.resolve(__dirname, "..", "extension", "lib", "data");
  mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "au-postcodes.json");
  writeFileSync(outFile, JSON.stringify(result, null, 2) + "\n", "utf-8");

  // Summary
  const totalPostcodes = sortedKeys.length;
  const totalSuburbs = sortedKeys.reduce((sum, k) => sum + lookup.get(k)!.suburbs.length, 0);

  console.log(`Written: ${outFile}`);
  console.log(`Postcodes: ${totalPostcodes}`);
  console.log(`Unique suburbs: ${totalSuburbs}`);
  console.log(`Rows skipped: ${skipped}`);
})();
