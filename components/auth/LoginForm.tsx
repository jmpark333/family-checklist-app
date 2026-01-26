"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState<"parent" | "child">("parent");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        // 자녀 회원가입 시 부모 이메일 필수 확인
        if (role === "child" && !parentEmail) {
          setError("자녀 가입 시 부모 이메일이 필요합니다.");
          setLoading(false);
          return;
        }
        await signup(email, password, role, parentEmail);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("이메일 또는 비밀번호를 확인해주세요.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else if (err.code === "auth/weak-password") {
        setError("비밀번호는 6자 이상이어야 합니다.");
      } else {
        setError(err.message || "오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🏠 가족 체크리스트</CardTitle>
          <CardDescription>
            {isSignup ? "가족과 함께 시작하세요" : "로그인하여 시작하세요"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {isSignup && (
              <div className="space-y-2">
                <Label>역할</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={role === "parent" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => {
                      setRole("parent");
                      setParentEmail(""); // 역할 변경 시 부모 이메일 초기화
                    }}
                    disabled={loading}
                  >
                    👨‍👩‍👧 부모
                  </Button>
                  <Button
                    type="button"
                    variant={role === "child" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setRole("child")}
                    disabled={loading}
                  >
                    👦 자녀
                  </Button>
                </div>
              </div>
            )}

            {isSignup && role === "child" && (
              <div className="space-y-2">
                <Label htmlFor="parentEmail">부모 이메일</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  placeholder="부모님 이메일을 입력하세요"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  부모님의 이메일을 입력하면 가족 계정에 연결됩니다
                </p>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "처리 중..." : isSignup ? "가입하기" : "로그인"}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                }}
                className="text-blue-600 hover:underline"
                disabled={loading}
              >
                {isSignup ? "이미 계정이 있나요? 로그인" : "계정이 없나요? 가입하기"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
