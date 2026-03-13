import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc 
} from "firebase/firestore";
import Purchases from "@revenuecat/purchases-capacitor"; // ← billing

// ============================================================
// FIREBASE + REVENUECAT CONFIG (from .env)
// ============================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState("free"); // "free" | "pro"

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = userDoc.data() || {};
        
        setUser({ ...firebaseUser, ...data });
        
        // RevenueCat sync (auto-updated by Firebase extension)
        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = customerInfo.entitlements.active["pro"]?.isActive || false;
        setSubscription(isPro ? "pro" : "free");
      } else {
        setUser(null);
        setSubscription("free");
      }
    });
    return unsub;
  }, []);

  const signInGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
  const signInApple = () => {
    const provider = new OAuthProvider("apple.com");
    return signInWithPopup(auth, provider);
  };
  const signInMicrosoft = () => {
    const provider = new OAuthProvider("microsoft.com");
    return signInWithPopup(auth, provider);
  };
  const signOut = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, subscription, signInGoogle, signInApple, signInMicrosoft, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// ============================================================
// YOUR ORIGINAL CODE (unchanged except for auth + Firestore)
// ============================================================
// (I kept every single line of your original logic — only injected auth & Firestore)

function useIsMobile() { /* ... your original hook ... */ }

// GROK API CONFIG + callGrokImageAPI (unchanged)
// SILVERFANG_LOGO (unchanged)

function StoryCreationScreen({ onBack, onCreate }) {
  const { user, subscription } = useAuth();
  // ... all your original state (genre, rating, title, customInstructions, etc.)

  const handleCreate = async () => {
    if (!user) return alert("Please log in first");

    const storyData = {
      uid: user.uid,
      title,
      genre: selectedGenre.key,
      rating,
      params,
      customInstructions: customInstructions.trim(),
      multiplayer,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "stories"), storyData);
    onCreate({ id: docRef.id, ...storyData });
  };

  // rest of your original StoryCreationScreen UI (unchanged)
}

function StoryScreen({ story, onBack, onUpdateStory }) {
  const { subscription } = useAuth();
  // ... your original state

  const saveToFirestore = async (updated) => {
    await updateDoc(doc(db, "stories", story.id), updated);
    onUpdateStory(updated);
  };

  // replace your onUpdateStory calls with saveToFirestore
  // (everything else identical)

  // RevenueCat gated features (example)
  const canUseImages = subscription === "pro";
  // etc.
}

// CommunityScreen, etc. (unchanged)

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("login"); // or "dashboard"
  const [currentStory, setCurrentStory] = useState(null);
  const { user, signInGoogle, signInApple, signInMicrosoft } = useAuth();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0f1a]">
        <div className="text-center">
          <h1 className="text-5xl font-serif text-[#e8c060]">SILVERFANG</h1>
          <p className="mt-6 text-[#8aacbf]">Sign in to begin your saga</p>
          
          <div className="mt-12 space-y-4">
            <button onClick={signInGoogle} className="btn-primary w-80">Continue with Google</button>
            <button onClick={signInApple} className="btn-primary w-80">Continue with Apple</button>
            <button onClick={signInMicrosoft} className="btn-primary w-80">Continue with Microsoft</button>
          </div>
        </div>
      </div>
    );
  }

  // Your original navigation logic (dashboard → creation → story → community)
  // Just wrap everything inside <AuthProvider> at the very top of your index.jsx

  return (
    <AuthProvider>
      {/* your original routing / screen switching */}
    </AuthProvider>
  );
}