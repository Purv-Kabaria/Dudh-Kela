"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const AnimatedBackground = dynamic(
  () => import("@/components/AnimatedBackground"),
  { ssr: false }
);

const ResetPasswordForm = dynamic(
  () => import("@/components/auth/ResetPasswordForm"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-md mx-auto animate-pulse">
        <div className="bg-white/10 dark:bg-black/10 rounded-2xl h-[400px]"></div>
      </div>
    ),
  }
);

export default function ResetPassword() {
  return (
    <main className="min-h-screen relative">
      <Suspense>
        <div className="absolute inset-0">
          <AnimatedBackground />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <ResetPasswordForm />
        </div>
      </Suspense>
    </main>
  );
}

