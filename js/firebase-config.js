const firebaseConfig = {
    apiKey: "AIzaSyCo8YI9P8hoqqXVSdAhG_Zpiz4ZbkebwPM",
    authDomain: "satriacode.firebaseapp.com",
    databaseURL: "https://satriacode-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "satriacode",
    storageBucket: "satriacode.firebasestorage.app",
    messagingSenderId: "567347968040",
    appId: "1:567347968040:web:c1947a90a89da409e59d1d",
    measurementId: "G-G95T0R314G"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

window.db = db;
window.firebase = firebase;