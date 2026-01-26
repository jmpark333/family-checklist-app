# 부모-자녀 데이터 동기화 설계

## 개요

부모와 자녀가 체크리스트, 보상, 일정, 가계부, 소비금액 등 모든 데이터를 실시간으로 공유하는 기능 구현

## 대상 계정

- 부모: rg327024@gmail.com
- 자녀: parkseun06@gmail.com

## 요구사항

1. **공유 체크리스트**: 부모와 자녀가 동일한 체크리스트 사용, 완료 상태 공유
2. **가족 공통 보상**: 누적 보상금이 가족 단위로 누적
3. **소비금액 즉시 반영**: 자녀 입력이 즉시 transactions에 추가
4. **공유 캘린더**: 모든 일정을 하나의 캘린더에 표시
5. **내일 적립금 표시**: 자녀 계정으로 로그인해도 "내일 적립 금액" 표시

## 핵심 아키텍처 변경

### 문제점

현재 부모와 자녀가 다른 `familyId`를 가지고 있어 데이터를 공유할 수 없음:
- 부모: `familyId = user.uid`
- 자녀: `familyId = family-${user.uid.slice(0, 8)}`

### 해결 방안

#### 1. Family ID 통합

- **마스터 familyId**: 부모의 uid를 마스터 familyId로 사용
- **마이그레이션**: 자녀 계정의 familyId를 부모의 uid로 변경
- **향후 회원가입**: 자녀는 부모 이메일 입력 후 부모의 familyId를 물려받음

#### 2. 데이터 구조 변경

**기존 (userId 기반)**:
```typescript
// checklists/{YYYY-MM-DD}
{
  [userId]: {
    items: ChecklistItem[],
    events: Event[],
    ...
  }
}
```

**변경 (familyId 기반)**:
```typescript
// checklists/{YYYY-MM-DD}
{
  [familyId]: {
    items: ChecklistItem[],
    events: Event[],
    ...
  }
}
```

## 구현 계획

### Phase 1: 마이그레이션 스크립트

**파일**: `app/api/migrate-family/route.ts`

**작업**:
1. 두 이메일로 사용자 찾기 (`rg327024@gmail.com`, `parkseun06@gmail.com`)
2. 부모의 uid를 마스터 familyId로 결정
3. users 컬렉션: 자녀의 familyId를 마스터로 변경
4. transactions 컬렉션: 자녀의 familyId를 마스터로 변경
5. households 컬렉션: 두 데이터 병합
   - 예산, 고정지출: 부모 데이터 사용
   - 잔고: 두 데이터 중 더 큰 값 사용
6. checklists 컬렉션: 부모 데이터 보존, 자녀 데이터 백업 후 삭제

### Phase 2: AuthContext 변경

**파일**: `contexts/AuthContext.tsx`

**변경사항**:
```typescript
// 자녀 회원가입 시 부모 이메일 필수 입력
const familyId = role === "parent"
  ? user.uid  // 부모: 새 familyId 생성
  : await getParentFamilyId(parentEmail);  // 자녀: 부모의 familyId 사용
```

### Phase 3: useChecklist Hook 변경

**파일**: `hooks/useChecklist.ts`

**변경사항**:
- `currentUser.uid` → `familyId`로 데이터 읽기/쓰기
- 모든 업데이트 로직에서 userId를 familyId로 변경

### Phase 4: DailyExpense 컴포넌트 변경

**파일**: `components/dashboard/DailyExpense.tsx`

**변경사항**:
- 소비금액 입력 시 `checklists.dailyExpense` 업데이트 대신
- `transactions` 컬렉션에 직접 추가

## 데이터 동기화 구조

### 실시간 공유 메커니즘

familyId만 통일되면 Firestore의 `onSnapshot`이 자동으로 실시간 동기화 처리

| 데이터 항목 | 저장 위치 | 공유 방식 |
|-----------|----------|----------|
| 체크리스트 | checklists/{date}[familyId] | 가족 공유 |
| 완료 상태 | checklists/{date}[familyId].items | 가족 공유 |
| 누적 보상 | checklists/{date}[familyId].totalReward | 가족 공유 |
| 일정/이벤트 | checklists/{date}[familyId].events | 가족 공유 |
| 소비금액 | transactions (familyId 기반) | 가족 공유 |
| 가계부 잔액 | households/{familyId} | 가족 공유 |

### 사용자 경험

**부모 계정**:
- 체크리스트 항목 토글 가능
- 설정 페이지 접근 가능
- 모든 데이터 실시간 확인

**자녀 계정**:
- 체크리스트 항목 토글 가능
- 대시보드에서 "내일 적립 금액" 확인
- 소비금액 입력 시 즉시 반영
- 모든 데이터 부모와 동기화

## 회원가입 플로우

### 부모 회원가입

1. 이메일/비밀번호 입력
2. 역할: "부모" 선택
3. Firebase Auth 생성
4. familyId = user.uid (새 가족 생성)

### 자녀 회원가입 (변경)

1. 이메일/비밀번호 입력
2. **부모 이메일 필수 입력**
3. 역할: "자녀" 선택
4. Firebase Auth 생성
5. 부모 이메일로 familyId 조회
6. familyId = 부모의 familyId (기존 가족 참여)

## 보안 고려사항

### Firestore Security Rules (업데이트 필요)

```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

match /households/{familyId} {
  allow read: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId == familyId;
  allow write: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId == familyId
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "parent";
}

match /transactions/{transactionId} {
  allow read: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId == resource.data.familyId;
  allow create: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId == request.resource.data.familyId;
}
```

## 테스트 계획

1. 마이그레이션 스크립트 실행 후 두 계정의 familyId 확인
2. 부모 계정: 체크리스트 항목 토글 → 자녀 계정에서 반영 확인
3. 자녀 계정: 소비금액 입력 → 부모 계정 가계부에서 확인
4. 일정 추가: 양쪽 계정에서 공유 확인
5. "내일 적립 금액": 자녀 계정에서도 표시 확인

## 롤백 계획

마이그레이션 전 데이터 백업:
- users 컬렉션 전체 백업
- transactions 컬렉션 전체 백업
- households 컬렉션 전체 백업
- checklists 컬렉션 전체 백업
