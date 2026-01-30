"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash2 } from "lucide-react";
import { ChecklistItem } from "@/lib/types";

interface SettingsPageProps {
  onClose: () => void;
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const { currentUser, userData } = useAuth();
  const [checklistItems, setChecklistItems] = useState<Omit<ChecklistItem, "completed">[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [saving, setSaving] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemReward, setNewItemReward] = useState(5000);

  const isParent = userData?.role === "parent";

  useEffect(() => {
    if (!currentUser || !isParent) return;

    const fetchSettings = async () => {
      try {
        // 사용자 문서에서 현재 잔고 가져오기
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setCurrentBalance(data.currentBalance || 0);
        }

        // 가족 설정에서 체크리스트 항목 가져오기
        const familyId = userData?.familyId;
        if (familyId) {
          const familyRef = doc(db, "families", familyId);
          const familySnap = await getDoc(familyRef);

          if (familySnap.exists()) {
            const familyData = familySnap.data();
            if (familyData.checklistItems) {
              setChecklistItems(familyData.checklistItems);
            } else {
              // 기본 항목 설정
              const defaultItems = [
                { id: "1", title: "7시 전 기상", reward: 5000 },
                { id: "2", title: "8시 전 나가기", reward: 5000 },
                { id: "3", title: "모든 약속은 미리 소통하고 결정하기", reward: 5000 },
                { id: "4", title: "반말 안하기, 말 예쁘게 하기", reward: 5000 },
              ];
              setChecklistItems(defaultItems);
              await setDoc(familyRef, { checklistItems: defaultItems }, { merge: true });
            }
          }
        }
      } catch (error) {
        console.error("설정 로드 오류:", error);
      }
    };

    fetchSettings();
  }, [currentUser, userData, isParent]);

  const handleSaveBalance = async () => {
    if (!currentUser || !isParent) return;

    setSaving(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { currentBalance });
      alert("잔고가 저장되었습니다.");
    } catch (error) {
      console.error("잔고 저장 오류:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;

    const newItem: ChecklistItem & { completed: boolean } = {
      id: Date.now().toString(),
      title: newItemTitle,
      reward: newItemReward,
      completed: false,
    };

    setChecklistItems([...checklistItems, { id: newItem.id, title: newItem.title, reward: newItem.reward }]);
    setNewItemTitle("");
    setNewItemReward(5000);

    await handleSaveChecklist();
  };

  const handleRemoveItem = async (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
    await handleSaveChecklist();
  };

  const handleUpdateItemTitle = async (id: string, title: string) => {
    setChecklistItems(checklistItems.map((item) =>
      item.id === id ? { ...item, title } : item
    ));
    await handleSaveChecklist();
  };

  const handleUpdateItemReward = async (id: string, reward: number) => {
    setChecklistItems(checklistItems.map((item) =>
      item.id === id ? { ...item, reward } : item
    ));
    await handleSaveChecklist();
  };

  const handleSaveChecklist = async (showAlert: boolean = false) => {
    if (!currentUser || !isParent || saving) return;

    setSaving(true);
    try {
      const familyId = userData?.familyId;
      if (familyId) {
        const familyRef = doc(db, "families", familyId);
        await updateDoc(familyRef, { checklistItems });
        if (showAlert) {
          alert("체크리스트가 저장되었습니다.");
        }
      }
    } catch (error) {
      console.error("체크리스트 저장 오류:", error);
      if (showAlert) {
        alert("저장에 실패했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isParent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">부모만 접근할 수 있습니다.</p>
            <Button onClick={onClose} className="mt-4">
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            부모 설정
          </h1>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>

        {/* 잔고 관리 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>잔고 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="balance">현재 잔고 (₩)</Label>
                <Input
                  id="balance"
                  type="number"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(Number(e.target.value))}
                  className="text-lg"
                />
              </div>
              <Button onClick={handleSaveBalance} disabled={saving} className="w-full">
                {saving ? "저장 중..." : "잔고 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 체크리스트 관리 */}
        <Card>
          <CardHeader>
            <CardTitle>체크리스트 항목 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 기존 항목 목록 */}
              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Input
                      value={item.title}
                      onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`reward-${item.id}`} className="text-sm">₩</Label>
                      <Input
                        id={`reward-${item.id}`}
                        type="number"
                        value={item.reward}
                        onChange={(e) => handleUpdateItemReward(item.id, Number(e.target.value))}
                        className="w-24"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* 새 항목 추가 */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <Input
                    placeholder="새 항목 제목"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="보상금"
                      value={newItemReward}
                      onChange={(e) => setNewItemReward(Number(e.target.value))}
                      className="w-32"
                    />
                    <Button onClick={handleAddItem} variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      추가
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSaveChecklist(true)} disabled={saving} className="w-full">
                {saving ? "저장 중..." : "체크리스트 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
