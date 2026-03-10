import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCenKofa1vFw7eBqYNJp9Vslw-W_yiowQI",
  authDomain: "statuspr-b065b.firebaseapp.com",
  projectId: "statuspr-b065b",
  storageBucket: "statuspr-b065b.firebasestorage.app",
  messagingSenderId: "1058128359206",
  appId: "1:1058128359206:web:ab97f72dd33c6ff7a7dbe7",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * ขอ Permission และส่ง Device Token ไปยัง Backend
 */
export async function requestPermissionAndGetToken() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('[Firebase] Notification permission granted');
      
      const token = await getToken(messaging, {
        vapidKey: "BN3FyhNiQb2qcAGGN4sXIdJOeC_CLjOwbXCo..." // VAPID key เต็มๆ จากรูป
      });
      if (token) {
        console.log('[Firebase] FCM Token:', token);
        
        // ส่ง Token ไปยัง Backend
        try {
          const response = await fetch(
            import.meta.env.VITE_API_URL + '/notifications/register-device' ||
            'https://statuspr.onrender.com/api/notifications/register-device',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceToken: token })
            }
          );
          
          if (response.ok) {
            console.log('[Firebase] Device token registered successfully');
          } else {
            console.error('[Firebase] Failed to register device token');
          }
        } catch (error) {
          console.error('[Firebase] Error registering device token:', error);
        }
      } else {
        console.log('[Firebase] No registration token available');
      }
    } else {
      console.log('[Firebase] Notification permission denied');
    }
  } catch (error) {
    console.error('[Firebase] Error requesting permission:', error);
  }
}

/**
 * ฟัง Notification ขณะ App ทำงาน
 */
export function setupMessageListener() {
  onMessage(messaging, (payload) => {
    console.log('[Firebase] Message received in foreground:', payload);
    
    // แสดง Notification ขณะ App ทำงาน
    if (payload.notification) {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon,
        badge: payload.notification.badge,
      });
    }
  });
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(registration => {
      console.log('[Service Worker] Registered:', registration);
    })
    .catch(error => {
      console.error('[Service Worker] Registration failed:', error);
    });
}

export { messaging };