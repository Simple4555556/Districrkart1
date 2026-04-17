"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-lg">
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl animate-pulse">
           <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter uppercase italic">
          Something went <span className="text-indigo-500">unexpected</span>
        </h1>
        
        <p className="text-gray-400 text-lg mb-10 font-medium leading-relaxed">
          We&apos;ve encountered a temporary breakdown, but don&apos;t worry—our team has been alerted and is already investigating the cause.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
          >
            Attempt Recovery
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
          >
            Return to Safety
          </Link>
        </div>

        {error.digest && (
          <p className="mt-12 text-[10px] uppercase font-bold text-gray-600 tracking-[0.2em]">
            Error Signature: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
