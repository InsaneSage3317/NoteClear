// ─── Notification Generator ──────────────────────────────────
// Produces realistic sample notifications for demo/testing mode
// when the native NotificationListenerService is unavailable.

const SPAM_TEMPLATES = [
  { sender: 'PromoKing', title: 'Exclusive Offer Just For You!', body: 'Get 90% off on our exclusive loan package. Limited time offer — act now!', packageName: 'com.promoking.deals' },
  { sender: 'WinBigNow', title: 'Congratulations! You Won!', body: 'Claim your exclusive prize worth $10,000. Click here to collect your offer.', packageName: 'com.winbig.app' },
  { sender: 'QuickLoans', title: 'Instant Loan Approval', body: 'Get a personal loan at 0% interest. No documents needed. Apply now for this exclusive deal.', packageName: 'com.quickloans' },
  { sender: 'DealZone', title: 'Flash Sale — 95% Off!', body: 'Exclusive offer on electronics. Free shipping + cashback offer. Buy now!', packageName: 'com.dealzone' },
  { sender: 'PromoKing', title: 'Last Chance Offer!', body: 'Your exclusive discount expires tonight. Loan pre-approved. Act now!', packageName: 'com.promoking.deals' },
  { sender: 'PromoKing', title: 'Mega Savings Inside', body: 'Open to see your exclusive offer. Pre-approved loan waiting for you.', packageName: 'com.promoking.deals' },
  { sender: 'EasyMoney', title: 'Earn Money From Home', body: 'No cost to start. Risk free investment. Limited time offer available.', packageName: 'com.easymoney' },
];

const TRANSACTION_TEMPLATES = [
  { sender: 'Google Pay', title: 'Payment Successful', body: '₹2,450 debited to PhonePe user Arjun. UPI Ref: 417289356.', packageName: 'com.google.android.apps.nbu.paisa.user' },
  { sender: 'HDFC Bank', title: 'Transaction Alert', body: '₹15,000 credited to your account from NEFT transfer. Balance: ₹45,230.', packageName: 'com.snapwork.hdfc' },
  { sender: 'PhonePe', title: 'UPI Payment', body: '₹890 debited for Amazon recharge. Transaction ID: PHN849201.', packageName: 'com.phonepe.app' },
  { sender: 'SBI', title: 'ATM Withdrawal', body: '₹5,000 withdrawal from ATM ID 4582. Available balance: ₹32,150.', packageName: 'com.sbi.SBIFreedomPlus' },
  { sender: 'Paytm', title: 'Bill Payment Receipt', body: 'Electricity bill payment of ₹3,200 successful. Invoice #EL-7829.', packageName: 'net.one97.paytm' },
  { sender: 'ICICI Bank', title: 'OTP for Transaction', body: 'Your OTP is 482916. Valid for 10 mins. Do not share with anyone.', packageName: 'com.csam.icici.bank.imobile' },
];

const PERSONAL_TEMPLATES = [
  { sender: 'Mom', title: 'Call me when free', body: 'Hey, are you coming home for dinner tonight? Miss you!', packageName: 'com.whatsapp' },
  { sender: 'Dad', title: 'Birthday reminder', body: "Hey, don't forget your aunt's birthday party this Saturday.", packageName: 'com.whatsapp' },
  { sender: 'Boss', title: 'Quick sync', body: 'Hi, can you call me regarding the client meeting? Need help.', packageName: 'com.whatsapp' },
  { sender: 'WhatsApp', title: 'New message from Priya', body: 'Hello! How are you? We should catch up for dinner soon.', packageName: 'com.whatsapp' },
  { sender: 'Telegram', title: '3 new messages', body: 'Hey, are you joining the group trip next month? Let me know!', packageName: 'org.telegram.messenger' },
];

const WORK_TEMPLATES = [
  { sender: 'GitHub', title: 'Pull Request #482', body: 'New review requested on PR "Refactor auth pipeline". Merge blocker resolved.', packageName: 'com.github.android' },
  { sender: 'Jira', title: 'Ticket Assigned', body: 'PROJ-1847 "Fix release pipeline" assigned to you. Sprint deadline: Friday.', packageName: 'com.atlassian.android.jira.core' },
  { sender: 'Slack', title: '#deploy channel', body: 'Build #392 deployed to staging. Pipeline passed all checks.', packageName: 'com.slack' },
  { sender: 'GitHub', title: 'CI Pipeline Failed', body: 'Build failed on branch feature/auth. 3 tests failing.', packageName: 'com.github.android' },
];

const GENERAL_TEMPLATES = [
  { sender: 'Weather App', title: 'Rain Alert', body: 'Heavy rain expected in your area from 4 PM to 9 PM today.', packageName: 'com.weather.app' },
  { sender: 'News Daily', title: 'Breaking News', body: 'Markets hit all-time high. Sensex crosses 85,000 for the first time.', packageName: 'com.news.daily' },
  { sender: 'Fitness Pro', title: 'Daily Goal', body: "You've walked 6,200 steps today. 3,800 more to hit your goal!", packageName: 'com.fitness.pro' },
  { sender: 'Calendar', title: 'Upcoming Event', body: "Dentist appointment tomorrow at 10:30 AM. Don't forget!", packageName: 'com.google.android.calendar' },
];

const ALL_POOLS = [
  { weight: 25, templates: SPAM_TEMPLATES },
  { weight: 25, templates: TRANSACTION_TEMPLATES },
  { weight: 20, templates: PERSONAL_TEMPLATES },
  { weight: 18, templates: WORK_TEMPLATES },
  { weight: 12, templates: GENERAL_TEMPLATES },
];

let idCounter = 0;

function pickWeighted() {
  const total = ALL_POOLS.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const pool of ALL_POOLS) {
    r -= pool.weight;
    if (r <= 0) return pool.templates;
  }
  return GENERAL_TEMPLATES;
}

export function generateNotification(forceOld = false) {
  const templates = pickWeighted();
  const template = templates[Math.floor(Math.random() * templates.length)];

  const timestamp = forceOld
    ? Date.now() - (25 * 60 * 60 * 1000) - Math.random() * 3600000
    : Date.now() - Math.random() * 60000;

  return {
    id: `demo-${++idCounter}-${Date.now()}`,
    ...template,
    timestamp,
    dismissed: false,
    isOngoing: false,
    category: null,
    processedAt: null,
  };
}

export function generateBatch(count = 5, includeOld = true) {
  const batch = [];
  for (let i = 0; i < count; i++) {
    const forceOld = includeOld && i === count - 1;
    batch.push(generateNotification(forceOld));
  }
  return batch;
}
