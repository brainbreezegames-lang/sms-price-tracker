/** Country flag emoji from ISO 3166-1 alpha-2 code */
export function countryFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Format SMS price: $0.0079 (4 decimal places for sub-cent) */
export function fmtSMSPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(4)}`;
  if (price < 0.1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(2)}`;
}

/** Format a dollar amount for display */
export function fmtDollars(amount: number): string {
  if (amount < 1) return `$${amount.toFixed(2)}`;
  if (amount < 1000) return `$${amount.toFixed(0)}`;
  return `$${(amount / 1000).toFixed(1)}k`;
}

/** Calculate cost for a volume of messages */
export function costForVolume(pricePerSms: number, volume: number): string {
  const total = pricePerSms * volume;
  return fmtDollars(total);
}

/** Format large numbers with K/M suffix */
export function fmtVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

/** Channel display labels */
export function channelLabel(type: string): string {
  switch (type) {
    case 'sms': return 'SMS';
    case 'mms': return 'MMS';
    case 'whatsapp': return 'WhatsApp';
    case 'rcs': return 'RCS';
    default: return type.toUpperCase();
  }
}

/** Channel badge colors */
export function channelColor(type: string): { bg: string; text: string; darkBg: string; darkText: string } {
  switch (type) {
    case 'sms': return { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-500/15', darkText: 'dark:text-blue-400' };
    case 'mms': return { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'dark:bg-purple-500/15', darkText: 'dark:text-purple-400' };
    case 'whatsapp': return { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-500/15', darkText: 'dark:text-emerald-400' };
    case 'rcs': return { bg: 'bg-orange-100', text: 'text-orange-700', darkBg: 'dark:bg-orange-500/15', darkText: 'dark:text-orange-400' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-700', darkBg: 'dark:bg-slate-500/15', darkText: 'dark:text-slate-400' };
  }
}

/** Freshness indicator */
export function getFreshness(lastUpdated: string): {
  level: 'live' | 'recent' | 'stale' | 'old';
  label: string;
  dotClass: string;
} {
  const diffMs = Date.now() - new Date(lastUpdated).getTime();
  const hours = diffMs / 3_600_000;
  if (hours < 1) return { level: 'live', label: 'Just now', dotClass: 'bg-brand-400' };
  if (hours < 24) return { level: 'recent', label: `${Math.floor(hours)}h ago`, dotClass: 'bg-yellow-400' };
  if (hours < 72) return { level: 'stale', label: `${Math.floor(hours / 24)}d ago`, dotClass: 'bg-amber-400' };
  return { level: 'old', label: `${Math.floor(hours / 24)}d ago`, dotClass: 'bg-red-400' };
}

/** Provider signup URLs */
export const PROVIDER_SIGNUP_URLS: Record<string, string> = {
  Twilio: 'https://www.twilio.com/try-twilio',
  Vonage: 'https://dashboard.nexmo.com/sign-up',
  MessageBird: 'https://dashboard.messagebird.com/en/sign-up',
  Telnyx: 'https://telnyx.com/sign-up',
  Plivo: 'https://console.plivo.com/accounts/register/',
  ClickSend: 'https://dashboard.clicksend.com/signup',
  Sinch: 'https://dashboard.sinch.com/signup',
  Infobip: 'https://www.infobip.com/signup',
  Bandwidth: 'https://www.bandwidth.com/sign-up/',
  'Amazon SNS': 'https://aws.amazon.com/sns/',
  Azure: 'https://azure.microsoft.com/en-us/products/communication-services/',
  Clickatell: 'https://www.clickatell.com/sign-up/',
  "Africa's Talking": 'https://account.africastalking.com/auth/register',
};

/** Provider pricing page URLs */
export const PROVIDER_PRICING_URLS: Record<string, string> = {
  Twilio: 'https://www.twilio.com/en-us/sms/pricing',
  Vonage: 'https://www.vonage.com/communications-apis/sms/pricing/',
  MessageBird: 'https://www.messagebird.com/en/pricing',
  Telnyx: 'https://telnyx.com/pricing/messaging',
  Plivo: 'https://www.plivo.com/sms/pricing/',
  ClickSend: 'https://www.clicksend.com/us/pricing',
  Sinch: 'https://www.sinch.com/pricing/messaging-prices/',
  Infobip: 'https://www.infobip.com/pricing',
  Bandwidth: 'https://www.bandwidth.com/messaging/pricing/',
  'Amazon SNS': 'https://aws.amazon.com/sns/sms-pricing/',
  Azure: 'https://azure.microsoft.com/en-us/pricing/details/communication-services/',
  Clickatell: 'https://www.clickatell.com/pricing/',
  "Africa's Talking": 'https://africastalking.com/sms',
};

/** Provider brand colors (for badges/charts) */
export const PROVIDER_COLORS: Record<string, string> = {
  Twilio: '#F22F46',
  Vonage: '#7B2D8E',
  MessageBird: '#2481FF',
  Telnyx: '#00C08B',
  Plivo: '#56B247',
  ClickSend: '#0099FF',
  Sinch: '#FF6B00',
  Infobip: '#FF5722',
  Bandwidth: '#079CEE',
  'Amazon SNS': '#FF9900',
  Azure: '#0078D4',
  Clickatell: '#4CAF50',
  "Africa's Talking": '#F9A825',
};

/** Slugify provider name for URL */
export function providerSlug(name: string): string {
  return name.toLowerCase().replace(/['\s]+/g, '-');
}

/** Un-slugify provider name */
export function providerFromSlug(slug: string): string | undefined {
  const map: Record<string, string> = {
    twilio: 'Twilio',
    vonage: 'Vonage',
    messagebird: 'MessageBird',
    telnyx: 'Telnyx',
    plivo: 'Plivo',
    clicksend: 'ClickSend',
    sinch: 'Sinch',
    infobip: 'Infobip',
    bandwidth: 'Bandwidth',
    'amazon-sns': 'Amazon SNS',
    azure: 'Azure',
    clickatell: 'Clickatell',
    'africas-talking': "Africa's Talking",
  };
  return map[slug];
}
