const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_CONNECTION_URI || 'mongodb+srv://root:12345678901@cluster0.mihlqek.mongodb.net/incomegrow-stock?retryWrites=true&w=majority';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('incomegrow-stock');
    
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}