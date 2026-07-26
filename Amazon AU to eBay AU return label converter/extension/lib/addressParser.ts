import type { Address, AuState } from "../types/Address";
import auPostcodesRaw from "./data/au-postcodes.json";

const auPostcodes = auPostcodesRaw as Record<string, { suburbs: string[]; state: string }>;
const AU_STATES: AuState[] = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const STATE_MAP: Record<string, string> = {
  "new south wales": "NSW",
  "victoria": "VIC",
  "queensland": "QLD",
  "western australia": "WA",
  "south australia": "SA",
  "tasmania": "TAS",
  "australian capital territory": "ACT",
  "northern territory": "NT",
};

const ALL_STATES_PATTERN = [
  ...AU_STATES,
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",
]
  .map((s) => s.replace(/\s+/g, "\\s+"))
  .join("|");



const EBAY_ORDER_ID_PATTERN = /\b\d{2}-\d{5}-\d{5}\b|\b\d{10,16}\b/;
const STREET_TYPE_PATTERN =
  /\b(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|link|lk|crescent|cres|court|ct|place|pl|boulevard|bvd|highway|hwy|parade|pde|terrace|tce|circuit|close|cl|way|walk|mews|grove|gr|loop|circle|cir|square|sq|path|pass|trail|track|rise|row|quay|vista|view|retreat|ridge|approach|entrance)\b/i;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /(?:\+?61|0)[\d\s().-]{8,}/;
const POSTCODE_SOURCE = "(?:0[289]\\d{2}|[1-9]\\d{3})";
const POSTCODE_PATTERN = new RegExp(`\\b${POSTCODE_SOURCE}\\b`);

const ITEM_TITLE_IGNORED_PATTERN =
  /^(g'?day|skip to|main content|seller hub|all orders|order details|paid|awaiting|ship|sent|send by|delivery|postage|buyer|order|total|quantity|qty|view|print|expand watchlist|more actions|address|postcode|phone|email|tracking|item|payment|message buyer|funds status|learn more|show contact|custom label|sold via|item id|label created|carrier scan|get postage|add tracking|free postage)\b/i;
const AVAILABILITY_LINE_PATTERN = /^\d+\s*\(\d+\s+available\)$/i;
const ADDRESS_NOISE_PATTERN =
  /\b(?:seller hub|feedback score|view profile|buyer paid|ready to post|order details|print invoice|postage instructions|buyer selected postage service|tracking|payment|funds status|message buyer|custom label|sold via|item id|expand watchlist|learn more|show contact|more actions)\b/i;

export interface EbayOrderDetailLink {
  href: string;
  itemTitle: string;
  orderId: string;
}

function cleanLine(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^\s*[-:|]+\s*/, "")
    .trim();
}

function isAddressNoiseLine(line: string) {
  return ADDRESS_NOISE_PATTERN.test(line);
}


function linesFromText(text: string) {
  return text
    .split(/\n| {2,}|\t/)
    .map(cleanLine)
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index);
}

const TEXT_NODE_FILTER = {
  acceptNode(node: Node) {
    const parent = node.parentElement;
    if (parent) {
      const tag = parent.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "noscript" || tag === "template" || tag === "iframe") {
        return NodeFilter.FILTER_REJECT;
      }
    }
    return NodeFilter.FILTER_ACCEPT;
  }
};

function getCleanTextContent(root: Node): string {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, TEXT_NODE_FILTER);
  const texts: string[] = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent) {
      texts.push(node.textContent);
    }
  }
  return texts.join(" ");
}

function nodeText(node: Element) {
  if (node instanceof HTMLElement) {
    return (node.innerText || "").replace(/\u00a0/g, " ").trim();
  }
  return getCleanTextContent(node).replace(/\u00a0/g, " ").trim();
}

function currentPageUrl() {
  return typeof window !== "undefined" ? window.location.href : "https://www.ebay.com.au/";
}


function candidateOrderNodes(root: Document) {
  const selectors = [
    "[data-order-id]",
    "[data-test-id*='order' i]",
    "[data-testid*='order' i]",
    "[id*='order' i]",
    "tr",
    "article",
    "section",
    "li",
    ".order-card",
    ".order-item",
  ];

  const nodes = Array.from(root.querySelectorAll(selectors.join(",")))
    .filter((node) => {
      const text = nodeText(node);
      return text.length > 80 && (EBAY_ORDER_ID_PATTERN.test(text) || POSTCODE_PATTERN.test(text));
    })
    .filter((node, index, all) => {
      const text = nodeText(node);
      return all.findIndex((candidate) => nodeText(candidate) === text) === index;
    });

  return nodes.length > 0 ? nodes : [root.body].filter(Boolean);
}

function findOrderId(node: Element, text: string) {
  const attrNode = node.closest("[data-order-id]") || node.querySelector("[data-order-id]");
  const attr = attrNode?.getAttribute("data-order-id");
  if (attr) {
    return attr;
  }

  const labelled = text.match(/(?:order(?:\s+number|\s+id)?|sales record)\s*[:#]?\s*([A-Z0-9-]{8,})/i);
  if (labelled?.[1]) {
    return labelled[1];
  }

  return text.match(EBAY_ORDER_ID_PATTERN)?.[0] || `visible-order-${Math.random().toString(36).slice(2, 9)}`;
}

function findItemTitle(lines: string[]) {
  const itemLine = lines.find(isItemTitleCandidate);
  return itemLine || "";
}

// Check if a line is a candidate for the item title
function isItemTitleCandidate(line: string) {
  return (
    line.length > 12 &&
    !ITEM_TITLE_IGNORED_PATTERN.test(line) &&
    !AVAILABILITY_LINE_PATTERN.test(line) &&
    !EMAIL_PATTERN.test(line) &&
    !PHONE_PATTERN.test(line) &&
    !EBAY_ORDER_ID_PATTERN.test(line) &&
    !/^\+?\d[\d\s().-]+$/.test(line)
  );
}

function isImageElement(element: Element): element is HTMLImageElement {
  return element.tagName.toLowerCase() === "img";
}

function titleFromImageAttributes(image: HTMLImageElement) {
  const values = [image.alt, image.title, image.getAttribute("aria-label") || ""].map(cleanLine);
  return values.find(isItemTitleCandidate) || "";
}

function findNearbyTitleAfterElement(elements: HTMLElement[], startIndex: number, maxElements = 28) {
  const endIndex = Math.min(elements.length, startIndex + maxElements);

  for (let index = startIndex; index < endIndex; index += 1) {
    const element = elements[index];
    if (isImageElement(element)) {
      continue;
    }

    const text = nodeText(element);
    if (!text || text.length > 260) {
      continue;
    }

    const title = linesFromText(text).find(isItemTitleCandidate);
    if (title) {
      return title;
    }
  }

  return "";
}

function findDetailsItemTitleNearImage(root: Document) {
  const elements = Array.from(
    root.body.querySelectorAll<HTMLElement>(
      "h1,h2,h3,h4,img,a,span,strong,b,p,div[role='heading'],[data-testid*='title' i],[data-test-id*='title' i],[class*='title' i]",
    ),
  );
  const orderDetailsIndex = elements.findIndex((element) => /^order details$/i.test(nodeText(element)));
  const searchStart = orderDetailsIndex >= 0 ? orderDetailsIndex + 1 : 0;

  for (let index = searchStart; index < elements.length; index += 1) {
    const element = elements[index];
    if (!isImageElement(element)) {
      continue;
    }

    const titleFromImage = titleFromImageAttributes(element);
    if (titleFromImage) {
      return titleFromImage;
    }

    const titleAfterImage = findNearbyTitleAfterElement(elements, index + 1);
    if (titleAfterImage) {
      return titleAfterImage;
    }
  }

  return "";
}

function findDetailsItemTitle(root: Document, lines: string[]) {
  const titleNearImage = findDetailsItemTitleNearImage(root);
  if (titleNearImage) {
    return titleNearImage;
  }

  const orderDetailsIndex = lines.findIndex((line) => /^order details$/i.test(line));
  if (orderDetailsIndex >= 0) {
    const beforeStatus = lines
      .slice(orderDetailsIndex + 1, orderDetailsIndex + 8)
      .filter((line) => !/^(print invoice|sent|postage|order|payment)$/i.test(line));
    const titleNearHeader = beforeStatus.find(isItemTitleCandidate);
    if (titleNearHeader) {
      return titleNearHeader;
    }
  }

  const itemIndex = lines.findIndex((line) => /^item$/i.test(line));
  if (itemIndex >= 0) {
    const titleNearItemSection = lines.slice(itemIndex + 1, itemIndex + 10).find(isItemTitleCandidate);
    if (titleNearItemSection) {
      return titleNearItemSection;
    }
  }

  return "";
}

function findQuantity(text: string) {
  const match = text.match(/\b(?:qty|quantity)\s*[:x]?\s*(\d{1,3})\b/i);
  const qty = Number.parseInt(match?.[1] || "1", 10);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function findDetailsQuantity(lines: string[], text: string) {
  const quantityIndex = lines.findIndex((line) => /^quantity$/i.test(line));
  if (quantityIndex >= 0) {
    const nextNumber = lines.slice(quantityIndex + 1, quantityIndex + 5).find((line) => /^\d{1,3}$/.test(line));
    if (nextNumber) {
      return Number.parseInt(nextNumber, 10);
    }
  }

  return findQuantity(text);
}

function findDetailsAddressScope(root: Document) {
  const selectors = [
    "[data-testid*='postage' i]",
    "[data-test-id*='postage' i]",
    "[class*='postage' i]",
    "[class*='shipping' i]",
    "section",
    "article",
    "div",
  ];

  return Array.from(root.querySelectorAll<HTMLElement>(selectors.join(",")))
    .map((node) => ({
      node,
      text: nodeText(node),
    }))
    .filter(({ text }) => /\b(?:post|ship)\s+to\b/i.test(text) && POSTCODE_PATTERN.test(text))
    .sort((a, b) => a.text.length - b.text.length)[0]?.node || null;
}

function getElementText(root: ParentNode, selectors: string[]): string {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el) {
      const text = el.textContent?.trim();
      if (text) return text;
    }
  }
  return "";
}

function getRawStreetText(root: ParentNode, selectors: string[]): string {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (!el) continue;

    // Check for <br> tags separating lines
    if (el instanceof HTMLElement && el.innerHTML.includes("<br")) {
      return el.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
    }

    // Check innerText for line breaks (block-level rendering)
    if (el instanceof HTMLElement) {
      const inner = el.innerText?.trim();
      if (inner && inner.includes("\n")) return inner;
    }

    // Check for multiple direct child elements that each contain text
    const childEls = Array.from(el.children).filter((c) => c.textContent?.trim());
    if (childEls.length >= 2) {
      const lines = childEls.map((c) => c.textContent?.trim() || "").filter(Boolean);
      if (lines.length >= 2) return lines.join("\n");
    }

    const text = el.textContent?.trim();
    if (text) return text;
  }
  return "";
}

function extractDigitsAndVerify(str: string): string | null {
  const normalized = str.replace(/[\u200b-\u200d\ufeff\xa0]/g, " ").trim();
  const cleaned = normalized.replace(/[^\d+]/g, "");
  const digitsOnly = cleaned.replace(/\D/g, "");
  
  if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    if (cleaned.startsWith("+61") || cleaned.startsWith("61") || cleaned.startsWith("0")) {
      return cleaned;
    }
  }
  return null;
}

function findPhoneFromLabel(root: ParentNode): string {
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT, TEXT_NODE_FILTER);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim().toLowerCase() || "";
    if (/phone/i.test(text)) {
      // 1. Check if the phone number is in the same text node
      const sameNodePhone = extractDigitsAndVerify(node.textContent || "");
      if (sameNodePhone) return sameNodePhone;

      // 2. Check parent element and siblings
      const parent = node.parentElement;
      if (parent) {
        const sibling = parent.nextElementSibling;
        if (sibling) {
          const siblingPhone = extractDigitsAndVerify(sibling.textContent || "");
          if (siblingPhone) return siblingPhone;
        }
        const parentPhone = extractDigitsAndVerify(parent.textContent || "");
        if (parentPhone) return parentPhone;
      }

      // 3. Fallback: Look at the next few text nodes for a phone number
      const cloneWalker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT, TEXT_NODE_FILTER);
      let cloneNode;
      while ((cloneNode = cloneWalker.nextNode())) {
        if (cloneNode === node) {
          break;
        }
      }
      for (let i = 0; i < 5; i++) {
        const next = cloneWalker.nextNode();
        if (!next) break;
        const nextPhone = extractDigitsAndVerify(next.textContent || "");
        if (nextPhone) return nextPhone;
      }
    }
  }

  // 4. Page-level text content search fallback
  const doc = root as unknown as Document;
  const el = root as unknown as HTMLElement;
  const fullText = doc.body?.innerText || el.innerText || el.textContent || "";
  if (fullText) {
    const lines = fullText.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      if (/phone/i.test(lines[i])) {
        for (let j = i; j <= Math.min(i + 2, lines.length - 1); j++) {
          const phoneVal = extractDigitsAndVerify(lines[j]);
          if (phoneVal) return phoneVal;
        }
      }
    }
  }

  return "";
}

function findAmazonAsin(root: ParentNode): string {
  const customLabelEl = root.querySelector('[data-testid="custom-label"]');
  if (customLabelEl) {
    const text = customLabelEl.textContent?.trim();
    if (text) {
      const asinMatch = text.match(/\b(B[A-Z0-9]{9})\b/i);
      if (asinMatch) return asinMatch[1].toUpperCase();
      return text;
    }
  }
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT, TEXT_NODE_FILTER);
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent?.includes("Custom label (SKU):")) {
      const text = node.textContent;
      const parts = text.split("Custom label (SKU):");
      if (parts.length > 1) {
        const val = parts[1].trim();
        if (val) {
          const asinMatch = val.match(/\b(B[A-Z0-9]{9})\b/i);
          if (asinMatch) return asinMatch[1].toUpperCase();
          return val;
        }
      }
      const parent = node.parentElement;
      if (parent) {
        const sibling = parent.nextElementSibling;
        if (sibling) {
          const val = sibling.textContent?.trim();
          if (val) {
            const asinMatch = val.match(/\b(B[A-Z0-9]{9})\b/i);
            if (asinMatch) return asinMatch[1].toUpperCase();
            return val;
          }
        }
      }
    }
  }
  return "";
}

function levenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function normaliseStreetType(streetLine: string): string {
  return streetLine;
}
function postProcessParsedAddress(addr: {
  buyerName: string;
  street1: string;
  street2?: string;
  suburb: string;
  state: string;
  postcode: string;
  phone?: string;
  isPOBox: boolean;
  isParcelCollect: boolean;
  parcelCollectId?: string;
  validationWarnings: string[];
}) {
  // If suburb contains a street type, it means street2 and suburb were merged into the suburb field (common structured parsing leakage)
  console.log("CP Bot postProcess: input suburb =", JSON.stringify(addr.suburb), "street2 =", JSON.stringify(addr.street2), "street1 =", JSON.stringify(addr.street1));
  if (addr.suburb) {
    const parts = addr.suburb.replace(/,/g, " ").replace(/\s+/g, " ").trim().split(" ");
    const streetTypeIndex = parts.findIndex((part) => STREET_TYPE_PATTERN.test(part));
    console.log("CP Bot postProcess: suburb parts =", JSON.stringify(parts), "streetTypeIndex =", streetTypeIndex, "parts.length =", parts.length);
    if (streetTypeIndex >= 0 && streetTypeIndex < parts.length - 1) {
      const extractedStreet2 = parts.slice(0, streetTypeIndex + 1).join(" ");
      const cleanedSuburb = parts.slice(streetTypeIndex + 1).join(" ");
      console.log("CP Bot postProcess: EXTRACTING street2 =", JSON.stringify(extractedStreet2), "suburb =", JSON.stringify(cleanedSuburb));
      addr.street2 = [addr.street2, extractedStreet2].filter(Boolean).join(", ");
      addr.suburb = cleanedSuburb;
    }
  }

  // If suburb is empty but street2 contains a state token, extract suburb and state
  if (!addr.suburb && addr.street2) {
    const stateTokenRegex = new RegExp(`\\b(${ALL_STATES_PATTERN})\\b`, "i");
    const stateMatch = addr.street2.match(stateTokenRegex);
    if (stateMatch) {
      const rawState = stateMatch[1];
      const parsedState = STATE_MAP[rawState.toLowerCase()] || rawState.toUpperCase();
      const stateIndex = addr.street2.toLowerCase().indexOf(rawState.toLowerCase());
      const parsedSuburb = addr.street2.substring(0, stateIndex)
        .replace(/,/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (parsedSuburb) {
        addr.suburb = parsedSuburb;
        addr.state = parsedState;
        addr.street2 = undefined;
      }
    }
  }

  // If street2 is just state and postcode, or consists only of suburb, state, and postcode, clear it
  if (addr.street2) {
    const cleanStreet2 = addr.street2.replace(/,+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    const cleanSuburb = addr.suburb.toLowerCase();
    const cleanState = addr.state.toLowerCase();
    const cleanPostcode = addr.postcode.toLowerCase();

    const parts = cleanStreet2.split(" ").filter(Boolean);
    const isOnlySuburbStatePostcode = parts.length > 0 && parts.every(part => 
      part === cleanSuburb || 
      part === cleanState || 
      part === cleanPostcode ||
      cleanSuburb.includes(part) ||
      cleanState.includes(part) ||
      cleanPostcode.includes(part)
    );

    if (isOnlySuburbStatePostcode) {
      addr.street2 = undefined;
    }
  }

  // Clean double commas and trailing commas from street1 and street2
  addr.street1 = addr.street1.replace(/,+/g, ",").replace(/,\s*,/g, ",").replace(/,\s*$/, "").trim();
  if (addr.street2) {
    addr.street2 = addr.street2.replace(/,+/g, ",").replace(/,\s*,/g, ",").replace(/,\s*$/, "").trim();
    if (!addr.street2) {
      addr.street2 = undefined;
    }
  }

  // Validate suburb and state against postcode database (re-run validation)
  const postcodeData = auPostcodes[addr.postcode];
  if (postcodeData) {
    if (!addr.state || addr.state !== postcodeData.state) {
      addr.state = postcodeData.state;
    }
    const knownSuburbs = postcodeData.suburbs;
    let matchedSuburb = "";
    const exactMatch = knownSuburbs.find((s) => s === addr.suburb);
    if (exactMatch) {
      matchedSuburb = exactMatch;
    } else {
      const caseInsensitiveMatch = knownSuburbs.find((s) => s.toLowerCase() === addr.suburb.toLowerCase());
      if (caseInsensitiveMatch) {
        matchedSuburb = caseInsensitiveMatch;
      } else {
        let bestDist = 999;
        let bestMatch = "";
        for (const known of knownSuburbs) {
          const dist = levenshteinDistance(addr.suburb.toLowerCase(), known.toLowerCase());
          if (dist <= 2 && dist < bestDist) {
            bestDist = dist;
            bestMatch = known;
          }
        }
        if (bestMatch) {
          matchedSuburb = bestMatch;
        }
      }
    }
    if (matchedSuburb) {
      addr.suburb = matchedSuburb;
      // Remove "Suburb does not match postcode" warning if it was added
      addr.validationWarnings = addr.validationWarnings.filter(w => w !== "Suburb does not match postcode");
    }
  }
}

export function parseAddressText(text: string, phoneFromPage = ""): {
  buyerName: string;
  street1: string;
  street2?: string;
  suburb: string;
  state: string;
  postcode: string;
  phone?: string;
  isPOBox: boolean;
  isParcelCollect: boolean;
  parcelCollectId?: string;
  validationWarnings: string[];
} | null {
  let lines = text
    .split(/\n| {2,}|\t/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((line) => !isAddressNoiseLine(line));

  const startIndex = lines.findIndex((l) => /^(?:post|ship)\s+to\b/i.test(l));
  if (startIndex >= 0) {
    const cleanLabel = lines[startIndex].replace(/^(?:post|ship)\s+to\s*/i, "").trim();
    lines = [cleanLabel, ...lines.slice(startIndex + 1)].filter(Boolean);
  }

  let phone = phoneFromPage;

  // Clean trailing noise lines (Australia, Phone labels, Phone numbers, Emails)
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim();
    const lower = last.toLowerCase();

    if (lower === "australia") {
      lines.pop();
      continue;
    }

    if (lower === "phone" || lower === "phone number" || PHONE_PATTERN.test(last)) {
      if (!phone && PHONE_PATTERN.test(last)) {
        phone = last;
      }
      lines.pop();
      continue;
    }

    if (EMAIL_PATTERN.test(last)) {
      lines.pop();
      continue;
    }

    break;
  }

  // Merge separate trailing lines for postcode, state, and suburb if they are split
  // e.g. ["Balhannah", ",", "South Australia", "5242"] -> "Balhannah, South Australia 5242"
  if (lines.length >= 2) {
    const lastIdx = lines.length - 1;
    const lastVal = lines[lastIdx];
    if (/^\d{4}$/.test(lastVal)) {
      let stateLine = "";
      let stateIdx = -1;
      const stateRegex = new RegExp(`^(${ALL_STATES_PATTERN})$`, "i");
      
      if (stateRegex.test(lines[lastIdx - 1])) {
        stateLine = lines[lastIdx - 1];
        stateIdx = lastIdx - 1;
      }
      
      const searchStart = stateIdx >= 0 ? stateIdx - 1 : lastIdx - 1;
      let suburbLine = "";
      let suburbIdx = -1;
      
      for (let i = searchStart; i >= Math.max(0, searchStart - 2); i--) {
        const val = lines[i];
        if (val === "," || val === "") {
          continue;
        }
        if (!STREET_TYPE_PATTERN.test(val)) {
          suburbLine = val;
          suburbIdx = i;
          break;
        }
      }
      
      if (suburbLine) {
        const combined = `${suburbLine}, ${stateLine ? stateLine + " " : ""}${lastVal}`.replace(/\s+/g, " ");
        lines[suburbIdx] = combined;
        lines.splice(suburbIdx + 1);
      }
    }
  }

  if (lines.length < 2) {
    return null;
  }

  const lastLine = lines.pop() || "";
  let suburb = "";
  let state = "";
  let postcode = "";
  const validationWarnings: string[] = [];

  const shortState = /^(.+?),\s*(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\s+(\d{4})$/i;
  const fullState = /^(.+?),\s*(New South Wales|Victoria|Queensland|Western Australia|South Australia|Tasmania|Australian Capital Territory|Northern Territory)\s+(\d{4})$/i;

  let match = lastLine.match(shortState);
  if (!match) {
    match = lastLine.match(fullState);
  }
  if (!match) {
    match = lastLine.match(/^(.+?)(?:,\s*|\s+)(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\s+(\d{4})$/i);
  }
  if (!match) {
    match = lastLine.match(/^(.+?)(?:,\s*|\s+)(New South Wales|Victoria|Queensland|Western Australia|South Australia|Tasmania|Australian Capital Territory|Northern Territory)\s+(\d{4})$/i);
  }

  if (match) {
    suburb = match[1].trim();
    const rawState = match[2].trim();
    postcode = match[3].trim();
    const lowerState = rawState.toLowerCase();
    state = STATE_MAP[lowerState] || rawState.toUpperCase();
  } else {
    const pcMatch = lastLine.match(/\b\d{4}\b/);
    const stMatch = lastLine.match(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT|New\s+South\s+Wales|Victoria|Queensland|Western\s+Australia|South\s+Australia|Tasmania|Australian\s+Capital\s+Territory|Northern\s+Territory)\b/i);
    if (pcMatch && stMatch) {
      postcode = pcMatch[0];
      const rawState = stMatch[0];
      state = STATE_MAP[rawState.toLowerCase()] || rawState.toUpperCase();
      suburb = lastLine.replace(pcMatch[0], "").replace(new RegExp(stMatch[0], "i"), "").replace(/,/g, "").trim();
    } else {
      const pcMatchOnly = lastLine.match(/\b\d{4}\b/);
      if (pcMatchOnly) {
        postcode = pcMatchOnly[0];
        suburb = lastLine.replace(pcMatchOnly[0], "").replace(/,/g, "").trim();
      } else {
        suburb = lastLine;
      }
    }
  }

  const buyerName = lines.shift() || "";

  const isEbayUsername = (line: string) => /^ebay:/i.test(line);
  const isParcelCollect = (line: string) => /^parcel\s+collect\s+\d+/i.test(line);
  const isPOBox = (line: string) => /^P\.?O\.?\s*Box/i.test(line);

  let isPOBoxAddress = false;
  let isParcelCollectAddress = false;
  let parcelCollectId = "";

  const middleLines: string[] = [];
  for (const line of lines) {
    if (isEbayUsername(line)) {
      continue;
    }
    if (isParcelCollect(line)) {
      isParcelCollectAddress = true;
      const pcMatch = line.match(/^parcel\s+collect\s+(.+)$/i);
      if (pcMatch) {
        parcelCollectId = pcMatch[1].trim();
      }
      middleLines.push(line);
      continue;
    }
    if (isPOBox(line)) {
      isPOBoxAddress = true;
      middleLines.push(line);
      continue;
    }
    middleLines.push(line);
  }

  let street1 = "";
  let street2 = "";

  if (isPOBoxAddress) {
    validationWarnings.push("PO Box detected — Amazon cannot ship to PO Boxes");
    const poBoxIndex = middleLines.findIndex(isPOBox);
    if (poBoxIndex >= 0) {
      street1 = middleLines[poBoxIndex];
      street2 = middleLines.filter((_, idx) => idx !== poBoxIndex).join(", ");
    } else {
      street1 = middleLines[0] || "";
      street2 = middleLines.slice(1).join(", ");
    }
  } else {
    street1 = middleLines[0] || "";
    street2 = middleLines.slice(1).join(", ");
  }

  const postcodeData = auPostcodes[postcode];
  if (!postcodeData) {
    validationWarnings.push("Postcode not found in AU database");
  } else {
    if (!state || state !== postcodeData.state) {
      state = postcodeData.state;
    }
    
    const knownSuburbs = postcodeData.suburbs;
    let matchedSuburb = "";
    
    const exactMatch = knownSuburbs.find((s) => s === suburb);
    if (exactMatch) {
      matchedSuburb = exactMatch;
    } else {
      const caseInsensitiveMatch = knownSuburbs.find((s) => s.toLowerCase() === suburb.toLowerCase());
      if (caseInsensitiveMatch) {
        matchedSuburb = caseInsensitiveMatch;
      } else {
        let bestDist = 999;
        let bestMatch = "";
        for (const known of knownSuburbs) {
          const dist = levenshteinDistance(suburb.toLowerCase(), known.toLowerCase());
          if (dist <= 2 && dist < bestDist) {
            bestDist = dist;
            bestMatch = known;
          }
        }
        if (bestMatch) {
          matchedSuburb = bestMatch;
        }
      }
    }
    
    if (matchedSuburb) {
      suburb = matchedSuburb;
    }
  }

  if (!phone) {
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      if (/phone/i.test(lines[i])) {
        for (let j = i; j <= Math.min(i + 2, lines.length - 1); j++) {
          const phoneVal = extractDigitsAndVerify(lines[j]);
          if (phoneVal) {
            phone = phoneVal;
            break;
          }
        }
        if (phone) break;
      }
    }
  }

  if (phone) {
    const cleanedPhone = phone.replace(/[^\d+]/g, "");
    if (cleanedPhone.startsWith("0")) {
      phone = "+61" + cleanedPhone.slice(1);
    } else if (cleanedPhone.startsWith("+61")) {
      phone = cleanedPhone;
    } else if (cleanedPhone.startsWith("61") && cleanedPhone.length >= 11) {
      phone = "+" + cleanedPhone;
    } else {
      validationWarnings.push("Phone number could not be normalised");
    }
  }

  street1 = normaliseStreetType(street1);
  if (street2) {
    street2 = normaliseStreetType(street2);
  }

  const result = {
    buyerName,
    street1,
    street2: street2 || undefined,
    suburb,
    state,
    postcode,
    phone: phone || undefined,
    isPOBox: isPOBoxAddress,
    isParcelCollect: isParcelCollectAddress,
    parcelCollectId: parcelCollectId || undefined,
    validationWarnings,
  };
  postProcessParsedAddress(result);
  return result;
}

export function findEbayOrderDetailLinks(root: Document = document, limit = 5): EbayOrderDetailLink[] {
  const links: EbayOrderDetailLink[] = [];
  const anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"));

  for (const anchor of anchors) {
    const rawHref = anchor.getAttribute("href") || anchor.href;
    if (!rawHref) {
      continue;
    }

    let href = "";
    try {
      href = new URL(rawHref, currentPageUrl()).toString();
    } catch {
      continue;
    }

    const url = new URL(href);
    const anchorText = nodeText(anchor);
    const orderId = url.searchParams.get("orderid") || anchorText.match(/\b\d{2}-\d{5}-\d{5}\b/)?.[0] || "";
    const pointsToOrderDetails = url.hostname.endsWith("ebay.com.au") && url.pathname.includes("/mesh/ord/details");

    if (!pointsToOrderDetails || !orderId || links.some((link) => link.orderId === orderId)) {
      continue;
    }

    links.push({
      href,
      itemTitle: "",
      orderId,
    });

    if (links.length >= limit) {
      break;
    }
  }

  return links;
}

export function parseEbayOrderDetailsPage(root: Document, sourceUrl = currentPageUrl()): Address | null {
  const url = new URL(sourceUrl, currentPageUrl());
  if (!url.pathname.includes("/mesh/ord/details")) {
    return null;
  }

  const pageText = nodeText(root.body);
  const orderId = url.searchParams.get("orderid") || getElementText(root, ['[data-testid="order-id"]'])?.match(/\b\d{2}-\d{5}-\d{5}\b/)?.[0] || findOrderId(root.body, pageText);
  const ebayOrderId = orderId.match(/\b\d{2}-\d{5}-\d{5}\b/)?.[0] || orderId;

  const buyerNameStructured = getElementText(root, ['[data-testid="shipping-address-name"]', '.shipping-address-name']);
  const street1Selectors = ['[data-testid="shipping-address-street1"]', '.shipping-address-street1'];
  let street1Structured = getElementText(root, street1Selectors);
  let street2Structured = getElementText(root, ['[data-testid="shipping-address-street2"]', '.shipping-address-street2']) || undefined;

  if (!street2Structured) {
    const rawStreet = getRawStreetText(root, street1Selectors);
    if (rawStreet.includes("\n")) {
      const parts = rawStreet.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        street1Structured = parts[0];
        street2Structured = parts.slice(1).join(", ");
      }
    }
  }

  const cityStructured = getElementText(root, ['[data-testid="shipping-address-city"]', '.shipping-address-city']);
  const stateStructured = getElementText(root, ['[data-testid="shipping-address-state"]', '.shipping-address-state']);
  const postcodeStructured = getElementText(root, ['[data-testid="shipping-address-zip"]', '.shipping-address-zip']);

  // If we still don't have street2, but we have no ebay username and street1 contains a comma, split it
  const hasEbayUsername = /ebay:[a-z0-9]+/i.test(pageText);
  if (!hasEbayUsername && !street2Structured && street1Structured.includes(",")) {
    const commaIdx = street1Structured.indexOf(",");
    street2Structured = street1Structured.substring(commaIdx + 1).trim();
    street1Structured = street1Structured.substring(0, commaIdx).trim();
  }

  // Visual context fallback: find street2 from the "Ship to" address block
  if (!street2Structured && street1Structured && postcodeStructured) {
    const street1El = root.querySelector('[data-testid="shipping-address-street1"]') || root.querySelector('.shipping-address-street1');
    if (street1El) {
      let container: Element | null = street1El;
      for (let d = 0; d < 6; d++) {
        container = container.parentElement;
        if (!container) break;
        const txt = container instanceof HTMLElement ? container.innerText : container.textContent || "";
        if (txt.includes(buyerNameStructured) && txt.includes(postcodeStructured)) break;
      }
      if (container && container instanceof HTMLElement) {
        const lines = container.innerText.split(/\n/).map((l) => l.trim()).filter(Boolean);
        const cleanStreet1 = street1Structured.split(",")[0].trim();
        const s1Idx = lines.findIndex((l) => l === cleanStreet1 || l.includes(cleanStreet1) || cleanStreet1.includes(l));
        if (s1Idx >= 0 && s1Idx < lines.length - 1) {
          const candidate = lines[s1Idx + 1];
          const lower = candidate.toLowerCase();
          const isNotStreet2 =
            lower.includes(postcodeStructured) ||
            lower === (cityStructured || "").toLowerCase() ||
            /^australia$/i.test(candidate) ||
            candidate === buyerNameStructured ||
            /^ebay:[a-z0-9]+$/i.test(candidate) ||
            /^\+?\d[\d\s()-]{7,}$/.test(candidate);
          if (!isNotStreet2) {
            street2Structured = candidate;
          }
        }
      }
    }
  }
  
  let phoneStructured = getElementText(root, ['[data-testid="buyer-phone"]', '.buyer-phone', '.transaction-phone']);
  if (!phoneStructured) {
    phoneStructured = findPhoneFromLabel(root);
  }
  const emailStructured = getElementText(root, ['[data-testid="buyer-email"]', '.buyer-email']);
  const amazonAsin = findAmazonAsin(root);

  let addressParsed: {
    buyerName: string;
    street1: string;
    street2?: string;
    suburb: string;
    state: string;
    postcode: string;
    phone?: string;
    isPOBox: boolean;
    isParcelCollect: boolean;
    parcelCollectId?: string;
    validationWarnings: string[];
  } | null = null;
  const hasStructuredAddress = buyerNameStructured && street1Structured && postcodeStructured && (cityStructured || stateStructured);

  if (hasStructuredAddress) {
    const postcode = postcodeStructured.replace(/\D/g, "");
    let state = stateStructured.toUpperCase();
    state = STATE_MAP[state.toLowerCase()] || state;
    let suburb = cityStructured;
    
    const isPOBoxAddress = /^P\.?O\.?\s*Box/i.test(street1Structured) || /^P\.?O\.?\s*Box/i.test(street2Structured || "");
    const isParcelCollectAddress = /^parcel\s+collect/i.test(street1Structured) || /^parcel\s+collect/i.test(street2Structured || "");
    let parcelCollectId: string | undefined;
    if (isParcelCollectAddress) {
      const pcMatch = (street1Structured + " " + (street2Structured || "")).match(/collect\s+(.+)$/i);
      if (pcMatch) {
        parcelCollectId = pcMatch[1].trim();
      }
    }

    const validationWarnings: string[] = [];
    if (isPOBoxAddress) {
      validationWarnings.push("PO Box detected — Amazon cannot ship to PO Boxes");
    }
    const buyerName = buyerNameStructured;

    const postcodeData = auPostcodes[postcode];
    if (!postcodeData) {
      validationWarnings.push("Postcode not found in AU database");
    } else {
      if (!state || state !== postcodeData.state) {
        state = postcodeData.state;
      }
      
      const knownSuburbs = postcodeData.suburbs;
      let matchedSuburb = "";
      const exactMatch = knownSuburbs.find((s) => s === suburb);
      if (exactMatch) {
        matchedSuburb = exactMatch;
      } else {
        const caseInsensitiveMatch = knownSuburbs.find((s) => s.toLowerCase() === suburb.toLowerCase());
        if (caseInsensitiveMatch) {
          matchedSuburb = caseInsensitiveMatch;
        } else {
          let bestDist = 999;
          let bestMatch = "";
          for (const known of knownSuburbs) {
            const dist = levenshteinDistance(suburb.toLowerCase(), known.toLowerCase());
            if (dist <= 2 && dist < bestDist) {
              bestDist = dist;
              bestMatch = known;
            }
          }
          if (bestMatch) {
            matchedSuburb = bestMatch;
          }
        }
      }
      
      if (matchedSuburb) {
        suburb = matchedSuburb;
      }
    }

    let phone = phoneStructured;
    if (phone) {
      const cleanedPhone = phone.replace(/[^\d+]/g, "");
      if (cleanedPhone.startsWith("0")) {
        phone = "+61" + cleanedPhone.slice(1);
      } else if (cleanedPhone.startsWith("+61")) {
        phone = cleanedPhone;
      } else if (cleanedPhone.startsWith("61") && cleanedPhone.length >= 11) {
        phone = "+" + cleanedPhone;
      } else {
        validationWarnings.push("Phone number could not be normalised");
      }
    }

    const street1 = normaliseStreetType(street1Structured);
    const street2 = street2Structured ? normaliseStreetType(street2Structured) : undefined;

    addressParsed = {
      buyerName,
      street1,
      street2,
      suburb,
      state,
      postcode,
      phone: phone || undefined,
      isPOBox: isPOBoxAddress,
      isParcelCollect: isParcelCollectAddress,
      parcelCollectId,
      validationWarnings,
    };
    postProcessParsedAddress(addressParsed);
  } else {
    console.log("CP Bot: Explicit DOM selectors returned empty. Falling back to bottom-up text-blob parser.");
    const addressScope = findDetailsAddressScope(root);
    const rawText = addressScope ? nodeText(addressScope) : pageText;
    addressParsed = parseAddressText(rawText, phoneStructured);
  }

  if (!addressParsed) {
    return null;
  }

  // If neither path found street2, and there is no eBay username on the page, extract it from the page text.
  // Find street1 in the page lines, then any lines between street1 and the
  // suburb/postcode line are street2.
  const hasEbayUsernameInPage = /ebay:[a-z0-9]+/i.test(pageText);
  console.log("CP Bot: Before page-line fallback: street1 =", JSON.stringify(addressParsed.street1), "street2 =", JSON.stringify(addressParsed.street2), "suburb =", JSON.stringify(addressParsed.suburb), "hasEbayUsername =", hasEbayUsernameInPage);
  if (!addressParsed.street2 && !hasEbayUsernameInPage) {
    const pageLines = pageText.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const s1Idx = pageLines.findIndex((l) => l === addressParsed!.street1 || l.includes(addressParsed!.street1));
    console.log("CP Bot: page-line fallback: s1Idx =", s1Idx, "looking for:", JSON.stringify(addressParsed.street1));
    if (s1Idx >= 0) {
      console.log("CP Bot: lines around street1:", JSON.stringify(pageLines.slice(Math.max(0, s1Idx - 1), s1Idx + 6)));
      for (let i = s1Idx + 1; i < Math.min(s1Idx + 5, pageLines.length); i++) {
        const line = pageLines[i];
        // This is the suburb/state/postcode line — stop here
        if (line.includes(addressParsed.postcode)) {
          console.log("CP Bot: found postcode at line", i, "gap =", i - s1Idx - 1, "line =", JSON.stringify(line));
          if (i > s1Idx + 1) {
            const potentialLines = pageLines.slice(s1Idx + 1, i);
            const filteredLines = potentialLines.filter(line => {
              const cleaned = line.replace(/[,.\s]/g, "").toLowerCase();
              if (!cleaned) return false;
              if (cleaned === addressParsed!.suburb.replace(/[,.\s]/g, "").toLowerCase()) return false;
              if (cleaned === addressParsed!.state.replace(/[,.\s]/g, "").toLowerCase()) return false;
              return true;
            });
            if (filteredLines.length > 0) {
              addressParsed.street2 = potentialLines.join(", ");
              console.log("CP Bot: EXTRACTED street2 =", JSON.stringify(addressParsed.street2));
            }
          }
          break;
        }
        // If we hit "Australia" or the buyer phone, stop
        if (/^australia$/i.test(line) || /^phone$/i.test(line) || /^\+?\d[\d\s()-]{7,}$/.test(line)) {
          console.log("CP Bot: hit stop line:", JSON.stringify(line));
          break;
        }
      }
    }
  }
  console.log("CP Bot: parsed phone =", JSON.stringify(addressParsed.phone), "phoneStructured =", JSON.stringify(phoneStructured));

  return {
    orderId,
    buyerName: addressParsed.buyerName,
    street1: addressParsed.street1,
    street2: addressParsed.street2 || "",
    suburb: addressParsed.suburb,
    state: addressParsed.state as AuState | "",
    postcode: addressParsed.postcode,
    country: "AU",
    phone: addressParsed.phone || "",
    email: emailStructured || pageText.match(EMAIL_PATTERN)?.[0] || "",
    itemTitle: findDetailsItemTitle(root, linesFromText(pageText)) || "Name Check Failed",
    qty: findDetailsQuantity(linesFromText(pageText), pageText),
    rawText: pageText,
    sourceUrl,
    ebayOrderId,
    amazonAsin: amazonAsin || undefined,
    isPOBox: addressParsed.isPOBox,
    isParcelCollect: addressParsed.isParcelCollect,
    parcelCollectId: addressParsed.parcelCollectId,
    validationWarnings: addressParsed.validationWarnings,
  };
}

export function formatAddressForClipboard(address: Address) {
  return [
    address.buyerName,
    address.street1,
    address.street2,
    [address.suburb, address.state, address.postcode].filter(Boolean).join(" "),
    "Australia",
    address.phone ? `Phone: ${address.phone}` : "",
    address.email ? `Email: ${address.email}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseEbayOrders(root: Document = document, sourceUrl = currentPageUrl()): Address[] {
  const detailOrder = parseEbayOrderDetailsPage(root, sourceUrl);
  if (detailOrder) {
    return [detailOrder];
  }

  const parsed = candidateOrderNodes(root)
    .map((node): Address | null => {
      const rawText = nodeText(node);
      const lines = linesFromText(rawText);
      
      const postcodeMatch = rawText.match(POSTCODE_PATTERN);
      if (!postcodeMatch) {
        return null;
      }
      
      const parsedAddress = parseAddressText(rawText);
      if (!parsedAddress) {
        return null;
      }

      const email = rawText.match(EMAIL_PATTERN)?.[0] || "";
      const amazonAsin = findAmazonAsin(node);

      let phone = parsedAddress.phone || "";
      if (!phone) {
        const phoneStructured = getElementText(root, ['[data-testid="buyer-phone"]', '.buyer-phone', '.transaction-phone']) || findPhoneFromLabel(root);
        if (phoneStructured) {
          const cleanedPhone = phoneStructured.replace(/[^\d+]/g, "");
          if (cleanedPhone.startsWith("0")) {
            phone = "+61" + cleanedPhone.slice(1);
          } else if (cleanedPhone.startsWith("+61")) {
            phone = cleanedPhone;
          } else if (cleanedPhone.startsWith("61") && cleanedPhone.length >= 11) {
            phone = "+" + cleanedPhone;
          } else {
            phone = phoneStructured;
          }
        }
      }

      return {
        orderId: findOrderId(node, rawText),
        buyerName: parsedAddress.buyerName,
        street1: parsedAddress.street1,
        street2: parsedAddress.street2 || "",
        suburb: parsedAddress.suburb,
        state: parsedAddress.state as AuState | "",
        postcode: parsedAddress.postcode,
        country: "AU",
        phone,
        email,
        itemTitle: findItemTitle(lines),
        qty: findQuantity(rawText),
        rawText,
        sourceUrl,
        ebayOrderId: findOrderId(node, rawText),
        amazonAsin: amazonAsin || undefined,
        isPOBox: parsedAddress.isPOBox,
        isParcelCollect: parsedAddress.isParcelCollect,
        parcelCollectId: parsedAddress.parcelCollectId,
        validationWarnings: parsedAddress.validationWarnings,
      };
    });

  return parsed
    .filter((order): order is Address => order !== null)
    .filter((order, index, all) => all.findIndex((candidate) => candidate.orderId === order.orderId) === index);
}
