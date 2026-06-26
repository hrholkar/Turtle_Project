const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const MONGO_URI = 'mongodb://localhost:27017/turtletrack';
const CSV_PATH = 'E:\\\\Personal All\\\\MIT AOE\\\\PROJECTS\\\\Sea_Turtle\\\\Turtle_Project\\\\dataset\\\\turtles-data\\\\data\\\\metadata_splits.csv';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const Turtle = mongoose.connection.db.collection('turtles');
  const Sighting = mongoose.connection.db.collection('sightings');

  // Clear existing
  await Turtle.deleteMany({});
  await Sighting.deleteMany({});
  console.log('Cleared existing data');

  const fileStream = fs.createReadStream(CSV_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isFirst = true;
  const turtlesMap = {}; // identity -> { count, firstImage, species, location, firstDate, latestDate }
  
  let totalSightings = 0;

  for await (const line of rl) {
    if (isFirst) {
      isFirst = false;
      continue;
    }
    
    // Parse CSV line correctly handling quotes if necessary, but simple split might work
    const parts = line.split(',');
    if (parts.length < 14) continue;

    const id = parts[0];
    const width = parts[1];
    const height = parts[2];
    const file_name = parts[3];
    const timestamp = parts[4];
    const identity = parts[5];
    const dateStr = parts[6];
    const year = parts[7];
    const turtle_type = parts[12];
    const location = parts[13];

    const sightingDate = new Date(timestamp || dateStr || new Date());

    if (!turtlesMap[identity]) {
      turtlesMap[identity] = { 
        count: 0, 
        firstImage: file_name, 
        species: turtle_type, 
        location: location,
        firstDate: sightingDate,
        latestDate: sightingDate
      };
    }
    const t = turtlesMap[identity];
    t.count++;
    if (sightingDate < t.firstDate) t.firstDate = sightingDate;
    if (sightingDate > t.latestDate) t.latestDate = sightingDate;
    
    // insert sighting
    await Sighting.insertOne({
      turtleId: identity,
      image: `/uploads/dataset/${file_name}`,
      location: location || 'Unknown',
      latitude: 0,
      longitude: 0,
      sightingDate: sightingDate,
      confidenceScore: 1,
      yearsSinceLastSeen: 0,
      notes: 'Imported from dataset',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    totalSightings++;
  }

  const turtlesToInsert = [];
  for (const [t_id, data] of Object.entries(turtlesMap)) {
    turtlesToInsert.push({
      turtleId: t_id,
      name: t_id,
      species: data.species || 'Unknown',
      gender: 'unknown',
      status: 'active',
      profileImage: `/uploads/dataset/${data.firstImage}`,
      totalSightings: data.count,
      firstSightingDate: data.firstDate,
      latestSightingDate: data.latestDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (turtlesToInsert.length > 0) {
    await Turtle.insertMany(turtlesToInsert);
  }

  console.log(`Inserted ${turtlesToInsert.length} turtles`);
  console.log(`Inserted ${totalSightings} sightings`);
  console.log('Seed complete');
  process.exit(0);
}

seed().catch(console.error);
