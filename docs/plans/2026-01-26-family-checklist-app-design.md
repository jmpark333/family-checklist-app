# 가족 생활습관 체크리스트 앱 - 디자인 문서

**날짜:** 2026-01-26
**목적:** 자녀의 생활습관 개선과 경제적 소비습관 향상을 위한 가족용 웹 앱

## 1. 아키텍처 개요

### 기술 스택
- **프론트엔드:** Next.js 15 (App Router) + shadcn/ui + TypeScript
- **백엔드:** Firebase (Authentication + Firestore)
- **배포:** Netlify

### 데이터 모델 (Firestore)
```
users/{userId}
  - email, role (parent/child), familyId

families/{familyId}
  - settings: { resetDay: 1, checklistItems: [...] }

checklists/{date}
  - {userId}: {
      items: [
        { id, title, reward, completed: boolean }
      ],
      dailyExpense: number,
      events: [
        { id, title, datetime, description, priority }
      ],
      totalReward: number  // 자동 계산
    }
  }

transactions/{transactionId}
  - { userId, date, amount, type: 'earning'|'expense', description }
```

## 2. 주요 컴포넌트 구조

### 메인 페이지 레이아웃
```
┌─────────────────────────────────────┐
│  헤더: 로고 | 총 보유 금액 | 로그아웃  │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌───────────────┐  │
│  │   오늘의    │ │   미니 달력    │  │
│  │ 체크리스트  │ │  (월 이동)     │  │
│  │             │ │               │  │
│  │  (부모만    │ │  날짜 클릭→   │  │
│  │   체크 가능)│ │  상세 팝업    │  │
│  └─────────────┘ └───────────────┘  │
│                                    │
│  이번 달 누적 보상금: ₩25,000      │
│  금주 달성률: 85% (4/5 완료)       │
│                                    │
│  오늘의 일정                        │
│  ┌──────────────────────────────┐ │
│  │ [중요] 학교 3시 끝            │ │
│  │ [보통] 피아노 레슨 5시        │ │
│  └──────────────────────────────┘ │
│                                    │
│  오늘의 소비금액: ₩0               │
│  [+] 추가하기 (자녀만)              │
└─────────────────────────────────────┘
```

### shadcn/ui 주요 컴포넌트
- `Calendar` - 미니 달력
- `Dialog` - 날짜 클릭 시 상세 팝업
- `Card` - 각 섹션 구분
- `Button` - 체크리스트 토글, 입력 버튼
- `Badge` - 중요도 표시
- `Progress` - 금주 달성률

## 3. 핵심 기능 흐름

### 체크리스트 완료 처리
```
부모가 체크리스트 항목 클릭
    ↓
Firestore: checklists/{date}/{userId}.items[].completed = true
    ↓
클라이언트: completed=true인 항목의 reward 합산
    ↓
Firestore: totalReward 업데이트
    ↓
UI: 실시간 금액 반영 (Firestore onSnapshot)
```

### 월간 정산 vs 총 누적 분리
- **이번 달 보상금:** checklists에서 해당 월의 completed 항목만 합산
- **총 보유 금액:** transactions 컬렉션에서 type='earning'인 모든 항목 합산
- **정산 시점:** 매월 1일 00시에 전월 데이터를 transactions로 이관 (Firebase Cloud Functions)

### 권한 분기
```
로그인 → user.role 확인
    ├─ parent: 모든 권한
    └─ child:
        ├─ 체크리스트: 조회만 (disabled 표시)
        ├─ 소비금액: 입력/수정 가능
        └─ 일정: 입력/수정 가능
```

## 4. 에러 처리

| 상황 | 처리 방식 |
|------|-----------|
| 네트워크 오류 | toast로 "일시적으로 연결할 수 없습니다" 표시, 오프라인 시 로컬 상태 유지 |
| 인증 실패 | "이메일 또는 비밀번호를 확인해주세요" |
| 권한 없음 | child가 부모 전용 기능 접근 시 "권한이 없습니다" |
| 데이터 로딩 | skeleton UI로 로딩 상태 표시 |
| 로그인 안 함 | 모든 데이터가 "로그인이 필요합니다" 메시지 |

## 5. 추가 기능

### 필수 기능
1. **달력 날짜 팝업:** 날짜 클릭 → Dialog로 해당 날짜의 체크리스트, 소비, 일정 표시
2. **반응형:** 모바일 1단, 태블릿 2단, 데스크탑 3단 레이아웃
3. **다크모드:** shadcn/ui 기본 다크모드 지원

### 추천 기능 (자녀 동기부여)
1. **달성 스티커:** 7일 연속 달성 시 귀여운 스티커/배지
2. **월간 리포트:** 달성률 그래프, 월별 보상 추이
3. **알림:** 자녀가 일정 등록 시 부모에게 푸시 알림 (Firebase Cloud Messaging)

## 6. Firebase 설정 가이드

### 1. Firebase 프로젝트 생성
```bash
# https://console.firebase.google.com 접속
# 새 프로젝트 생성: "family-checklist"
```

### 2. Authentication 설정
```
Build → Authentication → Get started
Sign-in method → Email/Password 활성화
```

### 3. Firestore 설정
```
Build → Firestore Database → Create database
Production mode → Start in test mode
```

### 4. Firestore 보안 규칙
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /families/{familyId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. 환경 변수 설정 (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 6. Netlify 배포
```bash
npm run build
netlify deploy --prod
```

## 7. 초기 체크리스트 예시

| 항목 | 보상금 |
|------|--------|
| 7시 전 기상 | +5,000원 |
| 8시 전 나가기 | +5,000원 |
| 모든 약속은 미리 소통하고 결정하기 | +5,000원 |
| 반말 안하기, 말 예쁘게 하기 | +5,000원 |
