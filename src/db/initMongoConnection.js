import mongoose from 'mongoose';
import { env } from '../utils/env.js';

export const initMongoConnection = async () => {
  try {
    const connectionString = env('MONGODB_CONNECTION_STRING');

    await mongoose.connect(connectionString);

    console.log('Mongo connection successfully established!');
  } catch (error) {
    console.error('Mongo connection failed:', error);
  }
};
