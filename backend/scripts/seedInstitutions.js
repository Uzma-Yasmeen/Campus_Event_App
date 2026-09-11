// Run with: npm run seed
require('dotenv').config();
const connectDB = require('../config/db');
const Institution = require('../models/Institution');

const institutions = [
  { name: 'IIT Delhi', code: 'IITD' },
  { name: 'IIT Bombay', code: 'IITB' },
  { name: 'Delhi University', code: 'DU' },
  { name: 'BITS Pilani', code: 'BITS' },
  { name: 'NIT Trichy', code: 'NITT' }
];

const seed = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    await Institution.deleteMany({});
    await Institution.insertMany(institutions);
    console.log('Institutions seeded');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
