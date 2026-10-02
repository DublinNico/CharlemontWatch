const mongoose = require('mongoose');

// One-off rename of the retired NEW status to AWAITING_RESPONSE. Runs on
// every startup but is a no-op once no NEW documents remain; updateMany
// skips schema validation, so it works even though NEW is no longer in the enum.
// A failure here is logged rather than fatal — the app still works, it just
// shows unmigrated reports with a fallback badge until the next restart.
const migrateLegacyStatuses = async () => {
  try {
    const { modifiedCount } = await mongoose.connection.db.collection('incidents')
      .updateMany({ status: 'NEW' }, { $set: { status: 'AWAITING_RESPONSE' } });
    if (modifiedCount) console.log(`Migrated ${modifiedCount} incident(s) from NEW to AWAITING_RESPONSE`);
  } catch (error) {
    console.error('Status migration failed:', error);
  }
};

// Connects to MongoDB on startup; exits the process if the connection fails
// since the app cannot function without a database
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