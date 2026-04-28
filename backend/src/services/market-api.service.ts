import axios from 'axios';
import { MarketData } from './market-data';

// ─── AGMARKNET (data.gov.in) ─────────────────────────────────────────────────

const AGMARKNET_API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const AGMARKNET_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL = 'https://api.data.gov.in/resource';

export interface ApiMarketPrice {
    market: string;
    district: string;
    state: string;
    commodity: string;
    min_price: number;
    max_price: number;
    modal_price: number;
    arrival_date: string;
    source: 'agmarknet';
}

// ─── OpenStreetMap Overpass API ───────────────────────────────────────────────

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export interface OsmMarket {
    name: string;
    lat: number;
    lon: number;
    type: string;       // e.g. 'marketplace', 'greengrocer', 'supermarket'
    address?: string | null;
    district?: string | null;
    state?: string | null;
    phone?: string | null;
    website?: string | null;
    email?: string | null;
    source: 'openstreetmap';
}

// ─── In-memory caches ────────────────────────────────────────────────────────

const agmarknetCache: Record<string, { timestamp: number; data: ApiMarketPrice[] }> = {};
const agmarknetHistoryCache: Record<string, { timestamp: number; data: ApiMarketPrice[] }> = {};
const osmCache: Record<string, { timestamp: number; data: OsmMarket[] }> = {};
const AGMARKNET_CACHE_TTL = 6 * 60 * 60 * 1000;  // 6 hours
const OSM_CACHE_TTL = 24 * 60 * 60 * 1000;        // 24 hours (markets don't move)

export class MarketApiService {
    private static buildAddress(tags: Record<string, string>): string | null {
        const parts = [
            tags['addr:housename'],
            tags['addr:housenumber'],
            tags['addr:street'],
            tags['addr:suburb'],
            tags['addr:place'],
            tags['addr:city'],
            tags['addr:district'],
            tags['addr:state']
        ].filter(Boolean);

        return parts.length > 0 ? parts.join(', ') : null;
    }

    // ─── AGMARKNET live prices ───────────────────────────────────────────────

    static async fetchLiveMarkets(cropName: string, stateName: string = 'Kerala'): Promise<ApiMarketPrice[]> {
        const formatCommodity = (name: string) => {
            const mappedName = name.toLowerCase() === 'brinjal' ? 'Brinjal' :
                               name.toLowerCase() === 'lady finger' ? 'Bhindi(Ladies Finger)' :
                               name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            return mappedName;
        };

        const commodity = formatCommodity(cropName);
        const cacheKey = `agm-${commodity}-${stateName}`;

        if (agmarknetCache[cacheKey] && Date.now() - agmarknetCache[cacheKey].timestamp < AGMARKNET_CACHE_TTL) {
            return agmarknetCache[cacheKey].data;
        }

        try {
            const url = `${BASE_URL}/${AGMARKNET_RESOURCE_ID}`;
            const response = await axios.get(url, {
                params: {
                    'api-key': AGMARKNET_API_KEY,
                    format: 'json',
                    limit: 500,
                    'filters[commodity]': commodity,
                    'filters[state]': stateName
                },
                timeout: 10000
            });

            if (response.data && response.data.records) {
                const records: ApiMarketPrice[] = response.data.records.map((r: any) => ({
                    market: r.market,
                    district: r.district,
                    state: r.state,
                    commodity: r.commodity,
                    min_price: parseFloat(r.min_price) || 0,
                    max_price: parseFloat(r.max_price) || 0,
                    modal_price: parseFloat(r.modal_price) || 0,
                    arrival_date: r.arrival_date,
                    source: 'agmarknet'
                }));

                agmarknetCache[cacheKey] = { timestamp: Date.now(), data: records };
                return records;
            }
            return [];
        } catch (error) {
            console.error('[AGMARKNET] Fetch error:', (error as any)?.message || error);
            return [];
        }
    }

    // ─── AGMARKNET historical prices (for trend charts) ──────────────────────

    /**
     * Fetch historical price records from AGMARKNET for a given crop + state
     * over the last `days` days. Returns records with arrival_date for building
     * real trend charts.
     */
    static async fetchHistoricalPrices(
        cropName: string,
        stateName: string,
        days: number = 30
    ): Promise<ApiMarketPrice[]> {
        const formatCommodity = (name: string) => {
            const mappedName = name.toLowerCase() === 'brinjal' ? 'Brinjal' :
                               name.toLowerCase() === 'lady finger' ? 'Bhindi(Ladies Finger)' :
                               name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            return mappedName;
        };

        const commodity = formatCommodity(cropName);
        const cacheKey = `agm-hist-${commodity}-${stateName}-${days}`;

        if (agmarknetHistoryCache[cacheKey] && Date.now() - agmarknetHistoryCache[cacheKey].timestamp < AGMARKNET_CACHE_TTL) {
            return agmarknetHistoryCache[cacheKey].data;
        }

        try {
            const url = `${BASE_URL}/${AGMARKNET_RESOURCE_ID}`;

            // Fetch a larger set to cover the date range — AGMARKNET returns latest records first
            const response = await axios.get(url, {
                params: {
                    'api-key': AGMARKNET_API_KEY,
                    format: 'json',
                    limit: 1000,
                    'filters[commodity]': commodity,
                    'filters[state]': stateName,
                },
                timeout: 15000
            });

            if (response.data && response.data.records) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);

                const records: ApiMarketPrice[] = response.data.records
                    .map((r: any) => ({
                        market: r.market,
                        district: r.district,
                        state: r.state,
                        commodity: r.commodity,
                        min_price: parseFloat(r.min_price) || 0,
                        max_price: parseFloat(r.max_price) || 0,
                        modal_price: parseFloat(r.modal_price) || 0,
                        arrival_date: r.arrival_date,
                        source: 'agmarknet' as const
                    }))
                    .filter((r: ApiMarketPrice) => {
                        // Parse dd/mm/yyyy format from AGMARKNET
                        if (!r.arrival_date) return false;
                        const parts = r.arrival_date.split('/');
                        if (parts.length !== 3) return false;
                        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                        return !isNaN(d.getTime()) && d >= cutoffDate && r.modal_price > 0;
                    });

                agmarknetHistoryCache[cacheKey] = { timestamp: Date.now(), data: records };
                console.log(`[AGMARKNET] Historical: ${records.length} records for ${commodity} in ${stateName} over ${days} days`);
                return records;
            }
            return [];
        } catch (error) {
            console.error('[AGMARKNET] Historical fetch error:', (error as any)?.message || error);
            return [];
        }
    }

    // ─── OpenStreetMap Overpass — discover nearby markets ─────────────────────

    /**
     * Query OpenStreetMap for ALL vegetable markets, greengrocers, marketplaces,
     * and farm shops within `radiusKm` of the given coordinates.
     * No API key needed. Free. Returns real market names + GPS.
     */
    static async fetchNearbyMarkets(
        lat: number,
        lon: number,
        radiusKm: number = 40
    ): Promise<OsmMarket[]> {
        const radiusM = radiusKm * 1000;
        const cacheKey = `osm-${lat.toFixed(2)}-${lon.toFixed(2)}-${radiusKm}`;

        if (osmCache[cacheKey] && Date.now() - osmCache[cacheKey].timestamp < OSM_CACHE_TTL) {
            console.log(`[OSM] Cache hit: ${osmCache[cacheKey].data.length} markets`);
            return osmCache[cacheKey].data;
        }

        // Overpass QL query: find all market-related POIs within radius
        const query = `
[out:json][timeout:25];
(
  node["amenity"="marketplace"](around:${radiusM},${lat},${lon});
  way["amenity"="marketplace"](around:${radiusM},${lat},${lon});
  node["shop"="greengrocer"](around:${radiusM},${lat},${lon});
  node["shop"="vegetables"](around:${radiusM},${lat},${lon});
  node["shop"="farm"](around:${radiusM},${lat},${lon});
  node["shop"="wholesale"](around:${radiusM},${lat},${lon});
  node["shop"="supermarket"](around:${radiusM},${lat},${lon});
  way["shop"="greengrocer"](around:${radiusM},${lat},${lon});
  way["shop"="vegetables"](around:${radiusM},${lat},${lon});
  way["shop"="supermarket"](around:${radiusM},${lat},${lon});
);
out center 200;
`;

        try {
            console.log(`[OSM] Querying Overpass API: radius=${radiusKm}km around (${lat}, ${lon})`);
            const response = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(query)}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 30000
            });

            const elements = response.data?.elements || [];
            console.log(`[OSM] Got ${elements.length} raw results`);

            const markets: OsmMarket[] = [];
            const seen = new Set<string>();

            for (const el of elements) {
                // Get coordinates — nodes have lat/lon directly, ways have center
                const elLat = el.lat ?? el.center?.lat;
                const elLon = el.lon ?? el.center?.lon;
                if (!elLat || !elLon) continue;

                const tags = el.tags || {};

                // Build a name. Many OSM entries have name:en, name, or just the shop type.
                let name = tags['name:en'] || tags['name'] || '';

                // Skip entries with no name at all — they're just tagged nodes
                if (!name || name.length < 2) continue;

                // Determine type
                const type = tags['amenity'] === 'marketplace' ? 'marketplace' :
                             tags['shop'] === 'greengrocer' ? 'greengrocer' :
                             tags['shop'] === 'vegetables' ? 'vegetables' :
                             tags['shop'] === 'farm' ? 'farm_shop' :
                             tags['shop'] === 'wholesale' ? 'wholesale' :
                             tags['shop'] === 'supermarket' ? 'supermarket' :
                             'market';

                // Deduplicate by name+approximate location
                const dedupeKey = `${name.toLowerCase()}-${elLat.toFixed(3)}-${elLon.toFixed(3)}`;
                if (seen.has(dedupeKey)) continue;
                seen.add(dedupeKey);

                markets.push({
                    name,
                    lat: elLat,
                    lon: elLon,
                    type,
                    address: this.buildAddress(tags),
                    district: tags['addr:district'] || tags['district'] || tags['is_in:district'] || null,
                    state: tags['addr:state'] || tags['is_in:state'] || null,
                    phone: tags['contact:phone'] || tags['phone'] || null,
                    website: tags['contact:website'] || tags['website'] || null,
                    email: tags['contact:email'] || tags['email'] || null,
                    source: 'openstreetmap'
                });
            }

            console.log(`[OSM] ${markets.length} named, unique markets after filtering`);

            osmCache[cacheKey] = { timestamp: Date.now(), data: markets };
            return markets;
        } catch (error) {
            console.error('[OSM] Overpass API error:', (error as any)?.message || error);
            return [];
        }
    }
}
