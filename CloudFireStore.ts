import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Phase 3 Output Persistence [cite: 661, 662]
const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "codesense.firebaseapp.com",
    projectId: "codesense-tech",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const UserDataService = {
    // Final persistence of player tokens and rank
    async syncPlayerStats(userId: string, earnedTokens: number) {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const newTotal = snap.data().tokens + earnedTokens;
            await updateDoc(userRef, { tokens: newTotal, lastActive: new Date() });
        }
    }
};