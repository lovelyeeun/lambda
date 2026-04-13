"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * /folders/[folderId] 직접 접근 시 → /folders 로 리다이렉트
 * (폴더 목록은 이제 /folders 메인에 통합됨)
 */
export default function FolderRedirectPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/folders"); }, [router]);
  return <div className="h-full" />;
}
