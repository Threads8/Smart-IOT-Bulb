const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

class FirebaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    init() {
        try {
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            if (!serviceAccountPath) {
                console.warn("⚠️ No FIREBASE_SERVICE_ACCOUNT_KEY found. Firebase sync disabled.");
                return;
            }

            // Resolve path relative to backend root
            const absolutePath = path.resolve(__dirname, '..', serviceAccountPath);
            const serviceAccount = require(absolutePath);

            initializeApp({
                credential: cert(serviceAccount)
            });

            this.db = getFirestore();
            this.isInitialized = true;
            console.log("✅ Firebase Admin SDK Initialized. Firestore connected.");
        } catch (error) {
            console.error("❌ Firebase Initialization Error:", error.message);
        }
    }

    async syncDeviceState(envState, bulbState) {
        if (!this.isInitialized || !this.db) return;
        
        try {
            await this.db.collection('devices').doc('main_assistant').set({
                environment: envState,
                lighting: bulbState,
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Firestore sync error:", error.message);
        }
    }

    async addTask(task) {
        if (!this.isInitialized || !this.db) return null;
        const res = await this.db.collection('tasks').add({
            ...task,
            createdAt: FieldValue.serverTimestamp(),
            completed: false
        });
        return res.id;
    }

    async getTasks() {
        if (!this.isInitialized || !this.db) return [];
        const snapshot = await this.db.collection('tasks').where('completed', '==', false).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async completeTaskByTitle(titleFragment) {
        if (!this.isInitialized || !this.db) return;
        const snapshot = await this.db.collection('tasks').where('completed', '==', false).get();
        let targetId = null;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.title && data.title.toLowerCase().includes(titleFragment.toLowerCase())) {
                targetId = doc.id;
                break;
            }
        }
        if (targetId) {
            await this.db.collection('tasks').doc(targetId).update({ completed: true });
        }
    }

    async addMemory(memoryString) {
        if (!this.isInitialized || !this.db) return null;
        const res = await this.db.collection('memory').add({
            content: memoryString,
            createdAt: FieldValue.serverTimestamp()
        });
        return res.id;
    }

    async searchMemory(queryFragment) {
        if (!this.isInitialized || !this.db) return [];
        // Note: Firestore doesn't support native text search easily. 
        // We will fetch all recent memories and filter in memory.
        const snapshot = await this.db.collection('memory').orderBy('createdAt', 'desc').limit(50).get();
        const memories = snapshot.docs.map(doc => doc.data().content);
        return memories.filter(m => m.toLowerCase().includes(queryFragment.toLowerCase()));
    }

    async addReminder(message, timestampMs) {
        if (!this.isInitialized || !this.db) return null;
        const res = await this.db.collection('reminders').add({
            message: message,
            triggerTime: timestampMs,
            triggered: false,
            createdAt: FieldValue.serverTimestamp()
        });
        return res.id;
    }

    async getReminders() {
        if (!this.isInitialized || !this.db) return [];
        const snapshot = await this.db.collection('reminders').where('triggered', '==', false).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    async markReminderTriggered(id) {
        if (!this.isInitialized || !this.db) return;
        await this.db.collection('reminders').doc(id).update({ triggered: true });
    }

    async getUserPreferences(uid) {
        if (!this.isInitialized || !this.db) return null;
        const doc = await this.db.collection('users').doc(uid).collection('preferences').doc('config').get();
        return doc.exists ? doc.data() : null;
    }

    async saveUserPreferences(uid, data) {
        if (!this.isInitialized || !this.db) return;
        await this.db.collection('users').doc(uid).collection('preferences').doc('config').set(data, { merge: true });
    }
}

module.exports = new FirebaseManager();
