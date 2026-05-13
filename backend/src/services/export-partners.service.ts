import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportPartner {
    id: number;
    name: string;
    type: 'Government' | 'Trade Board' | 'Exporter' | 'Cooperative' | 'Commodity Board';
    crops: string[];
    description: string;
    cropSpecificInsight: string;
    email: string;
    phone: string;
    website: string;
    location: string;
    verified: boolean;
    tag: string;
    tagColor: string;
    relevanceScore: number;
}

// ─── Curated REAL organizations ───────────────────────────────────────────────

interface RealOrg {
    name: string;
    type: ExportPartner['type'];
    cropCategories: string[]; // crops/categories this org handles
    description: string;
    email: string;
    phone: string;
    website: string;
    location: string;
    tag: string;
    tagColor: string;
}

const REAL_ORGANIZATIONS: RealOrg[] = [
    // ── Government Bodies ─────────────────────────────────────────────────────
    {
        name: 'APEDA – Agricultural & Processed Food Export Development Authority',
        type: 'Government',
        cropCategories: ['Rice', 'Wheat', 'Maize', 'Corn', 'Fruits', 'Vegetables', 'Spices', 'Processed Foods', 'Mango', 'Banana', 'Onion', 'Tomato', 'Potato', 'Groundnut', 'Soybean', 'Sugarcane', 'Cotton', 'Pulses'],
        description: "India's apex body for agricultural export promotion. Provides RCMC registration, quality certification, financial assistance, and connects farmers with international buyers.",
        email: 'apeda@apeda.gov.in',
        phone: '+91-11-26534186',
        website: 'https://apeda.gov.in',
        location: 'New Delhi, India',
        tag: 'Govt. Authority',
        tagColor: 'bg-blue-100 text-blue-700',
    },
    {
        name: 'NAFED – National Agricultural Cooperative Marketing Federation',
        type: 'Cooperative',
        cropCategories: ['Rice', 'Wheat', 'Pulses', 'Onion', 'Potato', 'Groundnut', 'Soybean', 'Cotton', 'Maize', 'Corn', 'Fruits', 'Vegetables', 'Spices'],
        description: 'Largest agricultural marketing cooperative in India. Procures at MSP, facilitates export of surplus produce, and stabilises domestic markets.',
        email: 'nafed@nafed-india.com',
        phone: '+91-11-26169252',
        website: 'https://www.nafed-india.com',
        location: 'New Delhi, India',
        tag: 'Cooperative',
        tagColor: 'bg-green-100 text-green-700',
    },
    {
        name: 'DGFT – Directorate General of Foreign Trade',
        type: 'Government',
        cropCategories: ['Rice', 'Wheat', 'Spices', 'Cotton', 'Sugarcane', 'Fruits', 'Vegetables', 'Processed Foods', 'Maize', 'Corn', 'Pulses', 'Soybean', 'Groundnut', 'Mango', 'Banana', 'Onion', 'Tomato', 'Potato'],
        description: 'Central government body that formulates and implements India\'s Foreign Trade Policy. Issues Import Export Code (IEC), essential for any agricultural export.',
        email: 'dgft@nic.in',
        phone: '+91-11-23061562',
        website: 'https://dgft.gov.in',
        location: 'New Delhi, India',
        tag: 'Trade Policy',
        tagColor: 'bg-slate-100 text-slate-700',
    },
    {
        name: 'Spices Board of India',
        type: 'Commodity Board',
        cropCategories: ['Spices', 'Cardamom', 'Pepper', 'Turmeric', 'Ginger', 'Chilli', 'Cinnamon', 'Clove', 'Cumin'],
        description: 'Statutory body for development and worldwide promotion of Indian spices. Provides quality certification, export guidance, and connects spice farmers to global buyers.',
        email: 'spicesboard@nic.in',
        phone: '+91-484-2333610',
        website: 'https://www.indianspices.com',
        location: 'Kochi, Kerala',
        tag: 'Commodity Board',
        tagColor: 'bg-amber-100 text-amber-700',
    },
    {
        name: 'Tea Board of India',
        type: 'Commodity Board',
        cropCategories: ['Tea'],
        description: 'Statutory body under the Ministry of Commerce for tea industry development. Provides quality control, export promotion, and research support for tea growers.',
        email: 'teaboard@teaboard.gov.in',
        phone: '+91-33-22351411',
        website: 'https://www.teaboard.gov.in',
        location: 'Kolkata, West Bengal',
        tag: 'Commodity Board',
        tagColor: 'bg-emerald-100 text-emerald-700',
    },
    {
        name: 'Coffee Board of India',
        type: 'Commodity Board',
        cropCategories: ['Coffee'],
        description: 'Statutory body for promotion and development of Indian coffee industry. Assists with export registration, quality grading, and international market access.',
        email: 'coffboard@coffeeboard.gov.in',
        phone: '+91-80-22266991',
        website: 'https://www.indiacoffee.org',
        location: 'Bengaluru, Karnataka',
        tag: 'Commodity Board',
        tagColor: 'bg-amber-100 text-amber-800',
    },
    {
        name: 'Rubber Board of India',
        type: 'Commodity Board',
        cropCategories: ['Rubber'],
        description: 'Statutory body for development of the rubber industry. Provides replanting subsidies, quality certification, and connects growers with domestic and international buyers.',
        email: 'rubberboard@rubberboard.org.in',
        phone: '+91-481-2353311',
        website: 'https://www.rubberboard.org.in',
        location: 'Kottayam, Kerala',
        tag: 'Commodity Board',
        tagColor: 'bg-gray-100 text-gray-700',
    },
    {
        name: 'Coconut Development Board',
        type: 'Commodity Board',
        cropCategories: ['Coconut', 'Copra'],
        description: 'Statutory body for integrated development of coconut cultivation and industry. Assists with product diversification, export promotion, and technology transfer.',
        email: 'kochi-cdb@nic.in',
        phone: '+91-484-2377266',
        website: 'https://www.coconutboard.gov.in',
        location: 'Kochi, Kerala',
        tag: 'Commodity Board',
        tagColor: 'bg-lime-100 text-lime-700',
    },
    {
        name: 'National Horticulture Board',
        type: 'Government',
        cropCategories: ['Fruits', 'Vegetables', 'Mango', 'Banana', 'Tomato', 'Potato', 'Onion', 'Grapes', 'Pomegranate', 'Flowers'],
        description: 'Promotes integrated development of horticulture. Provides cold storage subsidies, export infrastructure grants, and market linkages for fruit and vegetable growers.',
        email: 'nhb@nic.in',
        phone: '+91-124-2342992',
        website: 'https://nhb.gov.in',
        location: 'Gurugram, Haryana',
        tag: 'Horticulture',
        tagColor: 'bg-pink-100 text-pink-700',
    },
    {
        name: 'Cashew Export Promotion Council of India',
        type: 'Trade Board',
        cropCategories: ['Cashew'],
        description: 'Export promotion body for cashew products. Provides market intelligence, buyer-seller meets, and quality certification for cashew exports.',
        email: 'cepci@cashewexport.com',
        phone: '+91-484-2666766',
        website: 'https://cashewindia.org',
        location: 'Kochi, Kerala',
        tag: 'Export Council',
        tagColor: 'bg-yellow-100 text-yellow-700',
    },
    // ── Trade Associations ────────────────────────────────────────────────────
    {
        name: 'FIEO – Federation of Indian Export Organisations',
        type: 'Trade Board',
        cropCategories: ['Rice', 'Wheat', 'Spices', 'Fruits', 'Vegetables', 'Cotton', 'Processed Foods', 'Pulses', 'Maize', 'Corn', 'Soybean', 'Groundnut'],
        description: 'Apex body of Indian export promotion organisations. Provides trade facilitation, export documentation guidance, and connects exporters with 3,000+ global importers.',
        email: 'fieo@fieo.org',
        phone: '+91-11-26288888',
        website: 'https://www.fieo.org',
        location: 'New Delhi, India',
        tag: 'Trade Federation',
        tagColor: 'bg-indigo-100 text-indigo-700',
    },
    {
        name: 'All India Rice Exporters Association (AIREA)',
        type: 'Trade Board',
        cropCategories: ['Rice', 'Basmati Rice'],
        description: 'Premier association of rice exporters in India. Provides market intelligence, policy advocacy, and connects rice farmers with verified export buyers worldwide.',
        email: 'info@aaborice.com',
        phone: '+91-11-23622710',
        website: 'https://www.airea.net',
        location: 'New Delhi, India',
        tag: 'Rice Exports',
        tagColor: 'bg-emerald-100 text-emerald-700',
    },
    {
        name: 'Indian Oilseeds & Produce Export Promotion Council (IOPEPC)',
        type: 'Trade Board',
        cropCategories: ['Groundnut', 'Soybean', 'Sesame', 'Sunflower', 'Mustard', 'Castor'],
        description: 'Government-backed council promoting export of oilseeds, oils, and oilcake. Provides quality standards, market access, and buyer networking for oilseed farmers.',
        email: 'iopepc@iopepc.org',
        phone: '+91-22-22026567',
        website: 'https://www.iopepc.org',
        location: 'Mumbai, Maharashtra',
        tag: 'Oilseeds Council',
        tagColor: 'bg-orange-100 text-orange-700',
    },
    {
        name: 'Indian Sugar Mills Association (ISMA)',
        type: 'Trade Board',
        cropCategories: ['Sugarcane', 'Sugar'],
        description: 'Apex body representing sugar mills across India. Provides export policy guidance, market data, and connects sugarcane farmers with domestic and international sugar trade.',
        email: 'indiansugar@indiansugar.com',
        phone: '+91-11-23382070',
        website: 'https://www.indiansugar.com',
        location: 'New Delhi, India',
        tag: 'Sugar Industry',
        tagColor: 'bg-teal-100 text-teal-700',
    },
    {
        name: 'Cotton Association of India',
        type: 'Trade Board',
        cropCategories: ['Cotton'],
        description: 'Premier body of cotton trade in India since 1922. Provides daily cotton prices, quality grading, arbitration services, and export facilitation for cotton growers.',
        email: 'info@caionline.in',
        phone: '+91-22-23894002',
        website: 'https://www.caionline.in',
        location: 'Mumbai, Maharashtra',
        tag: 'Cotton Trade',
        tagColor: 'bg-sky-100 text-sky-700',
    },
    // ── Real Major Exporters ──────────────────────────────────────────────────
    {
        name: 'KRBL Ltd (India Gate Basmati)',
        type: 'Exporter',
        cropCategories: ['Rice', 'Basmati Rice'],
        description: "India's largest basmati rice company and the world's No.1 basmati rice brand. Procures directly from farmers in Punjab, Haryana, and UP with contract farming programmes.",
        email: 'info@krblrice.com',
        phone: '+91-11-29222301',
        website: 'https://www.krblrice.com',
        location: 'New Delhi, India',
        tag: 'Top Exporter',
        tagColor: 'bg-green-100 text-green-700',
    },
    {
        name: 'LT Foods Ltd (Daawat Basmati)',
        type: 'Exporter',
        cropCategories: ['Rice', 'Basmati Rice'],
        description: "Major basmati rice exporter present in 80+ countries. Runs farmer connect programmes for direct procurement with quality premiums.",
        email: 'info@ltgroup.in',
        phone: '+91-124-3055100',
        website: 'https://www.ltfoods.com',
        location: 'Gurugram, Haryana',
        tag: 'Global Exporter',
        tagColor: 'bg-green-100 text-green-700',
    },
    {
        name: 'ITC Limited – Agri Business Division',
        type: 'Exporter',
        cropCategories: ['Wheat', 'Rice', 'Soybean', 'Spices', 'Coffee', 'Fruits', 'Vegetables', 'Pulses', 'Maize', 'Corn'],
        description: "One of India's largest integrated agri-businesses. Operates the e-Choupal network connecting 4 million farmers for direct procurement and export of multiple crops.",
        email: 'endusercare@itc.in',
        phone: '+91-33-22889371',
        website: 'https://www.itcportal.com',
        location: 'Kolkata, West Bengal',
        tag: 'Major Corp.',
        tagColor: 'bg-violet-100 text-violet-700',
    },
    {
        name: 'Olam Agri India',
        type: 'Exporter',
        cropCategories: ['Rice', 'Cotton', 'Spices', 'Cashew', 'Coffee', 'Cocoa', 'Wheat'],
        description: 'Global food and agri-business company operating in India. Provides farm-gate procurement, processing, and export logistics across multiple crops.',
        email: 'contactus@olamnet.com',
        phone: '+91-124-4729900',
        website: 'https://www.olamagri.com',
        location: 'Gurugram, Haryana',
        tag: 'Global Trader',
        tagColor: 'bg-cyan-100 text-cyan-700',
    },
    {
        name: 'Adani Wilmar Ltd (Fortune)',
        type: 'Exporter',
        cropCategories: ['Soybean', 'Groundnut', 'Mustard', 'Sunflower', 'Rice', 'Wheat', 'Pulses'],
        description: "India's largest edible oil company with integrated food processing. Procures oilseeds and grains directly from farmers across Gujarat, Rajasthan, and MP.",
        email: 'info@adaniwilmar.com',
        phone: '+91-79-25555555',
        website: 'https://www.adaniwilmar.com',
        location: 'Ahmedabad, Gujarat',
        tag: 'Agri Corp.',
        tagColor: 'bg-emerald-100 text-emerald-700',
    },
    {
        name: 'Synthite Industries Ltd',
        type: 'Exporter',
        cropCategories: ['Spices', 'Pepper', 'Cardamom', 'Turmeric', 'Ginger', 'Chilli', 'Cumin'],
        description: "World's largest processor of spice oleoresins. Procures spices from 50,000+ farmers across Kerala, Karnataka, and Tamil Nadu for export to 90+ countries.",
        email: 'mail@synthite.com',
        phone: '+91-484-2712244',
        website: 'https://www.synthite.com',
        location: 'Kochi, Kerala',
        tag: 'Spice Giant',
        tagColor: 'bg-red-100 text-red-700',
    },
    {
        name: 'Jain Irrigation Systems Ltd',
        type: 'Exporter',
        cropCategories: ['Mango', 'Banana', 'Onion', 'Tomato', 'Fruits', 'Vegetables'],
        description: 'Largest processor of mangoes and dehydrated onions in the world. Operates contract farming with 300,000+ farmers for processed fruit and vegetable exports.',
        email: 'jisl@jains.com',
        phone: '+91-257-2258011',
        website: 'https://www.jains.com',
        location: 'Jalgaon, Maharashtra',
        tag: 'Agri-Tech',
        tagColor: 'bg-orange-100 text-orange-700',
    },
    // ── Cooperatives ──────────────────────────────────────────────────────────
    {
        name: 'IFFCO – Indian Farmers Fertiliser Cooperative',
        type: 'Cooperative',
        cropCategories: ['Rice', 'Wheat', 'Pulses', 'Maize', 'Corn', 'Soybean', 'Groundnut', 'Cotton', 'Sugarcane'],
        description: "World's largest fertiliser cooperative with 36,000+ member societies. Provides inputs, market linkages, and export facilitation for its farmer members.",
        email: 'iffco@iffco.in',
        phone: '+91-11-26510091',
        website: 'https://www.iffco.in',
        location: 'New Delhi, India',
        tag: 'Cooperative',
        tagColor: 'bg-green-100 text-green-700',
    },
    {
        name: 'NCDEX – National Commodity & Derivatives Exchange',
        type: 'Trade Board',
        cropCategories: ['Soybean', 'Cotton', 'Maize', 'Corn', 'Wheat', 'Rice', 'Groundnut', 'Mustard', 'Sugarcane', 'Pulses', 'Spices', 'Turmeric', 'Pepper'],
        description: 'Leading commodity exchange for agri-futures trading. Farmers can discover transparent prices, hedge risks, and access warehouse-based financing.',
        email: 'askus@ncdex.com',
        phone: '+91-22-66406789',
        website: 'https://www.ncdex.com',
        location: 'Mumbai, Maharashtra',
        tag: 'Exchange',
        tagColor: 'bg-purple-100 text-purple-700',
    },
    // ── International Trade Bodies ─────────────────────────────────────────────
    {
        name: 'India Trade Promotion Organisation (ITPO)',
        type: 'Government',
        cropCategories: ['Rice', 'Wheat', 'Spices', 'Fruits', 'Vegetables', 'Processed Foods', 'Cotton', 'Tea', 'Coffee'],
        description: 'Premier trade promotion body under Ministry of Commerce. Organises international trade fairs, buyer-seller meets, and provides market access to Indian farmers.',
        email: 'info@itpo.gov.in',
        phone: '+91-11-23371540',
        website: 'https://www.indiatradefair.com',
        location: 'New Delhi, India',
        tag: 'Trade Promotion',
        tagColor: 'bg-blue-100 text-blue-700',
    },
    {
        name: 'MPEDA – Marine Products Export Development Authority',
        type: 'Government',
        cropCategories: ['Shrimp', 'Fish', 'Seaweed'],
        description: 'Statutory body for promotion of marine product exports. Provides quality testing, export certification, and market development for aquaculture and fishery products.',
        email: 'mpeda@mpeda.gov.in',
        phone: '+91-484-2311979',
        website: 'https://www.mpeda.gov.in',
        location: 'Kochi, Kerala',
        tag: 'Marine Exports',
        tagColor: 'bg-blue-100 text-blue-700',
    },
    {
        name: 'Maharashtra State Agricultural Marketing Board (MSAMB)',
        type: 'Government',
        cropCategories: ['Onion', 'Tomato', 'Grapes', 'Pomegranate', 'Mango', 'Banana', 'Sugarcane', 'Cotton', 'Soybean'],
        description: 'State marketing board that manages APMC markets across Maharashtra. Provides e-market platforms, price transparency, and direct farmer-buyer connections.',
        email: 'maborig@gmail.com',
        phone: '+91-20-25537604',
        website: 'https://www.msamb.com',
        location: 'Pune, Maharashtra',
        tag: 'State Board',
        tagColor: 'bg-orange-100 text-orange-700',
    },
    {
        name: 'Kerala State Agricultural Marketing Department (SAM)',
        type: 'Government',
        cropCategories: ['Coconut', 'Rubber', 'Spices', 'Pepper', 'Cardamom', 'Rice', 'Banana', 'Cashew', 'Coffee', 'Tea'],
        description: 'State government marketing department that assists Kerala farmers with fair pricing, export facilitation, and quality certification for spices and plantation crops.',
        email: 'agrimarketing.ker@nic.in',
        phone: '+91-471-2304858',
        website: 'https://keralaagriculture.gov.in',
        location: 'Thiruvananthapuram, Kerala',
        tag: 'State Dept.',
        tagColor: 'bg-green-100 text-green-700',
    },
];

// ─── Groq AI ──────────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = ['llama-3.3-70b-versatile', 'llama3-70b-8192'];

async function callGroq(messages: { role: string; content: string }[], maxTokens = 300, attempt = 0): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return '';

    const model = MODELS[Math.min(attempt, MODELS.length - 1)];
    try {
        const res = await axios.post(GROQ_API_URL, { model, messages, temperature: 0.3, max_tokens: maxTokens }, {
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 30000,
        });
        return res.data?.choices?.[0]?.message?.content ?? '';
    } catch (err: any) {
        if (err?.response?.status === 429 && attempt < MODELS.length) {
            const wait = Math.min(parseInt(err.response?.headers?.['retry-after'] ?? '5', 10) * 1000, 8000);
            await new Promise(r => setTimeout(r, wait));
            return callGroq(messages, maxTokens, attempt + 1);
        }
        return '';
    }
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
    data: ExportPartner[];
    fetchedAt: number;
}

// Key = sorted crops + state, Value = cached result
const partnerCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(crops: string[], state: string): string {
    return [...crops].sort().map(c => c.toLowerCase()).join(',') + '|' + state.toLowerCase();
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export class ExportPartnersService {

    /**
     * Get export partners matched to the farmer's crops.
     * Uses in-memory cache (24h TTL). Only calls Groq AI on cache miss.
     */
    static async getPartners(crops: string[], farmerState: string): Promise<{ partners: ExportPartner[]; cached: boolean; fetchedAt: string }> {
        const key = getCacheKey(crops, farmerState);

        // Check cache
        const cached = partnerCache.get(key);
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
            console.log(`[ExportPartners] Cache HIT for key: ${key}`);
            return { partners: cached.data, cached: true, fetchedAt: new Date(cached.fetchedAt).toISOString() };
        }

        console.log(`[ExportPartners] Cache MISS for key: ${key} — building partner list`);

        // Match organizations to crops
        const cropSet = new Set(crops.map(c => c.toLowerCase()));
        const matched = REAL_ORGANIZATIONS.filter(org =>
            org.cropCategories.some(cat => cropSet.has(cat.toLowerCase()))
        );

        // Also include universal bodies (APEDA, DGFT, NAFED, FIEO) even if no direct crop match
        const universalNames = ['APEDA', 'DGFT', 'NAFED', 'FIEO'];
        const universalOrgs = REAL_ORGANIZATIONS.filter(org =>
            universalNames.some(u => org.name.includes(u)) && !matched.includes(org)
        );

        const allMatched = [...matched, ...universalOrgs];

        // Score by relevance (how many of the farmer's crops this org handles)
        const scored = allMatched.map(org => {
            const matchCount = org.cropCategories.filter(cat => cropSet.has(cat.toLowerCase())).length;
            const relevance = Math.min(99, Math.round((matchCount / crops.length) * 80) + (org.type === 'Government' ? 15 : org.type === 'Commodity Board' ? 12 : 5));
            return { org, relevance };
        });

        // Sort by relevance descending
        scored.sort((a, b) => b.relevance - a.relevance);

        // Generate AI insights in a single batch call (one Groq call for all partners)
        const cropList = crops.join(', ');
        let aiInsights: Record<string, string> = {};

        try {
            const orgNames = scored.slice(0, 15).map((s, i) => `${i + 1}. ${s.org.name} (${s.org.type}) — handles: ${s.org.cropCategories.slice(0, 5).join(', ')}`).join('\n');

            const prompt = `You are AgroIntel, an agricultural market advisor for Indian farmers.

A farmer in ${farmerState} grows: ${cropList}

For each organisation below, write ONE specific, actionable sentence (max 30 words) explaining how this farmer can benefit from them. Be practical and crop-specific.

${orgNames}

Respond as a JSON object where keys are the org numbers (1, 2, 3...) and values are the sentences. Example: {"1": "Register on APEDA portal to get...", "2": "Contact NAFED for..."}
Only respond with the JSON, no markdown.`;

            const raw = await callGroq([
                { role: 'system', content: 'Respond ONLY with valid JSON. No markdown, no explanation.' },
                { role: 'user', content: prompt },
            ], 800);

            if (raw) {
                const cleaned = raw.trim().replace(/^```json?\n?/i, '').replace(/```$/i, '').trim();
                try {
                    aiInsights = JSON.parse(cleaned);
                } catch { /* use fallbacks */ }
            }
        } catch {
            console.log('[ExportPartners] Groq AI unavailable, using static descriptions');
        }

        // Build final partner list
        const partners: ExportPartner[] = scored.map((s, i) => ({
            id: i + 1,
            name: s.org.name,
            type: s.org.type,
            crops: s.org.cropCategories.filter(cat => cropSet.has(cat.toLowerCase())),
            description: s.org.description,
            cropSpecificInsight: aiInsights[String(i + 1)] || `Contact ${s.org.name} for ${cropList} export opportunities in ${farmerState}.`,
            email: s.org.email,
            phone: s.org.phone,
            website: s.org.website,
            location: s.org.location,
            verified: true,
            tag: s.org.tag,
            tagColor: s.org.tagColor,
            relevanceScore: s.relevance,
        }));

        // Cache the result
        const now = Date.now();
        partnerCache.set(key, { data: partners, fetchedAt: now });

        return { partners, cached: false, fetchedAt: new Date(now).toISOString() };
    }

    /** Clear cache for specific crops or all */
    static clearCache(crops?: string[], state?: string) {
        if (crops && state) {
            const key = getCacheKey(crops, state);
            partnerCache.delete(key);
        } else {
            partnerCache.clear();
        }
    }
}
