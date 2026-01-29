import prisma from './src/prisma';

async function main() {
    const users = await prisma.user.findMany();
    console.log('All Users:', users);
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
