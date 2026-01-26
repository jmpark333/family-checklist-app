"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "./useChecklist";
import { getDateKey } from "@/lib/utils";

export function useWeeklyProgress() {
  const { currentUser } = useAuth();
  const { todayReward } = useChecklist(); // 오늘의 보상금이 변경되면 재계산
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(28); // 4개 항목 × 7일 = 28개
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchWeeklyData = async () => {
      setLoading(true);

      // 이번 주의 시작(월요일)과 끝(일요일) 계산
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0(일) ~ 6(토)

      // 월요일을 기준으로 계산 (일요일: 0 → -6, 월요일: 1 → 0, 화요일: 2 → -1, ...)
      const daysUntilMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + daysUntilMonday);
      monday.setHours(0, 0, 0, 0);

      // 오늘까지의 날짜들만 계산 (미래 날짜는 제외)
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // 이번 주 전체 목표: 4개 항목 × 7일 = 28개
      const WEEKLY_TARGET = 4 * 7;

      try {
        let totalCompleted = 0;

        // 월요일부터 일요일까지 순회 (단, 오늘까지만)
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(monday);
          currentDate.setDate(monday.getDate() + i);

          // 오늘보다 미래인 날짜는 스킵
          if (currentDate > today) break;

          const dateKey = getDateKey(currentDate);
          const checklistRef = doc(db, "checklists", dateKey);
          const docSnap = await getDoc(checklistRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const userData = data[currentUser.uid];
            if (userData && userData.items) {
              const dayCompleted = userData.items.filter((item: any) => item.completed).length;
              totalCompleted += dayCompleted;
            }
          }
        }

        // 달성률 계산: (완료한 개수 / 28) × 100
        const percentage = Math.round((totalCompleted / WEEKLY_TARGET) * 100);

        setCompleted(totalCompleted);
        setTotal(WEEKLY_TARGET);
        setProgress(percentage);
      } catch (error) {
        console.error("주간 달성률 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [currentUser, todayReward]); // todayReward가 변경되면 재계산

  return { progress, completed, total, loading };
}
