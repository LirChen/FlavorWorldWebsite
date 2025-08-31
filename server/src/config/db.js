const mongoose = require('mongoose');

function connectDB(uri) {
  if (!uri) throw new Error('Missing MONGODB_URI');
  mongoose.set('strictQuery', true);
  return mongoose.connect(uri)
    .then(() => console.log(' MongoDB connected'))
    .catch((err) => {
      console.error(' MongoDB connection error:', err.message);
      process.exit(1);
    });
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isMongoConnected };
