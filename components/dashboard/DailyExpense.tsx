"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "@/hooks/useChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet } from "lucide-react";
import { TodayExpenseDialog } from "./TodayExpenseDialog";

export function DailyExpense() {
  const router = useRouter();
  const { userData } = useAuth();
  const { dailyExpense } = useChecklist();
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);

  const isChild = userData?.role === "child";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            오늘의 소비금액
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => router.push("/ledger")}
            >
              가계부
            </Button>
            {isChild && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => router.push("/ledger")}
              >
                <Plus className="w-4 h-4" />
                추가
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <button
            onClick={() => setShowExpenseDialog(true)}
            className="text-3xl font-bold text-blue-600 hover:underline cursor-pointer"
          >
            ₩{dailyExpense.toLocaleString()}
          </button>
          <p className="text-sm text-gray-500 mt-1">오늘 사용한 금액</p>
          <p className="text-xs text-gray-400 mt-2">
            💡 금액을 클릭하면 내역을 볼 수 있습니다.
          </p>
        </div>
      </CardContent>
      <TodayExpenseDialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog} />
    </Card>
  );
}
