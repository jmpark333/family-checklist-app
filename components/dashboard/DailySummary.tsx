"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMonthlyReward } from "@/hooks/useMonthlyReward";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";

export function DailySummary() {
  const { monthlyReward, loading: monthlyLoading } = useMonthlyReward();
  const { progress, completed, total, loading: weeklyLoading } = useWeeklyProgress();

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 이번 달 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">이번 달 누적 보상금</span>
            <span className="font-bold text-lg text-green-600">
              {monthlyLoading ? (
                "로딩 중..."
              ) : (
                `₩${monthlyReward.toLocaleString()}`
              )}
            </span>
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
  );
}
