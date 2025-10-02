import { google } from 'googleapis'

export const initializeGoogleAuth = (credentials) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  if (credentials) {
    oauth2Client.setCredentials(credentials)
  }

  return oauth2Client
}

export const getAuthUrl = () => {
  const oauth2Client = initializeGoogleAuth()
  
  const scopes = ['https://www.googleapis.com/auth/calendar.events']

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  })
}

export const getTokenFromCode = async (code) => {
  const oauth2Client = initializeGoogleAuth()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}
