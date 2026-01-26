"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getDateKey } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Calendar, Wallet } from "lucide-react";
import { ChecklistItem, Event } from "@/lib/types";

interface DateDetailDialogProps {
  date: Date | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DateDetailDialog({ date, open, onOpenChange }: DateDetailDialogProps) {
  const { currentUser } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [dailyExpense, setDailyExpense] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date || !currentUser || !open) return;

    const fetchDateData = async () => {
      setLoading(true);
      const dateKey = getDateKey(date);

      try {
        const checklistRef = doc(db, "checklists", dateKey);
        const docSnap = await getDoc(checklistRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const userData = data[currentUser.uid];
          if (userData) {
            setChecklist(userData.items || []);
            setEvents(userData.events || []);
            setDailyExpense(userData.dailyExpense || 0);
          }
        } else {
          // 데이터가 없으면 초기화
          setChecklist([]);
          setEvents([]);
          setDailyExpense(0);
        }
      } catch (error) {
        console.error("날짜 데이터 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDateData();
  }, [date, currentUser, open]);

  const totalReward = checklist
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.reward, 0);

  const formatDate = date ? date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{formatDate}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="space-y-4">
            {/* 체크리스트 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>📋 체크리스트</span>
                  <Badge variant="secondary">
                    +₩{totalReward.toLocaleString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checklist.length > 0 ? (
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded border"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="flex-1">{item.title}</span>
                        <Badge variant={item.completed ? "default" : "secondary"}>
                          +₩{item.reward.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    체크리스트가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 일정 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  일정
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-2 rounded border"
                      >
                        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">{event.title}</div>
                          {event.description && (
                            <p className="text-sm text-gray-500">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    일정이 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 소비금액 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  소비금액
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₩{dailyExpense.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
