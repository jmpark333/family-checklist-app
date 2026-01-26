"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { LedgerTransaction, HouseholdLedger, Category } from "@/lib/types";
import { getTodayKey, getDateKey } from "@/lib/utils";

export const CATEGORIES = {
  food: { label: "식비", emoji: "🍎", color: "bg-red-500" },
  cafe: { label: "카페", emoji: "☕", color: "bg-orange-500" },
  transport: { label: "교통", emoji: "🚌", color: "bg-blue-500" },
  shopping: { label: "쇼핑", emoji: "🛍️", color: "bg-pink-500" },
  bills: { label: "공과금/월세", emoji: "🏠", color: "bg-purple-500" },
  allowance: { label: "용돈", emoji: "💰", color: "bg-green-500" },
  etc: { label: "기타", emoji: "📦", color: "bg-gray-500" },
} as const;

export function useLedger() {
  const { userData, currentUser } = useAuth();
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [ledger, setLedger] = useState<HouseholdLedger | null>(null);
  const [loading, setLoading] = useState(true);

  const familyId = userData?.familyId;

  // 가계부 설정 로드
  useEffect(() => {
    if (!familyId) return;

    const ledgerRef = doc(db, "households", familyId);

    const unsubscribe = onSnapshot(
      ledgerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setLedger(docSnap.data() as HouseholdLedger);
        } else {
          // 초기 설정 생성
          initializeLedger();
        }
        setLoading(false);
      },
      (error) => {
        console.error("가계부 설정 로드 오류:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [familyId]);

  // 트랜잭션 로드
  useEffect(() => {
    if (!familyId) return;

    const q = query(
      collection(db, "transactions"),
      where("familyId", "==", familyId),
      orderBy("date", "desc"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LedgerTransaction[];
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [familyId]);

  // 초기 가계부 설정
  const initializeLedger = async () => {
    if (!familyId) return;

    const defaultLedger: HouseholdLedger = {
      familyId,
      monthlyBudget: 600000,
      fixedExpense: 200000,
      initialBalance: 300000,
      currentBalance: 300000,
    };

    await setDoc(doc(db, "households", familyId), defaultLedger);
    setLedger(defaultLedger);
  };

  // 트랜잭션 추가
  const addTransaction = async (data: Omit<LedgerTransaction, "id" | "familyId" | "userId" | "createdAt">) => {
    if (!familyId || !currentUser) return;

    const newTransaction: Omit<LedgerTransaction, "id"> = {
      familyId,
      userId: currentUser.uid,
      createdAt: new Date().toISOString(),
      ...data,
    };

    // Firestore에 저장
    await addDoc(collection(db, "transactions"), newTransaction);

    // 잔액 업데이트
    if (ledger) {
      const newBalance = data.type === "income"
        ? ledger.currentBalance + data.amount
        : ledger.currentBalance - data.amount;

      await updateDoc(doc(db, "households", familyId), {
        currentBalance: newBalance,
      });
    }
  };

  // 예산 설정 업데이트
  const updateBudget = async (budget: Omit<HouseholdLedger, "familyId" | "currentBalance">) => {
    if (!familyId) return;

    await updateDoc(doc(db, "households", familyId), {
      monthlyBudget: budget.monthlyBudget,
      fixedExpense: budget.fixedExpense,
      initialBalance: budget.initialBalance,
      currentBalance: budget.initialBalance, // 초기 잔액 설정 시 현재 잔액도 함께 업데이트
    });
  };

  // 트랜잭션 수정
  const updateTransaction = async (id: string, data: Omit<LedgerTransaction, "id" | "familyId" | "userId" | "createdAt">) => {
    if (!familyId) return;

    // 기존 트랜잭션 가져오기
    const transactionRef = doc(db, "transactions", id);
    const transactionSnap = await getDoc(transactionRef);

    if (!transactionSnap.exists()) {
      console.error("트랜잭션을 찾을 수 없습니다:", id);
      return;
    }

    const oldTransaction = transactionSnap.data() as LedgerTransaction;

    // 트랜잭션 업데이트
    await updateDoc(transactionRef, data);

    // 잔액 조정 (기존 트랜잭션의 영향을 제거하고 새 트랜잭션의 영향을 적용)
    if (ledger) {
      let balanceChange = 0;

      // 기존 트랜잭션의 영향 제거
      balanceChange += oldTransaction.type === "income" ? -oldTransaction.amount : oldTransaction.amount;

      // 새 트랜잭션의 영향 적용
      balanceChange += data.type === "income" ? data.amount : -data.amount;

      await updateDoc(doc(db, "households", familyId), {
        currentBalance: ledger.currentBalance + balanceChange,
      });
    }
  };

  // 트랜잭션 삭제
  const deleteTransaction = async (id: string) => {
    if (!familyId) return;

    // 기존 트랜잭션 가져오기
    const transactionRef = doc(db, "transactions", id);
    const transactionSnap = await getDoc(transactionRef);

    if (!transactionSnap.exists()) {
      console.error("트랜잭션을 찾을 수 없습니다:", id);
      return;
    }

    const oldTransaction = transactionSnap.data() as LedgerTransaction;

    // 트랜잭션 삭제
    await deleteDoc(transactionRef);

    // 잔액 복구 (기존 트랜잭션의 영향을 제거)
    if (ledger) {
      const balanceChange = oldTransaction.type === "income" ? -oldTransaction.amount : oldTransaction.amount;

      await updateDoc(doc(db, "households", familyId), {
        currentBalance: ledger.currentBalance + balanceChange,
      });
    }
  };

  // 이번 달 지출 계산
  const getMonthlyExpense = (): number => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(monthKey))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // 오늘 지출 계산
  const getTodayExpense = (): number => {
    const todayKey = getTodayKey();

    return transactions
      .filter((t) => t.type === "expense" && t.date === todayKey)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // 남은 예산 계산
  const getRemainingBudget = (): number => {
    if (!ledger) return 0;
    return ledger.monthlyBudget - getMonthlyExpense();
  };

  // 카테고리별 지출 통계
  const getCategoryStats = (): Record<Category, number> => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const stats: Record<string, number> = {
      food: 0,
      cafe: 0,
      transport: 0,
      shopping: 0,
      bills: 0,
      allowance: 0,
      etc: 0,
    };

    transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(monthKey))
      .forEach((t) => {
        stats[t.category] = (stats[t.category] || 0) + t.amount;
      });

    return stats as Record<Category, number>;
  };

  // 최근 지출 5건
  const getRecentExpenses = (): LedgerTransaction[] => {
    return transactions
      .filter((t) => t.type === "expense")
      .slice(0, 5);
  };

  // 어제의 체크리스트 보상금을 잔고에 동기화
  const syncYesterdayReward = async () => {
    if (!familyId || !ledger) return;

    // 어제 날짜 계산 (Local timezone)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);

    // 이미 지급되었는지 확인
    if (ledger.paidRewards?.[yesterdayKey]) {
      console.log("[보상 동기화] 어제 보상 이미 지급됨:", yesterdayKey);
      return;
    }

    // 어제의 체크리스트에서 보상금 읽기
    const checklistRef = doc(db, "checklists", yesterdayKey);
    const checklistSnap = await getDoc(checklistRef);

    if (!checklistSnap.exists()) {
      console.log("[보상 동기화] 어제 체크리스트 없음:", yesterdayKey);
      return;
    }

    const yesterdayData = checklistSnap.data();
    const yesterdayReward = yesterdayData[familyId]?.totalReward || 0;

    if (yesterdayReward === 0) {
      console.log("[보상 동기화] 어제 보상금 0원:", yesterdayKey);
      return;
    }

    // 잔고에 보상금 추가 및 지급 기록
    await updateDoc(doc(db, "households", familyId), {
      currentBalance: ledger.currentBalance + yesterdayReward,
      [`paidRewards.${yesterdayKey}`]: yesterdayReward,
    });

    console.log("[보상 동기화] 어제 보상금 지급 완료:", yesterdayKey, yesterdayReward);
  };

  return {
    transactions,
    ledger,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateBudget,
    getMonthlyExpense,
    getTodayExpense,
    getRemainingBudget,
    getCategoryStats,
    getRecentExpenses,
    CATEGORIES,
    syncYesterdayReward,
  };
}
