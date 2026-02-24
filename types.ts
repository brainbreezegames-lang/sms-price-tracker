/* ── Messaging Rate data model ────────────────────────────────────────── */

export type SMSDirection = 'outbound' | 'inbound';
export type MessageType = 'sms' | 'mms' | 'whatsapp' | 'rcs';
export type NumberType = 'local' | 'toll-free' | 'short-code' | '10dlc';

export interface SMSRate {
  id: string;
  provider: string;
  country_iso: string;
  country_name: string;
  operator_name: string | null;
  mcc: string | null;
  mnc: string | null;
  price_per_sms: number;
  currency: string;
  price_usd: number;
  direction: SMSDirection;
  message_type: MessageType;
  carrier_surcharge_usd: number | null;
  total_price_usd: number;
  verify_price_usd: number | null;
  link: string;
  last_updated: string;
}

/* ── Phone Number Pricing ────────────────────────────────────────────── */

export interface PhoneNumberPrice {
  id: string;
  provider: string;
  country_iso: string;
  country_name: string;
  number_type: NumberType;
  monthly_cost_usd: number;
  setup_fee_usd: number;
  sms_enabled: boolean;
  mms_enabled: boolean;
  link: string;
}

/* ── Volume Tiers ────────────────────────────────────────────────────── */

export interface VolumeTier {
  min_messages: number;
  max_messages: number | null;
  price_per_message_usd: number;
  discount_pct: number;
}

export interface ProviderVolumePricing {
  id: string;
  provider: string;
  tiers: VolumeTier[];
}

/* ── 10DLC Fees (US) ─────────────────────────────────────────────────── */

export interface TenDLCFees {
  provider: string;
  brand_registration_usd: number;
  campaign_registration_usd: number;
  monthly_campaign_fee_usd: number;
  link: string;
}

/* ── Full Data Package ───────────────────────────────────────────────── */

export interface SMSDataPackage {
  lastUpdated: string;
  count: number;
  providerCount: number;
  countryCount: number;
  data: SMSRate[];
  phoneNumbers: PhoneNumberPrice[];
  volumeTiers: ProviderVolumePricing[];
  tenDlcFees: TenDLCFees[];
}

/* ── Filter & Sort ───────────────────────────────────────────────────── */

export interface FilterState {
  search: string;
  countries: string[];
  providers: string[];
  direction: SMSDirection[];
  messageType: MessageType[];
  minPrice: number;
  maxPrice: number;
}

export type SortField = 'price_usd' | 'total_price_usd' | 'provider' | 'country_name' | 'operator_name' | 'verify_price_usd';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

/* ── Price History ───────────────────────────────────────────────────── */

export interface CountrySnapshot {
  min: number;
  avg: number;
  count: number;
}

export interface DaySnapshot {
  date: string;
  entries: Record<string, CountrySnapshot>;
}

export interface PriceHistory {
  generated: string;
  snapshots: DaySnapshot[];
}

/* ── Defaults ────────────────────────────────────────────────────────── */

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  countries: [],
  providers: [],
  direction: [],
  messageType: [],
  minPrice: 0,
  maxPrice: 1,
};
