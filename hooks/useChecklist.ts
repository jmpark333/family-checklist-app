"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, query, where, orderBy, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getTodayKey } from "@/lib/utils";
import { ChecklistItem, DailyChecklist, Event, LedgerTransaction, HouseholdLedger } from "@/lib/types";

export function useChecklist() {
  const { currentUser, userData } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [dailyExpense, setDailyExpense] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const familyId = userData?.familyId;

  // 체크리스트 데이터 로드 - familyId 기반 + 하위 호환성
  useEffect(() => {
    if (!familyId || !currentUser) return;

    const todayKey = getTodayKey();
    const checklistRef = doc(db, "checklists", todayKey);

    console.log("[체크리스트 로드] familyId:", familyId, "currentUser.uid:", currentUser.uid);

    const unsubscribe = onSnapshot(
      checklistRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("[체크리스트 데이터] 문서 키들:", Object.keys(data));
          console.log("[체크리스트 데이터] familyId 데이터 존재?", !!data[familyId]);

          let familyChecklist = data[familyId] as DailyChecklist;

          // familyId로 데이터가 없고, currentUser.uid로 데이터가 있으면 마이그레이션
          if (!familyChecklist && data[currentUser.uid]) {
            console.log("마이그레이션: userId 기반 데이터를 familyId로 복사");
            const userData = data[currentUser.uid] as DailyChecklist;

            // familyId 키로 데이터 복사
            await updateDoc(checklistRef, {
              [familyId]: userData
            });

            familyChecklist = userData;
          }

          if (familyChecklist) {
            console.log("[체크리스트 성공] 데이터 로드됨, 항목 수:", familyChecklist.items?.length);
            setChecklist(familyChecklist.items || []);
            setEvents(familyChecklist.events || []);
          } else {
            // 초기 데이터 생성
            console.log("[체크리스트] familyId 데이터 없음, 초기 데이터 생성");
            await initializeDefaultData();
          }
        } else {
          // 문서가 없으면 초기 데이터 생성
          console.log("[체크리스트] 문서 없음, 초기 데이터 생성");
          await initializeDefaultData();
        }
        setLoading(false);
      },
      (error) => {
        console.error("체크리스트 로드 오류:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [familyId, currentUser]);

  // 가계부 트랜잭션에서 오늘의 지출 계산
  useEffect(() => {
    if (!familyId) return;

    const todayKey = getTodayKey();

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

  // 가계부 현재 잔액 로드
  useEffect(() => {
    if (!familyId) return;

    const ledgerRef = doc(db, "households", familyId);

    const unsubscribe = onSnapshot(
      ledgerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const ledger = docSnap.data() as HouseholdLedger;
          setCurrentBalance(ledger.currentBalance ?? 0);
        }
      },
      (error) => {
        console.error("가계부 잔액 로드 오류:", error);
      }
    );

    return () => unsubscribe();
  }, [familyId]);

  // 기본 데이터 초기화 - familyId 기반으로 변경
  const initializeDefaultData = async () => {
    if (!familyId) return;

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
        [familyId]: {
          familyId,
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
    if (!familyId) return;

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
      [`${familyId}.items`]: updatedItems,
      [`${familyId}.totalReward`]: totalReward,
    });
  };

  // 체크리스트 항목 보상금 수정
  const updateReward = async (itemId: string, newReward: number) => {
    if (!familyId) return;

    const updatedItems = checklist.map((item) =>
      item.id === itemId ? { ...item, reward: newReward } : item
    );

    // 로컬 상태 업데이트
    setChecklist(updatedItems);

    // Firestore 업데이트
    const todayKey = getTodayKey();
    const totalReward = updatedItems
      .filter((item) => item.completed)
      .reduce((sum, item) => sum + item.reward, 0);

    await updateDoc(doc(db, "checklists", todayKey), {
      [`${familyId}.items`]: updatedItems,
      [`${familyId}.totalReward`]: totalReward,
    });
  };

  // 이벤트 추가
  const addEvent = async (event: Omit<Event, "id">) => {
    if (!familyId) return;

    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);

    const todayKey = getTodayKey();
    await updateDoc(doc(db, "checklists", todayKey), {
      [`${familyId}.events`]: updatedEvents,
    });
  };

  // 이벤트 수정
  const updateEvent = async (eventId: string, updatedData: Omit<Event, "id">) => {
    if (!familyId) return;

    const updatedEvents = events.map((event) =>
      event.id === eventId ? { ...event, ...updatedData } : event
    );
    setEvents(updatedEvents);

    const todayKey = getTodayKey();
    await updateDoc(doc(db, "checklists", todayKey), {
      [`${familyId}.events`]: updatedEvents,
    });
  };

  // 이벤트 삭제
  const deleteEvent = async (eventId: string) => {
    if (!familyId) return;

    const updatedEvents = events.filter((event) => event.id !== eventId);
    setEvents(updatedEvents);

    const todayKey = getTodayKey();
    await updateDoc(doc(db, "checklists", todayKey), {
      [`${familyId}.events`]: updatedEvents,
    });
  };

  // 소비금액 업데이트 (더 이상 사용하지 않음, transactions 사용)
  const updateExpense = async (amount: number) => {
    if (!familyId) return;

    setDailyExpense(amount);

    const todayKey = getTodayKey();
    await updateDoc(doc(db, "checklists", todayKey), {
      [`${familyId}.dailyExpense`]: amount,
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
    currentBalance,
    todayReward,
    loading,
    toggleItem,
    updateReward,
    addEvent,
    updateEvent,
    deleteEvent,
    updateExpense,
  };
}
