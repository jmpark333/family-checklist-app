"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateDetailDialog } from "@/components/calendar/DateDetailDialog";
import { getEventDaysForMonth } from "@/lib/scheduledEvents";

export function MiniCalendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 현재 월의 일정이 있는 날짜들을 계산
  const eventDays = useMemo(() => {
    return getEventDaysForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  // 월 이동
  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    const newMonthValue = newMonth.getMonth() + (direction === "next" ? 1 : -1);
    newMonth.setMonth(newMonthValue);
    setCurrentMonth(newMonth);
  };

  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];

  // 날짜 선택 핸들러
  const handleSelectDate = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <div className="flex items-center justify-center gap-1 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm sm:text-base font-medium min-w-[120px] text-center">
                {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  setDate(now);
                  setCurrentMonth(now);
                }}
                className="text-xs px-3"
              >
                오늘
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pt-0">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              month={currentMonth}
              selected={date}
              onSelect={handleSelectDate}
              className="rounded-md border"
            modifiers={{
              hasEvent: (date) => eventDays.has(date.getDate()),
            }}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium hidden",
                nav: "space-x-1 flex items-center hidden",
                table: "w-full border-collapse space-y-1 mx-auto",
                head_row: "flex w-full justify-center",
                head_cell:
                  "text-muted-foreground rounded-md w-[30px] sm:w-9 flex-1 font-normal text-[0.7rem] sm:text-[0.8rem] text-center",
                row: "flex w-full mt-2 justify-center",
                cell: "h-7 w-[30px] sm:h-9 sm:w-9 p-0 text-xs sm:text-sm relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-outside)]:text-accent-foreground [&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:text-accent-foreground first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                day: "h-7 w-[30px] sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors flex items-center justify-center",
                day_range_end: "day-range-end",
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside:
                  "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            components={{
              Day: ({ day, ...props }) => {
                // 현재 월의 날짜인지 확인 (이전/다음 달의 날짜 제외)
                const isCurrentMonth = day.date.getMonth() === currentMonth.getMonth() &&
                                       day.date.getFullYear() === currentMonth.getFullYear();
                const hasEvent = isCurrentMonth && eventDays.has(day.date.getDate());
                return (
                  <div className="relative flex items-center justify-center h-7 w-[30px] sm:h-9 sm:w-9">
                    <div {...props} />
                    {hasEvent && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                    )}
                  </div>
                );
              },
            }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            📅 날짜를 클릭하면 상세 내용을 볼 수 있습니다
          </p>
        </CardContent>
      </Card>

      {/* 날짜 상세 팝업 */}
      <DateDetailDialog
        date={date}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
