// Quick standalone test for Overpass API - run with: npx ts-node test-osm.ts
import axios from 'axios';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

async function test() {
    const lat = 9.93;
    const lon = 76.27;
    const radiusM = 40000;

    const query = `
[out:json][timeout:25];
(
  node["amenity"="marketplace"](around:${radiusM},${lat},${lon});
  node["shop"="greengrocer"](around:${radiusM},${lat},${lon});
  node["shop"="vegetables"](around:${radiusM},${lat},${lon});
  node["shop"="supermarket"](around:${radiusM},${lat},${lon});
  way["amenity"="marketplace"](around:${radiusM},${lat},${lon});
);
out center 200;
`;

    console.log('Querying Overpass API via POST...');
    try {
        const response = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(query)}`, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 30000
        });

        const elements = response.data?.elements || [];
        console.log(`✅ Got ${elements.length} raw results`);

        const named = elements.filter((el: any) => el.tags?.name || el.tags?.['name:en']);
        console.log(`✅ ${named.length} have names`);

        named.forEach((el: any, i: number) => {
            const name = el.tags?.['name:en'] || el.tags?.name || 'NO NAME';
            const type = el.tags?.amenity || el.tags?.shop || '?';
            const elLat = el.lat || el.center?.lat;
            const elLon = el.lon || el.center?.lon;
            console.log(`  ${i + 1}. [${type}] ${name} (${elLat}, ${elLon})`);
        });
    } catch (e: any) {
        console.error('❌ Error:', e.message);
        if (e.response) {
            console.error('   Status:', e.response.status);
            console.error('   Data:', typeof e.response.data === 'string' ? e.response.data.substring(0, 200) : e.response.data);
        }
    }
}

test();
