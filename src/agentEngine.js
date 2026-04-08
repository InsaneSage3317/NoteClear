// ─── Agent Engine ─────────────────────────────────────────────
// Core logic for the Antigravity Orchestrator and its 3 sub-agents.
// Pure functions – no React dependency – works on any JS runtime.

// ============================================================
//  CONSTANTS
// ============================================================
const SPAM_KEYWORDS = [
  'loan', 'offer', 'exclusive', 'congratulations', 'winner',
  'free', 'limited time', 'act now', 'click here', 'prize',
  'urgent deal', 'earn money', 'no cost', 'risk free',
  'buy now', 'discount', 'cashback offer',
];

const TRUSTED_SENDERS = [
  'google pay', 'phonepe', 'paytm', 'amazon pay', 'bank of india',
  'hdfc bank', 'icici bank', 'sbi', 'axis bank', 'whatsapp',
  'telegram', 'mom', 'dad', 'boss', 'team lead',
  'hr department', 'github', 'jira', 'slack',
];

const TRUSTED_PACKAGES = [
  'com.google.android.apps.nbu.paisa.user',   // Google Pay
  'com.phonepe.app',                            // PhonePe
  'net.one97.paytm',                            // Paytm
  'in.amazon.mShop.android.shopping',           // Amazon
  'com.whatsapp',                                // WhatsApp
  'org.telegram.messenger',                      // Telegram
  'com.slack',                                   // Slack
  'com.google.android.gm',                       // Gmail
  'com.google.android.dialer',                   // Phone
  'com.google.android.apps.messaging',           // Messages
];

const TRANSACTION_KEYWORDS = [
  'debited', 'credited', 'transaction', 'payment', 'upi',
  'transfer', 'balance', 'withdrawal', 'deposit', 'otp',
  'invoice', 'receipt', 'neft', 'imps', 'rtgs',
];

const PERSONAL_KEYWORDS = [
  'hey', 'hello', 'hi', 'miss you', 'call me', 'dinner',
  'meeting', 'birthday', 'party', 'urgent', 'help',
  'how are you', 'coming home', 'good morning',
];

const WORK_KEYWORDS = [
  'deploy', 'merge', 'pull request', 'review', 'sprint',
  'standup', 'deadline', 'release', 'build', 'pipeline',
  'ticket', 'assigned', 'blocker', 'pr #',
];

const BANKING_PACKAGES = [
  'com.google.android.apps.nbu.paisa.user',
  'com.phonepe.app',
  'net.one97.paytm',
  'com.csam.icici.bank.imobile',
  'com.snapwork.hdfc',
  'com.sbi.SBIFreedomPlus',
];

const SOCIAL_PACKAGES = [
  'com.whatsapp',
  'org.telegram.messenger',
  'com.instagram.android',
  'com.facebook.orca',
  'com.snapchat.android',
  'com.twitter.android',
];

// ============================================================
//  NOTIFICATION CATEGORIES
// ============================================================
export const CATEGORIES = {
  SPAM: 'spam',
  TRANSACTION: 'transaction',
  PERSONAL: 'personal',
  WORK: 'work',
  SOCIAL: 'social',
  GENERAL: 'general',
};

const CATEGORY_META = {
  [CATEGORIES.SPAM]:        { label: 'Spam',        color: '#f43f5e', icon: '🚫', emoji: '🚫' },
  [CATEGORIES.TRANSACTION]: { label: 'Transaction', color: '#10b981', icon: '💳', emoji: '💳' },
  [CATEGORIES.PERSONAL]:    { label: 'Personal',    color: '#3b82f6', icon: '👤', emoji: '👤' },
  [CATEGORIES.WORK]:        { label: 'Work',        color: '#8b5cf6', icon: '💼', emoji: '💼' },
  [CATEGORIES.SOCIAL]:      { label: 'Social',      color: '#06b6d4', icon: '💬', emoji: '💬' },
  [CATEGORIES.GENERAL]:     { label: 'General',     color: '#f59e0b', icon: '📋', emoji: '📋' },
};

export function getCategoryMeta(cat) {
  return CATEGORY_META[cat] || CATEGORY_META[CATEGORIES.GENERAL];
}

// ============================================================
//  SUB-AGENT A  –  Spam Filter
// ============================================================
const unknownSenderCounts = new Map();

function containsSpamKeyword(text) {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.some((kw) => lower.includes(kw));
}

function isTrustedSender(sender) {
  const lower = sender.toLowerCase();
  return TRUSTED_SENDERS.some((t) => lower.includes(t));
}

function isTrustedPackage(packageName) {
  if (!packageName) return false;
  return TRUSTED_PACKAGES.some((p) => packageName.includes(p));
}

function isRepeatedUnknown(sender) {
  if (isTrustedSender(sender)) return false;
  const count = (unknownSenderCounts.get(sender) || 0) + 1;
  unknownSenderCounts.set(sender, count);
  return count >= 3;
}

/**
 * Sub-Agent A: returns { isSpam, reasons[] }
 */
export function agentA_spamFilter(notification) {
  const reasons = [];
  const { sender, title, body, packageName } = notification;
  const fullText = `${title} ${body}`;

  // Skip system / ongoing notifications
  if (notification.isOngoing) {
    return { isSpam: false, reasons: ['Ongoing notification — skipped'] };
  }

  if (containsSpamKeyword(fullText)) {
    const matched = SPAM_KEYWORDS.filter((k) => fullText.toLowerCase().includes(k));
    reasons.push(`Spam keywords: ${matched.join(', ')}`);
  }

  if (isRepeatedUnknown(sender)) {
    reasons.push(`Repeated unknown sender "${sender}"`);
  }

  if (!isTrustedSender(sender) && !isTrustedPackage(packageName) && containsSpamKeyword(fullText)) {
    reasons.push('Untrusted sender with suspicious content');
  }

  return { isSpam: reasons.length > 0, reasons };
}

export function resetSpamTracker() {
  unknownSenderCounts.clear();
}

// ============================================================
//  SUB-AGENT B  –  Categorizer
// ============================================================
function matchesKeywords(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Sub-Agent B: returns { category, confidence, reason }
 */
export function agentB_categorize(notification) {
  const { sender, title, body, packageName } = notification;
  const fullText = `${title} ${body}`;

  // Transaction alerts (by package or keywords)
  if (
    BANKING_PACKAGES.some((p) => packageName?.includes(p)) ||
    matchesKeywords(fullText, TRANSACTION_KEYWORDS)
  ) {
    return {
      category: CATEGORIES.TRANSACTION,
      confidence: 0.95,
      reason: 'Transaction/banking notification detected',
    };
  }

  // Personal contacts
  if (
    matchesKeywords(fullText, PERSONAL_KEYWORDS) &&
    (isTrustedSender(sender) || isTrustedPackage(packageName))
  ) {
    return {
      category: CATEGORIES.PERSONAL,
      confidence: 0.9,
      reason: 'Personal message from known contact',
    };
  }

  // Work
  if (matchesKeywords(fullText, WORK_KEYWORDS)) {
    return {
      category: CATEGORIES.WORK,
      confidence: 0.85,
      reason: 'Work/dev-related notification',
    };
  }

  // Social (by package)
  if (SOCIAL_PACKAGES.some((p) => packageName?.includes(p))) {
    return {
      category: CATEGORIES.SOCIAL,
      confidence: 0.8,
      reason: 'Social/messaging app notification',
    };
  }

  // Social (by sender name)
  if (
    isTrustedSender(sender) &&
    ['whatsapp', 'telegram', 'slack', 'instagram'].some((s) =>
      sender.toLowerCase().includes(s)
    )
  ) {
    return {
      category: CATEGORIES.SOCIAL,
      confidence: 0.7,
      reason: 'Social platform message',
    };
  }

  return {
    category: CATEGORIES.GENERAL,
    confidence: 0.5,
    reason: 'No strong category signals',
  };
}

// ============================================================
//  SUB-AGENT C  –  Auto-Cleanup (24-hour rule)
// ============================================================
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Sub-Agent C: returns list of notification IDs older than maxAgeMs.
 */
export function agentC_findExpired(notifications, maxAgeMs = TWENTY_FOUR_HOURS_MS) {
  const now = Date.now();
  return notifications
    .filter((n) => !n.dismissed && now - n.timestamp > maxAgeMs)
    .map((n) => n.id);
}

// ============================================================
//  ORCHESTRATOR  –  Main Antigravity Agent
// ============================================================
/**
 * Processes a single notification through the agent pipeline:
 *   1. Agent A (spam filter)
 *   2. Agent B (categorizer)
 * Returns { notification, log[] }
 */
export function orchestrate(notification) {
  const log = [];
  const start = Date.now();

  // ── Agent A ──
  const spamResult = agentA_spamFilter(notification);
  log.push({
    agent: 'A',
    agentName: 'Spam Filter',
    action: spamResult.isSpam ? 'DISMISSED' : 'PASSED',
    detail: spamResult.isSpam
      ? spamResult.reasons.join(' | ')
      : 'Clean — no spam detected',
    durationMs: Date.now() - start,
  });

  if (spamResult.isSpam) {
    return {
      notification: {
        ...notification,
        category: CATEGORIES.SPAM,
        dismissed: true,
        dismissedBy: 'Agent A',
        processedAt: Date.now(),
      },
      log,
    };
  }

  // ── Agent B ──
  const mid = Date.now();
  const catResult = agentB_categorize(notification);
  log.push({
    agent: 'B',
    agentName: 'Categorizer',
    action: 'CATEGORIZED',
    detail: `${getCategoryMeta(catResult.category).label} (${(catResult.confidence * 100).toFixed(0)}%) — ${catResult.reason}`,
    durationMs: Date.now() - mid,
  });

  return {
    notification: {
      ...notification,
      category: catResult.category,
      confidence: catResult.confidence,
      categoryReason: catResult.reason,
      dismissed: false,
      processedAt: Date.now(),
    },
    log,
  };
}
