import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { Event } from "../lib/types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 일정 데이터
const eventsData: Record<string, Event[]> = {
  "2025-01-30": [
    {
      id: "event-1",
      title: "SMART 영어 집중과정 1차 강의 마감",
      datetime: "2025-01-30T23:59:00",
      description: "",
      priority: "high",
    },
  ],
  "2025-02-03": [
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
      title: "본등록금 납부 기간 (2월 3일~5일)",
      datetime: "2025-02-03T09:00:00",
      description: "2월 5일까지 납부",
      priority: "high",
    },
  ],
  "2025-02-05": [
    {
      id: "event-5",
      title: "본등록금 납부 마감 및 1차 수강신청 시작",
      datetime: "2025-02-05T17:00:00",
      description: "",
      priority: "high",
    },
    {
      id: "event-6",
      title: "1차 수강신청 기간 (2월 5일~9일)",
      datetime: "2025-02-05T09:00:00",
      description: "2월 9일까지",
      priority: "high",
    },
  ],
  "2025-02-09": [
    {
      id: "event-7",
      title: "1차 수강신청 마감",
      datetime: "2025-02-09T17:00:00",
      description: "",
      priority: "high",
    },
  ],
  "2025-02-12": [
    {
      id: "event-8",
      title: "1차 수강신청 확정 결과 조회",
      datetime: "2025-02-12T10:00:00",
      description: "",
      priority: "high",
    },
  ],
  "2025-02-23": [
    {
      id: "event-9",
      title: "입학식 및 신입생 환영회",
      datetime: "2025-02-23T10:00:00",
      description: "",
      priority: "high",
    },
  ],
  "2025-02-24": [
    {
      id: "event-10",
      title: "신체검사 (2월 24일~26일)",
      datetime: "2025-02-24T09:00:00",
      description: "26일까지",
      priority: "medium",
    },
  ],
  "2025-02-25": [
    {
      id: "event-11",
      title: "신입생 오리엔테이션 (2월 25일~26일)",
      datetime: "2025-02-25T09:00:00",
      description: "26일까지",
      priority: "medium",
    },
  ],
  "2025-03-03": [
    {
      id: "event-12",
      title: "개강일",
      datetime: "2025-03-03T09:00:00",
      description: "첫 수업",
      priority: "high",
    },
  ],
  "2025-03-31": [
    {
      id: "event-13",
      title: "영어 교양필수 이수면제 신청 마감",
      datetime: "2025-03-31T17:00:00",
      description: "",
      priority: "medium",
    },
  ],
};

// Firestore에 일정 추가 (테스트용 사용자 ID 필요)
async function addEventsToFirestore(userId: string) {
  for (const [dateKey, events] of Object.entries(eventsData)) {
    try {
      const docRef = doc(db, "checklists", dateKey);
      await setDoc(
        docRef,
        {
          [userId]: {
            items: [],
            events: events,
            dailyExpense: 0,
            totalReward: 0,
          },
        },
        { merge: true }
      );
      console.log(`Added events for ${dateKey}`);
    } catch (error) {
      console.error(`Error adding events for ${dateKey}:`, error);
    }
  }
  console.log("All events added successfully!");
}

// 실행 (사용자 ID 필요)
const userId = process.env.USER_ID || "test-user-id";
addEventsToFirestore(userId);
