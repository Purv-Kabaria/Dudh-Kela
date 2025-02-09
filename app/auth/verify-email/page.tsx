"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const email = searchParams.get("email");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user?.emailVerified) {
        try {
          // Get the stored form data from localStorage
          const storedData = localStorage.getItem('signupFormData');
          if (storedData) {
            const formData = JSON.parse(storedData);
            const db = getFirestore();
            
            // Check if user document already exists
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (!userDoc.exists()) {
              // Save user data to Firestore only if it doesn't exist
              await setDoc(doc(db, "users", user.uid), {
                ...formData,
                email: user.email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              
              // Clear stored data after successful save
              localStorage.removeItem('signupFormData');
            }
          }
          
          // Redirect to home
          router.push("/");
        } catch (error) {
          console.error("Error saving user data:", error);
          setError("Failed to complete signup. Please try again.");
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (resendDisabled) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setResendDisabled(false);
            clearInterval(timer);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendDisabled]);

  const handleResendEmail = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Force refresh the current user
      await auth.currentUser?.reload();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError("Please sign in again to resend verification email");
        return;
      }

      // Check if already verified
      if (currentUser.emailVerified) {
        router.push("/");
        return;
      }
      
      await sendEmailVerification(currentUser, {
        url: `${window.location.origin}/verify`,  // Add redirect URL
      });
      
      setResendDisabled(true);
      setCountdown(60);
    } catch (err) {
      console.error("Error sending verification:", err);
      if (err instanceof Error && err.message.includes('too-many-requests')) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to resend verification email. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="container relative flex items-center justify-center min-h-screen py-8">
        <Card className="max-w-md w-full mx-auto border-0 shadow-xl bg-background/95 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Verify your email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              We've sent a verification email to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Click the link in the email to verify your account. If you don't see it,
              check your spam folder.
            </p>

            <div className="space-y-2">
              <Button
                className="w-full h-11"
                onClick={handleResendEmail}
                disabled={loading || resendDisabled}
              >
                {resendDisabled
                  ? `Resend email in ${countdown}s`
                  : loading
                  ? "Sending..."
                  : "Resend verification email"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 