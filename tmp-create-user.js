const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const email = 'loginusercheck@example.com';
    const password = 'StrongPass123!';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) await prisma.user.delete({ where: { email } });
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name: 'Login Check', email, password: hashed } });
    console.log('created', email);
  } finally {
    await prisma.$disconnect();
  }
})();
