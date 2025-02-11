"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/loading";

const AnimatedBackground = dynamic(
  () => import("@/components/AnimatedBackground"),
  { ssr: false }
);

const ResetPasswordForm = dynamic(
  () => import("@/components/auth/ResetPasswordForm"),
  {
    ssr: false,
    loading: () => <LoadingSpinner />
  }
);

export default function ResetPassword() {
  return (
    <main className="min-h-screen relative">
      <Suspense fallback={<LoadingSpinner />}>
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

