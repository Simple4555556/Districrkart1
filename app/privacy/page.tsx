import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <main>
      <Header />
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-12 shadow-sm border border-gray-100">
          <h1 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500 mb-6 italic">Last Updated: April 14, 2026</p>
          
          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p>Welcome to District Kart. We value your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. The Data We Collect About You</h2>
              <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. How We Use Your Personal Data</h2>
              <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests and your interests and fundamental rights do not override those interests.</li>
                <li>Where we need to comply with a legal or regulatory obligation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Vendor Responsibilities</h2>
              <p>As a multi-vendor marketplace, District Kart facilitates transactions between users and independent vendors. Vendors on our platform have their own privacy practices for which District Kart is not responsible, though we require all partners to adhere to standard data protection guidelines.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Contact Us</h2>
              <p>If you have any questions about this privacy policy or our privacy practices, please contact us at <a href="mailto:support@districtkart.com" className="text-indigo-600 font-bold">support@districtkart.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
