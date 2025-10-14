const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB Connected');
    } catch (err) {
      console.log('MongoDB Connection Error:', err);
    }
  } else {
    console.log('MONGODB_URI not found - running without database');
  }
};

const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = { connectDB, isMongoConnected };