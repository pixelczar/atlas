'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Globe, Mail } from 'lucide-react';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // TODO: Implement Firebase Google Auth
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to dashboard
    }, 1000);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement Firebase Email Auth
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#DDEEF9] px-4">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <Globe className="h-8 w-8 text-[#4863B0]" strokeWidth={1.5} />
            <h1 className="font-serif text-3xl tracking-tight text-[#1a1a1a]">
              Atlas
            </h1>
          </Link>
          <p className="mt-3 text-lg text-[#1a1a1a]/60">
            Sign in to access your sitemap projects
          </p>
        </div>

        <Card className="border-[#5B98D6]/30 bg-white">
          <CardHeader>
            <CardTitle className="text-2xl text-[#1a1a1a]">Welcome Back</CardTitle>
            <CardDescription className="text-[#1a1a1a]/60">
              Sign in with your Google account or email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full gap-2 border-[#5B98D6]/30 bg-transparent text-[#1a1a1a]/70 hover:bg-[#5B98D6]/10 hover:text-[#1a1a1a]"
              variant="outline"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#5B98D6]/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#1a1a1a]/50">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email Sign In */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  required
                  className="border-[#5B98D6]/30 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/40"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  required
                  className="border-[#5B98D6]/30 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/40"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 bg-[#4863B0] text-white hover:bg-[#5B98D6]"
              >
                <Mail className="h-4 w-4" />
                Sign In with Email
              </Button>
            </form>

            <p className="text-center text-sm text-[#1a1a1a]/50">
              Don't have an account?{' '}
              <Link href="/auth" className="text-[#4863B0] hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
