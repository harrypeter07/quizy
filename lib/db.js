import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {
  // High concurrency optimized settings for 1000+ users
  maxPoolSize: 100, // Increased for high concurrency
  minPoolSize: 10, // Keep more connections ready
  serverSelectionTimeoutMS: 30000, // Increased for network stability
  socketTimeoutMS: 60000, // Increased socket timeout
  connectTimeoutMS: 30000, // Increased connection timeout
  retryWrites: true,
  retryReads: true,
  // Optimized heartbeat for high load
  heartbeatFrequencyMS: 10000, // Reduced for faster connection detection
  // Disable command monitoring to reduce overhead
  monitorCommands: false,
  // Remove idle time restrictions for high concurrency
  maxIdleTimeMS: 0, // Don't close idle connections
  // Optimized write concern for performance
  writeConcern: {
    w: 1, // Changed from 'majority' to 1 for better performance
    j: false // Disable journal for better performance
  },
  // Additional optimizations for high concurrency
  maxConnecting: 50, // Allow more concurrent connections
  // Connection pool settings
  waitQueueTimeoutMS: 30000 // Wait up to 30 seconds for connection
}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB connected successfully (development) - High Concurrency Mode');
        // Minimal logging for performance
        client.on('connectionPoolCreated', () => {
          console.log('MongoDB connection pool created for high concurrency');
        });
        client.on('connectionPoolClosed', () => {
          console.log('MongoDB connection pool closed');
        });
        client.on('connectionPoolCleared', () => {
          console.log('MongoDB connection pool cleared');
        });
        return client;
      })
      .catch(error => {
        console.error('MongoDB connection failed (development):', error);
        throw error;
      });
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB connected successfully (production) - High Concurrency Mode');
      return client;
    })
    .catch(error => {
      console.error('MongoDB connection failed (production):', error);
      throw error;
    });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise 