"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "@/hooks/useChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Edit2, Trash2 } from "lucide-react";
import { Event } from "@/lib/types";

const priorityLabels = {
  high: "중요",
  medium: "보통",
  low: "선택",
};

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-blue-500",
  low: "bg-gray-500",
};

export function TodayEvents() {
  const { userData } = useAuth();
  const { events, addEvent, updateEvent, deleteEvent } = useChecklist();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  // 일정 수정 열기
  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    // datetime-local 형식에 맞게 변환 (YYYY-MM-DDTHH:mm)
    const date = new Date(event.datetime);
    const localDatetime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDatetime(localDatetime);
    setDescription(event.description);
    setPriority(event.priority);
    setIsDialogOpen(true);
  };

  // 일정 삭제
  const handleDelete = async (eventId: string) => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    await deleteEvent(eventId);
  };

  const handleSubmit = async () => {
    if (!title || !datetime) return;

    const eventData = {
      title,
      datetime: new Date(datetime).toISOString(),
      description,
      priority,
    };

    if (editingEvent) {
      // 수정 모드
      await updateEvent(editingEvent.id, eventData);
    } else {
      // 추가 모드
      await addEvent(eventData);
    }

    // 폼 초기화
    handleClose();
  };

  const handleClose = () => {
    setEditingEvent(null);
    setTitle("");
    setDatetime("");
    setDescription("");
    setPriority("medium");
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📅 오늘의 일정</span>
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditingEvent(null)}>
                <Plus className="w-4 h-4" />
                추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEvent ? "일정 수정" : "일정 추가"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="event-title">제목</Label>
                  <Input
                    id="event-title"
                    placeholder="일정 제목"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="event-datetime">날짜/시간</Label>
                  <Input
                    id="event-datetime"
                    type="datetime-local"
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="event-description">내용</Label>
                  <Input
                    id="event-description"
                    placeholder="간단한 내용"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label>중요도</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={priority === "high" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setPriority("high")}
                    >
                      중요
                    </Button>
                    <Button
                      type="button"
                      variant={priority === "medium" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setPriority("medium")}
                    >
                      보통
                    </Button>
                    <Button
                      type="button"
                      variant={priority === "low" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setPriority("low")}
                    >
                      선택
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleSubmit}>
                    {editingEvent ? "수정" : "저장"}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleClose}>
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group"
            >
              <div className="flex-shrink-0">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{event.title}</span>
                  <Badge className={`text-xs ${priorityColors[event.priority]}`}>
                    {priorityLabels[event.priority]}
                  </Badge>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-500 truncate">
                    {event.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(event)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(event.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              오늘의 일정이 없습니다
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
