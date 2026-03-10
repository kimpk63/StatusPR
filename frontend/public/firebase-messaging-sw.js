importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCemKofa1yFw7eBqYNJp9VsLw-M_yiowQ1",
  projectId: "statuspr-b065b",
  messagingSenderId: "1065812835926",
  appId: "1:1065812835926:web:ab97f72dd33c6ff7a7dbe7",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background message:', payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon,
  });
});