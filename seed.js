// seed.js

require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Service = require('./src/models/Service');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const providers = [
  {
    name: 'John Mwangi',
    email: 'john@gmail.com',
    password: 'password123',
    phone: '0711000001',
    location: 'Nairobi',
    bio: 'Experienced plumber and handyman.',
  },
  {
    name: 'Sarah Achieng',
    email: 'sarah@gmail.com',
    password: 'password123',
    phone: '0711000002',
    location: 'Mombasa',
    bio: 'Professional cleaner and home organizer.',
  },
  {
    name: 'Kevin Otieno',
    email: 'kevin@gmail.com',
    password: 'password123',
    phone: '0711000003',
    location: 'Kisumu',
    bio: 'Creative graphic designer and branding expert.',
  },
  {
    name: 'Mary Wanjiku',
    email: 'mary@gmail.com',
    password: 'password123',
    phone: '0711000004',
    location: 'Nakuru',
    bio: 'Certified electrician and installer.',
  },
  {
    name: 'Brian Kiptoo',
    email: 'brian@gmail.com',
    password: 'password123',
    phone: '0711000005',
    location: 'Eldoret',
    bio: 'Full stack web developer and IT consultant.',
  },
  {
    name: 'Faith Njeri',
    email: 'faith@gmail.com',
    password: 'password123',
    phone: '0711000006',
    location: 'Thika',
    bio: 'Professional photographer and editor.',
  },
];

const serviceTemplates = [
  {
    category: 'Plumbing',
    titles: [
      'Pipe Repair',
      'Water Tank Installation',
      'Bathroom Plumbing',
      'Drain Cleaning',
    ],
  },
  {
    category: 'Electrical',
    titles: [
      'House Wiring',
      'Lighting Installation',
      'Socket Repair',
      'Electrical Maintenance',
    ],
  },
  {
    category: 'Cleaning',
    titles: [
      'Home Cleaning',
      'Office Cleaning',
      'Sofa Cleaning',
      'Move-Out Cleaning',
    ],
  },
  {
    category: 'Graphic Design',
    titles: [
      'Logo Design',
      'Poster Design',
      'Business Card Design',
      'Social Media Graphics',
    ],
  },
  {
    category: 'Web Development',
    titles: [
      'Business Website',
      'Portfolio Website',
      'E-commerce Website',
      'Website Maintenance',
    ],
  },
  {
    category: 'Photography',
    titles: [
      'Wedding Photography',
      'Event Coverage',
      'Portrait Photography',
      'Product Photography',
    ],
  },
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');

    await mongoose.connection.asPromise();

    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});

    console.log('Old data removed');

    for (let i = 0; i < providers.length; i++) {
      const providerData = providers[i];

      // Create provider
      const provider = await User.create({
        ...providerData,
        role: 'provider',
      });

      console.log(`Created provider: ${provider.name}`);

      // Select service template
      const template = serviceTemplates[i];

      const services = template.titles.map((title, index) => ({
        providerId: provider._id,
        title,
        description: `${title} service offered professionally by ${provider.name}. High quality work and reliable service.`,
        category: template.category,
        price: 500 + Math.floor(Math.random() * 5000),
        location: provider.location,
        images: [
          `https://picsum.photos/seed/${provider._id}-${index}/600/400`,
        ],
        isActive: true,
      }));

      await Service.insertMany(services);

      console.log(`Added 4 services for ${provider.name}`);
    }

    console.log('Database seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();