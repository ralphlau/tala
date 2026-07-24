const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const user = await prisma.user.findUnique({ where: { email: 'loginusercheck@example.com' } });
    console.log(JSON.stringify(user));
  } finally {
    await prisma.$disconnect();
  }
})();
