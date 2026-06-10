import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      name: 'Admin User',
      role: 'staff',
    },
  });

  console.log(`Seeded user: ${admin.username}`);

  // Sample loan data (5 records from each category)
  const sampleLoans = [
    {
      accountNo: '00140000007',
      memberName: 'Dhan Kumari Sitaula',
      memberCode: '001001351',
      loanCategory: 'Agriculture Loan (40)',
      loanTypeCode: 40,
      disburseAmount: 1800000.00,
      principalDue: 129187.46,
      dueCount: 3,
      interestTotal: 23457.67,
      loanLimit: 1800000.00,
      outstandingAmount: 825187.46,
      totalDue: 152645.13,
      mobileNo: '9844778089',
      loanExpiryDate: new Date('2087-03-07'),
      status: 'active',
      createdBy: admin.id,
    },
    {
      accountNo: '00142000139',
      memberName: 'Huma Nepali',
      memberCode: '001001863',
      loanCategory: 'Collector Loan (42)',
      loanTypeCode: 42,
      disburseAmount: 590000.00,
      principalDue: 589892.00,
      dueCount: 4,
      interestTotal: 113429.73,
      loanLimit: 590000.00,
      outstandingAmount: 589892.00,
      totalDue: 703321.73,
      mobileNo: '9849980427',
      loanExpiryDate: new Date('2083-04-14'),
      status: 'active',
      createdBy: admin.id,
    },
    {
      accountNo: '00143001129',
      memberName: 'Maya Kumari Pade Magar',
      memberCode: '001000243',
      loanCategory: 'Deposit Loan (43)',
      loanTypeCode: 43,
      disburseAmount: 135000.00,
      principalDue: 2292.87,
      dueCount: 0,
      interestTotal: 0,
      loanLimit: 135000.00,
      outstandingAmount: 134765.00,
      totalDue: 2292.87,
      mobileNo: '9821930037,9824446202',
      loanExpiryDate: new Date('2083-10-16'),
      status: 'active',
      createdBy: admin.id,
    },
    {
      accountNo: '00144000707',
      memberName: 'Jit Bahadur B K',
      memberCode: '001000004',
      loanCategory: 'Dhanjamanat Loan (44)',
      loanTypeCode: 44,
      disburseAmount: 300000.00,
      principalDue: 300000.00,
      dueCount: 6,
      interestTotal: 218259.01,
      loanLimit: 300000.00,
      outstandingAmount: 300000.00,
      totalDue: 518259.01,
      mobileNo: '9847010595',
      loanExpiryDate: new Date('2080-09-25'),
      status: 'active',
      createdBy: admin.id,
    },
    {
      accountNo: '00145000008',
      memberName: 'Lok Nath Giri',
      memberCode: '001001246',
      loanCategory: 'Hire Purchase Loan (45)',
      loanTypeCode: 45,
      disburseAmount: 47000.00,
      principalDue: 36377.78,
      dueCount: 2,
      interestTotal: 871.26,
      loanLimit: 47000.00,
      outstandingAmount: 36377.78,
      totalDue: 37249.04,
      mobileNo: '9847033366',
      loanExpiryDate: new Date('2082-09-09'),
      status: 'active',
      createdBy: admin.id,
    },
    {
      accountNo: '00151000008',
      memberName: 'Om Bahadur Kunwar',
      memberCode: '001001277',
      loanCategory: 'Recurring Deposit Loan (51)',
      loanTypeCode: 51,
      disburseAmount: 160000.00,
      principalDue: 3554.82,
      dueCount: 0,
      interestTotal: 0,
      loanLimit: 160000.00,
      outstandingAmount: 159781.00,
      totalDue: 3554.82,
      mobileNo: '9867749408',
      loanExpiryDate: new Date('2084-05-11'),
      status: 'active',
      createdBy: admin.id,
    },
  ];

  for (const loan of sampleLoans) {
    const created = await prisma.loan.upsert({
      where: { accountNo: loan.accountNo },
      update: {},
      create: loan,
    });
    console.log(`Seeded loan: ${created.accountNo} - ${created.memberName}`);
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
