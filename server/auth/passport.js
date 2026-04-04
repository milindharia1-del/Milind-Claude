const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const allowedEmails = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value?.toLowerCase();

      if (!email) {
        return done(null, false, { message: 'No email returned from Google.' });
      }

      if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
        return done(null, false, { message: 'Email not authorised.' });
      }

      const user = {
        id: profile.id,
        email,
        name: profile.displayName,
        photo: profile.photos?.[0]?.value,
      };

      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
