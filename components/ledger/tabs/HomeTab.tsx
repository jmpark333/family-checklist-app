"use client";

import { useState } from "react";
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
              {recentExpenses.map((expense) => {
                const cat = expense.category;
                const catLabel = {
                  food: "🍎 식비",
                  cafe: "☕ 카페",
                  transport: "🚌 교통",
                  shopping: "🛍️ 쇼핑",
                  bills: "🏠 공과금/월세",
                  allowance: "💰 용돈",
                  etc: "📦 기타",
                }[cat] || "📦 기타";
                return (
                  <div
                    key={expense.id}
                    className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {expense.memo || catLabel}
                      </p>
                      <p className="text-xs text-gray-500">{expense.date}</p>
                    </div>
                    <span className="font-medium">
                      -₩{expense.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
