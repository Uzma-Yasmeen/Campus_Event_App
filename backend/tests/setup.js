const mongoose = require('mongoose');

// Tests run against a real MongoDB so queries, indexes and validation behave
// exactly as they do in production.
//
// CI provides one as a service container and passes MONGO_URI. Locally there is
// usually no database to hand, so we start one in memory instead - which is
// convenient on a laptop but downloads a MongoDB binary on first use, and that
// download is the fragile part on a CI runner.
let mongod;

beforeAll(async () => {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }

  await mongoose.connect(uri);
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
