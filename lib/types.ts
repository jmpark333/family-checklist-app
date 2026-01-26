// 사용자 역할
export type UserRole = "parent" | "child";

// 체크리스트 항목
export interface ChecklistItem {
  id: string;
  title: string;
  reward: number;
  completed: boolean;
}

// 일정 이벤트
export interface Event {
  id: string;
  title: string;
  datetime: string; // ISO datetime
  description: string;
  priority: "high" | "medium" | "low";
}

// 일일 체크리스트 데이터
export interface DailyChecklist {
  userId: string;
  date: string; // YYYY-MM-DD
  items: ChecklistItem[];
  dailyExpense: number;
  events: Event[];
  totalReward: number;
}

// 사용자 데이터
export interface UserData {
  email: string;
  role: UserRole;
  familyId: string;
  createdAt: string;
}

// 가족 설정
export interface FamilySettings {
  checklistItems: Omit<ChecklistItem, "completed">[];
  resetDay: number; // 1-31 (월간 정산일)
}

// 트랜잭션
export interface Transaction {
  userId: string;
  date: string;
  amount: number;
  type: "earning" | "expense";
  description: string;
  createdAt: string;
}
