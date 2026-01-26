"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateDetailDialog } from "@/components/calendar/DateDetailDialog";

// 고정 일정 데이터 (2025년)
const SCHEDULED_EVENTS = [
  { month: 0, day: 30, title: "SMART 영어 집중과정 1차 강의 마감" }, // 1월 30일
  { month: 1, day: 3, title: "본등록금 고지서 출력 시작" },
  { month: 1, day: 3, title: "장학금 증명 서류 제출 마감" },
  { month: 1, day: 3, title: "본등록금 납부 시작" },
  { month: 1, day: 5, title: "본등록금 납부 마감" },
  { month: 1, day: 5, title: "1차 수강신청 시작" },
  { month: 1, day: 9, title: "1차 수강신청 마감" },
  { month: 1, day: 12, title: "1차 수강신청 확정 결과 조회" },
  { month: 1, day: 23, title: "입학식 및 신입생 환영회" },
  { month: 1, day: 24, title: "신체검사 시작" },
  { month: 1, day: 25, title: "신입생 오리엔테이션 시작" },
  { month: 2, day: 3, title: "개강일" },
  { month: 2, day: 31, title: "영어 교양필수 이수면제 신청 마감" },
];

export function MiniCalendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 현재 월의 일정이 있는 날짜들을 계산
  const eventDays = useMemo(() => {
    const days = new Set<number>();
    SCHEDULED_EVENTS.forEach((event) => {
      if (event.month === currentMonth.getMonth()) {
        days.add(event.day);
      }
    });
    return days;
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
        <CardContent className="pt-0">
          <Calendar
            mode="single"
            month={currentMonth}
            selected={date}
            onSelect={handleSelectDate}
            className="rounded-md border w-full"
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
                const hasEvent = eventDays.has(day.date.getDate());
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
