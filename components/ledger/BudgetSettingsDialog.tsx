"use client";

import { useState, useEffect } from "react";
import { useLedger } from "@/hooks/useLedger";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetSettingsDialog({ open, onOpenChange }: BudgetSettingsDialogProps) {
  const { ledger, updateBudget } = useLedger();
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [fixedExpense, setFixedExpense] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  // 다이얼로그 열릴 때 현재 값 로드
  useEffect(() => {
    if (open && ledger) {
      setMonthlyBudget(ledger.monthlyBudget.toString());
      setFixedExpense(ledger.fixedExpense.toString());
      setInitialBalance(ledger.initialBalance.toString());
    }
  }, [open, ledger]);

  const handleSubmit = async () => {
    if (!ledger) return;

    await updateBudget({
      monthlyBudget: Number(monthlyBudget),
      fixedExpense: Number(fixedExpense),
      initialBalance: Number(initialBalance),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>예산 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="monthly-budget">월 예산</Label>
            <Input
              id="monthly-budget"
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fixed-expense">고정지출</Label>
            <Input
              id="fixed-expense"
              type="number"
              value={fixedExpense}
              onChange={(e) => setFixedExpense(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="initial-balance">시작 잔액</Label>
            <Input
              id="initial-balance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
