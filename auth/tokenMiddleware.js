import { getAccessToken } from './tokenStore.js';

export function tokenMiddleware(req, res, next) {
  const token = getAccessToken();
  if (!token) {
    return res.status(401).send('Access token is missing. Please log in.');
  }
  req.accessToken = token;
  next();
}