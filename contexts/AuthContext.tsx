"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserData, UserRole } from "@/lib/types";

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signup: (email: string, password: string, role: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // 회원가입
  async function signup(email: string, password: string, role: UserRole) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // familyId 생성 (이메일 도메인 기반 또는 UID 기반)
    const familyId = role === "parent" ? user.uid : `family-${user.uid.slice(0, 8)}`;

    const newUserData: UserData = {
      email,
      role,
      familyId,
      createdAt: new Date().toISOString(),
    };

    // 사용자 데이터 저장
    await setDoc(doc(db, "users", user.uid), newUserData);
    setUserData(newUserData);
  }

  // 로그인
  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // 로그아웃
  async function logout() {
    await signOut(auth);
    setUserData(null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // 사용자 데이터 가져오기
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, userData, loading, signup, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
