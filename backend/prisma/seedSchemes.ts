import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const schemes = [
        {
            name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
            description: 'A central sector scheme with 100% funding from Government of India. It provides income support to all landholding farmer families.',
            type: 'Central',
            link: 'https://pmkisan.gov.in/',
            applicableCrops: 'All',
            benefits: 'Rs. 6000/- per year in three equal installments.',
        },
        {
            name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
            description: 'Crop insurance scheme to provide financial support to farmers suffering crop loss/damage arising out of unforeseen events.',
            type: 'Central',
            link: 'https://pmfby.gov.in/',
            applicableCrops: 'All, Food Crops, Oilseeds, Annual Commercial / Horticultural Crops',
            benefits: 'Insurance coverage and financial support.',
        },
        {
            name: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',
            description: 'Scheme to extend the coverage of irrigation and improve water use efficiency.',
            type: 'Central',
            link: 'https://pmksy.gov.in/',
            applicableCrops: 'All',
            benefits: 'Improved water access and irrigation facilities.',
        },
        {
            name: 'Kisan Credit Card (KCC)',
            description: 'Scheme to provide adequate and timely credit support from the banking system.',
            type: 'Central',
            link: 'https://tm.sbi/kcc',
            applicableCrops: 'All',
            benefits: 'Credit support for cultivation and other needs.',
        },
        {
            name: 'National Food Security Mission (NFSM) - Rice',
            description: 'Increasing production of rice through area expansion and productivity enhancement.',
            type: 'Central',
            link: 'https://nfsm.gov.in/',
            applicableCrops: 'Rice',
            benefits: 'Assistance for seeds, nutrients, plant protection, and farm machinery.'
        },
        {
            name: 'National Food Security Mission (NFSM) - Wheat',
            description: 'Increasing production of wheat through area expansion and productivity enhancement.',
            type: 'Central',
            link: 'https://nfsm.gov.in/',
            applicableCrops: 'Wheat',
            benefits: 'Assistance for seeds, nutrients, plant protection, and farm machinery.'
        },
        {
            name: 'National Food Security Mission (NFSM) - Pulses',
            description: 'Increasing production of pulses through area expansion and productivity enhancement.',
            type: 'Central',
            link: 'https://nfsm.gov.in/',
            applicableCrops: 'Pulses, Lentil, Gram, Pigeon pea, Moong, Urad',
            benefits: 'Assistance for seeds, nutrients, plant protection, and farm machinery.'
        },
        {
            name: 'Mission for Integrated Development of Horticulture (MIDH)',
            description: 'Holistic growth of the horticulture sector covering fruits, vegetables, root & tuber crops, mushrooms, spices, flowers, aromatic plants, coconut, cashew, cocoa and bamboo.',
            type: 'Central',
            link: 'https://midh.gov.in/',
            applicableCrops: 'Fruits, Vegetables, Root Crops, Tuber Crops, Mushrooms, Spices, Flowers, Aromatic Plants, Coconut, Cashew, Cocoa, Bamboo',
            benefits: 'Financial assistance for plantation, infrastructure, and post-harvest management.'
        },
        {
            name: 'National Mission on Oilseeds and Oil Palm (NMOOP)',
            description: 'Increasing production and productivity of oilseeds and oil palm.',
            type: 'Central',
            link: 'https://nmoop.gov.in/',
            applicableCrops: 'Oilseeds, Groundnut, Soybean, Rapeseed, Mustard, Sunflower, Safflower, Niger, Sesame, Castor, Linseed, Oil Palm',
            benefits: 'Support for seed production, inputs, and transfer of technology.'
        }
    ];

    console.log('Seeding schemes...');
    for (const scheme of schemes) {
        await prisma.scheme.create({
            data: scheme,
        });
    }
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
