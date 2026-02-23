import type { SMSRate, FilterState, SortState, PriceHistory } from '../types';

export const fetchSMSData = async (): Promise<{ data: SMSRate[]; lastUpdated: string }> => {
  const response = await fetch('/sms-data.json');
  if (!response.ok) throw new Error(`Failed to fetch SMS data: ${response.statusText}`);
  const json = await response.json();
  return { data: json.data as SMSRate[], lastUpdated: json.lastUpdated };
};

export const fetchPriceHistory = async (): Promise<PriceHistory | null> => {
  try {
    const response = await fetch('/sms-price-history.json');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

export const filterData = (data: SMSRate[], filters: FilterState): SMSRate[] => {
  const countrySet = filters.countries.length > 0 ? new Set(filters.countries) : null;
  const providerSet = filters.providers.length > 0 ? new Set(filters.providers) : null;
  const directionSet = filters.direction.length > 0 ? new Set(filters.direction) : null;
  const typeSet = filters.messageType.length > 0 ? new Set(filters.messageType) : null;
  const q = filters.search?.toLowerCase() || '';

  return data.filter((item) => {
    if (q) {
      const match =
        item.country_name.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        (item.operator_name?.toLowerCase().includes(q) ?? false) ||
        item.country_iso.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (countrySet && !countrySet.has(item.country_iso)) return false;
    if (providerSet && !providerSet.has(item.provider)) return false;
    if (directionSet && !directionSet.has(item.direction)) return false;
    if (typeSet && !typeSet.has(item.message_type)) return false;
    if (item.price_usd < filters.minPrice || item.price_usd > filters.maxPrice) return false;
    return true;
  });
};

export const sortData = (data: SMSRate[], sort: SortState): SMSRate[] => {
  return [...data].sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case 'price_usd':
        cmp = a.price_usd - b.price_usd;
        break;
      case 'provider':
        cmp = a.provider.localeCompare(b.provider);
        break;
      case 'country_name':
        cmp = a.country_name.localeCompare(b.country_name);
        break;
      case 'operator_name':
        cmp = (a.operator_name ?? '').localeCompare(b.operator_name ?? '');
        break;
      case 'verify_price_usd':
        cmp = (a.verify_price_usd ?? 999) - (b.verify_price_usd ?? 999);
        break;
      default:
        cmp = 0;
    }
    return sort.direction === 'asc' ? cmp : -cmp;
  });
};
