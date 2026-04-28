// ─── Shared Market Data ───────────────────────────────────────────────────────
// Crop classification, unified market list, and shared helpers.
// Used by both market.service.ts and market-opportunities.service.ts.

// ─── Crop Classification ─────────────────────────────────────────────────────

/** Perishable crops that can be sold at local vegetable markets */
const PERISHABLE_CROPS = new Set([
    'tomato', 'onion', 'potato', 'lemon', 'chilli', 'brinjal', 'cabbage',
    'cauliflower', 'cucumber', 'beans', 'carrot', 'beetroot', 'pumpkin',
    'bitter gourd', 'ladies finger', 'okra', 'drumstick', 'spinach',
    'coriander', 'ginger', 'garlic', 'green peas', 'capsicum',
    'banana', 'mango', 'papaya', 'watermelon', 'pineapple', 'guava',
]);

/** Returns true if the crop is perishable (vegetable / fruit) */
export function isPerishable(cropName: string): boolean {
    return PERISHABLE_CROPS.has(cropName.toLowerCase().trim());
}

// ─── Market Types ────────────────────────────────────────────────────────────

export type MarketType = 'apmc' | 'vegetable' | 'local_estimate';

export interface MarketData {
    name: string;
    district: string;
    state: string;
    lat: number;
    lon: number;
    volumeBase: number;   // tonnes per day
    marketType: MarketType;
}

// ─── MSP Data ────────────────────────────────────────────────────────────────

export const CROP_MSP: Record<string, number> = {
    'rice': 2300, 'wheat': 2275, 'maize': 2090, 'sugarcane': 340,
    'cotton': 7521, 'soybean': 4892, 'groundnut': 6783, 'sunflower': 7280,
    'mustard': 5650, 'gram': 5440, 'tur': 7550, 'moong': 8682,
    'urad': 7400, 'jowar': 3371, 'bajra': 2625, 'ragi': 4290,
    'tomato': 1500, 'onion': 1200, 'potato': 900, 'lemon': 2000,
    'chilli': 1800, 'brinjal': 1100, 'cabbage': 800, 'cauliflower': 1000,
    'cucumber': 900, 'beans': 1400, 'carrot': 1200, 'banana': 1600,
    'default': 2200,
};

export function getBaseMSP(cropName: string): number {
    return CROP_MSP[cropName.toLowerCase().trim()] ?? CROP_MSP['default'];
}

// ─── India-wide APMC / Wholesale Markets ──────────────────────────────────────

const APMC_MARKETS: MarketData[] = [
    // Tamil Nadu
    { name: 'Chennai Koyambedu', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, volumeBase: 3200, marketType: 'apmc' },
    { name: 'Coimbatore APMC', district: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, volumeBase: 1800, marketType: 'apmc' },
    { name: 'Madurai Market', district: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198, volumeBase: 1400, marketType: 'apmc' },
    { name: 'Salem APMC', district: 'Salem', state: 'Tamil Nadu', lat: 11.6640, lon: 78.1460, volumeBase: 1100, marketType: 'apmc' },
    { name: 'Trichy Market', district: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lon: 78.7047, volumeBase: 1200, marketType: 'apmc' },
    { name: 'Tirunelveli APMC', district: 'Tirunelveli', state: 'Tamil Nadu', lat: 8.7139, lon: 77.7567, volumeBase: 900, marketType: 'apmc' },
    { name: 'Erode Market', district: 'Erode', state: 'Tamil Nadu', lat: 11.3410, lon: 77.7172, volumeBase: 1000, marketType: 'apmc' },
    { name: 'Hosur APMC', district: 'Krishnagiri', state: 'Tamil Nadu', lat: 12.7409, lon: 77.8253, volumeBase: 1500, marketType: 'apmc' },
    { name: 'Pollachi Market', district: 'Coimbatore', state: 'Tamil Nadu', lat: 10.6624, lon: 77.0069, volumeBase: 800, marketType: 'apmc' },
    { name: 'Vellore APMC', district: 'Vellore', state: 'Tamil Nadu', lat: 12.9165, lon: 79.1325, volumeBase: 850, marketType: 'apmc' },
    { name: 'Thanjavur Market', district: 'Thanjavur', state: 'Tamil Nadu', lat: 10.7870, lon: 79.1378, volumeBase: 700, marketType: 'apmc' },
    { name: 'Dindigul Market', district: 'Dindigul', state: 'Tamil Nadu', lat: 10.3673, lon: 77.9803, volumeBase: 800, marketType: 'apmc' },
    { name: 'Nagercoil APMC', district: 'Kanyakumari', state: 'Tamil Nadu', lat: 8.1833, lon: 77.4119, volumeBase: 650, marketType: 'apmc' },

    // Karnataka
    { name: 'Bengaluru APMC (Yeshwantpur)', district: 'Bengaluru', state: 'Karnataka', lat: 13.0232, lon: 77.5369, volumeBase: 4500, marketType: 'apmc' },
    { name: 'Mysuru APMC', district: 'Mysuru', state: 'Karnataka', lat: 12.2958, lon: 76.6394, volumeBase: 1100, marketType: 'apmc' },
    { name: 'Hubballi Market', district: 'Dharwad', state: 'Karnataka', lat: 15.3647, lon: 75.1240, volumeBase: 980, marketType: 'apmc' },
    { name: 'Mangaluru APMC', district: 'Dakshina Kannada', state: 'Karnataka', lat: 12.9141, lon: 74.8560, volumeBase: 870, marketType: 'apmc' },
    { name: 'Bellary Market', district: 'Bellary', state: 'Karnataka', lat: 15.1394, lon: 76.9214, volumeBase: 750, marketType: 'apmc' },
    { name: 'Davangere APMC', district: 'Davangere', state: 'Karnataka', lat: 14.4644, lon: 75.9218, volumeBase: 800, marketType: 'apmc' },
    { name: 'Shimoga Market', district: 'Shimoga', state: 'Karnataka', lat: 13.9299, lon: 75.5681, volumeBase: 600, marketType: 'apmc' },
    { name: 'Belgaum APMC', district: 'Belagavi', state: 'Karnataka', lat: 15.8497, lon: 74.4977, volumeBase: 900, marketType: 'apmc' },
    { name: 'Tumkur Market', district: 'Tumakuru', state: 'Karnataka', lat: 13.3392, lon: 77.1016, volumeBase: 650, marketType: 'apmc' },
    { name: 'Hassan APMC', district: 'Hassan', state: 'Karnataka', lat: 13.0068, lon: 76.1004, volumeBase: 550, marketType: 'apmc' },
    { name: 'Raichur Market', district: 'Raichur', state: 'Karnataka', lat: 16.2076, lon: 77.3463, volumeBase: 700, marketType: 'apmc' },

    // Andhra Pradesh
    { name: 'Kurnool Market', district: 'Kurnool', state: 'Andhra Pradesh', lat: 15.8281, lon: 78.0373, volumeBase: 1100, marketType: 'apmc' },
    { name: 'Guntur Market Yard', district: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lon: 80.4365, volumeBase: 1700, marketType: 'apmc' },
    { name: 'Vijayawada APMC', district: 'NTR', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480, volumeBase: 2200, marketType: 'apmc' },
    { name: 'Tirupati Market', district: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lon: 79.4192, volumeBase: 800, marketType: 'apmc' },
    { name: 'Kadapa APMC', district: 'YSR', state: 'Andhra Pradesh', lat: 14.4673, lon: 78.8242, volumeBase: 750, marketType: 'apmc' },
    { name: 'Nellore Market', district: 'SPSR Nellore', state: 'Andhra Pradesh', lat: 14.4426, lon: 79.9865, volumeBase: 900, marketType: 'apmc' },
    { name: 'Visakhapatnam APMC', district: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185, volumeBase: 1400, marketType: 'apmc' },
    { name: 'Anantapur Market', district: 'Anantapur', state: 'Andhra Pradesh', lat: 14.6819, lon: 77.6006, volumeBase: 850, marketType: 'apmc' },

    // Telangana
    { name: 'Hyderabad Bowenpally', district: 'Hyderabad', state: 'Telangana', lat: 17.4794, lon: 78.4983, volumeBase: 4200, marketType: 'apmc' },
    { name: 'Gaddiannaram Market', district: 'Hyderabad', state: 'Telangana', lat: 17.3686, lon: 78.5306, volumeBase: 1500, marketType: 'apmc' },
    { name: 'Warangal APMC', district: 'Warangal', state: 'Telangana', lat: 17.9689, lon: 79.5941, volumeBase: 1200, marketType: 'apmc' },
    { name: 'Nizamabad Market', district: 'Nizamabad', state: 'Telangana', lat: 18.6705, lon: 78.0968, volumeBase: 800, marketType: 'apmc' },
    { name: 'Karimnagar APMC', district: 'Karimnagar', state: 'Telangana', lat: 18.4386, lon: 79.1288, volumeBase: 700, marketType: 'apmc' },
    { name: 'Khammam Market', district: 'Khammam', state: 'Telangana', lat: 17.2473, lon: 80.1514, volumeBase: 750, marketType: 'apmc' },

    // Maharashtra
    { name: 'Mumbai APMC Vashi', district: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, volumeBase: 5000, marketType: 'apmc' },
    { name: 'Pune APMC', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, volumeBase: 3800, marketType: 'apmc' },
    { name: 'Nashik Market', district: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898, volumeBase: 2100, marketType: 'apmc' },
    { name: 'Nagpur APMC', district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, volumeBase: 1800, marketType: 'apmc' },
    { name: 'Aurangabad Market', district: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lon: 75.3433, volumeBase: 1200, marketType: 'apmc' },
    { name: 'Kolhapur APMC', district: 'Kolhapur', state: 'Maharashtra', lat: 16.7050, lon: 74.2433, volumeBase: 900, marketType: 'apmc' },
    { name: 'Solapur Market', district: 'Solapur', state: 'Maharashtra', lat: 17.6599, lon: 75.9064, volumeBase: 850, marketType: 'apmc' },
    { name: 'Sangli APMC', district: 'Sangli', state: 'Maharashtra', lat: 16.8524, lon: 74.5815, volumeBase: 1000, marketType: 'apmc' },
    { name: 'Amravati Market', district: 'Amravati', state: 'Maharashtra', lat: 20.9320, lon: 77.7523, volumeBase: 700, marketType: 'apmc' },
    { name: 'Latur APMC', district: 'Latur', state: 'Maharashtra', lat: 18.4088, lon: 76.5604, volumeBase: 800, marketType: 'apmc' },

    // Gujarat
    { name: 'Ahmedabad APMC', district: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, volumeBase: 3000, marketType: 'apmc' },
    { name: 'Surat Market', district: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311, volumeBase: 2500, marketType: 'apmc' },
    { name: 'Rajkot APMC', district: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022, volumeBase: 1500, marketType: 'apmc' },
    { name: 'Vadodara Market', district: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812, volumeBase: 1400, marketType: 'apmc' },
    { name: 'Mehsana APMC', district: 'Mehsana', state: 'Gujarat', lat: 23.5880, lon: 72.3693, volumeBase: 1100, marketType: 'apmc' },
    { name: 'Junagadh Market', district: 'Junagadh', state: 'Gujarat', lat: 21.5222, lon: 70.4579, volumeBase: 900, marketType: 'apmc' },

    // Delhi/NCR
    { name: 'Delhi Azadpur', district: 'Delhi', state: 'Delhi', lat: 28.7041, lon: 77.1025, volumeBase: 6000, marketType: 'apmc' },
    { name: 'Delhi Okhla', district: 'Delhi', state: 'Delhi', lat: 28.5273, lon: 77.2905, volumeBase: 2500, marketType: 'apmc' },
    { name: 'Delhi Ghazipur', district: 'Delhi', state: 'Delhi', lat: 28.6253, lon: 77.3294, volumeBase: 1800, marketType: 'apmc' },
    { name: 'Noida APMC', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910, volumeBase: 1500, marketType: 'apmc' },

    // UP
    { name: 'Lucknow APMC', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, volumeBase: 3500, marketType: 'apmc' },
    { name: 'Agra Market', district: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, volumeBase: 2000, marketType: 'apmc' },
    { name: 'Varanasi APMC', district: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, volumeBase: 1800, marketType: 'apmc' },
    { name: 'Kanpur Market', district: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, volumeBase: 2200, marketType: 'apmc' },
    { name: 'Prayagraj APMC', district: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463, volumeBase: 1500, marketType: 'apmc' },
    { name: 'Meerut Market', district: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064, volumeBase: 1200, marketType: 'apmc' },

    // Punjab / Haryana
    { name: 'Amritsar Grain Market', district: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723, volumeBase: 3100, marketType: 'apmc' },
    { name: 'Ludhiana APMC', district: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573, volumeBase: 2800, marketType: 'apmc' },
    { name: 'Jalandhar Market', district: 'Jalandhar', state: 'Punjab', lat: 31.3260, lon: 75.5762, volumeBase: 1500, marketType: 'apmc' },
    { name: 'Karnal APMC', district: 'Karnal', state: 'Haryana', lat: 29.6857, lon: 76.9905, volumeBase: 1600, marketType: 'apmc' },
    { name: 'Ambala Market', district: 'Ambala', state: 'Haryana', lat: 30.3782, lon: 76.7767, volumeBase: 1200, marketType: 'apmc' },
    { name: 'Panipat APMC', district: 'Panipat', state: 'Haryana', lat: 29.3909, lon: 76.9635, volumeBase: 1400, marketType: 'apmc' },

    // Rajasthan
    { name: 'Jaipur APMC', district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, volumeBase: 2400, marketType: 'apmc' },
    { name: 'Jodhpur Market', district: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243, volumeBase: 1500, marketType: 'apmc' },
    { name: 'Udaipur APMC', district: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lon: 73.7125, volumeBase: 1200, marketType: 'apmc' },
    { name: 'Kota Market', district: 'Kota', state: 'Rajasthan', lat: 25.2138, lon: 75.8648, volumeBase: 1800, marketType: 'apmc' },
    { name: 'Ajmer APMC', district: 'Ajmer', state: 'Rajasthan', lat: 26.4499, lon: 74.6399, volumeBase: 900, marketType: 'apmc' },

    // West Bengal
    { name: 'Kolkata Koley Market', district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, volumeBase: 4000, marketType: 'apmc' },
    { name: 'Sealdah Market', district: 'Kolkata', state: 'West Bengal', lat: 22.5695, lon: 88.3712, volumeBase: 2500, marketType: 'apmc' },
    { name: 'Siliguri APMC', district: 'Darjeeling', state: 'West Bengal', lat: 26.7136, lon: 88.4255, volumeBase: 1500, marketType: 'apmc' },
    { name: 'Howrah Market', district: 'Howrah', state: 'West Bengal', lat: 22.5958, lon: 88.3259, volumeBase: 1800, marketType: 'apmc' },

    // Madhya Pradesh
    { name: 'Indore APMC', district: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, volumeBase: 2500, marketType: 'apmc' },
    { name: 'Bhopal Market', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, volumeBase: 1800, marketType: 'apmc' },
    { name: 'Jabalpur APMC', district: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864, volumeBase: 1200, marketType: 'apmc' },
    { name: 'Gwalior Market', district: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828, volumeBase: 1000, marketType: 'apmc' },

    // Others
    { name: 'Raipur APMC', district: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296, volumeBase: 1600, marketType: 'apmc' },
    { name: 'Bhubaneswar Market', district: 'Khordha', state: 'Odisha', lat: 20.2961, lon: 85.8245, volumeBase: 1400, marketType: 'apmc' },
    { name: 'Guwahati APMC', district: 'Kamrup Metropolitan', state: 'Assam', lat: 26.1445, lon: 91.7362, volumeBase: 1500, marketType: 'apmc' },
    { name: 'Patna Market', district: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376, volumeBase: 1800, marketType: 'apmc' },
    { name: 'Ranchi APMC', district: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096, volumeBase: 1200, marketType: 'apmc' },
    { name: 'Jammu Market', district: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7266, lon: 74.8570, volumeBase: 900, marketType: 'apmc' },
    { name: 'Chandigarh APMC', district: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794, volumeBase: 1100, marketType: 'apmc' },
    { name: 'Dehradun Market', district: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322, volumeBase: 800, marketType: 'apmc' },
];

// ─── Kerala Vegetable Markets ───────────────────────────────────────────────

const VEGETABLE_MARKETS: MarketData[] = [
    // Thiruvananthapuram
    { name: 'Chalai Market', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.4875, lon: 76.9525, volumeBase: 550, marketType: 'vegetable' },
    { name: 'Palayam Market', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5040, lon: 76.9553, volumeBase: 400, marketType: 'vegetable' },
    { name: 'Neyyattinkara Market', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.3980, lon: 77.0850, volumeBase: 200, marketType: 'vegetable' },
    { name: 'Attingal Market', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.6946, lon: 76.8157, volumeBase: 250, marketType: 'vegetable' },
    { name: 'Kattakada Market', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.4965, lon: 77.0854, volumeBase: 150, marketType: 'vegetable' },
    { name: 'Kazhakuttom Market', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5684, lon: 76.8680, volumeBase: 180, marketType: 'vegetable' },

    // Kollam
    { name: 'Kavanad Market', district: 'Kollam', state: 'Kerala', lat: 8.9100, lon: 76.5500, volumeBase: 280, marketType: 'vegetable' },
    { name: 'Ramankulangara Market', district: 'Kollam', state: 'Kerala', lat: 8.8932, lon: 76.5641, volumeBase: 220, marketType: 'vegetable' },
    { name: 'Karunagappally Market', district: 'Kollam', state: 'Kerala', lat: 9.0558, lon: 76.5358, volumeBase: 190, marketType: 'vegetable' },
    { name: 'Punalur Market', district: 'Kollam', state: 'Kerala', lat: 9.0149, lon: 76.9298, volumeBase: 170, marketType: 'vegetable' },

    // Pathanamthitta
    { name: 'Adoor Market', district: 'Pathanamthitta', state: 'Kerala', lat: 9.1509, lon: 76.7329, volumeBase: 160, marketType: 'vegetable' },
    { name: 'Thiruvalla Market', district: 'Pathanamthitta', state: 'Kerala', lat: 9.3835, lon: 76.5744, volumeBase: 180, marketType: 'vegetable' },
    { name: 'Pathanamthitta Town Market', district: 'Pathanamthitta', state: 'Kerala', lat: 9.2648, lon: 76.7870, volumeBase: 150, marketType: 'vegetable' },

    // Alappuzha
    { name: 'Alappuzha Town Market', district: 'Alappuzha', state: 'Kerala', lat: 9.4981, lon: 76.3388, volumeBase: 200, marketType: 'vegetable' },
    { name: 'Cherthala Market', district: 'Alappuzha', state: 'Kerala', lat: 9.6842, lon: 76.3351, volumeBase: 170, marketType: 'vegetable' },
    { name: 'Kayamkulam Market', district: 'Alappuzha', state: 'Kerala', lat: 9.1725, lon: 76.4950, volumeBase: 190, marketType: 'vegetable' },

    // Kottayam
    { name: 'Thirunakkara Market', district: 'Kottayam', state: 'Kerala', lat: 9.5916, lon: 76.5222, volumeBase: 320, marketType: 'vegetable' },
    { name: 'Pala Market', district: 'Kottayam', state: 'Kerala', lat: 9.7118, lon: 76.6853, volumeBase: 180, marketType: 'vegetable' },
    { name: 'Changanassery Market', district: 'Kottayam', state: 'Kerala', lat: 9.4449, lon: 76.5398, volumeBase: 210, marketType: 'vegetable' },
    { name: 'Ettumanoor Market', district: 'Kottayam', state: 'Kerala', lat: 9.6644, lon: 76.5619, volumeBase: 160, marketType: 'vegetable' },

    // Idukki
    { name: 'Thodupuzha Market', district: 'Idukki', state: 'Kerala', lat: 9.8959, lon: 76.7183, volumeBase: 220, marketType: 'vegetable' },
    { name: 'Kattappana Market', district: 'Idukki', state: 'Kerala', lat: 9.7490, lon: 77.1066, volumeBase: 140, marketType: 'vegetable' },
    { name: 'Adimali Market', district: 'Idukki', state: 'Kerala', lat: 10.0125, lon: 76.9535, volumeBase: 110, marketType: 'vegetable' },
    { name: 'Munnar Market', district: 'Idukki', state: 'Kerala', lat: 10.0889, lon: 77.0595, volumeBase: 150, marketType: 'vegetable' },

    // Ernakulam
    { name: 'Ernakulam Market', district: 'Ernakulam', state: 'Kerala', lat: 9.9816, lon: 76.2999, volumeBase: 600, marketType: 'vegetable' },
    { name: 'Broadway Market', district: 'Ernakulam', state: 'Kerala', lat: 9.9798, lon: 76.2800, volumeBase: 350, marketType: 'vegetable' },
    { name: 'Aluva Market', district: 'Ernakulam', state: 'Kerala', lat: 10.1085, lon: 76.3496, volumeBase: 280, marketType: 'vegetable' },
    { name: 'Perumbavoor Market', district: 'Ernakulam', state: 'Kerala', lat: 10.1147, lon: 76.4789, volumeBase: 240, marketType: 'vegetable' },
    { name: 'Angamaly Market', district: 'Ernakulam', state: 'Kerala', lat: 10.1960, lon: 76.3860, volumeBase: 200, marketType: 'vegetable' },
    { name: 'Muvattupuzha Market', district: 'Ernakulam', state: 'Kerala', lat: 9.9855, lon: 76.5815, volumeBase: 220, marketType: 'vegetable' },
    { name: 'North Paravur Market', district: 'Ernakulam', state: 'Kerala', lat: 10.1444, lon: 76.2235, volumeBase: 180, marketType: 'vegetable' },

    // Thrissur
    { name: 'Sakthan Thampuran Market', district: 'Thrissur', state: 'Kerala', lat: 10.5230, lon: 76.2100, volumeBase: 380, marketType: 'vegetable' },
    { name: 'Guruvayoor Market', district: 'Thrissur', state: 'Kerala', lat: 10.5947, lon: 76.0401, volumeBase: 150, marketType: 'vegetable' },
    { name: 'Kodungallur Market', district: 'Thrissur', state: 'Kerala', lat: 10.2239, lon: 76.1952, volumeBase: 190, marketType: 'vegetable' },
    { name: 'Irinjalakuda Market', district: 'Thrissur', state: 'Kerala', lat: 10.3475, lon: 76.2081, volumeBase: 170, marketType: 'vegetable' },
    { name: 'Chalakudy Market', district: 'Thrissur', state: 'Kerala', lat: 10.3013, lon: 76.3353, volumeBase: 210, marketType: 'vegetable' },

    // Palakkad
    { name: 'Palakkad Town Market', district: 'Palakkad', state: 'Kerala', lat: 10.7867, lon: 76.6548, volumeBase: 250, marketType: 'vegetable' },
    { name: 'Ottapalam Market', district: 'Palakkad', state: 'Kerala', lat: 10.7681, lon: 76.3813, volumeBase: 160, marketType: 'vegetable' },
    { name: 'Shornur Market', district: 'Palakkad', state: 'Kerala', lat: 10.7610, lon: 76.2753, volumeBase: 140, marketType: 'vegetable' },
    { name: 'Chittur Market', district: 'Palakkad', state: 'Kerala', lat: 10.6946, lon: 76.7454, volumeBase: 130, marketType: 'vegetable' },

    // Malappuram
    { name: 'Manjeri Market', district: 'Malappuram', state: 'Kerala', lat: 11.1215, lon: 76.1211, volumeBase: 280, marketType: 'vegetable' },
    { name: 'Perinthalmanna Market', district: 'Malappuram', state: 'Kerala', lat: 10.9760, lon: 76.2239, volumeBase: 220, marketType: 'vegetable' },
    { name: 'Tirur Market', district: 'Malappuram', state: 'Kerala', lat: 10.9152, lon: 75.9224, volumeBase: 200, marketType: 'vegetable' },
    { name: 'Ponnani Market', district: 'Malappuram', state: 'Kerala', lat: 10.7725, lon: 75.9257, volumeBase: 150, marketType: 'vegetable' },
    { name: 'Kottakkal Market', district: 'Malappuram', state: 'Kerala', lat: 10.9996, lon: 75.9984, volumeBase: 160, marketType: 'vegetable' },

    // Kozhikode
    { name: 'Palayam Market', district: 'Kozhikode', state: 'Kerala', lat: 11.2480, lon: 75.7700, volumeBase: 450, marketType: 'vegetable' },
    { name: 'Vengeri Wholesale Market', district: 'Kozhikode', state: 'Kerala', lat: 11.2965, lon: 75.7901, volumeBase: 380, marketType: 'vegetable' },
    { name: 'Vadakara Market', district: 'Kozhikode', state: 'Kerala', lat: 11.6020, lon: 75.5898, volumeBase: 190, marketType: 'vegetable' },
    { name: 'Koyilandy Market', district: 'Kozhikode', state: 'Kerala', lat: 11.4420, lon: 75.6980, volumeBase: 170, marketType: 'vegetable' },

    // Wayanad
    { name: 'Kalpetta Market', district: 'Wayanad', state: 'Kerala', lat: 11.6103, lon: 76.0827, volumeBase: 180, marketType: 'vegetable' },
    { name: 'Sultan Bathery Market', district: 'Wayanad', state: 'Kerala', lat: 11.6660, lon: 76.2618, volumeBase: 160, marketType: 'vegetable' },
    { name: 'Mananthavady Market', district: 'Wayanad', state: 'Kerala', lat: 11.8028, lon: 76.0028, volumeBase: 140, marketType: 'vegetable' },

    // Kannur
    { name: 'Kannur Town Market', district: 'Kannur', state: 'Kerala', lat: 11.8745, lon: 75.3704, volumeBase: 300, marketType: 'vegetable' },
    { name: 'Thalassery Market', district: 'Kannur', state: 'Kerala', lat: 11.7481, lon: 75.4894, volumeBase: 250, marketType: 'vegetable' },
    { name: 'Payyanur Market', district: 'Kannur', state: 'Kerala', lat: 12.1030, lon: 75.2030, volumeBase: 180, marketType: 'vegetable' },

    // Kasaragod
    { name: 'Kasaragod Town Market', district: 'Kasaragod', state: 'Kerala', lat: 12.5000, lon: 74.9895, volumeBase: 200, marketType: 'vegetable' },
    { name: 'Kanhangad Market', district: 'Kasaragod', state: 'Kerala', lat: 12.3168, lon: 75.0931, volumeBase: 180, marketType: 'vegetable' },

    // Tamil Nadu & Karnataka Vegetable Markets
    { name: 'Koyambedu Vegetable Market', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0693, lon: 80.1947, volumeBase: 2800, marketType: 'vegetable' },
    { name: 'Oddanchatram Vegetable Market', district: 'Dindigul', state: 'Tamil Nadu', lat: 10.4850, lon: 77.7536, volumeBase: 1200, marketType: 'vegetable' },
    { name: 'Mettupalayam Vegetable Market', district: 'Coimbatore', state: 'Tamil Nadu', lat: 11.2990, lon: 76.9400, volumeBase: 900, marketType: 'vegetable' },
    { name: 'KR Market (Bengaluru)', district: 'Bengaluru', state: 'Karnataka', lat: 12.9600, lon: 77.5773, volumeBase: 2200, marketType: 'vegetable' },
    { name: 'Devaraja Market (Mysuru)', district: 'Mysuru', state: 'Karnataka', lat: 12.3050, lon: 76.6560, volumeBase: 700, marketType: 'vegetable' },
];

// ─── Market Selection ────────────────────────────────────────────────────────

/**
 * Returns the appropriate market list based on crop type:
 * - Perishable crops → vegetable markets + APMC
 * - Non-perishable crops → APMC wholesale markets only
 */
export function getMarketsForCrop(cropName: string): MarketData[] {
    if (isPerishable(cropName)) {
        return [...VEGETABLE_MARKETS, ...APMC_MARKETS];
    }
    return APMC_MARKETS;
}

/** Get ALL markets (used for backward compatibility) */
export function getAllMarkets(): MarketData[] {
    return APMC_MARKETS;
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

export function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const c = seed.charCodeAt(i);
        hash = (hash << 5) - hash + c;
        hash &= hash;
    }
    return Math.abs(hash % 10000) / 10000;
}

/**
 * Estimate a realistic price for a curated market when API data is not available.
 */
export function getRealisticPriceEstimate(
    market: MarketData,
    cropName: string,
    today: string,
    yesterday: string,
    baseMspOverride?: number
): { price: number; yestPrice: number; trend: number; volume: number } {
    let msp = baseMspOverride ?? getBaseMSP(cropName);

    // Apply regional premiums
    // Kerala imports most vegetables, so prices are typically 15-30% higher
    if (market.state === 'Kerala' && isPerishable(cropName)) {
        msp *= 1.25;
    } else if (market.state === 'Tamil Nadu' || market.state === 'Karnataka') {
        msp *= 1.10;
    }

    // Larger markets have slightly lower prices due to volume
    const sizeDiscount = market.volumeBase > 1000 ? 0.95 : 1.0;

    const todaySeed = `${cropName}-${market.name}-${today}`;
    const yestSeed = `${cropName}-${market.name}-${yesterday}`;

    // Each market has a permanent "premium" factor (±10%)
    const marketPremium = (seededRandom(`premium-${market.name}`) - 0.5) * 0.2;
    let basePrice = msp * (1 + marketPremium) * sizeDiscount;

    // Daily variation ±5%
    const todayVariation = (seededRandom(todaySeed) - 0.5) * 0.10;
    const yestVariation = (seededRandom(yestSeed) - 0.5) * 0.10;

    const price = Math.round(basePrice * (1 + todayVariation));
    const yestPrice = Math.round(basePrice * (1 + yestVariation));
    const trend = parseFloat((((price - yestPrice) / yestPrice) * 100).toFixed(2));

    // Volume varies ±30% daily
    const volVariation = 0.7 + seededRandom(`vol-${market.name}-${today}`) * 0.6;
    const volume = Math.round(market.volumeBase * volVariation);

    return { price, yestPrice, trend, volume };
}
