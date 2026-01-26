# 가족 체크리스트 & 가계부 앱 - 프로젝트 요약

## 프로젝트 개요

부모와 자녀가 함께 사용하는 가족 체크리스트와 가계부 관리 앱입니다.

- **목표**: 자녀의 습관 형성 돕기 + 예산 관리 능력 키우기
- **주요 기능**: 데일리 체크리스트, 일정 관리, 가계부(수입/지출력)
- **사용자 역할**: 부모(parent), 자녀(child)

---

## 기술 스택

### 프론트엔드
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI 기반)

### 백엔드
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Netlify

---

## 데이터베이스 구조

### 1. users 컬렉션
사용자 계정 정보
```typescript
{
  email: string,
  role: "parent" | "child",
  familyId: string,
  createdAt: string
}
```

### 2. checklists 컬렉션
데일리 체크리스트 데이터 (문서 ID: YYYY-MM-DD)
```typescript
{
  [userId]: {
    userId: string,
    date: string,
    items: ChecklistItem[],
    events: Event[],
    dailyExpense: number,
    totalReward: number
  }
}
```

### 3. households 컬렉션
가계부 설정 (문서 ID: familyId)
```typescript
{
  familyId: string,
  monthlyBudget: number,    // 월 예산
  fixedExpense: number,     // 고정지출
  initialBalance: number,   // 시작 잔액
  currentBalance: number    // 현재 잔액
}
```

### 4. transactions 컬렉션
가계부 수입/지출 내역
```typescript
{
  id: string,
  familyId: string,
  userId: string,
  date: string,             // YYYY-MM-DD
  type: "income" | "expense",
  category: Category,       // food, cafe, transport, shopping, bills, allowance, etc
  amount: number,
  memo: string,
  createdAt: string         // ISO timestamp
}
```

---

## 주요 기능 및 동작 원리

### 1. 인증 시스템

**파일**: `contexts/AuthContext.tsx`

- Firebase Auth로 이메일/비밀번호 로그인
- 회원가입 시 역할(parent/child) 선택
- familyId 생성:
  - parent: `user.uid`
  - child: `family-${user.uid.slice(0, 8)}`

### 2. 체크리스트 시스템

**Hook**: `hooks/useChecklist.ts`

#### 데이터 로드
- `checklists/{YYYY-MM-DD}` 문서 구독 (실시간 동기화)
- 사용자별 체크리스트 항목 불러오기

#### 초기 데이터 생성
```typescript
[
  { id: "1", title: "7시 전 기상", reward: 5000 },
  { id: "2", title: "8시 전 나가기", reward: 5000 },
  { id: "3", title: "모든 약속은 미리 소통하고 결정하기", reward: 5000 },
  { id: "4", title: "반말 안하기, 말 예쁘게 하기", reward: 5000 }
]
```

#### 보상 시스템
- 항목 완료 시 `reward` 금액 획득
- 완료된 항목들의 reward 합계 = `todayReward`
- 다음 날 잔고에 반영 (설정에서 조정 가능)

### 3. 가계부 시스템

**Hook**: `hooks/useLedger.ts`

#### 카테고리
```typescript
{
  food: { label: "식비", emoji: "🍎" },
  cafe: { label: "카페", emoji: "☕" },
  transport: { label: "교통", emoji: "🚌" },
  shopping: { label: "쇼핑", emoji: "🛍️" },
  bills: { label: "공과금/월세", emoji: "🏠" },
  allowance: { label: "용돈", emoji: "💰" },
  etc: { label: "기타", emoji: "📦" }
}
```

#### 트랜잭션 추가 흐름
1. 사용자가 수입/지출 입력
2. `transactions` 컬렉션에 문서 추가
3. `households.currentBalance` 실시간 업데이트:
   - 수입: `currentBalance + amount`
   - 지출: `currentBalance - amount`

#### 잔액 계산 로직
```typescript
// 초기 설정
currentBalance = initialBalance

// 트랜잭션 추가 시
if (type === "income") {
  currentBalance += amount
} else {
  currentBalance -= amount
}
```

### 4. 자동 동기화

#### 가계부 → 대시보드 소비금액
- `useChecklist`가 `transactions` 컬렉션 구독
- 오늘 날짜 + type="expense" 필터링
- 합계를 `dailyExpense`로 계산

#### 가계부 잔액 → 대시보드 잔고
- `useCurrentBalance`가 `households` 컬렉션 구독
- `currentBalance` 실시간 표시

---

## 파일 구조

```
components/
├── auth/
│   └── LoginForm.tsx          # 로그인 폼
├── dashboard/
│   ├── Dashboard.tsx          # 메인 대시보드
│   ├── TodayChecklist.tsx     # 오늘의 체크리스트
│   ├── DailySummary.tsx       # 요약 카드
│   ├── MiniCalendar.tsx       # 미니 달력
│   ├── TodayEvents.tsx        # 오늘의 일정
│   └── DailyExpense.tsx       # 오늘의 소비금액
├── ledger/
│   ├── LedgerPage.tsx         # 가계부 메인 페이지
│   ├── TransactionDialog.tsx  # 수입/지출 입력 다이얼로그
│   ├── BudgetSettingsDialog.tsx # 예산 설정 다이얼로그
│   └── tabs/
│       ├── HomeTab.tsx        # 홈 (요약)
│       ├── HistoryTab.tsx     # 기록 (내역)
│       └── StatsTab.tsx       # 통계
└── settings/
    └── SettingsPage.tsx       # 설정 페이지

hooks/
├── useAuth.ts                 # 인증 Hook
├── useChecklist.ts            # 체크리스트 Hook
├── useLedger.ts               # 가계부 Hook
└── useCurrentBalance.ts       # 잔액 Hook

lib/
├── firebase.ts                # Firebase 초기화
├── types.ts                   # TypeScript 타입 정의
└── utils.ts                   # 유틸리티 함수
```

---

## Firebase 설정

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 인증 required
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }

    // 같은 familyId만 접근 가능
    match /checklists/{date} {
      allow read, write: if request.auth != null;
    }

    match /households/{familyId} {
      allow read, write: if request.auth != null;
    }

    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 필수 인덱스
transactions 컬렉션 복합 인덱스:
- `familyId` (Ascending)
- `date` (Descending)
- `createdAt` (Descending)

---

## 환경 변수

```env
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 배포

1. **빌드**: `npm run build`
2. **배포**: GitHub push → Netlify 자동 배포
3. **URL**: https://family-checklist.netlify.app

---

## 개발 참고 사항

### 실시간 데이터 동기화
모든 데이터는 `onSnapshot`으로 실시간 구독하여 자동 업데이트됩니다.

### 에러 핸들링 주요 이슈
1. **빈 households 문서**: 초기화 로직으로 자동 생성
2. **null safety**: `ledger?.field ?? 0` 패턴 사용
3. **트랜잭션 일관성**: Firestore 트랜잭션 고려 (현재 미사용)

### 추후 개발 아이디어
- [ ] 월별 보고서
- [ ] 예산 알림
- [ ] 카테고리별 예산 설정
- [ ] 수입/지출 차트
- [ ] 가족 멤버별 지출 비교
- [ ] 용돈 자동 지급 기능
