import { PrismaClient, Role, VenueType, SlotStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only!)
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@sports-venues.com',
      password: hashedPassword,
      name: 'Администратор',
      phone: '+375291234567',
      role: Role.ADMIN,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'ivan.ivanov@example.com',
      password: hashedPassword,
      name: 'Иван Иванов',
      phone: '+375291234568',
      role: Role.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'petr.petrov@example.com',
      password: hashedPassword,
      name: 'Петр Петров',
      phone: '+375291234569',
      role: Role.USER,
    },
  });

  console.log('✅ Created users');

  // Create venues
  const footballVenue = await prisma.venue.create({
    data: {
      name: 'Футбольное поле Динамо',
      type: VenueType.FOOTBALL,
      address: 'г. Минск, ул. Кирова 8',
      description:
        'Современное футбольное поле с искусственным покрытием последнего поколения. Отлично подходит для игр в любую погоду.',
      pricePerHour: 40.0,
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
      amenities: ['Душ', 'Раздевалка', 'Парковка', 'Освещение'],
      isActive: true,
    },
  });

  const basketballVenue = await prisma.venue.create({
    data: {
      name: 'Баскетбольная площадка Уручье',
      type: VenueType.BASKETBALL,
      address: 'г. Минск, Уручье, ул. Петра Глебки 10',
      description:
        'Крытая площадка с профессиональным покрытием. Высота потолков 8 метров.',
      pricePerHour: 30.0,
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      amenities: ['Душ', 'Раздевалка', 'Кондиционер'],
      isActive: true,
    },
  });

  const tennisVenue = await prisma.venue.create({
    data: {
      name: 'Теннисный корт Минск-Арена',
      type: VenueType.TENNIS,
      address: 'г. Минск, пр-т Победителей 111',
      description: 'Профессиональный теннисный корт с покрытием хард.',
      pricePerHour: 50.0,
      imageUrl: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800',
      amenities: ['Душ', 'Раздевалка', 'Прокат ракеток', 'Парковка'],
      isActive: true,
    },
  });

  console.log('✅ Created venues');

  // Create slots for next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' },
    { start: '19:00', end: '20:00' },
    { start: '20:00', end: '21:00' },
    { start: '21:00', end: '22:00' },
  ];

  const venues = [footballVenue, basketballVenue, tennisVenue];

  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);

    for (const venue of venues) {
      for (const slot of timeSlots) {
        await prisma.slot.create({
          data: {
            venueId: venue.id,
            date: date,
            startTime: slot.start,
            endTime: slot.end,
            status: SlotStatus.AVAILABLE,
            maxBookings: 1,
            currentBookings: 0,
          },
        });
      }
    }
  }

  console.log('✅ Created slots for 7 days');

  // Create some reviews
  await prisma.review.create({
    data: {
      userId: user1.id,
      venueId: footballVenue.id,
      rating: 5,
      comment: 'Отличное поле! Покрытие супер, всем рекомендую!',
    },
  });

  await prisma.review.create({
    data: {
      userId: user2.id,
      venueId: footballVenue.id,
      rating: 4,
      comment: 'Хорошее место, но парковка маленькая.',
    },
  });

  await prisma.review.create({
    data: {
      userId: user1.id,
      venueId: basketballVenue.id,
      rating: 5,
      comment: 'Идеальная площадка для баскетбола!',
    },
  });

  console.log('✅ Created reviews');

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test credentials:');
  console.log('Admin: admin@sports-venues.com / password123');
  console.log('User1: ivan.ivanov@example.com / password123');
  console.log('User2: petr.petrov@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
