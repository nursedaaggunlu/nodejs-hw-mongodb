import bcrypt from 'bcrypt';
import createError from 'http-errors';
import { User } from '../db/User.js';
import crypto from 'crypto';
import { Session } from '../db/Session.js';

export const registerUser = async (payload) => {
  const user = await User.findOne({ email: payload.email });
  if (user) {
    throw createError(409, 'Email in use');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const newUser = await User.create({
    ...payload,
    password: hashedPassword,
  });

  return newUser;
};

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const createSessionData = () => {
  return {
    accessToken: crypto.randomBytes(30).toString('base64'),
    refreshToken: crypto.randomBytes(30).toString('base64'),
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  };
};

export const loginUser = async (payload) => {
  const user = await User.findOne({ email: payload.email });
  if (!user) {
    throw createError(401, 'Unauthorized');
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    user.password,
  );
  if (!isCorrectPassword) {
    throw createError(401, 'Unauthorized');
  }

  await Session.deleteOne({ userId: user._id });

  const session = await Session.create({
    userId: user._id,
    ...createSessionData(),
  });

  return session;
};

export const refreshSession = async ({ refreshToken }) => {
  const session = await Session.findOne({ refreshToken });
  if (!session) {
    throw createError(401, 'Session not found');
  }

  const isRefreshTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);
  if (isRefreshTokenExpired) {
    throw createError(401, 'Refresh token expired');
  }

  await Session.deleteOne({ _id: session._id });

  const newSession = await Session.create({
    userId: session.userId,
    ...createSessionData(),
  });

  return newSession;
};

export const logoutUser = async ({ refreshToken }) => {
  await Session.deleteOne({ refreshToken });
};
