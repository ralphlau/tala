const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('connected');
    const user = await prisma.user.create({
      data: { name: 'Test', email: 'test@example.com', password: 'abc' },
    });
    console.log(user.id);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
