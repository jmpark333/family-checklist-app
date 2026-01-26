"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "./useChecklist";
import { getTodayKey, getDateKey } from "@/lib/utils";

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

      try {
        // 오늘 날짜
        const today = new Date();
        const todayKey = getTodayKey();

        // 이번 달 1일부터 오늘까지의 날짜 배열 생성
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-indexed (0 = 1월)
        const dayOfMonth = today.getDate();

        const dateKeys: string[] = [];
        for (let day = 1; day <= dayOfMonth; day++) {
          const date = new Date(year, month, day);
          dateKeys.push(getDateKey(date));
        }

        // 각 날짜의 체크리스트를 병렬로 조회하여 보상금 합산
        const promises = dateKeys.map(async (dateKey) => {
          const checklistRef = doc(db, "checklists", dateKey);
          const docSnap = await getDoc(checklistRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const familyData = data[familyId];
            return familyData?.totalReward || 0;
          }
          return 0;
        });

        const rewards = await Promise.all(promises);
        const monthlySum = rewards.reduce((sum, reward) => sum + reward, 0);

        setMonthlyReward(monthlySum);
        setTotalBalance(monthlySum);
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
