"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "@/hooks/useChecklist";
import { useLedger } from "@/hooks/useLedger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Wallet } from "lucide-react";

export function DailyExpense() {
  const router = useRouter();
  const { userData } = useAuth();
  const { dailyExpense } = useChecklist();
  const { addTransaction } = useLedger();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputExpense, setInputExpense] = useState(0);
  const [inputMemo, setInputMemo] = useState("");

  const isChild = userData?.role === "child";

  const handleSaveExpense = async () => {
    if (inputExpense <= 0) return;

    // transactions 컬렉션에 직접 추가
    await addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      category: "etc",
      amount: inputExpense,
      memo: inputMemo || "오늘의 소비",
    });

    setInputExpense(0);
    setInputMemo("");
    setIsDialogOpen(false);
  };

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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    추가
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>소비금액 입력</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="expense-amount">금액</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      placeholder="0"
                      value={inputExpense || ""}
                      onChange={(e) => setInputExpense(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expense-memo">내용</Label>
                    <Input
                      id="expense-memo"
                      placeholder="무엇을 샀나요?"
                      value={inputMemo}
                      onChange={(e) => setInputMemo(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleSaveExpense}>
                    저장
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            ₩{dailyExpense.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500 mt-1">오늘 사용한 금액</p>
          <p className="text-xs text-gray-400 mt-2">
            오늘의 소비금액은 자녀가 입력합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
