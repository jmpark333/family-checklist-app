"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserData, UserRole } from "@/lib/types";

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signup: (email: string, password: string, role: UserRole, parentEmail?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // 회원가입
  async function signup(email: string, password: string, role: UserRole, parentEmail?: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    let familyId: string;

    if (role === "parent") {
      // 부모: 새 familyId 생성 (자신의 uid 사용)
      familyId = user.uid;
    } else {
      // 자녀: 부모 이메일로 familyId 찾기
      if (!parentEmail) {
        throw new Error("자녀 회원가입 시 부모 이메일이 필요합니다");
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", parentEmail), where("role", "==", "parent"));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("부모 계정을 찾을 수 없습니다. 부모 이메일을 확인해주세요");
      }

      const parentDoc = querySnapshot.docs[0];
      const parentData = parentDoc.data();
      familyId = parentData.familyId;
    }

    const newUserData: UserData = {
      email,
      role,
      familyId,
      createdAt: new Date().toISOString(),
    };

    // 사용자 데이터 저장
    await setDoc(doc(db, "users", user.uid), newUserData);

    // 부모가 가입할 때는 가족 설정 문서 생성 (기본 체크리스트 항목 포함)
    if (role === "parent") {
      const defaultChecklistItems = [
        { id: "1", title: "7시 전 기상", reward: 5000 },
        { id: "2", title: "8시 전 나가기", reward: 5000 },
        { id: "3", title: "모든 약속은 미리 소통하고 결정하기", reward: 5000 },
        { id: "4", title: "반말 안하기, 말 예쁘게 하기", reward: 5000 },
      ];

      await setDoc(doc(db, "families", familyId), {
        checklistItems: defaultChecklistItems,
        resetDay: 1,
      });
    }

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
