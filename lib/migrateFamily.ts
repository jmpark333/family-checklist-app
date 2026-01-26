/**
 * Client-side Family Migration Utility
 *
 * 브라우저 개발자 콘솔에서 직접 실행하여 familyId를 통합합니다.
 *
 * 사용 방법:
 * 1. 부모 계정으로 로그인 (rg327024@gmail.com)
 * 2. 브라우저 개발자 콘솔(F12)에서 다음 실행:
 *
 * import { migrateFamily } from './lib/migrateFamily';
 * await migrateFamily("rg327024@gmail.com", "parkseun06@gmail.com");
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";

export async function migrateFamily(parentEmail: string, childEmail: string) {
  try {
    console.log("=== Family Migration Started ===");

    // 1. 두 사용자 찾기
    const usersRef = collection(db, "users");
    const parentQuery = query(usersRef, where("email", "==", parentEmail));
    const childQuery = query(usersRef, where("email", "==", childEmail));

    const [parentSnap, childSnap] = await Promise.all([
      getDocs(parentQuery),
      getDocs(childQuery)
    ]);

    if (parentSnap.empty) {
      throw new Error(`부모 계정을 찾을 수 없습니다: ${parentEmail}`);
    }

    if (childSnap.empty) {
      throw new Error(`자녀 계정을 찾을 수 없습니다: ${childEmail}`);
    }

    const parentDoc = parentSnap.docs[0];
    const childDoc = childSnap.docs[0];

    const parentUid = parentDoc.id;
    const childUid = childDoc.id;
    const masterFamilyId = parentUid; // 부모의 uid를 마스터 familyId로 사용
    const oldChildFamilyId = childDoc.data().familyId;

    console.log("부모 UID:", parentUid);
    console.log("자녀 UID:", childUid);
    console.log("마스터 FamilyID:", masterFamilyId);
    console.log("자녀 기존 FamilyID:", oldChildFamilyId);

    const results: any = {
      parentUid,
      childUid,
      masterFamilyId,
      oldChildFamilyId,
      updates: {}
    };

    // 2. 자녀의 familyId를 마스터로 변경
    await updateDoc(doc(db, "users", childUid), { familyId: masterFamilyId });
    results.updates.users = "완료";
    console.log("✓ users 컬렉션 업데이트 완료");

    // 3. transactions 컬렉션: 자녀의 familyId를 마스터로 변경
    const transactionsRef = collection(db, "transactions");
    const transactionsQuery = query(transactionsRef, where("familyId", "==", oldChildFamilyId));
    const transactionsSnap = await getDocs(transactionsQuery);

    if (!transactionsSnap.empty) {
      const batch = writeBatch(db);
      transactionsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { familyId: masterFamilyId });
      });
      await batch.commit();
      results.updates.transactions = `${transactionsSnap.size}개 문서 업데이트`;
      console.log(`✓ transactions 컬렉션 ${transactionsSnap.size}개 업데이트 완료`);
    } else {
      results.updates.transactions = "업데이트할 문서 없음";
      console.log("○ transactions 컬렉션: 업데이트할 문서 없음");
    }

    // 4. households 컬렉션: 두 데이터 병합
    const parentHouseholdRef = doc(db, "households", masterFamilyId);
    const childHouseholdRef = doc(db, "households", oldChildFamilyId);

    const [parentHouseholdSnap, childHouseholdSnap] = await Promise.all([
      getDoc(parentHouseholdRef),
      getDoc(childHouseholdRef)
    ]);

    if (parentHouseholdSnap.exists() && childHouseholdSnap.exists()) {
      const parentLedger = parentHouseholdSnap.data();
      const childLedger = childHouseholdSnap.data();

      // 잔고: 두 데이터 중 더 큰 값
      const maxBalance = Math.max(
        parentLedger.currentBalance ?? 0,
        childLedger.currentBalance ?? 0
      );

      await updateDoc(parentHouseholdRef, {
        currentBalance: maxBalance
      });

      results.updates.households = `병합 완료 (잔고: ${maxBalance})`;
      console.log(`✓ households 컬렉션 병합 완료 (잔고: ${maxBalance})`);
    } else if (parentHouseholdSnap.exists()) {
      results.updates.households = "부모 household만 존재 (병합 불필요)";
      console.log("○ households 컬렉션: 부모 household만 존재");
    } else if (childHouseholdSnap.exists()) {
      // 부모 household가 없고 자녀만 있는 경우: 자녀를 복사해서 부모 생성
      const childLedger = childHouseholdSnap.data();
      await setDoc(parentHouseholdRef, {
        ...childLedger,
        familyId: masterFamilyId
      });
      results.updates.households = "자녀 household를 부모로 복사";
      console.log("✓ households 컬렉션: 자녀 household를 부모로 복사");
    } else {
      results.updates.households = "두 household 모두 없음";
      console.log("○ households 컬렉션: 두 household 모두 없음");
    }

    // 5. checklists 컬렉션: 부모 데이터 보존 (구조 변경 후 familyId 기반으로 접근)
    results.updates.checklists = "부모 데이터 보존 (구조 변경 후 familyId 기반으로 접근)";
    console.log("○ checklists 컬렉션: 부모 데이터 보존");

    console.log("=== Migration Complete ===");
    console.log("결과:", results);

    alert("마이그레이션이 완료되었습니다! 자녀 계정으로 로그인하여 데이터 동기화를 확인하세요.");
    return results;

  } catch (error: any) {
    console.error("마이그레이션 오류:", error);
    alert(`마이그레이션 실패: ${error.message}`);
    throw error;
  }
}

// 전역 함수로 등록 (개발자 콘솔에서 바로 호출 가능)
if (typeof window !== "undefined") {
  (window as any).migrateFamily = migrateFamily;
  console.log("migrateFamily 함수가 전역에 등록되었습니다.");
  console.log("사용법: await migrateFamily('rg327024@gmail.com', 'parkseun06@gmail.com')");
}
