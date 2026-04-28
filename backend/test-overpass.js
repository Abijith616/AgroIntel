const https = require('https');
const d = 'data=' + encodeURIComponent('[out:json][timeout:25];(node["amenity"="marketplace"](around:40000,9.93,76.27);node["shop"="greengrocer"](around:40000,9.93,76.27);node["shop"="supermarket"](around:40000,9.93,76.27););out center 50;');
const opts = { hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(d) } };
const req = https.request(opts, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
        try {
            const j = JSON.parse(b);
            const els = j.elements || [];
            console.log('Total elements:', els.length);
            const named = els.filter(e => e.tags && e.tags.name);
            console.log('Named elements:', named.length);
            named.slice(0, 15).forEach((e, i) => console.log(`  ${i + 1}. [${e.tags.shop || e.tags.amenity}] ${e.tags.name} (${e.lat || (e.center && e.center.lat)})`));
        } catch (e) { console.log('Parse error:', b.substring(0, 300)); }
    });
});
req.on('error', e => console.error('Request error:', e.message));
req.write(d);
req.end();
