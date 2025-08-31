require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, isMongoConnected } = require('./config/db');

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);

    const server = http.createServer(app);

    const PORT = process.env.PORT || 3000; 
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`MongoDB status: ${isMongoConnected() ? 'Connected' : 'Disconnected'}`);
    });
  } catch (err) {
    console.error(' Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
