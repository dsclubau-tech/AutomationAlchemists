import type { Address, AuState } from "../types/Address";
import { detectSecurityChallenge, isBlockedAutomationAction, securityChallengeMessage } from "./securityGuards";

export interface FillResult {
  filled: string[];
  missing: string[];
  openedAddressForm?: boolean;
  submittedAddressForm?: boolean;
  dismissedPrimeUpsell?: boolean;
  primePromptDetected?: boolean;
  primePromptDismissed?: boolean;
  foundExistingAddress?: boolean;
  selectedExistingAddress?: boolean;
  deliveredExistingAddress?: boolean;
  blockedBySecurityChallenge?: boolean;
  blockedPurchaseAction?: boolean;
  manualActionRequired?: boolean;
  message?: string;
}

interface FillOptions {
  autoUseThisAddress?: boolean;
}

const FIELD_SELECTORS = {
  fullName: [
    "#address-ui-widgets-enterAddressFullName",
    "input[name='address-ui-widgets-enterAddressFullName']",
    "input[name='enterAddressFullName']",
    "input[name*='FullName' i]",
    "input[id*='FullName' i]",
    "input[autocomplete='name']",
  ],
  street1: [
    "#address-ui-widgets-enterAddressLine1",
    "input[name='address-ui-widgets-enterAddressLine1']",
    "input[name='enterAddressAddressLine1']",
    "input[name*='AddressLine1' i]",
    "input[id*='AddressLine1' i]",
    "input[autocomplete='address-line1']",
  ],
  street2: [
    "#address-ui-widgets-enterAddressLine2",
    "input[name='address-ui-widgets-enterAddressLine2']",
    "input[name='enterAddressAddressLine2']",
    "input[name*='AddressLine2' i]",
    "input[id*='AddressLine2' i]",
    "input[autocomplete='address-line2']",
    "input[placeholder*='Apt' i]",
    "input[placeholder*='Suite' i]",
    "input[placeholder*='Unit' i]",
    "input[placeholder*='Building' i]",
    "input[placeholder*='Floor' i]",
  ],
  city: [
    "#address-ui-widgets-enterAddressCity",
    "#address-ui-widgets-enterAddressCity-dropdown-nativeId",
    "select[name='address-ui-widgets-enterAddressCity']",
    "select[name='enterAddressCity']",
    "select[name*='AddressCity' i]",
    "select[id*='AddressCity' i]",
    "input[name='address-ui-widgets-enterAddressCity']",
    "input[name='enterAddressCity']",
    "input[name*='City' i]",
    "input[id*='City' i]",
    "input[autocomplete='address-level2']",
  ],
  state: [
    "#address-ui-widgets-enterAddressStateOrRegion",
    "#address-ui-widgets-enterAddressStateOrRegion-dropdown-nativeId",
    "select[name='address-ui-widgets-enterAddressStateOrRegion']",
    "input[name='address-ui-widgets-enterAddressStateOrRegion']",
    "select[name='enterAddressStateOrRegion']",
    "input[name='enterAddressStateOrRegion']",
    "[name*='StateOrRegion' i]",
    "[id*='StateOrRegion' i]",
    "select[autocomplete='address-level1']",
    "input[autocomplete='address-level1']",
  ],
  postcode: [
    "#address-ui-widgets-enterAddressPostalCode",
    "input[name='address-ui-widgets-enterAddressPostalCode']",
    "input[name='enterAddressPostalCode']",
    "input[name*='PostalCode' i]",
    "input[id*='PostalCode' i]",
    "input[autocomplete='postal-code']",
  ],
  phone: [
    "#address-ui-widgets-enterAddressPhoneNumber",
    "input[name='address-ui-widgets-enterAddressPhoneNumber']",
    "input[name='enterAddressPhoneNumber']",
    "input[name*='PhoneNumber' i]",
    "input[id*='PhoneNumber' i]",
    "input[autocomplete='tel']",
  ],
  country: [
    "#address-ui-widgets-countryCode",
    "#address-ui-widgets-countryCode-dropdown-nativeId",
    "select[name='address-ui-widgets-countryCode']",
    "select[name='enterAddressCountryCode']",
    "select[name*='CountryCode' i]",
    "select[id*='CountryCode' i]",
  ],
} as const;

const REQUIRED_FIELDS: Array<keyof typeof FIELD_SELECTORS> = ["fullName", "street1", "city", "postcode", "phone"];
const FIELD_LABELS: Partial<Record<keyof typeof FIELD_SELECTORS, RegExp[]>> = {
  fullName: [/^full name\b/i],
  street1: [/^address$/i, /^street address\b/i],
  street2: [/^apt\b/i, /\bsuite\b/i, /\bunit\b/i],
  postcode: [/^postcode\b/i, /^postal code\b/i],
  phone: [/^phone number\b/i, /^phone\b/i],
};
const STREET_TYPE_PATTERN =
  /\b(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|link|lk|crescent|cres|court|ct|place|pl|boulevard|bvd|highway|hwy|parade|pde|terrace|tce|circuit|close|cl|way|walk|mews|grove|gr|loop|circle|cir|square|sq|path|pass|trail|track|rise|row|quay|vista|view|retreat|ridge|approach|entrance)\b/i;
const STATE_NAMES: Record<AuState, string> = {
  NSW: "NEW SOUTH WALES",
  VIC: "VICTORIA",
  QLD: "QUEENSLAND",
  WA: "WESTERN AUSTRALIA",
  SA: "SOUTH AUSTRALIA",
  TAS: "TASMANIA",
  ACT: "AUSTRALIAN CAPITAL TERRITORY",
  NT: "NORTHERN TERRITORY",
};

const AMAZON_MANUAL_ACTION_MESSAGE =
  "Amazon showed an unexpected checkout state. CP Bot stopped automation. Please continue manually on this page.";

export function isSlowNetwork(): boolean {
  try {
    const conn = (navigator as unknown as { connection?: { effectiveType?: string; rtt?: number } }).connection;
    if (conn) {
      if (conn.effectiveType === "2g" || conn.effectiveType === "3g") {
        return true;
      }
      if (typeof conn.rtt === "number" && conn.rtt > 500) {
        return true;
      }
    }
  } catch {
    // Ignore
  }
  return false;
}

function delay(ms: number) {
  if ((window as any).cpBotCancelled) {
    throw new Error("Task canceled by User");
  }
  const finalMs = isSlowNetwork() ? ms * 2 : ms;
  return new Promise<void>((resolve, reject) => {
    window.setTimeout(() => {
      if ((window as any).cpBotCancelled) {
        reject(new Error("Task canceled by User"));
      } else {
        resolve();
      }
    }, finalMs);
  });
}

function isFillableElement(element: Element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function queryFirst(
  selectors: readonly string[],
  options: { allowHidden?: boolean; preferSelect?: boolean } = {},
) {
  const matches: Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = [];

  for (const selector of selectors) {
    matches.push(...Array.from(document.querySelectorAll(selector)).filter(isFillableElement));
  }

  if (options.preferSelect) {
    matches.sort((a, b) => Number(b instanceof HTMLSelectElement) - Number(a instanceof HTMLSelectElement));
  }

  for (const element of matches) {
    if (options.allowHidden || isVisible(element)) {
      return element;
    }
  }

  return null;
}

function findFieldByLabel(
  field: keyof typeof FIELD_SELECTORS,
  options: { allowHidden?: boolean; preferSelect?: boolean } = {},
) {
  const patterns = FIELD_LABELS[field];
  if (!patterns) {
    return null;
  }

  const labels = Array.from(document.querySelectorAll<HTMLLabelElement>("label"));
  for (const label of labels) {
    if (!options.allowHidden && !isVisible(label)) {
      continue;
    }

    if (!patterns.some((pattern) => pattern.test(textOf(label)))) {
      continue;
    }

    const labelledControl = label.control || (label.htmlFor ? document.getElementById(label.htmlFor) : null);
    if (labelledControl && isFillableElement(labelledControl) && (options.allowHidden || isVisible(labelledControl))) {
      return labelledControl;
    }

    const container = label.closest<HTMLElement>(".a-section, .a-row, .a-input-text-wrapper, div");
    const controls = Array.from(container?.querySelectorAll("input, select, textarea") || []).filter(isFillableElement);
    const candidates = options.preferSelect
      ? controls.sort((a, b) => Number(b instanceof HTMLSelectElement) - Number(a instanceof HTMLSelectElement))
      : controls;
    const control = candidates.find((candidate) => {
      if (candidate instanceof HTMLInputElement && candidate.type === "hidden") {
        return false;
      }

      return options.allowHidden || isVisible(candidate);
    });

    if (control) {
      return control;
    }
  }

  return null;
}

function queryField(
  field: keyof typeof FIELD_SELECTORS,
  options: { allowHidden?: boolean; preferSelect?: boolean } = {},
) {
  return queryFirst(FIELD_SELECTORS[field], options) || findFieldByLabel(field, options);
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
}

function textOf(element: Element) {
  const labelledBy = (element.getAttribute("aria-labelledby") || "")
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent || "")
    .join(" ");
  const wrapperText =
    element.closest<HTMLElement>("button, .a-button, .a-button-inner, [role='button']")?.textContent || "";

  return `${element.textContent || ""} ${element.getAttribute("aria-label") || ""} ${labelledBy} ${wrapperText} ${
    element instanceof HTMLInputElement ? element.value : ""
  }`.replace(/\s+/g, " ").trim();
}

export function detectAmazonCheckoutAnomaly() {
  const url = new URL(window.location.href);
  const text = (document.body?.innerText || document.body?.textContent || "").replace(/\s+/g, " ").trim();
  const normalized = text.toLowerCase();
  const isAmazon = url.hostname.endsWith("amazon.com.au");
  const isAmazonErrorPage =
    isAmazon &&
    (url.pathname.includes("/error") ||
      url.pathname.includes("error.html") ||
      (normalized.includes("looking for something") && normalized.includes("not a functioning page")));
  const isCheckoutError =
    isAmazon &&
    /\/(?:checkout|gp\/buy|gp\/cart|gp\/payment|gp\/payselect)\b/i.test(url.pathname) &&
    (normalized.includes("something went wrong") ||
      normalized.includes("there was a problem") ||
      normalized.includes("unable to process") ||
      normalized.includes("not a functioning page"));

  if (!isAmazonErrorPage && !isCheckoutError) {
    return null;
  }

  return AMAZON_MANUAL_ACTION_MESSAGE;
}

function blockedBySecurityChallengeResult(challenge = detectSecurityChallenge()): FillResult {
  return {
    filled: [],
    missing: [],
    blockedBySecurityChallenge: true,
    message: challenge
      ? securityChallengeMessage(challenge)
      : "Security challenge detected. CP Bot stopped automation. Complete this step manually, then refresh or retry.",
  };
}

function manualActionResult(message = AMAZON_MANUAL_ACTION_MESSAGE): FillResult {
  return {
    filled: [],
    missing: [],
    manualActionRequired: true,
    message,
  };
}

function fireInputEvents(element: HTMLElement) {
  element.dispatchEvent(new Event("focus", { bubbles: true }));
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));
}

function closeDropdown(element: HTMLElement) {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, code: "Escape", key: "Escape" }));
  element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true, code: "Escape", key: "Escape" }));
  element.blur();
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = Object.getPrototypeOf(element) as HTMLInputElement | HTMLTextAreaElement;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  fireInputEvents(element);
}

function normalizeComparable(value: string) {
  return value
    .replace(/\b(?:NSW|VIC|QLD|WA|SA|TAS|ACT|NT|AUSTRALIA)\b/gi, "")
    .replace(/\b\d{4}\b/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function optionText(option: HTMLOptionElement) {
  return `${option.value} ${option.textContent || ""}`;
}

function findSelectOption(field: keyof typeof FIELD_SELECTORS, element: HTMLSelectElement, value: string) {
  const options = Array.from(element.options).filter(
    (option) => !option.disabled && option.value !== "" && !/choose|select/i.test(option.textContent || ""),
  );
  const wanted = normalizeComparable(value);

  if (field === "country") {
    return options.find((option) => {
      const normalized = optionText(option).toUpperCase();
      return /\bAU\b/.test(normalized) || normalized.includes("AUSTRALIA");
    });
  }

  if (field === "state") {
    const stateName = STATE_NAMES[value.toUpperCase() as AuState] || value;
    return options.find((option) => {
      const normalized = optionText(option).toUpperCase();
      return normalized === value.toUpperCase() || normalized.includes(value.toUpperCase()) || normalized.includes(stateName);
    });
  }

  return (
    options.find((option) => normalizeComparable(option.textContent || "") === wanted) ||
    options.find((option) => normalizeComparable(optionText(option)) === wanted) ||
    options.find((option) => wanted.endsWith(normalizeComparable(optionText(option)))) ||
    options.find((option) => normalizeComparable(optionText(option)).endsWith(wanted)) ||
    options.find((option) => normalizeComparable(optionText(option)).includes(wanted))
  );
}

function setSelectValue(element: HTMLSelectElement, value: string, field: keyof typeof FIELD_SELECTORS) {
  const option = findSelectOption(field, element, value);
  if (!option) {
    return false;
  }

  option.selected = true;
  element.selectedIndex = Array.from(element.options).indexOf(option);
  element.value = option.value;
  fireInputEvents(element);
  closeDropdown(element);
  return true;
}

function shouldUseHiddenSelect(field: keyof typeof FIELD_SELECTORS) {
  return field === "country" || field === "state";
}

function addMissing(result: FillResult, field: keyof typeof FIELD_SELECTORS) {
  if (!result.missing.includes(field)) {
    result.missing.push(field);
  }
}

function fillField(field: keyof typeof FIELD_SELECTORS, value: string, result: FillResult) {
  if (!value && field !== "country") {
    if (REQUIRED_FIELDS.includes(field)) {
      addMissing(result, field);
    }
    return;
  }

  const element = queryField(field, {
    allowHidden: shouldUseHiddenSelect(field),
    preferSelect: shouldUseHiddenSelect(field),
  });
  if (!element) {
    addMissing(result, field);
    return;
  }

  if (element instanceof HTMLSelectElement) {
    if (!setSelectValue(element, value, field)) {
      addMissing(result, field);
      return;
    }
  } else {
    setNativeValue(element, value);
  }

  result.filled.push(field);
}

function extractPhoneFromText(text: string) {
  const labelled = text.match(/\bPhone(?:\s+number)?\s*[:#]?\s*((?:\+?61|0)[\d\s().-]{8,})/i)?.[1];
  return labelled || "";
}

function normalizePhone(phone?: string) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith("4") && digits.length === 9) {
    return `0${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return digits;
  }

  return "";
}

function inferStateFromPostcode(postcode: string): AuState | "" {
  const value = Number.parseInt(postcode, 10);
  if (!Number.isFinite(value)) {
    return "";
  }

  if ((value >= 1000 && value <= 2599) || (value >= 2619 && value <= 2899) || (value >= 2921 && value <= 2999)) {
    return "NSW";
  }
  if ((value >= 200 && value <= 299) || (value >= 2600 && value <= 2618) || (value >= 2900 && value <= 2920)) {
    return "ACT";
  }
  if ((value >= 3000 && value <= 3999) || (value >= 8000 && value <= 8999)) {
    return "VIC";
  }
  if ((value >= 4000 && value <= 4999) || (value >= 9000 && value <= 9999)) {
    return "QLD";
  }
  if (value >= 5000 && value <= 5999) {
    return "SA";
  }
  if (value >= 6000 && value <= 6999) {
    return "WA";
  }
  if (value >= 7000 && value <= 7999) {
    return "TAS";
  }
  if (value >= 800 && value <= 999) {
    return "NT";
  }

  return "";
}

function splitStreetFromSuburb(value: string) {
  const parts = value
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  const streetTypeIndex = parts.findIndex((part) => STREET_TYPE_PATTERN.test(part));

  if (streetTypeIndex < 0 || streetTypeIndex >= parts.length - 1) {
    return null;
  }

  return {
    streetPart: parts.slice(0, streetTypeIndex + 1).join(" "),
    suburbPart: parts.slice(streetTypeIndex + 1).join(" "),
  };
}

function repairAddressParts(address: Address) {
  const postcode = address.postcode.replace(/\D/g, "").slice(0, 4);
  const hasEbayUsername = /ebay:[a-z0-9]+/i.test(address.rawText || "");
  let street1 = address.street1;
  let street2 = (address.street2 || "").trim();

  if (hasEbayUsername) {
    street1 = street1.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  } else {
    street1 = street1.trim();
  }

  let suburb = address.suburb.replace(/,+$/, "").replace(/\s+/g, " ").trim();
  const state = (address.state.trim().toUpperCase() || inferStateFromPostcode(postcode)) as AuState | "";
  const splitSuburb = splitStreetFromSuburb(suburb);

  if (hasEbayUsername) {
    if (splitSuburb && (!STREET_TYPE_PATTERN.test(street1) || /^\d+[A-Z]?$/i.test(street1))) {
      street1 = [street1, splitSuburb.streetPart].filter(Boolean).join(" ");
      suburb = splitSuburb.suburbPart;
    }

    if (!street2 || street2 === suburb) {
      street2 = "";
    }
  }

  return { street1, street2, suburb, state, postcode };
}

function normalizeAddress(address: Address) {
  const repaired = repairAddressParts(address);
  const phone = normalizePhone(address.phone) || normalizePhone(extractPhoneFromText(address.rawText || ""));

  return {
    ...address,
    buyerName: address.buyerName.trim(),
    street1: repaired.street1,
    street2: repaired.street2,
    suburb: repaired.suburb,
    state: repaired.state,
    postcode: repaired.postcode,
    phone,
  };
}

function visiblePageAndFieldText() {
  const visibleText = document.body?.innerText || document.body?.textContent || "";
  const fieldText = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input, select, textarea",
  ))
    .map((field) => {
      if (field instanceof HTMLSelectElement) {
        return `${field.value} ${field.selectedOptions[0]?.textContent || ""}`;
      }

      return field.value || field.getAttribute("value") || "";
    })
    .join(" ");

  return `${visibleText} ${fieldText}`;
}

export function amazonPageContainsAddress(address: Address) {
  if (detectAmazonCheckoutAnomaly() || detectSecurityChallenge()) {
    return false;
  }

  const normalized = normalizeAddress(address);
  const rawPageText = visiblePageAndFieldText();
  const pageText = normalizeComparable(rawPageText);
  const buyerName = normalizeComparable(normalized.buyerName);
  const street1 = normalizeComparable(normalized.street1);
  const street2 = normalizeComparable(normalized.street2);
  const suburb = normalizeComparable(normalized.suburb);
  const postcode = normalized.postcode.replace(/\D/g, "").slice(0, 4);

  if (!pageText || !buyerName || !postcode || !pageText.includes(buyerName) || !rawPageText.includes(postcode)) {
    return false;
  }

  return Boolean(
    (street1 && pageText.includes(street1)) ||
      (street2 && pageText.includes(street2)) ||
      (suburb && pageText.includes(suburb)),
  );
}

function normalizeStreetText(str: string): string {
  let normalized = str.toUpperCase();
  normalized = normalized.replace(/\bROAD\b/g, "RD");
  normalized = normalized.replace(/\bSTREET\b/g, "ST");
  normalized = normalized.replace(/\bAVENUE\b/g, "AVE");
  normalized = normalized.replace(/\bDRIVE\b/g, "DR");
  normalized = normalized.replace(/\bPLACE\b/g, "PL");
  normalized = normalized.replace(/\bCOURT\b/g, "CT");
  normalized = normalized.replace(/\bPARADE\b/g, "PDE");
  normalized = normalized.replace(/\bCLOSE\b/g, "CL");
  normalized = normalized.replace(/\bHIGHWAY\b/g, "HWY");
  normalized = normalized.replace(/\bTERRACE\b/g, "TCE");
  normalized = normalized.replace(/\bBOULEVARD\b/g, "BVD");
  normalized = normalized.replace(/\bLANE\b/g, "LN");
  normalized = normalized.replace(/\bCRESCENT\b/g, "CRES");
  normalized = normalized.replace(/\bCIRCUIT\b/g, "CCT");
  normalized = normalized.replace(/\bUNIT\b/g, "U");
  normalized = normalized.replace(/\bAPARTMENT\b/g, "APT");
  normalized = normalized.replace(/\bFACTORY\b/g, "FY");
  return normalized.replace(/[^A-Z0-9]/g, "");
}

function textContainsAddress(text: string, address: Address) {
  const normalized = normalizeAddress(address);
  const comparable = normalizeComparable(text);
  const buyerName = normalizeComparable(normalized.buyerName);
  const postcode = normalized.postcode.replace(/\D/g, "").slice(0, 4);

  // 1. Basic validation: Name and Postcode must be present in the text
  if (!comparable || !buyerName || !postcode || !comparable.includes(buyerName) || !text.includes(postcode)) {
    return false;
  }

  // 2. Strict validation of street lines
  const normalizedCard = normalizeStreetText(text);
  
  // Check street1 if it contains structural info (both numbers and letters)
  if (normalized.street1 && /\d/.test(normalized.street1) && /[a-zA-Z]/.test(normalized.street1)) {
    const target1 = normalizeStreetText(normalized.street1);
    if (target1 && !normalizedCard.includes(target1)) {
      return false;
    }
  }

  // Check street2 if it contains structural info (both numbers and letters)
  if (normalized.street2 && /\d/.test(normalized.street2) && /[a-zA-Z]/.test(normalized.street2)) {
    const target2 = normalizeStreetText(normalized.street2);
    if (target2 && !normalizedCard.includes(target2)) {
      return false;
    }
  }

  // Fallback check: if neither street1 nor street2 had digits, require at least one match
  const street1Norm = normalized.street1 ? normalizeStreetText(normalized.street1) : "";
  const street2Norm = normalized.street2 ? normalizeStreetText(normalized.street2) : "";
  const suburbNorm = normalized.suburb ? normalizeStreetText(normalized.suburb) : "";

  if (street1Norm && normalizedCard.includes(street1Norm)) {
    return true;
  }
  if (street2Norm && normalizedCard.includes(street2Norm)) {
    return true;
  }
  if (suburbNorm && normalizedCard.includes(suburbNorm)) {
    return true;
  }

  return false;
}

function findExistingAddressOption(address: Address) {
  const radios = Array.from(document.querySelectorAll<HTMLInputElement>("input[type='radio']"));
  const visibleRadios = radios.filter(isVisible);

  interface AddressCardOption {
    radio: HTMLInputElement;
    scope: HTMLElement;
    text: string;
  }

  const options: AddressCardOption[] = [];
  for (const radio of visibleRadios) {
    let parent = radio.parentElement;
    let card: HTMLElement | null = null;
    while (parent && parent !== document.body) {
      if (parent.querySelectorAll("input[type='radio']").length > 1) {
        break;
      }
      card = parent;
      parent = parent.parentElement;
    }
    if (card) {
      options.push({ radio, scope: card, text: (card.innerText || card.textContent || "").replace(/\s+/g, " ").trim() });
    }
  }

  const addressMatches = options.filter(opt => textContainsAddress(opt.text, address));

  if (addressMatches.length === 0) {
    return null;
  }

  if (addressMatches.length === 1) {
    return addressMatches[0];
  }

  // Multiple matches: verify using phone number
  const targetPhone = address.phone || "";
  const targetPhoneDigits = targetPhone.replace(/\D/g, "");
  if (targetPhoneDigits) {
    const targetSuffix = targetPhoneDigits.replace(/^(?:0|61)/, "");
    const phoneMatches = addressMatches.filter(opt => {
      const cardDigits = opt.text.replace(/\D/g, "");
      return cardDigits.includes(targetSuffix);
    });

    if (phoneMatches.length > 0) {
      return phoneMatches[0];
    }
  }

  // Fallback: return the first matched address option
  return addressMatches[0];
}

function findDeliverToThisAddressButton() {
  const candidates = candidateButtonElements(document.body);

  return (
    candidates.find((candidate) => {
      const clickable = findClickableSubmitTarget(candidate);
      if (!isVisible(candidate) && !isVisible(clickable)) {
        return false;
      }

      if (isBlockedPurchaseControl(candidate) || isBlockedPurchaseControl(clickable)) {
        return false;
      }

      return /\bdeliver\s+to\s+this\s+address\b/i.test(textOf(candidate));
    }) || null
  );
}

export function isAmazonCheckoutPage(url: string = window.location.href): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.pathname.includes("/checkout/p/") ||
      parsed.pathname.includes("/gp/checkout") ||
      /\/(?:checkout|gp\/buy|gp\/cart|gp\/payment|gp\/payselect)\b/i.test(parsed.pathname)
    );
  } catch {
    return (
      url.includes("/checkout/p/") ||
      url.includes("/gp/checkout") ||
      url.includes("/gp/buy") ||
      url.includes("/gp/payment") ||
      url.includes("/gp/cart") ||
      url.includes("/gp/payselect")
    );
  }
}

export function hasAddressRadioCards(): boolean {
  const radios = Array.from(document.querySelectorAll<HTMLInputElement>("input[type='radio']"));
  const visibleRadios = radios.filter(isVisible);
  return visibleRadios.some((radio) => {
    const nameAttr = (radio.name || "").toLowerCase();
    const idAttr = (radio.id || "").toLowerCase();
    if (nameAttr.includes("address") || idAttr.includes("address") || nameAttr.includes("ship") || idAttr.includes("ship")) {
      return true;
    }
    let parent = radio.parentElement;
    while (parent && parent !== document.body) {
      const cls = (parent.className || "").toString().toLowerCase();
      const pid = (parent.id || "").toString().toLowerCase();
      if (
        cls.includes("address") ||
        pid.includes("address") ||
        cls.includes("ship") ||
        pid.includes("ship")
      ) {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  });
}

export function isAmazonAddressPageReady(): boolean {
  const url = window.location.href;
  if (!isAmazonCheckoutPage(url) || !url.includes("/address")) {
    return false;
  }
  const hasRadioInputs = Boolean(document.querySelector("input[type='radio']"));
  const hasAddressCardContainer = Boolean(
    document.querySelector(".a-box, .a-cardui, #address-list, [id*='address'], [class*='address']")
  );
  return Boolean(
    hasRadioInputs ||
      hasAddressCardContainer ||
      hasAddressForm() ||
      findAddNewAddressControl() ||
      findDeliverToThisAddressButton()
  );
}

let statusCallback: ((message: string | null) => void) | null = null;
let unlockButtonsCallback: (() => void) | null = null;

export function setStatusCallback(cb: (message: string | null) => void) {
  statusCallback = cb;
}

export function setUnlockButtonsCallback(cb: () => void) {
  unlockButtonsCallback = cb;
}

function unlockAutomationButtons() {
  if (unlockButtonsCallback) {
    unlockButtonsCallback();
  }
}

function updateStatus(message: string | null) {
  if (statusCallback) {
    statusCallback(message);
  }
}

export function findShowMoreAddressesButton(): HTMLElement | null {
  const elements = Array.from(document.querySelectorAll("a, span, button"));
  return elements.find((el) => {
    const text = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    return text === "show more addresses" || text.includes("show more addresses");
  }) as HTMLElement | null;
}

export async function expandAddressListIfNeeded(): Promise<boolean> {
  let showMoreBtn = findShowMoreAddressesButton();
  if (!showMoreBtn) {
    const startedWaiting = Date.now();
    while (Date.now() - startedWaiting < 3000) {
      await delay(250);
      showMoreBtn = findShowMoreAddressesButton();
      if (showMoreBtn) {
        break;
      }
    }
  }

  if (!showMoreBtn) {
    return false;
  }
  
  console.log("CP Bot: Clicking 'Show more addresses' to expand address list...");
  clickElement(showMoreBtn);
  await delay(800);
  return true;
}

export async function selectExistingAmazonAddressAndDeliver(address: Address): Promise<FillResult> {
  const anomaly = detectAmazonCheckoutAnomaly();
  if (anomaly) {
    return manualActionResult(anomaly);
  }

  const challenge = detectSecurityChallenge();
  if (challenge) {
    return blockedBySecurityChallengeResult(challenge);
  }

  const result: FillResult = {
    filled: [],
    missing: [],
  };

  // 1. Always expand the address list first before scanning
  updateStatus("Expanding address list and searching for buyer name...");
  const expanded = await expandAddressListIfNeeded();
  if (expanded) {
    updateStatus("Address list expanded. Searching for buyer name...");
  } else {
    updateStatus("Searching for buyer name in saved addresses...");
  }

  await delay(800);

  // 2. Scan the (now expanded) address list for the matching address
  let existingAddress = findExistingAddressOption(address);
  if (!existingAddress) {
    updateStatus(`Searching saved addresses... (attempt 2)`);
    await delay(1000);
    existingAddress = findExistingAddressOption(address);
  }

  if (!existingAddress) {
    result.foundExistingAddress = false;
    result.message = "Copied address was not found in Amazon's saved delivery address list.";
    updateStatus("Copied address was not found in Amazon's saved delivery address list.");
    await delay(1500);
    updateStatus(null);
    return result;
  }

  result.foundExistingAddress = true;
  updateStatus("Matching address found! Scrolling to address...");

  // Scroll to the found address option
  existingAddress.scope.scrollIntoView({ behavior: "smooth", block: "center" });
  
  await delay(1500);

  // 3. Click on the name to select the matching address, fallback to radioTarget
  const radioTarget = existingAddress.radio.closest<HTMLElement>("label, .a-radio, .a-row, div") || existingAddress.radio;
  const nameElement = Array.from(existingAddress.scope.querySelectorAll("b, strong, h1, h2, h3, h4, span, div"))
    .find((el) => normalizeComparable(el.textContent || "").includes(normalizeComparable(address.buyerName)));

  if (nameElement) {
    console.log("CP Bot: Clicking name element to select address:", nameElement.textContent);
    clickElement(nameElement as HTMLElement);
  } else {
    console.log("CP Bot: Clicking radio target to select address...");
    clickElement(radioTarget);
  }

  await delay(isSlowNetwork() ? 300 : 150);
  existingAddress.radio.checked = true;
  fireInputEvents(existingAddress.radio);
  result.selectedExistingAddress = existingAddress.radio.checked;

  updateStatus("Address selected. Submitting delivery...");
  await delay(isSlowNetwork() ? 600 : 300);

  updateStatus("Clicking 'Deliver to this address'...");
  const deliverButton = findDeliverToThisAddressButton();
  if (!deliverButton) {
    result.manualActionRequired = true;
    result.message =
      "Copied address was found and selected, but CP Bot could not find Amazon's Deliver to this address button.";
    updateStatus(null);
    return result;
  }

  const submitTarget = findClickableSubmitTarget(deliverButton);
  const clickSuccess = clickElement(submitTarget);
  result.deliveredExistingAddress = clickSuccess;
  result.submittedAddressForm = clickSuccess;

  if (clickSuccess) {
    unlockAutomationButtons();
    result.message = "Copied address was found, selected, and submitted to Amazon AU.";
    // Write success status before the page unloads/navigates
    updateStatus("Address submitted to Amazon AU!");
    try {
      await delay(isSlowNetwork() ? 400 : 200);
      updateStatus(null);
    } catch {
      // Context destroyed due to navigation — expected
    }
  } else {
    result.message = "Copied address was found, but CP Bot could not safely click Amazon's Deliver to this address button.";
    // Revert status to failure immediately
    updateStatus("Failed to submit delivery address.");
  }
  return result;
}

function isGiftTextField(element: Element): element is HTMLInputElement | HTMLTextAreaElement {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    return false;
  }

  if (!isVisible(element)) {
    return false;
  }

  if (element instanceof HTMLInputElement) {
    return !["button", "checkbox", "hidden", "radio", "reset", "submit"].includes(element.type);
  }

  return true;
}

function fieldLabelText(element: HTMLInputElement | HTMLTextAreaElement) {
  const labels = Array.from(element.labels || [])
    .map((label) => label.textContent || "")
    .join(" ");
  const wrapperText = element.closest<HTMLElement>("label, .a-row, .a-section, div")?.textContent || "";

  return `${labels} ${element.getAttribute("aria-label") || ""} ${element.placeholder || ""} ${element.name} ${
    element.id
  } ${wrapperText}`
    .replace(/\s+/g, " ")
    .trim();
}

function findGiftMessageField(): HTMLTextAreaElement | HTMLInputElement | null {
  const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea"));
  if (textareas.length > 0) {
    const visibleTextarea = textareas.find(isVisible);
    return visibleTextarea || textareas[0];
  }

  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input")).filter(isGiftTextField);
  return (
    inputs.find((field) => /gift\s*message|message/i.test(fieldLabelText(field))) ||
    inputs.find((field) => field.type === "text") ||
    null
  );
}

function findGiftFromField(messageField: HTMLInputElement | HTMLTextAreaElement | null): HTMLInputElement | HTMLTextAreaElement | null {
  const fields = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"))
    .filter(isGiftTextField)
    .filter((field) => field !== messageField);

  const inputFields = fields.filter((field): field is HTMLInputElement => field instanceof HTMLInputElement && field.type === "text");

  return (
    inputFields.find((field) => /\bfrom\b/i.test(fieldLabelText(field))) ||
    inputFields[0] ||
    fields.find((field) => /\bfrom\b/i.test(fieldLabelText(field))) ||
    fields[0] ||
    null
  );
}

async function waitForGiftMessageField(maxWaitMs = 3000): Promise<HTMLTextAreaElement | HTMLInputElement | null> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const field = findGiftMessageField();
    if (field) {
      return field;
    }
    await delay(150);
  }
  return findGiftMessageField();
}

async function clearAndFillGiftField(field: HTMLInputElement | HTMLTextAreaElement, value: string) {
  setNativeValue(field, "");
  await delay(150);
  setNativeValue(field, value);
}

function findSaveGiftOptionsButton() {
  const candidates = candidateButtonElements(document.body);

  return (
    candidates.find((candidate) => {
      const clickable = findClickableSubmitTarget(candidate);
      if (!isVisible(candidate) && !isVisible(clickable)) {
        return false;
      }

      if (isBlockedPurchaseControl(candidate) || isBlockedPurchaseControl(clickable)) {
        return false;
      }

      return /\bsave\s+gift\s+options\b/i.test(textOf(candidate));
    }) || null
  );
}

export function findAmazonAddGiftOptionsLink(): HTMLElement | null {
  // 1. Try finding by href containing selectGiftOptions
  const selectGiftLink = document.querySelector<HTMLElement>('a[href*="selectGiftOptions"], a[href*="giftOptions"]');
  if (selectGiftLink && isVisible(selectGiftLink)) {
    return selectGiftLink;
  }

  // 2. Try finding by href containing /gift
  const giftUrlLink = Array.from(document.querySelectorAll<HTMLElement>('a[href*="/gift"]')).find(isVisible);
  if (giftUrlLink) {
    return giftUrlLink;
  }

  // 3. Fallback to text matching
  const elements = Array.from(document.querySelectorAll<HTMLElement>("a, button, span, [role='button']"));
  const textMatch = elements.find((el) => {
    if (!isVisible(el)) {
      return false;
    }
    const text = textOf(el).toLowerCase().trim();
    return text === "add gift options" || text.includes("add gift options");
  });

  if (textMatch) {
    return findClickableSubmitTarget(textMatch);
  }

  return null;
}

export function isAmazonGiftPageReady(): boolean {
  const url = window.location.href;
  if (!isAmazonCheckoutPage(url) || !url.includes("/gift")) {
    return false;
  }
  const hasGiftCheckbox = Boolean(
    document.querySelector("input[type='checkbox'][name*='gift'], input[type='checkbox'][id*='gift'], .gift-is-gift")
  );
  const hasGiftContainer = Boolean(
    document.querySelector("textarea, [id*='gift'], [class*='gift'], form")
  );
  return Boolean(
    findGiftMessageField() ||
      findGiftFromField(null) ||
      hasGiftCheckbox ||
      hasGiftContainer
  );
}

export async function fillAmazonGiftOptions(options: { message: string; from: string }): Promise<FillResult> {
  const startingAnomaly = detectAmazonCheckoutAnomaly();
  if (startingAnomaly) {
    return manualActionResult(startingAnomaly);
  }

  const startingChallenge = detectSecurityChallenge();
  if (startingChallenge) {
    return blockedBySecurityChallengeResult(startingChallenge);
  }

  const result: FillResult = {
    filled: [],
    missing: [],
  };
  const giftMessage = options.message.trim();
  const giftFrom = options.from.trim();

  if (!giftMessage || !giftFrom) {
    result.manualActionRequired = true;
    result.message = "Gift message settings are incomplete. Add both Gift message and From text in the CP Bot popup.";
    return result;
  }

  updateStatus("Filling gift message...");
  const messageField = await waitForGiftMessageField(3000);
  if (!messageField) {
    result.missing.push("giftMessage");
  } else {
    updateStatus("Entering gift message text...");
    await clearAndFillGiftField(messageField, giftMessage);
    result.filled.push("giftMessage");
  }

  await delay(1500);

  const fromField = findGiftFromField(messageField);
  if (!fromField) {
    result.missing.push("giftFrom");
  } else {
    updateStatus("Entering gift sender name...");
    await clearAndFillGiftField(fromField, giftFrom);
    result.filled.push("giftFrom");
  }

  if (result.missing.length > 0) {
    result.manualActionRequired = true;
    result.message = `Could not find Amazon gift field(s): ${result.missing.join(", ")}.`;
    updateStatus("Failed to fill gift options.");
    await delay(1500);
    updateStatus(null);
    return result;
  }

  await delay(2000);

  const challengeBeforeSave = detectSecurityChallenge();
  if (challengeBeforeSave) {
    return blockedBySecurityChallengeResult(challengeBeforeSave);
  }

  updateStatus("Saving gift options...");
  const saveButton = findSaveGiftOptionsButton();
  if (!saveButton) {
    result.manualActionRequired = true;
    result.message = "Gift fields were filled, but CP Bot could not find Amazon's Save gift options button.";
    updateStatus(null);
    return result;
  }

  result.submittedAddressForm = clickElement(findClickableSubmitTarget(saveButton));
  if (!result.submittedAddressForm) {
    result.manualActionRequired = true;
    result.message = "Gift fields were filled, but CP Bot could not safely click Amazon's Save gift options button.";
    updateStatus(null);
    return result;
  }
  unlockAutomationButtons();

  const endingAnomaly = detectAmazonCheckoutAnomaly();
  if (endingAnomaly) {
    return manualActionResult(endingAnomaly);
  }

  result.message = "Gift message filled and saved on Amazon AU.";
  updateStatus("Gift message saved successfully!");
  await delay(1500);
  updateStatus(null);
  return result;
}

async function waitForSelectOption(field: keyof typeof FIELD_SELECTORS, value: string, timeoutMs = 3500) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const element = queryField(field, {
      allowHidden: shouldUseHiddenSelect(field),
      preferSelect: true,
    });
    if (element instanceof HTMLSelectElement && findSelectOption(field, element, value)) {
      return true;
    }

    await delay(200);
  }

  return false;
}

function hasAddressForm() {
  return Boolean(queryField("fullName") || queryField("street1"));
}

function findAddNewAddressControl() {
  const controls = Array.from(document.querySelectorAll<HTMLElement>("a, button, input[type='button'], input[type='submit']"));

  return controls.find((control) => {
    if (!isVisible(control)) {
      return false;
    }

    const text = textOf(control).toLowerCase();
    return (
      text.includes("add a new delivery address") ||
      text.includes("add new delivery address") ||
      text.includes("add a new address") ||
      text.includes("add address")
    );
  });
}

function isBlockedPurchaseControl(element: HTMLElement) {
  const text = textOf(element);
  const target = findClickableSubmitTarget(element);
  const targetText = target === element ? "" : textOf(target);

  return isBlockedAutomationAction(`${text} ${targetText}`);
}

export function clickElement(element: HTMLElement) {
  if (isBlockedPurchaseControl(element)) {
    return false;
  }

  const target = findClickableSubmitTarget(element);
  target.scrollIntoView({ block: "center", inline: "center" });

  // Dispatch full pointer and mouse event sequences to simulate a realistic human click
  target.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, cancelable: true, pointerId: 1 }));
  target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 1 }));
  target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true, view: window }));
  target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
  target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
  target.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerId: 1 }));

  let originalHref: string | null = null;
  if (target instanceof HTMLAnchorElement || target.tagName === "A") {
    const href = target.getAttribute("href") || "";
    if (href.startsWith("javascript:")) {
      originalHref = href;
      target.removeAttribute("href");
    }
  }

  target.click();

  if (originalHref !== null) {
    target.setAttribute("href", originalHref);
  }
  return true;
}

function findClickableSubmitTarget(element: HTMLElement) {
  const buttonWrapper = element.closest<HTMLElement>("a, button, [role='button'], .a-button");
  return buttonWrapper || element;
}

function candidateButtonElements(root: Element) {
  const selector = [
    "button",
    "input[type='submit']",
    "input[type='button']",
    "a",
    "[role='button']",
    ".a-button",
    ".a-button-inner",
    ".a-button-text",
    ".a-button-input",
  ].join(",");

  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

function isUseThisAddressButton(element: HTMLElement) {
  const clickable = findClickableSubmitTarget(element);
  if (!isVisible(element) && !isVisible(clickable)) {
    return false;
  }

  if (isBlockedPurchaseControl(element) || isBlockedPurchaseControl(clickable)) {
    return false;
  }

  const text = textOf(element).toLowerCase();
  return (
    text.includes("use this address") ||
    text.includes("save address") ||
    text.includes("add address") ||
    text.includes("deliver to this address")
  );
}

async function waitForAddressForm(timeoutMs = 8000) {
  const startedAt = Date.now();
  const limit = isSlowNetwork() ? timeoutMs * 2 : timeoutMs;

  while (Date.now() - startedAt < limit) {
    if (hasAddressForm()) {
      return true;
    }

    await new Promise((resolve) => window.setTimeout(resolve, isSlowNetwork() ? 500 : 250));
  }

  return hasAddressForm();
}

async function waitForAddNewAddressControl(timeoutMs = 6000): Promise<HTMLElement | null> {
  const startedAt = Date.now();
  const limit = isSlowNetwork() ? timeoutMs * 2 : timeoutMs;
  while (Date.now() - startedAt < limit) {
    const control = findAddNewAddressControl();
    if (control) {
      return control;
    }
    await new Promise((resolve) => window.setTimeout(resolve, isSlowNetwork() ? 500 : 250));
  }
  return findAddNewAddressControl() || null;
}

async function openAddNewAddressForm() {
  if (hasAddressForm()) {
    return false;
  }

  const addControl = await waitForAddNewAddressControl();
  if (!addControl) {
    return false;
  }

  clickElement(addControl);
  await waitForAddressForm();
  return true;
}

function addressFormContainer() {
  const field = queryField("fullName") || queryField("street1");
  return field?.closest("form") || field?.closest("[role='dialog']") || field?.closest("[class*='popover' i]") || null;
}

export function dispatchHumanLikeClick(element: HTMLElement): boolean {
  if (isBlockedPurchaseControl(element)) {
    return false;
  }

  const target = findClickableSubmitTarget(element);
  target.scrollIntoView({ block: "center", inline: "center" });

  const opts = { bubbles: true, cancelable: true, view: window };
  target.dispatchEvent(new MouseEvent("mouseover", opts));
  target.dispatchEvent(new MouseEvent("mousemove", opts));
  target.dispatchEvent(new MouseEvent("mousedown", opts));
  target.dispatchEvent(new MouseEvent("mouseup", opts));
  target.dispatchEvent(new MouseEvent("click", opts));

  return true;
}

function findSubmitAddressButton(root?: Element): HTMLElement | null {
  const container = addressFormContainer();
  const roots: Element[] = root ? [root] : container ? [container, document.body] : [document.body];
  const candidates = Array.from(new Set(roots.flatMap(candidateButtonElements)));
  const submit = candidates.find(isUseThisAddressButton);

  if (!submit) {
    return null;
  }

  return findClickableSubmitTarget(submit);
}

async function waitForSubmitAddressButton(maxWaitMs = 2000, root?: Element): Promise<HTMLElement | null> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxWaitMs) {
    const btn = findSubmitAddressButton(root);
    if (btn && isVisible(btn) && !isBlockedPurchaseControl(btn)) {
      return btn;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
  const btn = findSubmitAddressButton(root);
  return btn && isVisible(btn) ? btn : null;
}

function submitAddressForm(root?: Element) {
  if (detectSecurityChallenge()) {
    return false;
  }

  const submit = findSubmitAddressButton(root);
  if (!submit) {
    return false;
  }

  return dispatchHumanLikeClick(submit);
}

function findAddressVerificationDialog() {
  const dialogs = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[role='dialog'], [aria-modal='true'], .a-popover, .a-popover-wrapper, .a-modal-scroller, .a-modal-content",
    ),
  ).filter(isVisible);

  return (
    dialogs.find((dialog) => {
      const text = textOf(dialog).toLowerCase();
      return (
        text.includes("verify your address") ||
        text.includes("there's a problem with the address provided") ||
        text.includes("there is a problem with the address provided")
      );
    }) || null
  );
}

function findPrimeExpeditedDeliveryDialog() {
  const dialogs = Array.from(
    document.querySelectorAll<HTMLElement>(
      [
        "[role='dialog']",
        "[aria-modal='true']",
        ".a-popover",
        ".a-popover-wrapper",
        ".a-modal",
        ".a-modal-scroller",
        ".a-modal-content",
        "[class*='prime' i]",
      ].join(","),
    ),
  ).filter(isVisible);

  const isPrimeUpsell = (element: HTMLElement) => {
    const text = textOf(element).toLowerCase();
    const hasPrimeContext =
      text.includes("try prime") ||
      text.includes("why pay for expedited delivery") ||
      /\bmembership renews at \$[\d.]+\/(?:month|year)\b/i.test(text) ||
      text.includes("continue with prime") ||
      text.includes("sign up and pay") ||
      text.includes("prime benefits");

    return text.includes("prime") && text.includes("no thanks") && hasPrimeContext;
  };

  const modalDialog = dialogs.find(isPrimeUpsell);
  if (modalDialog) {
    return modalDialog;
  }

  const noThanks = candidateButtonElements(document.body).find(isNoThanksButton);
  const fallbackDialog =
    noThanks?.closest<HTMLElement>(
      "[role='dialog'], [aria-modal='true'], .a-popover, .a-popover-wrapper, .a-modal, .a-modal-scroller, .a-modal-content, [class*='prime' i]",
    ) || null;

  if (fallbackDialog && isPrimeUpsell(fallbackDialog)) {
    return fallbackDialog;
  }

  return noThanks && isPrimeUpsell(document.body) ? document.body : null;
}

function isNoThanksButton(element: HTMLElement) {
  const clickable = findClickableSubmitTarget(element);
  if (!isVisible(element) && !isVisible(clickable)) {
    return false;
  }

  const text = textOf(element);
  return /\bno\s+thanks\b/i.test(text) && !isBlockedAutomationAction(text);
}

function findNoThanksControl(dialog: HTMLElement) {
  const candidates = candidateButtonElements(dialog);
  const noThanks = candidates.find((candidate) => /^no thanks$/i.test(textOf(candidate))) || candidates.find(isNoThanksButton);
  return noThanks || null;
}

function findPrimeDialogCloseControl(dialog: HTMLElement) {
  const candidates = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      [
        "button[aria-label*='close' i]",
        "button[title*='close' i]",
        "[data-action='a-popover-close']",
        ".a-button-close",
        ".a-popover-close",
        "[aria-label*='close' i]",
        "[role='button']",
        "button",
      ].join(","),
    ),
  ).filter(isVisible);

  return (
    candidates.find((candidate) => {
      const text = textOf(candidate).toLowerCase();
      return text === "×" || text === "x" || text.includes("close");
    }) || null
  );
}

async function waitForPrimeDialogToClose(timeoutMs = 1200) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (detectAmazonCheckoutAnomaly()) {
      return false;
    }

    if (!findPrimeExpeditedDeliveryDialog()) {
      return true;
    }

    await delay(150);
  }

  return !findPrimeExpeditedDeliveryDialog();
}

async function clickNoThanks(dialog: HTMLElement) {
  const noThanks = findNoThanksControl(dialog);
  if (!noThanks) {
    return false;
  }

  const target = findClickableSubmitTarget(noThanks);
  const clickedTarget = clickElement(target);

  if (target !== noThanks && !clickedTarget) {
    clickElement(noThanks);
  }

  if (await waitForPrimeDialogToClose()) {
    return true;
  }

  if (target !== noThanks) {
    clickElement(noThanks);
  }

  return waitForPrimeDialogToClose();
}

async function closePrimeDialog(dialog: HTMLElement) {
  const closeControl = findPrimeDialogCloseControl(dialog);
  if (!closeControl) {
    return false;
  }

  clickElement(findClickableSubmitTarget(closeControl));
  if (await waitForPrimeDialogToClose()) {
    return true;
  }

  clickElement(closeControl);
  return waitForPrimeDialogToClose();
}

export async function dismissPrimeExpeditedDeliveryPromptIfPresent(timeoutMs = 6000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const anomaly = detectAmazonCheckoutAnomaly();
    if (anomaly) {
      return { found: false, dismissed: false, manualActionRequired: true, message: anomaly };
    }

    if (detectSecurityChallenge()) {
      return { found: false, dismissed: false, manualActionRequired: true, message: AMAZON_MANUAL_ACTION_MESSAGE };
    }

    const dialog = findPrimeExpeditedDeliveryDialog();
    if (dialog) {
      updateStatus("Prime upsell offer detected. Dismissing Prime prompt...");
      unlockAutomationButtons();
      // Co-ordinate between concurrent dismissal attempts to avoid race conditions
      if (dialog.dataset.cpDismissing === "true") {
        if (await waitForPrimeDialogToClose()) {
          return { found: true, dismissed: true, manualActionRequired: false };
        }
        delete dialog.dataset.cpDismissing;
      }

      dialog.dataset.cpDismissing = "true";

      if (await clickNoThanks(dialog)) {
        return { found: true, dismissed: true, manualActionRequired: false };
      }

      if (await closePrimeDialog(dialog)) {
        return { found: true, dismissed: true, manualActionRequired: false };
      }

      delete dialog.dataset.cpDismissing;

      return {
        found: true,
        dismissed: false,
        manualActionRequired: true,
        message:
          "CP Bot could not close Amazon's Prime offer safely. Please click No thanks or the X manually, then continue.",
      };
    }

    await delay(250);
  }

  return { found: false, dismissed: false, manualActionRequired: false };
}

function selectOriginalAddress(dialog: HTMLElement) {
  const radios = Array.from(dialog.querySelectorAll<HTMLInputElement>("input[type='radio']"));
  const originalRadio = radios.find((radio) => {
    const scope = radio.closest<HTMLElement>("label, .a-radio, .a-box, .a-row, li, div") || radio;
    return textOf(scope).toLowerCase().includes("original address");
  });

  if (!originalRadio) {
    return false;
  }

  // Check if original address radio is already selected
  if (originalRadio.checked) {
    return true;
  }

  // Find the label associated with the radio button if it exists
  let labelElement: HTMLElement | null = null;
  if (originalRadio.id) {
    labelElement = dialog.querySelector<HTMLElement>(`label[for="${originalRadio.id}"]`);
  }
  if (!labelElement) {
    labelElement = originalRadio.closest<HTMLElement>("label");
  }

  // Select original address radio using human-like single click
  const targetElement = labelElement || originalRadio;
  dispatchHumanLikeClick(targetElement);

  // Force checking properties and dispatching events to update any framework states
  originalRadio.checked = true;
  originalRadio.dispatchEvent(new Event("click", { bubbles: true }));
  originalRadio.dispatchEvent(new Event("input", { bubbles: true }));
  originalRadio.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

async function resolveAddressVerificationIfPresent(timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (detectSecurityChallenge()) {
      return { found: false, selectedOriginal: false, submittedOriginal: false };
    }

    const dialog = findAddressVerificationDialog();
    if (dialog) {
      updateStatus("Selecting original address...");
      const selectedOriginal = selectOriginalAddress(dialog);
      await delay(1000);
      updateStatus("Submitting original address selection...");
      const submittedOriginal = submitAddressForm(dialog);
      if (submittedOriginal) {
        unlockAutomationButtons();
      }
      return { found: true, selectedOriginal, submittedOriginal };
    }

    await delay(250);
  }

  return { found: false, selectedOriginal: false, submittedOriginal: false };
}

export async function fillAmazonAddress(address: Address): Promise<FillResult> {
  const anomaly = detectAmazonCheckoutAnomaly();
  if (anomaly) {
    return manualActionResult(anomaly);
  }

  const challenge = detectSecurityChallenge();
  if (challenge) {
    return blockedBySecurityChallengeResult(challenge);
  }

  const result: FillResult = {
    filled: [],
    missing: [],
  };
  const normalized = normalizeAddress(address);

  updateStatus("Filling full name...");
  fillField("fullName", normalized.buyerName, result);
  await delay(800);

  updateStatus("Entering phone number...");
  fillField("phone", normalized.phone, result);
  await delay(800);

  updateStatus("Entering street address line 1...");
  // Fill street1 with natural interaction
  const street1El = queryField("street1");
  if (street1El) {
    street1El.focus();
    street1El.click();
    await delay(500);
  }
  fillField("street1", normalized.street1, result);
  await delay(500);

  updateStatus("Entering street address line 2...");
  // Focus and click Street2 box → wait 500ms → fill value.
  const street2El = queryField("street2");
  if (street2El) {
    street2El.focus();
    street2El.click();
    await delay(500);
  }
  fillField("street2", normalized.street2, result);
  await delay(500); // Wait 500ms.

  updateStatus("Entering postcode...");
  fillField("postcode", normalized.postcode, result);
  await delay(2000); // Wait 2000ms → select City/Suburb.

  updateStatus("Selecting city/suburb...");
  await waitForSelectOption("city", normalized.suburb);
  fillField("city", normalized.suburb, result);

  return result;
}

export async function addOrFillAmazonAddress(address: Address, options: FillOptions = {}): Promise<FillResult> {
  const startingAnomaly = detectAmazonCheckoutAnomaly();
  if (startingAnomaly) {
    return manualActionResult(startingAnomaly);
  }

  const startingChallenge = detectSecurityChallenge();
  if (startingChallenge) {
    return blockedBySecurityChallengeResult(startingChallenge);
  }

  updateStatus("Opening new address form...");
  const openedAddressForm = await openAddNewAddressForm();
  
  updateStatus("Pasting address fields...");
  const result = await fillAmazonAddress(address);
  result.openedAddressForm = openedAddressForm;

  if (result.blockedBySecurityChallenge) {
    return result;
  }

  const missingRequired = result.missing.filter((field) => REQUIRED_FIELDS.includes(field as keyof typeof FIELD_SELECTORS));
  if (missingRequired.length === 0) {
    if (options.autoUseThisAddress) {
      const challengeBeforeSubmit = detectSecurityChallenge();
      if (challengeBeforeSubmit) {
        return {
          ...result,
          blockedBySecurityChallenge: true,
          message: securityChallengeMessage(challengeBeforeSubmit),
        };
      }

      // 1. Show waiting message and wait 4 seconds before submitting address form
      updateStatus("Wating for few seconds to load...");
      await delay(4000);

      // 2. Wait for submit button to be visible & clickable (max 2 seconds)
      const submitBtn = await waitForSubmitAddressButton(2000);
      if (submitBtn) {
        // 3. Scroll into view
        submitBtn.scrollIntoView({ block: "center", inline: "center" });
        // 4. Dispatch real MouseEvent sequence (mouseover -> mousemove -> mousedown -> mouseup -> click)
        result.submittedAddressForm = dispatchHumanLikeClick(submitBtn);
      } else {
        result.submittedAddressForm = submitAddressForm();
      }

      // 5. Set status to "Submitting address form..." and proceed without fixed delay
      updateStatus("Submitting address form...");
      if (result.submittedAddressForm) {
        unlockAutomationButtons();
        const startWait = Date.now();
        const maxWait = isSlowNetwork() ? 6000 : 3000;
        let verification = { found: false, selectedOriginal: false, submittedOriginal: false };
        let primeUpsell = { found: false, dismissed: false, manualActionRequired: false, message: "" };

        while (Date.now() - startWait < maxWait) {
          const url = window.location.href;
          if (url.includes("/spc")) {
            break;
          }
          verification = await resolveAddressVerificationIfPresent();
          primeUpsell = await dismissPrimeExpeditedDeliveryPromptIfPresent();
          if (verification.found || primeUpsell.found) {
            break;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 200));
        }

        result.dismissedPrimeUpsell = primeUpsell.dismissed;
        if (primeUpsell.found) {
          result.primePromptDetected = true;
          result.primePromptDismissed = primeUpsell.dismissed;
        }

        if (primeUpsell.manualActionRequired) {
          result.manualActionRequired = true;
          result.message = primeUpsell.message || AMAZON_MANUAL_ACTION_MESSAGE;
          return result;
        }

        const anomalyAfterSubmit = detectAmazonCheckoutAnomaly();
        if (anomalyAfterSubmit) {
          result.manualActionRequired = true;
          result.message = anomalyAfterSubmit;
          return result;
        }

        if (verification.found) {
          result.message =
            verification.selectedOriginal && verification.submittedOriginal
              ? primeUpsell.dismissed
                ? "Address filled, original address selected, Prime prompt dismissed, and submitted to Amazon AU."
                : "Address filled, original address selected, and submitted to Amazon AU."
              : "Address filled, but CP Bot could not submit Amazon's original address prompt.";
        } else if (primeUpsell.dismissed) {
          result.message = "Address filled, submitted to Amazon AU, and Prime prompt dismissed.";
        } else {
          result.message = "Address filled and submitted to Amazon AU.";
        }
      } else {
        result.message = "Address filled. Could not find Amazon's Use this address button.";
      }
    } else {
      result.message = "Address filled. Review it, then click Amazon's address save/use button.";
    }
  } else {
    result.message = `Filled ${result.filled.length} Amazon field(s). Missing: ${missingRequired.join(", ")}.`;
  }

  return result;
}

export function findAmazonSpcChangeAddressElements(): { deliveringTo: HTMLElement | null; changeLink: HTMLElement | null } {
  // Find the deepest element containing "Delivering to"
  const allCandidates = Array.from(document.querySelectorAll("h1, h2, h3, h4, div, span, b, strong, td"));
  const deliveringTo = allCandidates.find((el) => {
    const text = el.textContent || "";
    if (!text.includes("Delivering to")) {
      return false;
    }
    const hasChildWithText = Array.from(el.children).some((child) => 
      child.textContent?.includes("Delivering to")
    );
    return !hasChildWithText;
  }) as HTMLElement | null;

  // Find the "Change" link inside the same container
  let changeLink: HTMLElement | null = null;
  if (deliveringTo) {
    let parent = deliveringTo.parentElement;
    for (let i = 0; i < 4; i++) {
      if (!parent) break;
      const found = Array.from(parent.querySelectorAll("a, span, div, button")).find((child) => {
        const text = child.textContent?.trim() || "";
        return text === "Change" || text === "Change address";
      });
      if (found) {
        changeLink = found as HTMLElement;
        break;
      }
      parent = parent.parentElement;
    }
  }

  // Fallback: search for any "Change" link inside a block containing delivery or address keywords
  if (!changeLink) {
    const allLinks = Array.from(document.querySelectorAll("a, span.a-declarative, span.a-button, button"));
    const found = allLinks.find((el) => {
      const text = el.textContent?.trim() || "";
      if (text !== "Change") return false;
      const section = el.closest("div, span, td");
      const sectionText = section?.textContent || "";
      return sectionText.includes("Delivering to") || sectionText.includes("address") || sectionText.includes("shipping");
    });
    if (found) {
      changeLink = found as HTMLElement;
    }
  }

  return { deliveringTo, changeLink };
}
