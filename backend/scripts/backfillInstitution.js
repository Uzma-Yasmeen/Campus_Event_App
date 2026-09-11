// Assign an institution to every event that predates campus scoping.
//
// Events are scoped per campus, so an event without an institution is
// invisible to everyone. This gives each one its organiser's institution.
//
// Run with: npm run backfill:institution
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Event = require('../models/Event');
const User = require('../models/User');

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    const orphans = await Event.find({
      $or: [{ institution: null }, { institution: { $exists: false } }]
    });

    if (!orphans.length) {
      console.log('Every event already belongs to an institution.');
      await mongoose.disconnect();
      process.exit(0);
    }

    let fixed = 0;
    const stuck = [];

    for (const event of orphans) {
      const organizer = await User.findById(event.organizer).select('institution name');

      if (!organizer || !organizer.institution) {
        stuck.push(event.title);
        continue;
      }

      event.institution = organizer.institution;
      await event.save();
      fixed++;
      console.log(`"${event.title}" -> ${organizer.name}'s institution`);
    }

    console.log(`\nDone. ${fixed} event(s) updated.`);

    if (stuck.length) {
      console.log(
        `\n${stuck.length} event(s) could not be assigned because their organiser ` +
        'has no institution either. Set one on those accounts, then run this again:'
      );
      stuck.forEach((t) => console.log(`  - ${t}`));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
