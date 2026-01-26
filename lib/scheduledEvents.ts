import { Event } from "./types";

// 고정 일정 데이터 (2025년)
export const SCHEDULED_EVENTS: Event[] = [
  {
    id: "event-1",
    title: "SMART 영어 집중과정 1차 강의 마감",
    datetime: "2025-01-30T23:59:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-2",
    title: "본등록금 고지서 출력 시작",
    datetime: "2025-02-03T00:00:00",
    description: "",
    priority: "medium",
  },
  {
    id: "event-3",
    title: "장학금 증명 서류 제출 마감",
    datetime: "2025-02-03T17:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-4",
    title: "본등록금 납부 기간",
    datetime: "2025-02-03T09:00:00",
    description: "2월 3일~5일",
    priority: "high",
  },
  {
    id: "event-5",
    title: "본등록금 납부 마감",
    datetime: "2025-02-05T17:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-6",
    title: "1차 수강신청 기간",
    datetime: "2025-02-05T09:00:00",
    description: "2월 5일~9일",
    priority: "high",
  },
  {
    id: "event-7",
    title: "1차 수강신청 마감",
    datetime: "2025-02-09T17:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-8",
    title: "1차 수강신청 확정 결과 조회",
    datetime: "2025-02-12T10:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-9",
    title: "입학식 및 신입생 환영회",
    datetime: "2025-02-23T10:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-10",
    title: "신체검사",
    datetime: "2025-02-24T09:00:00",
    description: "2월 24일~26일",
    priority: "medium",
  },
  {
    id: "event-11",
    title: "신입생 오리엔테이션",
    datetime: "2025-02-25T09:00:00",
    description: "2월 25일~26일",
    priority: "medium",
  },
  {
    id: "event-12",
    title: "개강일",
    datetime: "2025-03-03T09:00:00",
    description: "첫 수업",
    priority: "high",
  },
  {
    id: "event-13",
    title: "영어 교양필수 이수면제 신청 마감",
    datetime: "2025-03-31T17:00:00",
    description: "",
    priority: "medium",
  },
];

// 날짜에 해당하는 일정 가져오기
export function getEventsForDate(date: Date): Event[] {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return SCHEDULED_EVENTS.filter((event) => {
    const eventDate = event.datetime.split("T")[0];
    return eventDate === dateStr;
  });
}

// 월에 해당하는 일정이 있는 날짜들 가져오기
export function getEventDaysForMonth(year: number, month: number): Set<number> {
  const days = new Set<number>();
  SCHEDULED_EVENTS.forEach((event) => {
    const eventDate = new Date(event.datetime);
    if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
      days.add(eventDate.getDate());
    }
  });
  return days;
}
