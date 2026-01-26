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

// 카테고리 타입
export type Category = "food" | "cafe" | "transport" | "shopping" | "bills" | "allowance" | "etc";

// 가계부 트랜잭션 타입 (수입/지출 내역)
export interface LedgerTransaction {
  id: string;
  familyId: string;
  userId: string;           // 기록한 사람
  date: string;             // YYYY-MM-DD
  type: "income" | "expense";
  category: Category;
  amount: number;
  memo: string;
  createdAt: string;        // ISO timestamp
}

// 가계부 설정
export interface HouseholdLedger {
  familyId: string;
  monthlyBudget: number;    // 월 예산
  fixedExpense: number;     // 고정지출
  initialBalance: number;   // 시작 잔액
  currentBalance: number;   // 현재 잔액 (실시간 계산)
}

// 트랜잭션 (기존 호환성 유지)
export interface Transaction {
  userId: string;
  date: string;
  amount: number;
  type: "earning" | "expense";
  description: string;
  createdAt: string;
}
