"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "./useChecklist";
import { getTodayKey } from "@/lib/utils";

export function useMonthlyReward() {
  const { userData } = useAuth();
  const { todayReward } = useChecklist();
  const [monthlyReward, setMonthlyReward] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const familyId = userData?.familyId;

  useEffect(() => {
    if (!familyId) return;

    const fetchMonthlyData = async () => {
      setLoading(true);

      // 오늘 날짜 키
      const todayKey = getTodayKey();

      try {
        // 오늘의 체크리스트 문서 가져오기
        const checklistRef = doc(db, "checklists", todayKey);
        const docSnap = await getDoc(checklistRef);

        let monthlySum = 0;

        if (docSnap.exists()) {
          const data = docSnap.data();
          const familyData = data[familyId];
          if (familyData && familyData.totalReward) {
            monthlySum = familyData.totalReward;
          }
        }

        // TODO: 전월 데이터 합산 (현재는 오늘만)
        setMonthlyReward(monthlySum);
        setTotalBalance(monthlySum); // 임시로 오늘 합계와 동일
      } catch (error) {
        console.error("월간 보상금 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [familyId, todayReward]); // todayReward가 변경되면 다시 조회

  return { monthlyReward, totalBalance, loading };
}
