const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Tests run against a real MongoDB held in memory, so queries, indexes and
// validation behave exactly as they do in production - without needing a
// database installed on the machine or in CI.
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

// Each test starts from an empty database, so no test can depend on the
// leftovers of another.
afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
