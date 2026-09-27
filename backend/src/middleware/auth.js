const jwt = require('jsonwebtoken');

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) {
  console.warn(
    '[auth] Missing JWT_SECRET in .env — set it to any long random string ' +
      '(see backend/README.md). Tokens cannot be issued or verified without it.'
  );
}

const TOKEN_TTL = '30d';

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

// Protects every route it's applied to: requires "Authorization: Bearer
// <token>", verifies it, and attaches the signed-in user's id as
// req.ownerId. Every saved-person route filters by req.ownerId, which is how
// one account's saved people/photos stay invisible to every other account.
function requireAuth(req, res, next) {
  const header = req.header('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Sign in required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.ownerId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

module.exports = { signToken, requireAuth };
