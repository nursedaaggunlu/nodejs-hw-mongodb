/* global process */
import mongoose from 'mongoose';
import { env } from '../utils/env.js';

export async function initMongoConnection() {
  try {
    const user = env('MONGODB_USER');
    const pwd = env('MONGODB_PASSWORD');
    const url = env('MONGODB_URL');
    const db = env('MONGODB_DB');

    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');

    const connectionLink = isLocal
      ? `mongodb://${url}/${db}`
      : `mongodb+srv://${user}:${pwd}@${url}/${db}?retryWrites=true&w=majority`;

    await mongoose.connect(connectionLink, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log('Mongo connection successfully established!');
  } catch (e) {
    console.error('Error while setting up mongo connection', e);
    throw e;
  }
}
