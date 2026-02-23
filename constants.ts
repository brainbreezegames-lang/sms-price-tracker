import type { SMSDirection, MessageType } from './types';

export const PROVIDERS = [
  'Twilio',
  'Vonage',
  'MessageBird',
  'Telnyx',
  'Plivo',
  'ClickSend',
  'Sinch',
  'Infobip',
] as const;

export interface CountryInfo {
  iso: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryInfo[] = [
  { iso: 'US', name: 'United States', flag: '🇺🇸' },
  { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { iso: 'IN', name: 'India', flag: '🇮🇳' },
  { iso: 'DE', name: 'Germany', flag: '🇩🇪' },
  { iso: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { iso: 'JP', name: 'Japan', flag: '🇯🇵' },
  { iso: 'AU', name: 'Australia', flag: '🇦🇺' },
  { iso: 'FR', name: 'France', flag: '🇫🇷' },
  { iso: 'CA', name: 'Canada', flag: '🇨🇦' },
  { iso: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { iso: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { iso: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { iso: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { iso: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { iso: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { iso: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { iso: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { iso: 'ES', name: 'Spain', flag: '🇪🇸' },
  { iso: 'IT', name: 'Italy', flag: '🇮🇹' },
  { iso: 'NL', name: 'Netherlands', flag: '🇳🇱' },
];

export const COUNTRY_MAP = new Map(COUNTRIES.map(c => [c.iso, c]));

export const DIRECTIONS: { label: string; value: SMSDirection }[] = [
  { label: 'Outbound', value: 'outbound' },
  { label: 'Inbound', value: 'inbound' },
];

export const MESSAGE_TYPES: { label: string; value: MessageType }[] = [
  { label: 'SMS', value: 'sms' },
  { label: 'MMS', value: 'mms' },
  { label: 'Verify / OTP', value: 'verify' },
];

export const ITEMS_PER_PAGE = 50;
