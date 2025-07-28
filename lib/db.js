import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

// Debug: Log environment variable status
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!uri) {
  console.error('Environment variables loaded:', Object.keys(process.env).filter(key => key.includes('MONGODB')));
  throw new Error('Please add your MongoDB URI to .env.local. Current env vars: ' + Object.keys(process.env).join(', '));
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise; 