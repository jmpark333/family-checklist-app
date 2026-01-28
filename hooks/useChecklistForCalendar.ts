"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getDateKey } from "@/lib/utils";
import { DailyChecklist } from "@/lib/types";

/**
 * 캘린더에서 특정 월의 체크리스트 완료 상태를 확인하는 훅
 * 모든 체크리스트 항목(4개)이 완료된 날짜들을 반환
 */
export function useChecklistForCalendar(month: Date) {
  const { currentUser, userData } = useAuth();
  const [completedDates, setCompletedDates] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const familyId = userData?.familyId;

  useEffect(() => {
    if (!familyId || !currentUser) {
      setLoading(false);
      return;
    }

    const fetchCompletedDates = async () => {
      setLoading(true);
      const completedSet = new Set<number>();

      // 현재 월의 모든 날짜에 대해 체크리스트 완료 상태 확인
      const year = month.getFullYear();
      const currentMonth = month.getMonth();
      const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();

      // 각 날짜에 대해 체크리스트 데이터를 확인
      const promises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, currentMonth, day);
        const dateKey = getDateKey(date);
        const promise = getDoc(doc(db, "checklists", dateKey))
          .then((docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const familyData = data[familyId] as DailyChecklist;
              
              // 4개 항목이 모두 있는지 확인하고 모두 완료되었는지 체크
              if (familyData && familyData.items && familyData.items.length === 4) {
                const allCompleted = familyData.items.every((item) => item.completed);
                if (allCompleted) {
                  completedSet.add(day);
                }
              }
            }
          });
        promises.push(promise);
      }

      await Promise.all(promises);
      setCompletedDates(completedSet);
      setLoading(false);
    };

    fetchCompletedDates();
  }, [familyId, currentUser, month]);

  return { completedDates, loading };
}
