import { MongoClient } from 'mongodb';
import env from './env.js';

const client = new MongoClient(env.mongodb.uri, {
  serverSelectionTimeoutMS: 5000,
});

let db = null;

export async function connectMongo() {
  if (!db) {
    await client.connect();
    db = client.db();
  }
  return db;
}

export async function testMongoConnection() {
  const database = await connectMongo();
  await database.command({ ping: 1 });
}

export default { connectMongo, testMongoConnection };