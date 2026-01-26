"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, query, where, orderBy, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getTodayKey } from "@/lib/utils";
import { ChecklistItem, DailyChecklist, Event, LedgerTransaction } from "@/lib/types";

export function useChecklist() {
  const { currentUser, userData } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [dailyExpense, setDailyExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  const familyId = userData?.familyId;

  // 체크리스트 데이터 로드
  useEffect(() => {
    if (!currentUser) return;

    const todayKey = getTodayKey();
    const checklistRef = doc(db, "checklists", todayKey);

    const unsubscribe = onSnapshot(
      checklistRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userChecklist = data[currentUser.uid] as DailyChecklist;
          if (userChecklist) {
            setChecklist(userChecklist.items || []);
            setEvents(userChecklist.events || []);
            // dailyExpense는 이제 ledger 트랜잭션에서 계산하므로 여기서는 사용하지 않음
          } else {
            // 초기 데이터 생성
            initializeDefaultData();
          }
        } else {
          // 문서가 없으면 초기 데이터 생성
          initializeDefaultData();
        }
        setLoading(false);
      },
      (error) => {
        console.error("체크리스트 로드 오류:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 가계부 트랜잭션에서 오늘의 지출 계산
  useEffect(() => {
    if (!familyId) return;

    const todayKey = new Date().toISOString().split("T")[0];

    const q = query(
      collection(db, "transactions"),
      where("familyId", "==", familyId),
      where("date", "==", todayKey),
      where("type", "==", "expense")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todayExpenses = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
        } as LedgerTransaction;
      });

      // 오늘 지출 합계 계산
      const total = todayExpenses.reduce((sum, t) => sum + t.amount, 0);
      setDailyExpense(total);
    }, (error) => {
      console.error("트랜잭션 로드 오류:", error);
    });

    return () => unsubscribe();
  }, [familyId]);

  // 기본 데이터 초기화
  const initializeDefaultData = async () => {
    const defaultItems: ChecklistItem[] = [
      { id: "1", title: "7시 전 기상", reward: 5000, completed: false },
      { id: "2", title: "8시 전 나가기", reward: 5000, completed: false },
      { id: "3", title: "모든 약속은 미리 소통하고 결정하기", reward: 5000, completed: false },
      { id: "4", title: "반말 안하기, 말 예쁘게 하기", reward: 5000, completed: false },
    ];

    const todayKey = getTodayKey();
    const checklistRef = doc(db, "checklists", todayKey);

    await setDoc(
      checklistRef,
      {
        [currentUser!.uid]: {
          userId: currentUser!.uid,
          date: todayKey,
          items: defaultItems,
          events: [],
          dailyExpense: 0,
          totalReward: 0,
        },
      },
      { merge: true }
    );

    setChecklist(defaultItems);
  };

  // 체크리스트 항목 토글
  const toggleItem = async (itemId: string) => {
    const updatedItems = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    // 로컬 상태 업데이트
    setChecklist(updatedItems);

    // Firestore 업데이트
    const todayKey = getTodayKey();
    const totalReward = updatedItems
      .filter((item) => item.completed)
      .reduce((sum, item) => sum + item.reward, 0);

    await updateDoc(doc(db, "checklists", todayKey), {
      [`${currentUser!.uid}.items`]: updatedItems,
      [`${currentUser!.uid}.totalReward`]: totalReward,
    });
  };

  // 이벤트 추가
  const addEvent = async (event: Omit<Event, "id">) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);

    const todayKey = getTodayKey();
    await updateDoc(doc(db, "checklists", todayKey), {
      [`${currentUser!.uid}.events`]: updatedEvents,
    });
  };

  // 이벤트 수정
  const updateEvent = async (eventId: string, updatedData: Omit<Event, "id">) => {
    const updatedEvents = events.map((event) =>
      event.id === eventId ? { ...event, ...updatedData } : event
    );
    setEvents(updatedEvents);

    const todayKey = getTodayKey();
    await updateDoc(doc(db, "checklists", todayKey), {
      [`${currentUser!.uid}.events`]: updatedEvents,
    });
  };

  // 이벤트 삭제
  const deleteEvent = async (eventId: string) => {
    const updatedEvents = events.filter((event) => event.id !== eventId);
    setEvents(updatedEvents);

    const todayKey = getTodayKey();
    await updateDoc(doc(db, "checklists", todayKey), {
      [`${currentUser!.uid}.events`]: updatedEvents,
    });
  };

  // 소비금액 업데이트
  const updateExpense = async (amount: number) => {
    setDailyExpense(amount);

    const todayKey = getTodayKey();
    await updateDoc(doc(db, "checklists", todayKey), {
      [`${currentUser!.uid}.dailyExpense`]: amount,
    });
  };

  // 오늘의 총 보상금
  const todayReward = checklist
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.reward, 0);

  return {
    checklist,
    events,
    dailyExpense,
    todayReward,
    loading,
    toggleItem,
    addEvent,
    updateEvent,
    deleteEvent,
    updateExpense,
  };
}
