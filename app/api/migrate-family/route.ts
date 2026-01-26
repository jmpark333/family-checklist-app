import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, setDoc, writeBatch, initializeFirestore } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase Admin SDK가 필요하지 않으므로 클라이언트 SDK 사용
// 이 API는 인증된 사용자만 호출해야 함
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const { parentEmail, childEmail } = await request.json();

    if (!parentEmail || !childEmail) {
      return NextResponse.json(
        { error: "parentEmail과 childEmail이 필요합니다" },
        { status: 400 }
      );
    }

    // 1. 두 사용자 찾기
    const usersRef = collection(db, "users");
    const parentQuery = query(usersRef, where("email", "==", parentEmail));
    const childQuery = query(usersRef, where("email", "==", childEmail));

    const [parentSnap, childSnap] = await Promise.all([
      getDocs(parentQuery),
      getDocs(childQuery)
    ]);

    if (parentSnap.empty) {
      return NextResponse.json(
        { error: `부모 계정을 찾을 수 없습니다: ${parentEmail}` },
        { status: 404 }
      );
    }

    if (childSnap.empty) {
      return NextResponse.json(
        { error: `자녀 계정을 찾을 수 없습니다: ${childEmail}` },
        { status: 404 }
      );
    }

    const parentDoc = parentSnap.docs[0];
    const childDoc = childSnap.docs[0];

    const parentData = parentDoc.data();
    const childData = childDoc.data();

    const parentUid = parentDoc.id;
    const childUid = childDoc.id;
    const masterFamilyId = parentUid; // 부모의 uid를 마스터 familyId로 사용
    const oldChildFamilyId = childData.familyId;

    console.log("=== 마이그레이션 시작 ===");
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
    } else {
      results.updates.transactions = "업데이트할 문서 없음";
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

      // 부모 데이터 사용 (예산, 고정지출), 잔고만 더 큰 값으로
      await updateDoc(parentHouseholdRef, {
        currentBalance: maxBalance
      });

      // 자녀 household 삭제 (데이터 병합 완료)
      // 삭제하지 않고 백업용으로 유지하거나 필요 시 삭제

      results.updates.households = `병합 완료 (잔고: ${maxBalance})`;
    } else if (parentHouseholdSnap.exists()) {
      results.updates.households = "부모 household만 존재 (병합 불필요)";
    } else if (childHouseholdSnap.exists()) {
      // 부모 household가 없고 자녀만 있는 경우: 자녀를 복사해서 부모 생성
      const childLedger = childHouseholdSnap.data();
      await setDoc(parentHouseholdRef, {
        ...childLedger,
        familyId: masterFamilyId
      });
      results.updates.households = "자녀 household를 부모로 복사";
    } else {
      results.updates.households = "두 household 모두 없음";
    }

    // 5. checklists 컬렉션: 부모 데이터 보존 (변경 불필요)
    // 이미 familyId 기반으로 변경 예정이므로 마이그레이션 시점에서는 데이터 보존만 확인
    results.updates.checklists = "부모 데이터 보존 (구조 변경 후 familyId 기반으로 접근)";

    console.log("=== 마이그레이션 완료 ===");
    console.log("결과:", JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      message: "마이그레이션이 완료되었습니다",
      results
    });

  } catch (error) {
    console.error("마이그레이션 오류:", error);
    return NextResponse.json(
      {
        error: "마이그레이션 실패",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
