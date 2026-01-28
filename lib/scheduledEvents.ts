import { Event } from "./types";

// 고정 일정 데이터 (2026년)
export const SCHEDULED_EVENTS: Event[] = [
  {
    id: "event-1",
    title: "SMART 영어 집중과정 1차 강의 마감",
    datetime: "2026-01-30T23:59:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-2",
    title: "본등록금 고지서 출력 시작",
    datetime: "2026-02-03T00:00:00",
    description: "",
    priority: "medium",
  },
  {
    id: "event-3",
    title: "장학금 증명 서류 제출 마감",
    datetime: "2026-02-03T17:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-4",
    title: "본등록금 납부 기간",
    datetime: "2026-02-03T09:00:00",
    description: "2월 3일~5일",
    priority: "high",
  },
  {
    id: "event-5",
    title: "본등록금 납부 마감",
    datetime: "2026-02-05T17:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-6",
    title: "1차 수강신청 기간",
    datetime: "2026-02-05T09:00:00",
    description: "2월 5일~9일",
    priority: "high",
  },
  {
    id: "event-7",
    title: "1차 수강신청 마감",
    datetime: "2026-02-09T17:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-8",
    title: "1차 수강신청 확정 결과 조회",
    datetime: "2026-02-12T10:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-9",
    title: "입학식 및 신입생 환영회",
    datetime: "2026-02-23T10:00:00",
    description: "",
    priority: "high",
  },
  {
    id: "event-10",
    title: "신체검사",
    datetime: "2026-02-24T09:00:00",
    description: "2월 24일~26일",
    priority: "medium",
  },
  {
    id: "event-11",
    title: "신입생 오리엔테이션",
    datetime: "2026-02-25T09:00:00",
    description: "2월 25일~26일",
    priority: "medium",
  },
  {
    id: "event-12",
    title: "개강일",
    datetime: "2026-03-03T09:00:00",
    description: "첫 수업",
    priority: "high",
  },
  {
    id: "event-13",
    title: "영어 교양필수 이수면제 신청 마감",
    datetime: "2026-03-31T17:00:00",
    description: "",
    priority: "medium",
  },
];

// 날짜에 해당하는 일정 가져오기
export function getEventsForDate(date: Date): Event[] {
  // 로컬 시간대 기준으로 YYYY-MM-DD 형식 생성
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  return SCHEDULED_EVENTS.filter((event) => {
    const eventDate = event.datetime.split("T")[0];
    return eventDate === dateStr;
  });
}

// 2026년 대한민국 공휴일
const HOLIDAYS_2026: { [key: string]: string } = {
  "1-1": "신정",
  "2-15": "설날 연휴",
  "2-16": "설날",
  "2-17": "설날 연휴",
  "2-18": "설날 연휴",
  "3-1": "삼일절",
  "5-5": "어린이날",
  "5-24": "부처님오신날",
  "6-6": "현충일",
  "8-15": "광복절",
  "9-23": "추석 연휴",
  "9-24": "추석",
  "9-25": "추석 연휴",
  "9-26": "추석 연휴",
  "10-3": "개천절",
  "10-9": "한글날",
  "12-25": "크리스마스",
};

// 공휴일 여부 확인
export function isHoliday(date: Date): boolean {
  const day = date.getDay();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();

  if (year !== 2026) return false;

  const key = `${month}-${dayOfMonth}`;
  return day === 0 || key in HOLIDAYS_2026;
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
