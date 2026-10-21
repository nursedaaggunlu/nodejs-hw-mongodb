import bcrypt from 'bcrypt';
import createError from 'http-errors';
import { User } from '../db/User.js';
import crypto from 'crypto';
import { Session } from '../db/Session.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { env } from '../utils/env.js';

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

export const sendResetEmail = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw createError(404, 'User not found!');
  }

  const jwtSecret = env('JWT_SECRET');
  const token = jwt.sign({ email }, jwtSecret, { expiresIn: '5m' });

  const appDomain = env('APP_DOMAIN');
  const smtpHost = env('SMTP_HOST');
  const smtpPort = Number(env('SMTP_PORT'));
  const smtpUser = env('SMTP_USER');
  const smtpPassword = env('SMTP_PASSWORD');
  const smtpFrom = env('SMTP_FROM');

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      password: smtpPassword,
    },
  });

  const resetLink = `${appDomain}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>To reset your password, please click on the following link:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>This link is valid for 5 minutes.</p>`,
    });
  } catch (error) {
    console.error('Nodemailer Error:', error);
    throw createError(500, 'Failed to send the email, please try again later.');
  }
};

export const resetPassword = async (payload) => {
  let decoded;

  try {
    const jwtSecret = env('JWT_SECRET');
    decoded = jwt.verify(payload.token, jwtSecret);
  } catch (error) {
    throw createError(401, 'Token is expired or invalid.');
  }

  const user = await User.findOne({ email: decoded.email });
  if (!user) {
    throw createError(404, 'User not found!');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  user.password = hashedPassword;
  await user.save();

  await Session.deleteMany({ userId: user._id });
};
