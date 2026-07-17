const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");


const serviceAccount = require("../../mukandaprepa-dcb78-firebase-adminsdk-fbsvc-a4173de566.json");


admin.initializeApp({
    credential: admin.cert(serviceAccount)
});


const db = getFirestore();


module.exports = {
    admin,
    db
};