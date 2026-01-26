"use client";

import { useState } from "react";
import { useLedger } from "@/hooks/useLedger";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category } from "@/lib/types";
import { CATEGORIES } from "@/hooks/useLedger";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDialog({ open, onOpenChange }: TransactionDialogProps) {
  const { addTransaction } = useLedger();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<Category>("food");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = async () => {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) return;

    await addTransaction({
      date,
      type,
      category,
      amount: amountNum,
      memo,
    });

    // 초기화
    setAmount("");
    setMemo("");
    setDate(new Date().toISOString().split("T")[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>내역 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 구분 선택 */}
          <div>
            <Label>구분</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={type === "income" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("income")}
              >
                수입
              </Button>
              <Button
                type="button"
                variant={type === "expense" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("expense")}
              >
                지출
              </Button>
            </div>
          </div>

          {/* 카테고리 선택 */}
          {type === "expense" && (
            <div>
              <Label>카테고리</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([key, cat]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={category === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(key)}
                    className="flex flex-col gap-1 h-auto py-2"
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-xs">{cat.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 금액 입력 */}
          <div>
            <Label htmlFor="amount">금액</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* 날짜 선택 */}
          <div>
            <Label htmlFor="date">날짜</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* 메모 입력 */}
          <div>
            <Label htmlFor="memo">메모 (선택)</Label>
            <Input
              id="memo"
              placeholder="간단한 내용"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* 저장 버튼 */}
          <Button className="w-full" onClick={handleSubmit}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
