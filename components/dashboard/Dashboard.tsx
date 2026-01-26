"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBalance } from "@/hooks/useCurrentBalance";
import { Button } from "@/components/ui/button";
import { TodayChecklist } from "./TodayChecklist";
import { MiniCalendar } from "./MiniCalendar";
import { DailySummary } from "./DailySummary";
import { TodayEvents } from "./TodayEvents";
import { DailyExpense } from "./DailyExpense";
import { SettingsPage } from "../settings/SettingsPage";
import { LogOut, Settings } from "lucide-react";

export function Dashboard() {
  const { userData, logout } = useAuth();
  const { currentBalance, pendingReward, loading: balanceLoading } = useCurrentBalance();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  // 설정 페이지가 열리면 설정 페이지를 표시
  if (showSettings) {
    return <SettingsPage onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-xl font-bold">🏠 가족 체크리스트</h1>
              {userData && (
                <span className="text-xs sm:text-sm text-gray-500">
                  ({userData.role === "parent" ? "부모" : "자녀"})
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* 잔고 정보 - 한줄 표시 */}
              <div className="text-sm flex items-center flex-wrap gap-1 sm:gap-2">
                <span className="text-gray-500">잔고:</span>
                <span className="font-bold text-green-600">
                  {balanceLoading ? "로딩 중..." : `₩${currentBalance.toLocaleString()}`}
                </span>
                {pendingReward > 0 && (
                  <>
                    <span className="text-gray-500">내일:</span>
                    <span className="font-bold text-blue-600">+₩{pendingReward.toLocaleString()}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {userData?.role === "parent" && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSettings(true)}
                    className="relative group"
                  >
                    <Settings className="w-5 h-5" />
                    {/* 툴팁 */}
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      설정
                    </span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLogout}
                  className="relative group"
                >
                  <LogOut className="w-5 h-5" />
                  {/* 툴팁 */}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    로그아웃
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 오늘의 체크리스트 + 요약 */}
          <div className="lg:col-span-2 space-y-6">
            <TodayChecklist />
            <DailySummary />
          </div>

          {/* 오른쪽: 달력 + 일정 + 소비 */}
          <div className="space-y-6">
            <MiniCalendar />
            <TodayEvents />
            <DailyExpense />
          </div>
        </div>
      </main>
    </div>
  );
}
