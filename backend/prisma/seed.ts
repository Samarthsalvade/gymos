import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

const PLANS = [
  { name: 'Monthly', days: 30, price: 1499 },
  { name: 'Quarterly', days: 90, price: 3999 },
  { name: 'Semi-Annual', days: 180, price: 6999 },
  { name: 'Annual', days: 365, price: 11999 },
  { name: 'Student Monthly', days: 30, price: 999 },
  { name: 'Student Quarterly', days: 90, price: 2499 },
  { name: 'Premium Annual', days: 365, price: 24999 },
];

const MEMBERS = [
  { firstName: 'Arjun',    lastName: 'Sharma',    email: 'arjun@example.com',    goals: 'Build muscle mass',                level: 'INTERMEDIATE', gender: 'Male',   weight: 78, target: 85, plan: 'Quarterly',      loyalty: 340 },
  { firstName: 'Priya',    lastName: 'Patel',     email: 'priya@example.com',    goals: 'Weight loss and toning',           level: 'BEGINNER',     gender: 'Female', weight: 68, target: 60, plan: 'Monthly',         loyalty: 80  },
  { firstName: 'Rahul',    lastName: 'Verma',     email: 'rahul@example.com',    goals: 'Athletic performance',             level: 'ADVANCED',     gender: 'Male',   weight: 80, target: 78, plan: 'Annual',          loyalty: 890 },
  { firstName: 'Sneha',    lastName: 'Gupta',     email: 'sneha@example.com',    goals: 'General fitness and stress relief',level: 'BEGINNER',     gender: 'Female', weight: 62, target: 58, plan: 'Student Monthly',  loyalty: 55  },
  { firstName: 'Vikram',   lastName: 'Singh',     email: 'vikram@example.com',   goals: 'Powerlifting and strength',        level: 'ADVANCED',     gender: 'Male',   weight: 95, target: 95, plan: 'Premium Annual',  loyalty: 1200},
  { firstName: 'Anjali',   lastName: 'Mehta',     email: 'anjali@example.com',   goals: 'Posture correction and flexibility',level: 'BEGINNER',    gender: 'Female', weight: 55, target: 55, plan: 'Semi-Annual',     loyalty: 210 },
  { firstName: 'Karan',    lastName: 'Kapoor',    email: 'karan@example.com',    goals: 'Six pack abs and lean body',       level: 'INTERMEDIATE', gender: 'Male',   weight: 72, target: 68, plan: 'Quarterly',       loyalty: 440 },
  { firstName: 'Nisha',    lastName: 'Joshi',     email: 'nisha@example.com',    goals: 'Marathon training and cardio',     level: 'INTERMEDIATE', gender: 'Female', weight: 58, target: 56, plan: 'Annual',          loyalty: 670 },
  { firstName: 'Aditya',   lastName: 'Kumar',     email: 'aditya@example.com',   goals: 'Bulk up and gain weight',          level: 'BEGINNER',     gender: 'Male',   weight: 65, target: 75, plan: 'Student Quarterly',loyalty: 120 },
  { firstName: 'Pooja',    lastName: 'Rao',       email: 'pooja@example.com',    goals: 'Fitness after pregnancy',          level: 'BEGINNER',     gender: 'Female', weight: 72, target: 63, plan: 'Monthly',         loyalty: 90  },
  { firstName: 'Sanjay',   lastName: 'Malhotra',  email: 'sanjay@example.com',   goals: 'Corporate fitness and energy',     level: 'INTERMEDIATE', gender: 'Male',   weight: 82, target: 76, plan: 'Quarterly',       loyalty: 310 },
  { firstName: 'Deepika',  lastName: 'Nair',      email: 'deepika@example.com',  goals: 'Dance fitness and flexibility',    level: 'BEGINNER',     gender: 'Female', weight: 59, target: 55, plan: 'Semi-Annual',     loyalty: 180 },
  { firstName: 'Rohan',    lastName: 'Bose',      email: 'rohan@example.com',    goals: 'Sports conditioning for cricket',  level: 'ADVANCED',     gender: 'Male',   weight: 74, target: 72, plan: 'Annual',          loyalty: 750 },
  { firstName: 'Kavita',   lastName: 'Iyer',      email: 'kavita@example.com',   goals: 'Strength and bone density',        level: 'BEGINNER',     gender: 'Female', weight: 64, target: 60, plan: 'Monthly',         loyalty: 65  },
  { firstName: 'Amit',     lastName: 'Desai',     email: 'amit@example.com',     goals: 'Body recomposition',               level: 'INTERMEDIATE', gender: 'Male',   weight: 88, target: 80, plan: 'Premium Annual',  loyalty: 980 },
];

async function main() {
  console.log('🌱 Seeding PostgreSQL database...');

  // Gym
  const gym = await prisma.gym.upsert({
    where: { gymCode: 'DEMO01' },
    update: {},
    create: {
      gymCode: 'DEMO01',
      name: 'FitZone Premium Gym',
      accentColor: '#6366f1',
      address: '123 Fitness Avenue, Bandra West, Mumbai - 400050',
      phone: '+91 98765 43210',
      email: 'info@fitzone.com',
      website: 'https://fitzone.example.com',
      description: 'Mumbai\'s premier fitness destination with state-of-the-art equipment and expert trainers.',
    },
  });
  console.log(`✅ Gym: ${gym.name} (${gym.gymCode})`);

  // Admin
  const adminHash = await bcrypt.hash('admin123', 12);
  let admin = await prisma.user.findFirst({ where: { gymId: gym.id, email: 'admin@fitzone.com' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        gymId: gym.id, email: 'admin@fitzone.com', username: 'admin@fitzone.com',
        passwordHash: adminHash, role: 'ADMIN', firstName: 'Samarth', lastName: 'Gupta',
        phone: '+91 98765 00001', referralCode: 'ADMIN001',
      },
    });
  }
  const adminQr = await QRCode.toDataURL(JSON.stringify({ userId: admin.id, gymId: gym.id }));
  await prisma.user.update({ where: { id: admin.id }, data: { qrCode: adminQr } });
  console.log(`✅ Admin: ${admin.email}`);

  // Trainer
  const trainerHash = await bcrypt.hash('trainer123', 12);
  let trainer = await prisma.user.findFirst({ where: { gymId: gym.id, email: 'trainer@fitzone.com' } });
  if (!trainer) {
    trainer = await prisma.user.create({
      data: {
        gymId: gym.id, email: 'trainer@fitzone.com', username: 'trainer@fitzone.com',
        passwordHash: trainerHash, role: 'TRAINER', firstName: 'Raj', lastName: 'Fitness',
        phone: '+91 98765 00002', referralCode: 'TRAINER01',
      },
    });
  }
  const trainerQr = await QRCode.toDataURL(JSON.stringify({ userId: trainer.id, gymId: gym.id }));
  await prisma.user.update({ where: { id: trainer.id }, data: { qrCode: trainerQr } });

  // 15 Members
  for (let i = 0; i < MEMBERS.length; i++) {
    const m = MEMBERS[i];
    const hash = await bcrypt.hash('member123', 12);
    const planDef = PLANS.find(p => p.name === m.plan) || PLANS[0];
    const startDate = new Date(Date.now() - Math.floor(Math.random() * 60 + 5) * 86400000);
    const endDate = new Date(startDate.getTime() + planDef.days * 86400000);

    let user = await prisma.user.findFirst({ where: { gymId: gym.id, email: m.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          gymId: gym.id, email: m.email, username: m.email,
          passwordHash: hash, role: 'MEMBER',
          firstName: m.firstName, lastName: m.lastName,
          phone: `+91 987654${String(i + 10).padStart(4, '0')}`,
          referralCode: `${m.firstName.toUpperCase().slice(0, 4)}${String(i + 1).padStart(3, '0')}`,
          loyaltyPoints: m.loyalty,
          profile: {
            create: {
              goals: m.goals, fitnessLevel: m.level, gender: m.gender,
              currentWeight: m.weight, targetWeight: m.target,
              availableDays: JSON.stringify(['Monday', 'Wednesday', 'Friday', 'Saturday']),
            },
          },
        },
      });
    }
    const qr = await QRCode.toDataURL(JSON.stringify({ userId: user.id, gymId: gym.id }));
    await prisma.user.update({ where: { id: user.id }, data: { qrCode: qr } });

    // Membership
    const existingMemb = await prisma.membership.findFirst({ where: { gymId: gym.id, userId: user.id } });
    if (!existingMemb) {
      await prisma.membership.create({
        data: {
          gymId: gym.id, userId: user.id,
          planName: planDef.name, price: planDef.price,
          startDate, endDate,
          status: endDate > new Date() ? 'ACTIVE' : 'EXPIRED',
          paymentMethod: ['Cash', 'UPI', 'Card', 'NEFT'][i % 4],
        },
      });
    }

    // Attendance history
    const checkInCount = Math.floor(Math.random() * 20) + 5;
    const usedDays = new Set<string>();
    for (let j = 0; j < checkInCount; j++) {
      const daysBack = Math.floor(Math.random() * 45) + 1;
      const d = new Date(Date.now() - daysBack * 86400000);
      d.setHours(6 + Math.floor(Math.random() * 12), 0, 0, 0);
      const key = d.toDateString();
      if (!usedDays.has(key)) {
        usedDays.add(key);
        await prisma.attendance.create({
          data: { gymId: gym.id, userId: user.id, checkInTime: d },
        });
      }
    }

    // Progress log
    const existingProg = await prisma.progressLog.findFirst({ where: { gymId: gym.id, userId: user.id } });
    if (!existingProg) {
      await prisma.progressLog.create({
        data: {
          gymId: gym.id, userId: user.id, weight: m.weight,
          waistCm: m.gender === 'Female' ? 70 + Math.random() * 10 : 82 + Math.random() * 10,
          logDate: new Date(Date.now() - 7 * 86400000),
        },
      });
    }
    console.log(`✅ Member ${i + 1}/15: ${m.firstName} ${m.lastName} (${planDef.name} ₹${planDef.price}, ${m.loyalty} pts)`);
  }

  // Equipment
  const equipment = [
    { name: 'Olympic Barbell 20kg', category: 'Free Weights', quantity: 6 },
    { name: 'Dumbbells Set 2.5–50kg', category: 'Free Weights', quantity: 2 },
    { name: 'EZ Curl Bar', category: 'Free Weights', quantity: 4 },
    { name: 'Squat Rack with Safety Bars', category: 'Rack', quantity: 3 },
    { name: 'Power Rack', category: 'Rack', quantity: 2 },
    { name: 'Flat Bench', category: 'Bench', quantity: 4 },
    { name: 'Incline/Decline Bench', category: 'Bench', quantity: 2 },
    { name: 'Treadmill', category: 'Cardio', quantity: 8 },
    { name: 'Elliptical Trainer', category: 'Cardio', quantity: 4 },
    { name: 'Stationary Bike', category: 'Cardio', quantity: 6 },
    { name: 'Rowing Machine', category: 'Cardio', quantity: 2 },
    { name: 'Cable Crossover Machine', category: 'Machine', quantity: 2 },
    { name: 'Leg Press Machine', category: 'Machine', quantity: 2 },
    { name: 'Lat Pulldown Machine', category: 'Machine', quantity: 2 },
    { name: 'Chest Fly Machine', category: 'Machine', quantity: 2 },
    { name: 'Seated Row Machine', category: 'Machine', quantity: 2 },
    { name: 'Smith Machine', category: 'Machine', quantity: 1 },
    { name: 'Pull-up / Dip Station', category: 'Bodyweight', quantity: 4 },
    { name: 'Kettlebells 8–32kg', category: 'Free Weights', quantity: 1 },
    { name: 'Resistance Bands Set', category: 'Accessories', quantity: 10 },
    { name: 'Foam Roller', category: 'Recovery', quantity: 6 },
    { name: 'Ab Roller', category: 'Accessories', quantity: 8 },
  ];
  for (const e of equipment) {
    const ex = await prisma.equipment.findFirst({ where: { gymId: gym.id, name: e.name } });
    if (!ex) await prisma.equipment.create({ data: { gymId: gym.id, ...e } });
  }
  console.log(`✅ ${equipment.length} equipment items`);

  // Events
  const events = [
    { title: 'New Treadmills Arrived!', type: 'ANNOUNCEMENT', description: '4 new commercial treadmills with incline up to 15%!', daysFromNow: 1 },
    { title: 'Gym Maintenance – Sunday', type: 'MAINTENANCE', description: 'Closed 7am–12pm for deep cleaning.', daysFromNow: 3 },
    { title: 'Zumba Class Launch', type: 'CLASS', description: 'New Zumba every Tue & Thu at 7pm. Free for active members!', daysFromNow: 5 },
    { title: 'Independence Day Holiday', type: 'HOLIDAY', description: 'Open 8am–2pm only.', daysFromNow: 10 },
  ];
  for (const ev of events) {
    const ex = await prisma.event.findFirst({ where: { gymId: gym.id, title: ev.title } });
    if (!ex) {
      await prisma.event.create({
        data: { gymId: gym.id, title: ev.title, type: ev.type, description: ev.description,
          eventDate: new Date(Date.now() + ev.daysFromNow * 86400000), createdBy: admin.id },
      });
    }
  }

  // Announcements
  const announcements = [
    { title: '🎉 Welcome to FitZone!', body: 'We are thrilled to have you here. Check out our class schedule and trainer booking system.', pinned: true },
    { title: '💧 Hydration Station Upgrade', body: 'New chilled water dispensers with electrolyte stations installed on both floors.' },
    { title: '🏆 Monthly Fitness Challenge', body: 'This month\'s challenge: 20 check-ins to win a free protein shaker! Leaderboard updated daily.' },
  ];
  for (const a of announcements) {
    const ex = await prisma.announcement.findFirst({ where: { gymId: gym.id, title: a.title } });
    if (!ex) await prisma.announcement.create({ data: { gymId: gym.id, ...a } });
  }

  // Loyalty rules
  const loyaltyRules = [
    { action: 'CHECKIN', points: 10, description: 'Earn 10 points per gym visit' },
    { action: 'REFERRAL', points: 200, description: 'Earn 200 points when you refer a friend' },
    { action: 'ANNIVERSARY', points: 500, description: 'Earn 500 points on your 1-year gym anniversary' },
    { action: 'MILESTONE_30', points: 100, description: 'Earn 100 points for 30-day streak' },
  ];
  for (const rule of loyaltyRules) {
    const ex = await prisma.loyaltyRule.findFirst({ where: { gymId: gym.id, action: rule.action } });
    if (!ex) await prisma.loyaltyRule.create({ data: { gymId: gym.id, ...rule } });
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('📋 Login credentials:');
  console.log('   Gym Code : DEMO01');
  console.log('   Admin    : admin@fitzone.com / admin123');
  console.log('   Trainer  : trainer@fitzone.com / trainer123');
  console.log('   Members  : arjun@example.com / member123 (and 14 others)');
  console.log('\n🔐 Security: 5 login attempts → 2-min lockout');
  console.log('🐘 Database: PostgreSQL (concurrent connections supported)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
