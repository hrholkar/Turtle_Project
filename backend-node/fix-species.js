const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/turtletrack';

const speciesMap = {
  'Green Sea turtle': 'green',
  'Loggerhead': 'loggerhead',
  'Hawksbill': 'hawksbill',
  'Leatherback': 'leatherback',
  'Olive Ridley': 'olive_ridley'
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const Turtle = mongoose.connection.db.collection('turtles');
  const turtles = await Turtle.find({}).toArray();

  let updatedCount = 0;
  for (const t of turtles) {
    if (speciesMap[t.species]) {
      await Turtle.updateOne({ _id: t._id }, { $set: { species: speciesMap[t.species] } });
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} turtles species.`);
  process.exit(0);
}

run().catch(console.error);
