"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getTodayKey } from "@/lib/utils";
import { LedgerTransaction } from "@/lib/types";
import { CATEGORIES } from "@/hooks/useLedger";
import { Trash2 } from "lucide-react";

interface TodayExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TodayExpenseDialog({ open, onOpenChange }: TodayExpenseDialogProps) {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const familyId = userData?.familyId;

  useEffect(() => {
    if (!open || !familyId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const todayKey = getTodayKey();

    const q = query(
      collection(db, "transactions"),
      where("familyId", "==", familyId),
      where("date", "==", todayKey),
      where("type", "==", "expense"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LedgerTransaction[];
      setTransactions(txs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [open, familyId]);

  const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💸 오늘의 지출 내역</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            오늘 지출 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {/* 합계 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">총 지출</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₩{totalExpense.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 지출 내역 */}
            <div className="space-y-2">
              {transactions.map((tx) => {
                const category = CATEGORIES[tx.category];
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="text-2xl">{category.emoji}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{category.label}</div>
                      {tx.memo && <div className="text-xs text-gray-500">{tx.memo}</div>}
                      <div className="text-xs text-gray-400">{formatTime(tx.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        -₩{tx.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
