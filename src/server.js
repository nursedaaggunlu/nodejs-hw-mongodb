import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import { env } from './utils/env.js';
import {
  getContactsController,
  getContactByIdController,
} from './controllers/contacts.js';

dotenv.config();

export function setupServer() {
  const app = express();

  const PORT = Number(env('PORT', 3000));

  app.use(express.json());
  app.use(cors());
  app.use(
    pino({
      transport: { target: 'pino-pretty' },
    }),
  );

  app.get('/contacts', getContactsController);
  app.get('/contacts/:contactId', getContactByIdController);

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
