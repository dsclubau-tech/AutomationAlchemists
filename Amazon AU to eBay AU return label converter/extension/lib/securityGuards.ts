export interface SecurityChallenge {
  reason: string;
}

const SECURITY_CHALLENGE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bcaptcha\b/i, reason: "CAPTCHA" },
  { pattern: /\b(?:i'?m|i am)\s+not\s+a\s+robot\b/i, reason: "CAPTCHA" },
  { pattern: /\b(?:enter|type)\s+the\s+characters\s+you\s+see\b/i, reason: "CAPTCHA" },
  { pattern: /\bprove\s+(?:you'?re|you are)\s+human\b/i, reason: "human verification" },
  { pattern: /\bverify\s+(?:it'?s|it is)\s+you\b/i, reason: "account verification" },
  { pattern: /\btwo[-\s]?step\s+verification\b/i, reason: "two-step verification" },
  { pattern: /\btwo[-\s]?factor\s+authentication\b/i, reason: "two-factor authentication" },
  { pattern: /\b2fa\b/i, reason: "two-factor authentication" },
  { pattern: /\bone[-\s]?time\s+(?:password|passcode|code)\b/i, reason: "one-time code" },
  { pattern: /\botp\b/i, reason: "one-time code" },
  { pattern: /\bverification\s+code\b/i, reason: "verification code" },
  { pattern: /\bsecurity\s+challenge\b/i, reason: "security challenge" },
  { pattern: /\bsecurity\s+check\b/i, reason: "security check" },
  { pattern: /\bunusual\s+activity\b/i, reason: "account warning" },
  { pattern: /\bsuspicious\s+activity\b/i, reason: "account warning" },
  { pattern: /\baccount\s+(?:warning|restricted|locked|temporarily\s+locked)\b/i, reason: "account warning" },
  { pattern: /\btoo\s+many\s+requests\b/i, reason: "rate limit" },
  { pattern: /\brate\s+limit(?:ed)?\b/i, reason: "rate limit" },
  { pattern: /\bautomated\s+access\b/i, reason: "automated access warning" },
  { pattern: /\bbrowser\s+fingerprint(?:ing)?\b/i, reason: "browser security warning" },
];

const SECURITY_CHALLENGE_SELECTORS = [
  "#captchacharacters",
  "input[name*='captcha' i]",
  "input[id*='captcha' i]",
  "img[src*='captcha' i]",
  "iframe[src*='captcha' i]",
  "iframe[title*='captcha' i]",
  "[id*='captcha' i]",
  "[class*='captcha' i]",
  "iframe[src*='recaptcha' i]",
  "iframe[title*='recaptcha' i]",
  "iframe[src*='hcaptcha' i]",
  "iframe[title*='hcaptcha' i]",
  "input[name*='otp' i]",
  "input[id*='otp' i]",
  "input[name*='mfa' i]",
  "input[id*='mfa' i]",
  "input[name*='twoStep' i]",
  "input[id*='twoStep' i]",
  "input[autocomplete='one-time-code']",
];

const BLOCKED_AUTOMATION_ACTION_PATTERNS = [
  /\bplace\s+(?:your\s+)?order\b/i,
  /\bplace\s+order\b/i,
  /\bbuy\s+now\b/i,
  /\bcomplete\s+(?:purchase|order|checkout)\b/i,
  /\bcontinue\s+with\s+prime\s+and\s+pay\b/i,
  /\bsign\s+up\s+and\s+pay\b/i,
  /\bprime\s+and\s+pay\b/i,
  /\bsubmit\s+order\b/i,
  /\bconfirm\s+(?:purchase|order)\b/i,
];

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
}

function visibleText(root: Document) {
  return (root.body?.innerText || root.body?.textContent || "").replace(/\s+/g, " ").trim();
}

function matchingSelectorReason(root: Document) {
  const selector = SECURITY_CHALLENGE_SELECTORS.join(",");
  const element = Array.from(root.querySelectorAll<HTMLElement>(selector)).find(isVisible);

  if (!element) {
    return null;
  }

  const text = `${element.id} ${element.className} ${element.getAttribute("name") || ""} ${
    element.getAttribute("title") || ""
  } ${element.getAttribute("aria-label") || ""}`;
  const matchedPattern = SECURITY_CHALLENGE_PATTERNS.find(({ pattern }) => pattern.test(text));

  return matchedPattern?.reason || "security challenge";
}

export function detectSecurityChallenge(root: Document = document): SecurityChallenge | null {
  const selectorReason = matchingSelectorReason(root);
  if (selectorReason) {
    return { reason: selectorReason };
  }

  const text = visibleText(root);
  // Ignore delivery-related signature or one-time password warnings
  const cleanedText = text
    .replace(/\bsignature\s+or\s+one[-\s]time\s+password\s+required/i, "")
    .replace(/\bone[-\s]time\s+password\s+required\s+at\s+time\s+of\s+delivery/i, "");

  const matchedPattern = SECURITY_CHALLENGE_PATTERNS.find(({ pattern }) => pattern.test(cleanedText));

  return matchedPattern ? { reason: matchedPattern.reason } : null;
}

export function securityChallengeMessage(challenge: SecurityChallenge) {
  return `Security challenge detected (${challenge.reason}). CP Bot stopped automation. Complete this step manually, then refresh or retry.`;
}

export function isBlockedAutomationAction(text: string) {
  return BLOCKED_AUTOMATION_ACTION_PATTERNS.some((pattern) => pattern.test(text));
}
