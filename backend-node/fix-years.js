const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/turtletrack';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const Sighting = mongoose.connection.db.collection('sightings');
  const sightings = await Sighting.find({}).toArray();

  const currentYear = new Date().getFullYear(); // e.g. 2026
  
  let updatedCount = 0;
  for (const s of sightings) {
    const sightingYear = new Date(s.sightingDate).getFullYear();
    const yearsSince = currentYear - sightingYear;
    
    // We just want to set yearsSinceLastSeen correctly for mock data
    if (s.yearsSinceLastSeen !== yearsSince) {
      await Sighting.updateOne({ _id: s._id }, { $set: { yearsSinceLastSeen: yearsSince } });
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} sightings.`);
  process.exit(0);
}

run().catch(console.error);
