import { detectSecurityChallenge } from "../lib/securityGuards";
import { isExtensionContextReady, debugLog } from "../lib/storage";

const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-*]+@[a-zA-Z0-9.\-*]+\.[a-zA-Z*]{2,}/;

function findChallengeIndicators(): boolean {
  if (detectSecurityChallenge(document)) {
    return true;
  }
  return !!(
    document.querySelector('input[type="password"]') ||
    document.querySelector('input[name="otpCode"]') ||
    /verify your identity|enter the code|captcha/i.test(document.body.innerText)
  );
}

function scrapeCheckedAccount(): { email: string | null } {
  // Find all elements containing the email pattern where no child elements also match the pattern (innermost leaf elements)
  const allElements = Array.from(document.querySelectorAll("body *"));
  const rows = allElements.filter((el) => {
    const text = el.textContent || "";
    if (!EMAIL_PATTERN.test(text)) return false;
    const hasMatchingChild = Array.from(el.children).some((child) =>
      EMAIL_PATTERN.test(child.textContent || "")
    );
    return !hasMatchingChild;
  });

  debugLog("CP Bot Account Check: rows found:", rows.map(r => r.textContent));


  // Prefer the row nearest a checkmark/selected indicator (svg or icon with
  // aria-label containing "selected", or a checkmark glyph in a sibling element).
  // Fallback: if exactly one account row exists on the page, use it directly.
  // Implement a DOM-nearest-checkmark heuristic here, falling back to the
  // single-row case when there's no picker (already-selected account only).

  if (rows.length === 0) return { email: null };

  const checkmarks = Array.from(document.querySelectorAll("svg, i, span, img, div"))
    .filter(el => {
      const ariaLabel = el.getAttribute("aria-label") || "";
      if (/selected|active|checkmark/i.test(ariaLabel)) return true;
      const className = el.className || "";
      if (typeof className === "string" && /selected|active|checkmark|check-mark/i.test(className)) return true;
      const text = el.textContent || "";
      if (/^[✓✔]$/.test(text.trim())) return true;
      return false;
    });

  let bestNode: Element | null = null;
  let minDistance = Infinity;

  for (const node of rows) {
    for (const check of checkmarks) {
      let parent: HTMLElement | null = node.parentElement;
      let distNode = 0;
      while (parent) {
        distNode++;
        if (parent.contains(check)) {
          let child: HTMLElement | null = check.parentElement;
          let distCheck = 0;
          while (child && child !== parent) {
            distCheck++;
            child = child.parentElement;
          }
          const totalDist = distNode + distCheck;
          if (totalDist < minDistance) {
            minDistance = totalDist;
            bestNode = node;
          }
          break;
        }
        parent = parent.parentElement;
      }
    }
  }

  if (bestNode && minDistance < 10) {
    debugLog("CP Bot Account Check: Selected bestNode based on checkmark distance. Node:", bestNode.textContent, "Distance:", minDistance);
    const emailMatch = bestNode.textContent?.match(EMAIL_PATTERN);
    if (emailMatch) return { email: emailMatch[0] };
  } else {
    debugLog("CP Bot Account Check: No node found within checkmark threshold. Falling back. Rows count:", rows.length);
  }

  if (rows.length === 1) {
    const emailMatch = rows[0].textContent?.match(EMAIL_PATTERN);
    if (emailMatch) return { email: emailMatch[0] };
  }

  const firstEmailMatch = rows[0].textContent?.match(EMAIL_PATTERN);
  return { email: firstEmailMatch ? firstEmailMatch[0] : null };
}

(function main() {
  if (!window.location.search.includes("switch_account=picker")) {
    return;
  }

  const startTime = Date.now();
  const maxWaitMs = 5000;

  function poll() {
    if (!isExtensionContextReady()) {
      return;
    }

    try {
      if (findChallengeIndicators()) {
        chrome.runtime.sendMessage({ type: "CPBOT_AMAZON_ACCOUNT_CHECK_RESULT", status: "challenge" }).catch(() => undefined);
        return;
      }

      const result = scrapeCheckedAccount();
      if (result.email) {
        chrome.runtime.sendMessage({
          type: "CPBOT_AMAZON_ACCOUNT_CHECK_RESULT",
          status: "active",
          email: result.email,
        }).catch(() => undefined);
        return;
      }

      if (Date.now() - startTime < maxWaitMs) {
        setTimeout(poll, 250);
      } else {
        // Page loaded but no picker elements containing email found within timeout
        chrome.runtime.sendMessage({ type: "CPBOT_AMAZON_ACCOUNT_CHECK_RESULT", status: "no_picker" }).catch(() => undefined);
      }
    } catch (err) {
      console.log("CP Bot Account Check: poll() aborted due to error:", err);
    }
  }

  poll();
})();
