// firebase-config.js
import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmF5FS_ekWW_7-1RUHtGCR71LH6r9fg08",
  authDomain: "medcomvc-ubs.firebaseapp.com",
  projectId: "medcomvc-ubs",
  storageBucket: "medcomvc-ubs.firebasestorage.app",
  messagingSenderId: "313420248004",
  appId: "1:313420248004:web:a9a28d97b3ef2e33c36a91",
  measurementId: "G-04YK0WXT42"
};

// only initialize once, otherwise reuse existing app
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

const db = getFirestore(app);
const storage = getStorage(app, "gs://medcomvc-ubs.firebasestorage.app");

export { app, db, storage };
