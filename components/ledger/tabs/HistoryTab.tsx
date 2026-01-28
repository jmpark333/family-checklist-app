"use client";

import { useState } from "react";
import { useLedger } from "@/hooks/useLedger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { TransactionDialog } from "../TransactionDialog";
import { CATEGORIES } from "@/hooks/useLedger";
import { LedgerTransaction } from "@/lib/types";

type FilterType = "all" | "income" | "expense";

interface HistoryTabProps {
  year: number;
  month: number;
}

export function HistoryTab({ year, month }: HistoryTabProps) {
  const { deleteTransaction, getMonthlyExpenses } = useLedger();
  const [filter, setFilter] = useState<FilterType>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<LedgerTransaction | null>(null);

  const handleEdit = (transaction: LedgerTransaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deleteTransaction(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  const monthlyTransactions = getMonthlyExpenses(year, month);

  const filteredTransactions = monthlyTransactions.filter((t) => {
    if (filter === "all") return true;
    return t.type === filter;
  });

  // 날짜별 그룹화
  const groupedByDate = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.date]) {
      acc[t.date] = [];
    }
    acc[t.date].push(t);
    return acc;
  }, {} as Record<string, LedgerTransaction[]>);

  return (
    <div className="space-y-4">
      {/* 필터 버튼 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="flex-1"
            >
              전체
            </Button>
            <Button
              variant={filter === "income" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("income")}
              className="flex-1"
            >
              수입
            </Button>
            <Button
              variant={filter === "expense" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("expense")}
              className="flex-1"
            >
              지출
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 내역 리스트 */}
      {Object.keys(groupedByDate).length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 text-center py-4">
              기록된 내역이 없습니다
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByDate).map(([date, items]) => (
          <Card key={date}>
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
              <div className="space-y-2">
                {items.map((item) => {
                  const cat = CATEGORIES[item.category];
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{cat.emoji}</span>
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.memo || cat.label}
                          </p>
                          <p className="text-xs text-gray-500">{cat.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            item.type === "income"
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {item.type === "income" ? "+" : "-"}₩
                          {item.amount.toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* 플로팅 추가 버튼 */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}
