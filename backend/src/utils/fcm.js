import admin from 'firebase-admin'

let firebaseApp = null

export const resetFirebase = () => {
  firebaseApp = null
}

export const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp

  if (!process.env.FCM_PROJECT_ID || !process.env.FCM_SERVER_KEY) {
    console.warn('Firebase credentials not configured')
    return null
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FCM_PROJECT_ID,
        clientEmail: `firebase-adminsdk@${process.env.FCM_PROJECT_ID}.iam.gserviceaccount.com`,
        privateKey: process.env.FCM_SERVER_KEY?.replace(/\\n/g, '\n'),
      }),
    })
    return firebaseApp
  } catch (error) {
    console.error('Firebase initialization error:', error)
    return null
  }
}

export const sendPushNotification = async (tokens, notification) => {
  const app = initializeFirebase()
  if (!app || !tokens || tokens.length === 0) {
    return { success: false, error: 'No Firebase app or tokens' }
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: Array.isArray(tokens) ? tokens : [tokens],
    }

    const response = await admin.messaging().sendMulticast(message)
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    }
  } catch (error) {
    console.error('FCM send error:', error)
    return { success: false, error: error.message }
  }
}
