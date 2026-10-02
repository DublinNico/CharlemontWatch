const mongoose = require('mongoose');

// One-off rename of the retired NEW status to AWAITING_RESPONSE. Runs on
// every startup but is a no-op once no NEW documents remain; updateMany
// skips schema validation, so it works even though NEW is no longer in the enum.
// Must succeed before serving: unmigrated NEW records drop out of the public
// feed (not in ACTIVE_STATUSES) and fail enum validation on save. Retries a
// few times, then throws so connectDB exits and Render restarts the service.
const MIGRATION_ATTEMPTS = 3;
const migrateLegacyStatuses = async () => {
  for (let attempt = 1; ; attempt++) {
    try {
      const { modifiedCount } = await mongoose.connection.db.collection('incidents')
        .updateMany({ status: 'NEW' }, { $set: { status: 'AWAITING_RESPONSE' } });
      if (modifiedCount) console.log(`Migrated ${modifiedCount} incident(s) from NEW to AWAITING_RESPONSE`);
      return;
    } catch (error) {
      console.error(`Status migration attempt ${attempt}/${MIGRATION_ATTEMPTS} failed:`, error);
      if (attempt >= MIGRATION_ATTEMPTS) throw new Error('Status migration failed; refusing to start');
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// Connects to MongoDB on startup; exits the process if the connection or the
// status migration fails since the app cannot function correctly without either
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    await migrateLegacyStatuses();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;