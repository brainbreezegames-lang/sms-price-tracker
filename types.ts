/* ── SMS Rate data model ─────────────────────────────────────────────── */

export type SMSDirection = 'outbound' | 'inbound';
export type MessageType = 'sms' | 'mms' | 'verify';

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
  verify_price_usd: number | null;
  link: string;
  last_updated: string;
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

export type SortField = 'price_usd' | 'provider' | 'country_name' | 'operator_name' | 'verify_price_usd';
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
  entries: Record<string, CountrySnapshot>; // keyed by "US-twilio-outbound"
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
