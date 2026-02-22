import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Login Function
  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userResult = result.user;

      // Check if user exists in DB, if not, create them
      const userRef = doc(db, "users", userResult.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: userResult.uid,
          email: userResult.email,
          name: userResult.displayName,
          role: "user", // Default role
          plan: "basic", // Default plan for new users
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // Fetch role and plan from DB
        const userRef = doc(db, "users", currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUser({ ...currentUser, ...userData });
            setIsAdmin(userData.role === "admin");
          } else {
            // Fallback if data doesn't exist yet but user is auth'd
            setUser({ ...currentUser, plan: "basic" });
          }
        } catch (e) {
          console.error("Error fetching user data:", e);
          setUser({ ...currentUser, plan: "basic" });
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
