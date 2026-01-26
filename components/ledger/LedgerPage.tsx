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
