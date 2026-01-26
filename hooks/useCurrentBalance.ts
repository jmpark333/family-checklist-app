"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "./useChecklist";
import { HouseholdLedger } from "@/lib/types";

export function useCurrentBalance() {
  const { userData } = useAuth();
  const { todayReward } = useChecklist();
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const familyId = userData?.familyId;

  useEffect(() => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    const ledgerRef = doc(db, "households", familyId);

    const unsubscribe = onSnapshot(
      ledgerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const ledger = docSnap.data() as HouseholdLedger;
          setCurrentBalance(ledger.currentBalance ?? 0);
        }
        setLoading(false);
      },
      (error) => {
        console.error("잔고 로드 오류:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [familyId]);

  return {
    currentBalance,
    pendingReward: todayReward, // 오늘의 예정 보상금
    total: currentBalance + todayReward, // 총액 (잔고 + 예정)
    loading,
  };
}
