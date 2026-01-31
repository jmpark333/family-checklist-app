"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "@/hooks/useChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Pencil, Trash2, Plus } from "lucide-react";

export function TodayChecklist() {
  const { userData } = useAuth();
  const { checklist, todayReward, loading, toggleItem, updateItem, deleteItem, addItem } = useChecklist();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingReward, setEditingReward] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemReward, setNewItemReward] = useState("5000");

  const isParent = userData?.role === "parent";

  const handleStartEdit = (itemId: string, currentTitle: string, currentReward: number) => {
    setEditingItemId(itemId);
    setEditingTitle(currentTitle);
    setEditingReward(currentReward.toString());
  };

  const handleSaveEdit = async () => {
    if (editingItemId) {
      const newReward = parseInt(editingReward, 10);
      if (!isNaN(newReward) && newReward >= 0 && editingTitle.trim()) {
        await updateItem(editingItemId, {
          title: editingTitle.trim(),
          reward: newReward,
        });
      }
    }
    setEditingItemId(null);
    setEditingTitle("");
    setEditingReward("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingItemId(null);
      setEditingTitle("");
      setEditingReward("");
    }
  };

  const handleAddItem = async () => {
    const reward = parseInt(newItemReward, 10);
    if (newItemTitle.trim() && !isNaN(reward) && reward >= 0) {
      await addItem(newItemTitle.trim(), reward);
      setNewItemTitle("");
      setNewItemReward("5000");
      setShowAddForm(false);
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddItem();
    } else if (e.key === "Escape") {
      setShowAddForm(false);
      setNewItemTitle("");
      setNewItemReward("5000");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📋 <span className="hidden sm:inline">오늘의 체크리스트</span><span className="sm:hidden">Checklist</span></span>
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
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                  item.completed
                    ? "bg-green-50 border-green-500 dark:bg-green-900/20"
                    : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                }`}
              >
                 {/* 체크리스트 항목 버튼 */}
                 {isParent && editingItemId === item.id ? (
                   <div className="flex-1 flex items-center gap-4">
                     <div className="flex-shrink-0">
                       <Circle className="w-6 h-6 text-gray-400" />
                     </div>
                     <Input
                       value={editingTitle}
                       onChange={(e) => setEditingTitle(e.target.value)}
                       onBlur={handleSaveEdit}
                       onKeyDown={handleKeyDown}
                       className="flex-1 h-8 text-sm"
                       autoFocus
                     />
                   </div>
                 ) : (
                   <button
                     onClick={() => toggleItem(item.id)}
                     disabled={!isParent}
                     className="flex-1 flex items-center gap-4 text-left"
                   >
                     <div className="flex-shrink-0">
                       {item.completed ? (
                         <CheckCircle2 className="w-6 h-6 text-green-500" />
                       ) : (
                         <Circle className={`w-6 h-6 ${isParent ? "text-gray-400" : "text-gray-300"}`} />
                       )}
                     </div>
                     <div className="font-medium">{item.title}</div>
                   </button>
                 )}

                  {/* 보상금 표시/편집 */}
                  {isParent && editingItemId === item.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editingReward}
                        onChange={(e) => setEditingReward(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDown}
                        className="w-24 h-8 text-sm"
                        min="0"
                      />
                      <span className="text-sm text-gray-500">원</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                 ) : (
                   <div
                     className={`flex items-center gap-2 ${isParent ? "cursor-pointer hover:opacity-80" : ""}`}
                     onClick={() => isParent && handleStartEdit(item.id, item.title, item.reward)}
                     title={isParent ? "클릭하여 편집" : ""}
                   >
                     <Badge
                       variant={item.completed ? "default" : "secondary"}
                       className={item.completed ? "bg-green-500" : ""}
                     >
                       +₩{item.reward.toLocaleString()}
                     </Badge>
                     {isParent && <Pencil className="w-3 h-3 text-gray-400" />}
                   </div>
                 )}
              </div>
             ))}
             {isParent && (
               <div className="pt-3 border-t">
                 {showAddForm ? (
                   <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                     <Input
                       value={newItemTitle}
                       onChange={(e) => setNewItemTitle(e.target.value)}
                       onKeyDown={handleAddKeyDown}
                       placeholder="새 항목"
                       className="flex-1 h-8"
                       autoFocus
                     />
                     <Input
                       type="number"
                       value={newItemReward}
                       onChange={(e) => setNewItemReward(e.target.value)}
                       onKeyDown={handleAddKeyDown}
                       placeholder="보상"
                       className="w-20 h-8"
                       min="0"
                     />
                     <Button size="sm" onClick={handleAddItem} className="h-8">
                       추가
                     </Button>
                     <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="h-8">
                       취소
                     </Button>
                   </div>
                 ) : (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setShowAddForm(true)}
                     className="w-full"
                   >
                     <Plus className="w-4 h-4 mr-2" />
                     항목 추가
                   </Button>
                 )}
               </div>
             )}
           </div>
         )}
         {!isParent && (
           <p className="text-sm text-gray-500 mt-4 text-center">
             체크리스트는 부모님이 확인해주세요
           </p>
         )}
         {isParent && (
           <p className="text-xs text-gray-400 mt-2 text-center">
             체크리스트는 부모님이 입력합니다.
           </p>
         )}
       </CardContent>
     </Card>
   );
 }
