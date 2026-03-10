const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * ส่ง Notification ไป Device
 * @param {string} deviceToken - Token ของ Device (จาก Frontend)
 * @param {string} title - หัวข้อแจ้งเตือน
 * @param {string} body - เนื้อหาแจ้งเตือน
 * @param {object} data - ข้อมูลเพิ่มเติม
 */
async function sendNotification(deviceToken, title, body, data = {}) {
  try {
    const message = {
      token: deviceToken,
      notification: {
        title: title,
        body: body,
      },
      data: data,
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          title: title,
          body: body,
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('[Firebase] Notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('[Firebase] Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ส่ง Notification แบบ Multicast (หลาย Device)
 * @param {array} deviceTokens - Array ของ Device Tokens
 * @param {string} title - หัวข้อแจ้งเตือน
 * @param {string} body - เนื้อหาแจ้งเตือน
 * @param {object} data - ข้อมูลเพิ่มเติม
 */
async function sendMulticastNotification(deviceTokens, title, body, data = {}) {
  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: data,
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          title: title,
          body: body,
        },
      },
    };

    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens: deviceTokens,
    });

    console.log('[Firebase] Multicast notification sent:', response);
    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    console.error('[Firebase] Error sending multicast notification:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotification,
  sendMulticastNotification,
};