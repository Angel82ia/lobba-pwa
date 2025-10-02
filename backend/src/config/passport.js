import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as AppleStrategy } from 'passport-apple'
import { createUser, findUserByGoogleId, findUserByAppleId, findUserByEmail } from '../models/User.js'

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await findUserByGoogleId(profile.id)

          if (!user) {
            user = await findUserByEmail(profile.emails[0].value)
            
            if (!user) {
              user = await createUser({
                email: profile.emails[0].value,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                role: 'user',
                googleId: profile.id,
              })
            }
          }

          done(null, user)
        } catch (error) {
          done(error, null)
        }
      }
    )
  )
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyString: process.env.APPLE_PRIVATE_KEY,
        callbackURL: '/api/auth/apple/callback',
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          let user = await findUserByAppleId(profile.id)

          if (!user) {
            user = await findUserByEmail(profile.email)
            
            if (!user) {
              user = await createUser({
                email: profile.email,
                firstName: profile.name?.firstName || 'Apple',
                lastName: profile.name?.lastName || 'User',
                role: 'user',
                appleId: profile.id,
              })
            }
          }

          done(null, user)
        } catch (error) {
          done(error, null)
        }
      }
    )
  )
}

export default passport
