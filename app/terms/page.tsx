import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  return (
    <main>
      <Header />
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-12 shadow-sm border border-gray-100">
          <h1 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">Terms of Service</h1>
          <p className="text-gray-500 mb-6 italic">Last Updated: April 14, 2026</p>
          
          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using District Kart, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. Marketplace Structure</h2>
              <p>District Kart is a multi-vendor marketplace platform. We provide a digital space for independent vendors to list and sell products. We do not own or sell the products ourselves. Any contract for sale is directly between the buyer and the vendor.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
              <p>Users must provide accurate information when creating an account or placing an order. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Vendor Conduct</h2>
              <p>Vendors are responsible for the accuracy of their product listings, fulfillment of orders, and handling returns or complaints. All products must comply with local laws and regulations.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
              <p>District Kart shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the platform or transactions with independent vendors. We do not guarantee the quality, safety, or legality of items advertised by vendors.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. Governing Law</h2>
              <p>These terms shall be governed by and construed in accordance with the laws of India, specifically within the jurisdiction of Bihar.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
