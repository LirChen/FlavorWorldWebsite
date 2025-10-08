const { app, server } = require('./src/app');
const { connectDB, isMongoConnected } = require('./src/config/database');

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB status: ${isMongoConnected() ? 'Connected' : 'Disconnected'}`);
});