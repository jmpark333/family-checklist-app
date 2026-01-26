"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "@/hooks/useChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

export function TodayChecklist() {
  const { userData } = useAuth();
  const { checklist, todayReward, loading, toggleItem } = useChecklist();

  const isParent = userData?.role === "parent";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📋 오늘의 체크리스트</span>
          <Badge variant="secondary" className="text-lg">
            +₩{todayReward.toLocaleString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : (
          <div className="space-y-3">
            {checklist.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                disabled={!isParent}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                  item.completed
                    ? "bg-green-50 border-green-500 dark:bg-green-900/20"
                    : isParent
                    ? "bg-white border-gray-200 hover:border-blue-300 dark:bg-gray-800 dark:border-gray-700"
                    : "bg-gray-50 border-gray-200 cursor-not-allowed dark:bg-gray-800/50"
                }`}
              >
                <div className="flex-shrink-0">
                  {item.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.title}</div>
                </div>
                <Badge
                  variant={item.completed ? "default" : "secondary"}
                  className={item.completed ? "bg-green-500" : ""}
                >
                  +₩{item.reward.toLocaleString()}
                </Badge>
              </button>
            ))}
          </div>
        )}
        {!isParent && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            체크리스트는 부모님이 확인해주세요
          </p>
        )}
      </CardContent>
    </Card>
  );
}
