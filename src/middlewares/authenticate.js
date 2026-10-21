import createError from 'http-errors';
import { Session } from '../db/Session.js';
import { User } from '../db/User.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    return next(createError(401, 'Auth header is missing'));
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return next(createError(401, 'Auth header must be Bearer type'));
  }

  const session = await Session.findOne({ accessToken: token });
  if (!session) {
    return next(createError(401, 'Session not found'));
  }

  const isAccessTokenExpired =
    new Date() > new Date(session.accessTokenValidUntil);
  if (isAccessTokenExpired) {
    return next(createError(401, 'Access token expired'));
  }

  const user = await User.findById(session.userId);
  if (!user) {
    return next(createError(401, 'User not found'));
  }

  req.user = user;
  next();
};
