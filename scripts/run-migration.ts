/**
 * Family ID Migration Script
 *
 * 이 스크립트는 부모(rg327024@gmail.com)와 자녀(parkseun06@gmail.com) 계정의
 * familyId를 통합하여 데이터 동기화를 가능하게 합니다.
 *
 * 실행 방법:
 * 1. 프로젝트 루트에서 `npm run dev`로 개발 서버 실행
 * 2. 브라우저에서 마이그레이션 페이지 열기
 * 3. 또는 curl로 API 직접 호출
 */

const PARENT_EMAIL = "rg327024@gmail.com";
const CHILD_EMAIL = "parkseun06@gmail.com";

// API 호출 예시 (curl)
const curlCommand = `curl -X POST http://localhost:3000/api/migrate-family \\
  -H "Content-Type: application/json" \\
  -d '{
    "parentEmail": "${PARENT_EMAIL}",
    "childEmail": "${CHILD_EMAIL}"
  }'`;

console.log("=== Family ID Migration ===");
console.log("\n마이그레이션 API 호출 명령어:");
console.log(curlCommand);
console.log("\n또는 브라우저 개발자 콘솔에서 실행:");
console.log(`
fetch('/api/migrate-family', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    parentEmail: "${PARENT_EMAIL}",
    childEmail: "${CHILD_EMAIL}"
  })
}).then(r => r.json()).then(console.log);
`);

export {};
