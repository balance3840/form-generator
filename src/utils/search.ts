import get from 'lodash/get';

/**
 * Remote search shared by the `search` / `address` fields and by the builder's "Test it" button.
 * A *source* describes the endpoint:
 *
 *   { url: 'https://…?q={q}', method?: 'GET' | 'POST', headers?, body?,           // `{q}` is replaced by the typed text
 *     resultsPath?, labelKey?, labelTemplate?, valueKey?, extraKey?,              // how to read the response
 *     minChars?, debounce?, drill?: { typeKey, expandTypes } }                    // behaviour
 */
export type SearchSource = { [key: string]: any };
export type SearchItem = { value: any; label: string; extra?: string; expandable?: boolean };

const fillBody = (node: any, q: string): any => {
  if (typeof node === 'string') return node.replace(/\{q\}/g, q);
  if (Array.isArray(node)) return node.map(n => fillBody(n, q));
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, fillBody(v, q)]));
  return node;
};

/** `labelTemplate` ("{road} {number}, {zip} {city|town}") or, without one, the `labelKey` field. */
export function formatLabel(raw: any, source: SearchSource): string {
  const template: string = source.labelTemplate;
  if (template) {
    const filled = template.replace(/\{([^}]+)\}/g, (_m, expression: string) => {
      for (const path of expression.split('|')) {
        const value = get(raw, path.trim());
        if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
      }
      return '';
    });
    // drop the parts left empty ("Street 5, , 2200" -> "Street 5, 2200")
    const tidy = filled
      .split(',')
      .map(part => part.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(', ');
    if (tidy) return tidy;
  }
  return String(get(raw, source.labelKey || 'label') ?? '');
}

/** Turns a response into pick-able items. Duplicates are dropped (by stored value when there is one, else by text). */
export function parseResults(json: any, source: SearchSource): SearchItem[] {
  const list = source.resultsPath ? get(json, source.resultsPath) : json;
  const drill = source.drill || null;
  const seen = new Set<string>();
  return (Array.isArray(list) ? list : [])
    .slice(0, 50)
    .map((raw: any) => {
      const label = typeof raw === 'string' ? raw : formatLabel(raw, source);
      const value = typeof raw === 'string' ? raw : source.valueKey ? get(raw, source.valueKey) : label;
      const extra = typeof raw === 'string' || !source.extraKey ? undefined : get(raw, source.extraKey);
      const expandable = !!drill && typeof raw !== 'string' && (drill.expandTypes || []).includes(get(raw, drill.typeKey || 'type'));
      return { label, value, extra: extra ? String(extra) : undefined, expandable } as SearchItem;
    })
    .filter(item => {
      const key = source.valueKey && item.value !== undefined && item.value !== null ? `v:${item.value}` : `l:${item.label}`;
      if (!item.label || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export type SearchOutcome = { items: SearchItem[]; error?: string };

/** One request. Never throws: problems come back as `error` (with the service's own message when it sends one). */
export async function runSearch(source: SearchSource, q: string, signal?: AbortSignal): Promise<SearchOutcome> {
  const url: string = source && source.url;
  if (!url || !/^https?:\/\//i.test(url)) return { items: [], error: 'No valid endpoint URL (it must start with http:// or https://)' };
  const method = String(source.method || 'GET').toUpperCase();
  const headers: { [key: string]: string } = { ...(source.headers || {}) };
  const init: RequestInit = { method, headers, signal };
  if (method !== 'GET') {
    if (!Object.keys(headers).some(h => h.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(fillBody(source.body || {}, q));
  }
  try {
    const response = await fetch(url.replace(/\{q\}/g, encodeURIComponent(q)), init);
    const text = await response.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      /* not json */
    }
    if (!response.ok) {
      const message = json && (get(json, 'error.message') || json.message || json.error_message || json.error);
      return { items: [], error: `${response.status}${message ? ': ' + (typeof message === 'string' ? message : JSON.stringify(message)) : ''}` };
    }
    if (json === null) return { items: [], error: 'The service did not answer with JSON' };
    return { items: parseResults(json, source) };
  } catch (e) {
    if (e && (e as any).name === 'AbortError') return { items: [] };
    return { items: [], error: 'Could not reach the service (network error, or it does not allow requests from this site)' };
  }
}

/* ------------------------------------------------------------- address providers */

export type AddressProvider = { id: string; label: string; description: string; needsKey?: boolean; keyHelp?: string; keyUrl?: string; countries?: boolean; attribution?: string };

export const ADDRESS_PROVIDERS: AddressProvider[] = [
  { id: 'osm', label: 'OpenStreetMap', description: 'Worldwide. Free, no key. Meant for light use.', countries: true, attribution: '© OpenStreetMap contributors' },
  { id: 'google', label: 'Google Places', description: 'Worldwide, very complete. Needs a Google Maps API key with billing.', needsKey: true, keyUrl: 'https://developers.google.com/maps/documentation/places/web-service/get-api-key', keyHelp: 'Enable “Places API (New)” and restrict the key to your website.', countries: true, attribution: 'Powered by Google' },
  { id: 'mapbox', label: 'Mapbox', description: 'Worldwide. Needs a Mapbox access token (free tier).', needsKey: true, keyUrl: 'https://account.mapbox.com/access-tokens/', keyHelp: 'Use a public token restricted to your website.', countries: true },
  { id: 'geoapify', label: 'Geoapify', description: 'Worldwide. Needs an API key (free tier).', needsKey: true, keyUrl: 'https://myprojects.geoapify.com/', keyHelp: 'Restrict the key to your website in the project settings.', countries: true },
  { id: 'dk', label: 'Denmark: official register', description: 'Danish addresses incl. floors and doors. Needs a free Dataforsyningen token.', needsKey: true, keyUrl: 'https://dataforsyningen.dk/', keyHelp: 'Create a user, then a token under your account.', countries: false },
  { id: 'custom', label: 'My own service', description: 'Any JSON endpoint: your API, or another provider.' },
];

/** The source for an `address` field's simple settings (`provider`, `apiKey`, `countries`, `city`, language). */
export function addressSource(config: { [key: string]: any }, language = 'en'): SearchSource {
  const provider = config.provider || 'osm';
  if (provider === 'custom') return config.source || {};
  const key = encodeURIComponent(String(config.apiKey || ''));
  const countries: string[] = (config.countries || []).map((c: string) => String(c).toLowerCase());
  const city = String(config.city || '').trim();
  const lang = (language || 'en').split('-')[0];
  const base = { minChars: 3, debounce: 400 };
  const withCity = (q: string) => (city ? `${q}, ${city}` : q);

  if (provider === 'google') {
    return {
      ...base,
      url: 'https://places.googleapis.com/v1/places:autocomplete',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': String(config.apiKey || '') },
      body: { input: withCity('{q}'), languageCode: lang, ...(countries.length ? { includedRegionCodes: countries.slice(0, 15) } : {}), includedPrimaryTypes: ['street_address', 'subpremise', 'premise', 'route'] },
      resultsPath: 'suggestions',
      labelKey: 'placePrediction.text.text',
      valueKey: 'placePrediction.placeId',
    };
  }
  if (provider === 'mapbox') {
    return {
      ...base,
      url: `https://api.mapbox.com/search/geocode/v6/forward?q=${city ? '{q}%2C%20' + encodeURIComponent(city) : '{q}'}&access_token=${key}&autocomplete=true&types=address&limit=8&language=${lang}${countries.length ? `&country=${countries.join(',')}` : ''}`,
      resultsPath: 'features',
      labelKey: 'properties.full_address',
      valueKey: 'properties.mapbox_id',
    };
  }
  if (provider === 'geoapify') {
    return {
      ...base,
      url: `https://api.geoapify.com/v1/geocode/autocomplete?text=${city ? '{q}%2C%20' + encodeURIComponent(city) : '{q}'}&apiKey=${key}&format=json&limit=8&lang=${lang}${countries.length ? `&filter=countrycode:${countries.join(',')}` : ''}`,
      resultsPath: 'results',
      labelKey: 'formatted',
      valueKey: 'place_id',
    };
  }
  if (provider === 'dk') {
    return { ...base, minChars: 2, url: `https://api.dataforsyningen.dk/rest/gsearch/v2.0/adresse?q=${city ? '{q}%2C%20' + encodeURIComponent(city) : '{q}'}&limit=10&token=${key}`, labelKey: 'visningstekst', valueKey: 'id' };
  }
  // OpenStreetMap (Nominatim)
  const place = '{address.city|address.town|address.village|address.municipality}';
  // number before the street in English speaking countries, after it in most of the rest of the world
  const numberFirst = countries.length === 1 && ['us', 'gb', 'ie', 'ca', 'au', 'nz'].includes(countries[0]);
  const street = numberFirst ? '{address.house_number} {address.road}' : '{address.road} {address.house_number}';
  const rest = numberFirst ? `${place} {address.postcode}` : `{address.postcode} ${place}`;
  return {
    ...base,
    url: `https://nominatim.openstreetmap.org/search?q={q}${city ? `%2C%20${encodeURIComponent(city)}` : ''}&format=jsonv2&addressdetails=1&limit=8&accept-language=${encodeURIComponent(lang)}${countries.length ? `&countrycodes=${countries.join(',')}` : ''}`,
    labelTemplate: `${street}, ${rest}${countries.length === 1 ? '' : ', {address.country}'}`,
    labelKey: 'display_name',
    valueKey: 'place_id',
  };
}
