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
              ₩{monthlyExpense.toLocaleString()} / ₩{(ledger?.monthlyBudget ?? 0).toLocaleString()}
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
                const percentage = monthlyExpense > 0
                  ? Math.round((amount / monthlyExpense) * 100)
                  : 0;

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
