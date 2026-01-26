"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDateKey } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface DailyRewardData {
  date: string;
  totalReward: number;
  items: Array<{ title: string; reward: number; completed: boolean }>;
}

interface MonthlyRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonthlyRewardDialog({ open, onOpenChange }: MonthlyRewardDialogProps) {
  const { userData } = useAuth();
  const [dailyRewards, setDailyRewards] = useState<DailyRewardData[]>([]);
  const [loading, setLoading] = useState(true);

  const familyId = userData?.familyId;

  useEffect(() => {
    if (!open || !familyId) {
      setDailyRewards([]);
      setLoading(false);
      return;
    }

    const fetchMonthlyData = async () => {
      setLoading(true);

      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const dayOfMonth = today.getDate();

        const dateKeys: string[] = [];
        for (let day = dayOfMonth; day >= 1; day--) {
          const date = new Date(year, month, day);
          dateKeys.push(getDateKey(date));
        }

        const promises = dateKeys.map(async (dateKey) => {
          const checklistRef = doc(db, "checklists", dateKey);
          const docSnap = await getDoc(checklistRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const familyData = data[familyId];
            if (familyData?.items) {
              const completedItems = familyData.items.filter((item: any) => item.completed);
              const totalReward = completedItems.reduce((sum: number, item: any) => sum + item.reward, 0);

              return {
                date: dateKey,
                totalReward,
                items: completedItems,
              };
            }
          }
          return null;
        });

        const results = await Promise.all(promises);
        const filteredResults = results.filter((r): r is DailyRewardData => r !== null && r.totalReward > 0);

        setDailyRewards(filteredResults);
      } catch (error) {
        console.error("월간 보상 내역 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [open, familyId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day} (${weekday})`;
  };

  const totalMonthlyReward = dailyRewards.reduce((sum, day) => sum + day.totalReward, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📊 이번 달 보상 내역</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : dailyRewards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            이번 달 보상 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {/* 합계 */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">총 보상금</span>
                <span className="text-2xl font-bold text-green-600">
                  ₩{totalMonthlyReward.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 일별 내역 */}
            <div className="space-y-3">
              {dailyRewards.map((dayData) => (
                <div key={dayData.date} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{formatDate(dayData.date)}</span>
                    <Badge variant="secondary" className="text-green-600">
                      +₩{dayData.totalReward.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {dayData.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="flex-1">{item.title}</span>
                        <span className="text-gray-500">+₩{item.reward.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
