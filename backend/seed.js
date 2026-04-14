require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const Booking = require('./src/models/Booking');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Event.deleteMany({});
  await Booking.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create Users
  const users = await User.insertMany([
    { name: 'Admin User',      email: 'admin@tcs.com',  password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { name: 'Event Organizer', email: 'org@tcs.com',    password: await bcrypt.hash('org123', 10),   role: 'organizer' },
    { name: 'John Doe',        email: 'user@tcs.com',   password: await bcrypt.hash('user123', 10),  role: 'user' },
    { name: 'Priya Sharma',    email: 'priya@tcs.com',  password: await bcrypt.hash('user123', 10),  role: 'user' },
  ]);

  const [admin, organizer, user1, user2] = users;
  console.log('👥 Created users');

  // Create Events (all approved so they show up right away)
  const events = await Event.insertMany([
    {
      title: 'TCS Tech Summit 2025',
      description: 'Join industry leaders for cutting-edge talks on AI, cloud computing, and digital transformation. Network with 500+ professionals across Mumbai.',
      date: new Date('2025-08-15T09:00:00'),
      location: 'Mumbai, Maharashtra',
      category: 'conference',
      ticketPrice: 1499,
      totalSeats: 500,
      availableSeats: 347,
      organizerId: organizer._id,
      status: 'approved',
    },
    {
      title: 'React & Node.js Workshop',
      description: 'A hands-on full-day workshop covering modern React patterns, hooks, and building REST APIs with Express and MongoDB. Bring your laptop!',
      date: new Date('2025-07-20T10:00:00'),
      location: 'Bengaluru, Karnataka',
      category: 'workshop',
      ticketPrice: 799,
      totalSeats: 80,
      availableSeats: 12,
      organizerId: organizer._id,
      status: 'approved',
    },
    {
      title: 'Indie Music Fest 2025',
      description: 'A celebration of independent artists across genres — folk, indie-rock, electronic, and jazz. Three stages, 20+ artists, food stalls, and more.',
      date: new Date('2025-09-05T17:00:00'),
      location: 'Pune, Maharashtra',
      category: 'concert',
      ticketPrice: 599,
      totalSeats: 1000,
      availableSeats: 680,
      organizerId: organizer._id,
      status: 'approved',
    },
    {
      title: 'Startup Networking Night',
      description: 'Connect with founders, investors, and mentors in an informal setting. Perfect for early-stage startups looking for funding and partnerships.',
      date: new Date('2025-07-28T18:30:00'),
      location: 'Hyderabad, Telangana',
      category: 'networking',
      ticketPrice: 0,
      totalSeats: 150,
      availableSeats: 89,
      organizerId: organizer._id,
      status: 'approved',
    },
    {
      title: 'Cloud & DevOps Webinar',
      description: 'Live online session covering Kubernetes, CI/CD pipelines, and infrastructure-as-code. Certificate of participation provided to all attendees.',
      date: new Date('2025-08-02T15:00:00'),
      location: 'Online (Zoom)',
      category: 'webinar',
      ticketPrice: 0,
      totalSeats: 300,
      availableSeats: 201,
      organizerId: organizer._id,
      status: 'approved',
    },
    {
      title: 'IPL Watch Party — Finals Night',
      description: 'Watch the IPL 2025 finals on a giant 50-ft screen with fellow cricket fans. Includes complimentary snacks, beverages, and live commentary.',
      date: new Date('2025-09-25T19:30:00'),
      location: 'Delhi, NCR',
      category: 'sports',
      ticketPrice: 349,
      totalSeats: 250,
      availableSeats: 175,
      organizerId: organizer._id,
      status: 'approved',
    },
    {
      title: 'Diwali Cultural Festival',
      description: 'Celebrate Diwali with cultural performances, rangoli competitions, traditional food stalls, and a grand fireworks display — a family event for all ages.',
      date: new Date('2025-10-20T16:00:00'),
      location: 'Chennai, Tamil Nadu',
      category: 'festival',
      ticketPrice: 199,
      totalSeats: 2000,
      availableSeats: 1540,
      organizerId: organizer._id,
      status: 'approved',
    },
    {
      title: 'AI & Machine Learning Summit',
      description: 'Deep-dive sessions on LLMs, computer vision, and MLOps. Featuring keynotes from Google, Microsoft, and leading academic researchers.',
      date: new Date('2025-08-28T09:30:00'),
      location: 'Bengaluru, Karnataka',
      category: 'conference',
      ticketPrice: 2499,
      totalSeats: 400,
      availableSeats: 218,
      organizerId: organizer._id,
      status: 'pending', // Pending approval — tests admin flow
    },
  ]);

  console.log('🎪 Created events');

  // Create Bookings for user1
  const [ev1, ev2, ev3] = events;
  const ticketBase = Date.now();

  await Booking.insertMany([
    {
      userId: user1._id,
      eventId: ev1._id,
      ticketId: `TKT-${ticketBase}-001`,
      quantity: 2,
      status: 'confirmed',
    },
    {
      userId: user1._id,
      eventId: ev3._id,
      ticketId: `TKT-${ticketBase}-002`,
      quantity: 1,
      status: 'confirmed',
    },
    {
      userId: user2._id,
      eventId: ev2._id,
      ticketId: `TKT-${ticketBase}-003`,
      quantity: 1,
      status: 'confirmed',
    },
  ]);

  // Sync availableSeats after bookings
  await Event.findByIdAndUpdate(ev1._id, { $inc: { availableSeats: -2 } });
  await Event.findByIdAndUpdate(ev3._id, { $inc: { availableSeats: -1 } });
  await Event.findByIdAndUpdate(ev2._id, { $inc: { availableSeats: -1 } });

  console.log('🎫 Created bookings');
  console.log('\n✅ Seed complete! Demo credentials:');
  console.log('   Admin:     admin@tcs.com  / admin123');
  console.log('   Organizer: org@tcs.com    / org123');
  console.log('   User:      user@tcs.com   / user123');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
