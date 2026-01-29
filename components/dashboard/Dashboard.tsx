"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBalance } from "@/hooks/useCurrentBalance";
import { useLedger } from "@/hooks/useLedger";
import { Button } from "@/components/ui/button";
import { TodayChecklist } from "./TodayChecklist";
import { MiniCalendar } from "./MiniCalendar";
import { DailySummary } from "./DailySummary";
import { TodayEvents } from "./TodayEvents";
import { DailyExpense } from "./DailyExpense";
import { SettingsPage } from "../settings/SettingsPage";
import { MotivationPopup } from "../auth/MotivationPopup";
import { LogOut, Settings } from "lucide-react";

// 개발 모드에서만 마이그레이션 함수 로드
if (process.env.NODE_ENV === "development") {
  import("@/lib/migrateFamily").then(() => {
    console.log("%c[마이그레이션] migrateFamily 함수가 준비되었습니다.", "color: green; font-weight: bold");
    console.log("사용법: await migrateFamily('rg327024@gmail.com', 'parkseun06@gmail.com')");
  });
}

export function Dashboard() {
  const { userData, logout } = useAuth();
  const { currentBalance, pendingReward, loading: balanceLoading } = useCurrentBalance();
  const { syncYesterdayReward, ledger: householdLedger, loading: ledgerLoading } = useLedger();
  const [showSettings, setShowSettings] = useState(false);
  const [synced, setSynced] = useState(false);

  // 앱 로드 시 어제의 보상금을 잔고에 동기화
  // ledger가 로드된 후에 실행되어야 함
  useEffect(() => {
    if (!ledgerLoading && householdLedger && !synced) {
      syncYesterdayReward();
      setSynced(true);
    }
  }, [ledgerLoading, householdLedger, synced, syncYesterdayReward]);

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
      {userData?.role === "child" && <MotivationPopup />}
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
              <div className="text-base sm:text-lg flex items-center flex-wrap gap-1 sm:gap-2">
                <span className="text-gray-500">잔고:</span>
                <span className="font-bold text-green-600 text-xl sm:text-2xl">
                  {balanceLoading ? "로딩 중..." : `₩${currentBalance.toLocaleString()}`}
                </span>
                {pendingReward > 0 && (
                  <>
                    <span className="text-gray-500">내일:</span>
                    <span className="font-bold text-blue-600 text-lg sm:text-xl">+₩{pendingReward.toLocaleString()}</span>
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
