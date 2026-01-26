"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMonthlyReward } from "@/hooks/useMonthlyReward";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { MonthlyRewardDialog } from "./MonthlyRewardDialog";

export function DailySummary() {
  const { monthlyReward, loading: monthlyLoading } = useMonthlyReward();
  const { progress, completed, total, loading: weeklyLoading } = useWeeklyProgress();
  const [showRewardDialog, setShowRewardDialog] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>📊 이번 달 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">이번 달 누적 보상금</span>
              <button
                onClick={() => setShowRewardDialog(true)}
                className="font-bold text-lg text-green-600 hover:underline cursor-pointer"
              >
                {monthlyLoading ? (
                  "로딩 중..."
                ) : (
                  `₩${monthlyReward.toLocaleString()}`
                )}
              </button>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">금주 달성률</span>
              <span className="font-medium">
                {weeklyLoading ? (
                  "로딩 중..."
                ) : (
                  `${progress}% (${completed}/${total} 완료)`
                )}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>
      <MonthlyRewardDialog open={showRewardDialog} onOpenChange={setShowRewardDialog} />
    </>
  );
}
