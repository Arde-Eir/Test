import { db } from './firebase';
import { 
  collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc, serverTimestamp, limit
} from "firebase/firestore";
import { UserProfile } from '../types';

export const DatabaseService = {
  
  // --- AUTHENTICATION ---

  // LOGIN: Verifies credentials
  async login(gamertag: string, secretCode: string): Promise<UserProfile> {
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef, 
        where("gamertag", "==", gamertag),
        where("password", "==", secretCode),
        limit(1) // Optimization: Stop searching after finding one
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("INVALID_CREDENTIALS");
      }
      
      // Merge ID into the data just in case
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },

  // SIGNUP: Creates new user (With Duplicate Check)
  async signUp(gamertag: string, secretCode: string, character: string): Promise<UserProfile> {
    const usersRef = collection(db, "users");
    
    // 1. CRITICAL CHECK: Does this name exist?
    const q = query(usersRef, where("gamertag", "==", gamertag));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error("USERNAME_TAKEN");
    }

    // 2. Create User
    const userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newUser: UserProfile = {
      id: userId,
      gamertag,
      password: secretCode, // In a real app, hash this!
      character,
      tokens: 50, // Start with a bonus!
      rank: 'Novice',
      level: 1,
      isGuest: false
    };

    await setDoc(doc(db, "users", userId), newUser);
    return newUser;
  },

  // GUEST LOGIN: Temporary session
// GUEST LOGIN: Temporary session
  async loginAsGuest(): Promise<UserProfile> {
    const guestId = `guest_${Date.now()}`;
    const guestUser: UserProfile = {
      id: guestId,
      gamertag: `Explorer_${Math.floor(Math.random() * 999)}`,
      password: "GUEST-SESSION", // <--- ADD THIS LINE
      character: 'Novice',
      tokens: 0,
      rank: 'Guest',
      level: 1,
      isGuest: true 
    };
    
    // We save guests too so they can save reports temporarily
    await setDoc(doc(db, "users", guestId), guestUser);
    return guestUser;
  },

  // --- PROGRESS SYSTEM ---

  // LEVEL UP LOGIC: Updates tokens and recalculates Rank
  async updateTokens(userId: string, tokensEarned: number): Promise<UserProfile | null> {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data() as UserProfile;
      const newTotal = (data.tokens || 0) + tokensEarned;
      
      // Simple RPG Math: Level = 1 + (Tokens / 100)
      const newLevel = Math.floor(newTotal / 100) + 1;
      
      // Determine Rank based on Level
      let newRank = "Novice";
      if (newLevel >= 5) newRank = "Apprentice";
      if (newLevel >= 10) newRank = "Adept";
      if (newLevel >= 20) newRank = "Master";

      const updates = {
        tokens: newTotal,
        level: newLevel,
        rank: newRank
      };

      await updateDoc(userRef, updates);
      return { ...data, ...updates };
    }
    return null;
  },

  // --- HISTORY & ANALYTICS ---

  // Saves the "Pedagogy Report" to the cloud
  async saveAnalysisReport(userId: string, code: string, narrative: string[]): Promise<void> {
    try {
      const reportRef = doc(collection(db, "reports")); // Auto-ID
      await setDoc(reportRef, {
        userId,
        sourceCode: code,
        narrative: narrative, 
        timestamp: serverTimestamp(),
        type: "SANDBOX_RUN"
      });
    } catch (e) {
      console.error("Failed to save report", e);
      // Don't crash the app if analytics fail
    }
  }
};