# 가계부(Ledger) 기능 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 자녀의 예산 관리 능력을 키워주는 가족 가계부 시스템 구축

**Architecture:** Firestore에 가계부 데이터(transactions, households)를 저장하고, useLedger Hook으로 실시간 동기화하여 3개 탭(홈, 기록, 통계) UI에 표시

**Tech Stack:** Next.js 15, Firebase Firestore, shadcn/ui, Tailwind CSS, React Hooks

---

## 카테고리 정의

```typescript
const CATEGORIES = {
  food: { label: "식비", emoji: "🍎", color: "bg-red-500" },
  cafe: { label: "카페", emoji: "☕", color: "bg-orange-500" },
  transport: { label: "교통", emoji: "🚌", color: "bg-blue-500" },
  shopping: { label: "쇼핑", emoji: "🛍️", color: "bg-pink-500" },
  bills: { label: "공과금/월세", emoji: "🏠", color: "bg-purple-500" },
  allowance: { label: "용돈", emoji: "💰", color: "bg-green-500" },
  etc: { label: "기타", emoji: "📦", color: "bg-gray-500" },
} as const;
```

---

### Task 1: 타입 정의 (lib/types.ts 확장)

**Files:**
- Modify: `lib/types.ts`

**Step 1: Add ledger types to lib/types.ts**

```typescript
// 카테고리 타입
export type Category = "food" | "cafe" | "transport" | "shopping" | "bills" | "allowance" | "etc";

// 트랜잭션 타입 (수입/지출 내역)
export interface Transaction {
  id: string;
  familyId: string;
  userId: string;           // 기록한 사람
  date: string;             // YYYY-MM-DD
  type: "income" | "expense";
  category: Category;
  amount: number;
  memo: string;
  createdAt: string;        // ISO timestamp
}

// 가계부 설정
export interface HouseholdLedger {
  familyId: string;
  monthlyBudget: number;    // 월 예산
  fixedExpense: number;     // 고정지출
  initialBalance: number;   // 시작 잔액
  currentBalance: number;   // 현재 잔액 (실시간 계산)
}
```

**Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add ledger types to types.ts"
```

---

### Task 2: useLedger Hook 생성

**Files:**
- Create: `hooks/useLedger.ts`

**Step 1: Create hooks/useLedger.ts**

```typescript
"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction, HouseholdLedger, Category } from "@/lib/types";

const CATEGORIES = {
  food: { label: "식비", emoji: "🍎", color: "bg-red-500" },
  cafe: { label: "카페", emoji: "☕", color: "bg-orange-500" },
  transport: { label: "교통", emoji: "🚌", color: "bg-blue-500" },
  shopping: { label: "쇼핑", emoji: "🛍️", color: "bg-pink-500" },
  bills: { label: "공과금/월세", emoji: "🏠", color: "bg-purple-500" },
  allowance: { label: "용돈", emoji: "💰", color: "bg-green-500" },
  etc: { label: "기타", emoji: "📦", color: "bg-gray-500" },
} as const;

export function useLedger() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      })) as Transaction[];
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
  const addTransaction = async (data: Omit<Transaction, "id" | "familyId" | "userId" | "createdAt">) => {
    if (!familyId || !userData) return;

    const newTransaction: Omit<Transaction, "id"> = {
      familyId,
      userId: userData.uid,
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
    });
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
    const todayKey = new Date().toISOString().split("T")[0];

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
  const getRecentExpenses = (): Transaction[] => {
    return transactions
      .filter((t) => t.type === "expense")
      .slice(0, 5);
  };

  return {
    transactions,
    ledger,
    loading,
    addTransaction,
    updateBudget,
    getMonthlyExpense,
    getTodayExpense,
    getRemainingBudget,
    getCategoryStats,
    getRecentExpenses,
    CATEGORIES,
  };
}
```

**Step 2: Commit**

```bash
git add hooks/useLedger.ts
git commit -m "feat: create useLedger hook"
```

---

### Task 3: 가계부 페이지 메인 컴포넌트

**Files:**
- Create: `components/ledger/LedgerPage.tsx`

**Step 1: Create components/ledger/LedgerPage.tsx**

```typescript
"use client";

import { useState } from "react";
import { useLedger } from "@/hooks/useLedger";
import { HomeTab } from "./tabs/HomeTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { StatsTab } from "./tabs/StatsTab";
import { TransactionDialog } from "./TransactionDialog";
import { BudgetSettingsDialog } from "./BudgetSettingsDialog";
import { useAuth } from "@/contexts/AuthContext";

type TabType = "home" | "history" | "stats";

export function LedgerPage() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);

  const {
    ledger,
    loading
  } = useLedger();

  const isParent = userData?.role === "parent";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">💰 가계부</h1>
          {isParent && (
            <button
              onClick={() => setIsBudgetDialogOpen(true)}
              className="text-sm text-blue-600 dark:text-blue-400"
            >
              예산 설정
            </button>
          )}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="max-w-md mx-auto px-4 py-6">
        {activeTab === "home" && <HomeTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "stats" && <StatsTab />}
      </div>

      {/* 하단 탭 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 py-3 text-center ${
              activeTab === "home"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <span className="text-xl">🏠</span>
            <p className="text-xs mt-1">홈</p>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-center ${
              activeTab === "history"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <span className="text-xl">📝</span>
            <p className="text-xs mt-1">기록</p>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-3 text-center ${
              activeTab === "stats"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <span className="text-xl">📊</span>
            <p className="text-xs mt-1">통계</p>
          </button>
        </div>
      </div>

      {/* 다이얼로그 */}
      <TransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
      />
      <BudgetSettingsDialog
        open={isBudgetDialogOpen}
        onOpenChange={setIsBudgetDialogOpen}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/ledger/LedgerPage.tsx
git commit -m "feat: create LedgerPage main component"
```

---

### Task 4: 홈 탭 (HomeTab)

**Files:**
- Create: `components/ledger/tabs/HomeTab.tsx`

**Step 1: Create components/ledger/tabs/HomeTab.tsx**

```typescript
"use client";

import { useLedger } from "@/hooks/useLedger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TransactionDialog } from "../TransactionDialog";

export function HomeTab() {
  const {
    ledger,
    getMonthlyExpense,
    getRemainingBudget,
    getTodayExpense,
    getRecentExpenses,
  } = useLedger();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const monthlyExpense = getMonthlyExpense();
  const remainingBudget = getRemainingBudget();
  const todayExpense = getTodayExpense();
  const recentExpenses = getRecentExpenses();

  const budgetPercentage = ledger
    ? Math.round((monthlyExpense / ledger.monthlyBudget) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* 현재 잔액 */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            현재 잔액
          </p>
          <p className="text-3xl font-bold text-center mt-2">
            ₩{ledger?.currentBalance.toLocaleString() ?? 0}
          </p>
        </CardContent>
      </Card>

      {/* 이번 달 예산 현황 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">이번 달 지출</span>
            <span className="text-sm font-medium">
              ₩{monthlyExpense.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">남은 예산</span>
            <span className={`text-sm font-medium ${
              remainingBudget < 0 ? "text-red-500" : ""
            }`}>
              ₩{remainingBudget.toLocaleString()}
            </span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>예산 사용률</span>
              <span>{budgetPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  budgetPercentage > 90
                    ? "bg-red-500"
                    : budgetPercentage > 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 오늘 사용 금액 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-sm">오늘 사용 금액</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ₩{todayExpense.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 최근 지출 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">최근 지출</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              기록된 내역이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {expense.memo || expense.category}
                    </p>
                    <p className="text-xs text-gray-500">{expense.date}</p>
                  </div>
                  <span className="font-medium">
                    -₩{expense.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/ledger/tabs/HomeTab.tsx
git commit -m "feat: create HomeTab component"
```

---

### Task 5: 기록 탭 (HistoryTab)

**Files:**
- Create: `components/ledger/tabs/HistoryTab.tsx`

**Step 1: Create components/ledger/tabs/HistoryTab.tsx**

```typescript
"use client";

import { useState } from "react";
import { useLedger } from "@/hooks/useLedger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TransactionDialog } from "../TransactionDialog";
import { CATEGORIES } from "@/hooks/useLedger";

type FilterType = "all" | "income" | "expense";

export function HistoryTab() {
  const { transactions } = useLedger();
  const [filter, setFilter] = useState<FilterType>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 필터링된 내역
  const filteredTransactions = transactions.filter((t) => {
    if (filter === "all") return true;
    return t.type === filter;
  });

  // 날짜별 그룹화
  const groupedByDate = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.date]) {
      acc[t.date] = [];
    }
    acc[t.date].push(t);
    return acc;
  }, {} as Record<string, typeof transactions>);

  return (
    <div className="space-y-4">
      {/* 필터 버튼 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="flex-1"
            >
              전체
            </Button>
            <Button
              variant={filter === "income" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("income")}
              className="flex-1"
            >
              수입
            </Button>
            <Button
              variant={filter === "expense" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("expense")}
              className="flex-1"
            >
              지출
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 내역 리스트 */}
      {Object.keys(groupedByDate).length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 text-center py-4">
              기록된 내역이 없습니다
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByDate).map(([date, items]) => (
          <Card key={date}>
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
              <div className="space-y-2">
                {items.map((item) => {
                  const cat = CATEGORIES[item.category];
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.emoji}</span>
                        <div>
                          <p className="font-medium">
                            {item.memo || cat.label}
                          </p>
                          <p className="text-xs text-gray-500">{cat.label}</p>
                        </div>
                      </div>
                      <span
                        className={`font-bold ${
                          item.type === "income"
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.type === "income" ? "+" : "-"}₩
                        {item.amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* 플로팅 추가 버튼 */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      <TransactionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/ledger/tabs/HistoryTab.tsx
git commit -m "feat: create HistoryTab component"
```

---

### Task 6: 통계 탭 (StatsTab)

**Files:**
- Create: `components/ledger/tabs/StatsTab.tsx`

**Step 1: Create components/ledger/tabs/StatsTab.tsx**

```typescript
"use client";

import { useLedger } from "@/hooks/useLedger";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CATEGORIES } from "@/hooks/useLedger";

export function StatsTab() {
  const { ledger, getMonthlyExpense, getCategoryStats } = useLedger();

  const monthlyExpense = getMonthlyExpense();
  const categoryStats = getCategoryStats();

  const budgetPercentage = ledger
    ? Math.round((monthlyExpense / ledger.monthlyBudget) * 100)
    : 0;

  // 카테고리별 정렬 (금액 높은 순)
  const sortedCategories = Object.entries(categoryStats)
    .filter(([_, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-4">
      {/* 예산 사용률 */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">이번 달 예산 사용률</h3>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold">{budgetPercentage}%</p>
            <p className="text-sm text-gray-500 mt-1">
              ₩{monthlyExpense.toLocaleString()} / ₩
              {ledger?.monthlyBudget.toLocaleString()}
            </p>
          </div>
          <Progress
            value={budgetPercentage}
            className="h-3"
          />
        </CardContent>
      </Card>

      {/* 카테고리별 지출 */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">카테고리별 지출</h3>
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              이번 달 지출 내역이 없습니다
            </p>
          ) : (
            <div className="space-y-4">
              {sortedCategories.map(([category, amount]) => {
                const cat = CATEGORIES[category as keyof typeof CATEGORIES];
                const percentage = Math.round((amount / monthlyExpense) * 100);

                return (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-sm">{cat.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₩{amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{percentage}%</p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/ledger/tabs/StatsTab.tsx
git commit -m "feat: create StatsTab component"
```

---

### Task 7: 트랜잭션 입력 다이얼로그

**Files:**
- Create: `components/ledger/TransactionDialog.tsx`

**Step 1: Create components/ledger/TransactionDialog.tsx`

```typescript
"use client";

import { useState } from "react";
import { useLedger } from "@/hooks/useLedger";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category } from "@/lib/types";
import { CATEGORIES } from "@/hooks/useLedger";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDialog({ open, onOpenChange }: TransactionDialogProps) {
  const { addTransaction } = useLedger();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<Category>("food");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = async () => {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) return;

    await addTransaction({
      date,
      type,
      category,
      amount: amountNum,
      memo,
    });

    // 초기화
    setAmount("");
    setMemo("");
    setDate(new Date().toISOString().split("T")[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>내역 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 구분 선택 */}
          <div>
            <Label>구분</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={type === "income" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("income")}
              >
                수입
              </Button>
              <Button
                type="button"
                variant={type === "expense" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("expense")}
              >
                지출
              </Button>
            </div>
          </div>

          {/* 카테고리 선택 */}
          {type === "expense" && (
            <div>
              <Label>카테고리</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([key, cat]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={category === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(key)}
                    className="flex flex-col gap-1 h-auto py-2"
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-xs">{cat.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 금액 입력 */}
          <div>
            <Label htmlFor="amount">금액</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* 날짜 선택 */}
          <div>
            <Label htmlFor="date">날짜</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* 메모 입력 */}
          <div>
            <Label htmlFor="memo">메모 (선택)</Label>
            <Input
              id="memo"
              placeholder="간단한 내용"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* 저장 버튼 */}
          <Button className="w-full" onClick={handleSubmit}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add components/ledger/TransactionDialog.tsx
git commit -m "feat: create TransactionDialog component"
```

---

### Task 8: 예산 설정 다이얼로그

**Files:**
- Create: `components/ledger/BudgetSettingsDialog.tsx`

**Step 1: Create components/ledger/BudgetSettingsDialog.tsx**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useLedger } from "@/hooks/useLedger";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetSettingsDialog({ open, onOpenChange }: BudgetSettingsDialogProps) {
  const { ledger, updateBudget } = useLedger();
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [fixedExpense, setFixedExpense] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  // 다이얼로그 열릴 때 현재 값 로드
  useEffect(() => {
    if (open && ledger) {
      setMonthlyBudget(ledger.monthlyBudget.toString());
      setFixedExpense(ledger.fixedExpense.toString());
      setInitialBalance(ledger.initialBalance.toString());
    }
  }, [open, ledger]);

  const handleSubmit = async () => {
    if (!ledger) return;

    await updateBudget({
      monthlyBudget: Number(monthlyBudget),
      fixedExpense: Number(fixedExpense),
      initialBalance: Number(initialBalance),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>예산 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="monthly-budget">월 예산</Label>
            <Input
              id="monthly-budget"
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fixed-expense">고정지출</Label>
            <Input
              id="fixed-expense"
              type="number"
              value={fixedExpense}
              onChange={(e) => setFixedExpense(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="initial-balance">시작 잔액</Label>
            <Input
              id="initial-balance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add components/ledger/BudgetSettingsDialog.tsx
git commit -m "feat: create BudgetSettingsDialog component"
```

---

### Task 9: Dashboard에서 가계부 버튼 연결

**Files:**
- Modify: `components/dashboard/DailyExpense.tsx`

**Step 1: Add ledger button to DailyExpense.tsx**

```typescript
// Add import at top
import { useRouter } from "next/navigation";

// Inside DailyExpense component, add:
const router = useRouter();

// In the JSX, inside CardTitle after the existing button:
<Button
  size="sm"
  variant="outline"
  className="gap-2"
  onClick={() => router.push("/ledger")}
>
  가계부
</Button>
```

**Step 2: Commit**

```bash
git add components/dashboard/DailyExpense.tsx
git commit -m "feat: add ledger button to DailyExpense"
```

---

### Task 10: 가계부 페이지 라우팅 추가

**Files:**
- Modify: `app/ledger/page.tsx` (create if not exists)

**Step 1: Create app/ledger/page.tsx**

```typescript
"use client";

import { LedgerPage } from "@/components/ledger/LedgerPage";

export default function LedgerRoute() {
  return <LedgerPage />;
}
```

**Step 2: Commit**

```bash
git add app/ledger/page.tsx
git commit -m "feat: create ledger route page"
```

---

## 완료 후 테스트 체크리스트

1. **홈 탭**
   - [ ] 현재 잔액이 올바르게 표시되는가
   - [ ] 이번 달 지출/남은 예산이 올바른가
   - [ ] 예산 사용률 프로그레스 바가 정확한가
   - [ ] 오늘 사용 금액이 올바른가
   - [ ] 최근 지출 5건이 표시되는가

2. **기록 탭**
   - [ ] 전체/수입/지출 필터가 작동하는가
   - [ ] 날짜별로 내역이 그룹화되는가
   - [ ] 플로팅 추가 버튼이 작동하는가

3. **통계 탭**
   - [ ] 예산 사용률이 올바른가
   - [ ] 카테고리별 지출이 올바르게 표시되는가

4. **트랜잭션 다이얼로그**
   - [ ] 수입/지출 토글이 작동하는가
   - [ ] 카테고리 선택이 작동하는가
   - [ ] 금액 입력 후 저장이 되는가
   - [ ] 저장 후 잔액이 업데이트되는가

5. **예산 설정 다이얼로그**
   - [ ] 부모만 접근할 수 있는가
   - [ ] 예산 수정 후 저장이 되는가

6. **Dashboard 연결**
   - [ ] "가계부" 버튼 클릭 시 가계부 페이지로 이동하는가
