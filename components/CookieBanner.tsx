"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookie-consent");
    if (!accepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="container container-wide">
        <div className="bg-gray-900 border border-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-2">We value your privacy</h3>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              We use cookies to improve your experience on District Kart. By continuing, you agree to our{" "}
              <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 font-bold underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
          <button
            onClick={handleAccept}
            className="w-full md:w-auto px-10 py-4 bg-white text-gray-950 font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
