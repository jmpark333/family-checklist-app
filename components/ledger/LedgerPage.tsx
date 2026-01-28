"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useLedger } from "@/hooks/useLedger";
import { HomeTab } from "./tabs/HomeTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { StatsTab } from "./tabs/StatsTab";
import { TransactionDialog } from "./TransactionDialog";
import { BudgetSettingsDialog } from "./BudgetSettingsDialog";
import { useAuth } from "@/contexts/AuthContext";

type TabType = "home" | "history" | "stats";

export function LedgerPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const {
    loading
  } = useLedger();

  const isParent = userData?.role === "parent";

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatDateKey = () => `${selectedYear}년 ${selectedMonth}월`;

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">💰 가계부</h1>
          </div>
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

      {/* 월 선택 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{formatDateKey()}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="max-w-md mx-auto px-4 py-6">
        {activeTab === "home" && <HomeTab year={selectedYear} month={selectedMonth} />}
        {activeTab === "history" && <HistoryTab year={selectedYear} month={selectedMonth} />}
        {activeTab === "stats" && <StatsTab year={selectedYear} month={selectedMonth} />}
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
