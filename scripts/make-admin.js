// One-off bootstrap script: promotes an existing user to admin.
// Usage: node scripts/make-admin.js you@example.com

const { PrismaClient } = require('@prisma/client');

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/make-admin.js <email>');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user found with email ${email}. Register the account first.`);
      process.exit(1);
    }
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    });
    console.log(`${updated.email} is now an admin.`);
  } finally {
    await prisma.$disconnect();
  }
})();
