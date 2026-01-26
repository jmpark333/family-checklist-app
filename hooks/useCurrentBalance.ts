"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "./useChecklist";

export function useCurrentBalance() {
  const { currentUser } = useAuth();
  const { todayReward } = useChecklist();
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setCurrentBalance(data.currentBalance || 0);
        }
      } catch (error) {
        console.error("잔고 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [currentUser]);

  return {
    currentBalance,
    pendingReward: todayReward, // 오늘의 예정 보상금
    total: currentBalance + todayReward, // 총액 (잔고 + 예정)
    loading,
  };
}
