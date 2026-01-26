import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Date 객체를 로컬 타임존 기준 YYYY-MM-DD 형식으로 변환
 * toISOString()은 UTC를 기준으로 하므로 한국 시간(UTC+9)과 차이가 발생
 */
export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 오늘 날짜의 키를 반환
 */
export function getTodayKey(): string {
  return getDateKey(new Date());
}
