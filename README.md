# 가족 체크리스트 (Family Checklist App)

자녀의 생활습관 개선과 경제적 소비습관 향상을 위한 가족용 체크리스트 앱입니다. 일일 체크리스트 완료 보상 시스템과 가계부 기능을 통해 자녀에게 자기관리 능력과 금전 감각을 길러줍니다.

## 기능

### 📋 일일 체크리스트
- 자녀가 매일 수행해야 할 생활 습관 체크리스트 관리
- 부모가 사용자 정의 체크리스트 항목 추가/수정/삭제
- 체크리스트 완료율에 따른 보상금 자동 지급

### 💰 보상 및 잔고 시스템
- 체크리스트 완료에 따른 일일 보상금 지급
- 현재 잔고 및 다음 지급 예상금액 표시
- 보상금은 다음 날 잔고로 자동 동기화

### 📊 가계부
- 수입/지출 내역 기록 및 조회
- 월별 예산 설정 및 관리
- 카테고리별 지출 통계

### 📅 캘린더
- 미니 캘린더를 통한 날짜별 체크리스트 조회
- 일정 관리 기능

### 👨‍👩‍👧‍👦 역할별 기능
- **부모 역할**: 체크리스트 관리, 보상 설정, 예산 설정, 일정 관리
- **자녀 역할**: 체크리스트 완료, 가계부 조회, 일정 확인

## 기술 스택

- **프레임워크**: [Next.js](https://nextjs.org) 16.1.4
- **프론트엔드**: React 19.2.3
- **언어**: TypeScript 5
- **스타일링**: Tailwind CSS 4
- **백엔드/데이터베이스**: Firebase (Authentication, Firestore)
- **UI 컴포넌트**: Radix UI
- **아이콘**: Lucide React
- **날짜 처리**: date-fns, react-day-picker

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 Firebase 설정을 추가하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 앱을 확인할 수 있습니다.

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm run start
```

### 린트

```bash
npm run lint
```

## 프로젝트 구조

```
family-checklist-app/
├── app/
│   ├── api/              # API 라우트
│   ├── ledger/           # 가계부 페이지
│   ├── layout.tsx        # 루트 레이아웃
│   └── page.tsx          # 메인 페이지
├── components/
│   ├── auth/             # 인증 관련 컴포넌트
│   ├── dashboard/        # 대시보드 컴포넌트
│   ├── ledger/           # 가계부 컴포넌트
│   ├── settings/         # 설정 컴포넌트
│   └── ui/               # UI 기본 컴포넌트
├── contexts/             # React Context
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티 함수
└── public/               # 정적 파일
```

## 주요 기능 사용법

### 로그인

- Firebase 인증을 사용하여 로그인합니다.
- 이메일/비밀번호 또는 소셜 로그인 지원

### 체크리스트 관리 (부모)

1. 대시보드에서 "체크리스트" 섹션 확인
2. 체크리스트 추가/수정/삭제 가능
3. 각 항목별 보상금 설정 가능

### 체크리스트 완료 (자녀)

1. 오늘의 체크리스트 항목들을 체크
2. 완료율에 따라 보상금이 계산됨
3. 완료한 체크리스트는 다음 날 자동으로 잔고에 반영

### 가계부 사용

1. `/ledger` 페이지에서 접속
2. 수입/지출 내역 추가
3. 예산 설정 및 지출 통계 확인

## 배포

[Vercel](https://vercel.com)를 사용하여 배포하는 것을 추천합니다.

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 배포

## 라이선스

이 프로젝트는 개인/가족 사용을 위해 만들어졌습니다.
