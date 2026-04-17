"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function VendorPendingPage() {
  return (
    <div className="flex min-h-screen relative items-center justify-center p-4 sm:p-8 font-sans text-gray-900 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50/50">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-3/4 h-3/4 mix-blend-multiply opacity-20 blur-[100px] -z-10 rounded-full bg-amber-400" />
      <div className="absolute bottom-[-20%] left-[-10%] w-1/2 h-1/2 mix-blend-multiply opacity-30 blur-[100px] -z-10 bg-white rounded-full" />

      <div className="w-full max-w-lg bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-amber-900/10 border border-white/50 p-8 sm:p-12 relative z-10 text-center">
        
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-center"
        >
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
        </motion.div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Registration Successful!</h1>
        
        <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100 mb-8">
            <p className="text-lg font-medium text-amber-800 leading-relaxed">
                Aapki request Admin ke paas bhej di gayi hai. <br/>
                <span className="text-amber-600 font-bold">Please wait for approval.</span>
            </p>
        </div>

        <p className="text-gray-500 text-sm mb-10 leading-relaxed">
            We are reviewing your shop details. Once approved, you will have access to the Vendor Dashboard and can start listing your products. This typically takes 24-48 hours.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
            <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex-1 bg-gray-900 text-white py-4 rounded-xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-black transition-all"
            >
                Sign Out
            </button>
            <Link 
                href="/"
                className="flex-1 bg-white border border-gray-200 text-gray-600 py-4 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center justify-center"
            >
                Back to Website
            </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Need help?</p>
            <p className="text-sm text-gray-500 mt-1">Contact us at support@districtkart.com</p>
        </div>
      </div>
    </div>
  );
}
