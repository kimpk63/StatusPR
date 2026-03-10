importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCenKofa1vFw7eBqYNJp9Vslw-W_yiowQI",
  projectId: "statuspr-b065b",
  messagingSenderId: "1058128359206",
  appId: "1:1058128359206:web:ab97f72dd33c6ff7a7dbe7",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background message:', payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192x192.png',
  });
});