import { app, server } from './src/app.js';
import { connectDB, isMongoConnected } from './src/config/database.js';

if (process.env.NODE_ENV !== 'test') {
  // Connect to MongoDB
  connectDB();

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB status: ${isMongoConnected() ? 'Connected' : 'Disconnected'}`);
  });
} else {
  console.log('Running in TEST mode - server and DB managed by tests');
}

export { app, server };