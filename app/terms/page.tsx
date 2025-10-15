'use client';

import React from 'react';
import Header from '@/components/Header';

export default function TermsOfService() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pt-20">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Terms of Service</h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Please read these terms carefully before using our platform
              </p>
              <div className="mt-8 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-blue-100">
                  Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using Umbrella Stock ("the Service", "Platform", "Website"), you agree to be bound by these Terms of Service
                ("Terms"). If you do not agree to these Terms, please do not use our Service.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms constitute a legally binding agreement between you and Umbrella Stock. Please read them carefully.
              </p>
            </section>

            {/* Definitions */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Definitions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>"Service"</strong> refers to the Umbrella Stock platform and all its features</li>
                <li><strong>"User"</strong> refers to any person accessing or using the Service</li>
                <li><strong>"Account"</strong> refers to your registered user account on the Platform</li>
                <li><strong>"Content"</strong> refers to all data, text, software, music, sound, photographs, graphics, video, messages, or other materials</li>
              </ul>
            </section>

            {/* Eligibility */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use this Service, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into a binding contract</li>
                <li>Not be prohibited from using the Service under applicable laws</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration and Security</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.1 Account Creation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password confidential and secure</li>
                <li>Notify us immediately of any unauthorized account access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Account Termination</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account at our discretion, without notice, for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent, illegal, or harmful activities</li>
                <li>Extended periods of inactivity</li>
                <li>Requests by law enforcement or government agencies</li>
              </ul>
            </section>

            {/* Use of Service */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Use of Service</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Permitted Use</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may use the Service for lawful purposes only. The Service is provided for personal, non-commercial use
                unless you have a commercial agreement with us.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Prohibited Activities</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon intellectual property rights</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Scrape, crawl, or harvest data without permission</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Impersonate any person or entity</li>
                <li>Use automated systems (bots) without authorization</li>
                <li>Engage in market manipulation or illegal trading activities</li>
                <li>Share false, misleading, or fraudulent information</li>
              </ul>
            </section>

            {/* Investment Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Investment Disclaimer</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl mb-4">
                <p className="text-gray-700 leading-relaxed font-semibold mb-2">
                  IMPORTANT: Not Financial Advice
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The information provided on this platform is for informational purposes only and does not constitute
                  financial, investment, trading, or other professional advice. You should consult with a qualified
                  financial advisor before making any investment decisions.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>All investments carry risk, including the potential loss of principal</li>
                <li>Past performance does not guarantee future results</li>
                <li>We do not guarantee the accuracy or completeness of any information</li>
                <li>You are solely responsible for your investment decisions</li>
                <li>We are not liable for any investment losses</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.1 Our Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All content on the Service, including text, graphics, logos, software, and data compilations, is owned by
                Umbrella Stock or its licensors and protected by intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 User Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of content you submit to the Service. By submitting content, you grant us a
                non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection
                with the Service.
              </p>
            </section>

            {/* Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your privacy is important to us. Please review our <a href="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</a> to
                understand how we collect, use, and protect your personal information.
              </p>
            </section>

            {/* Subscription and Payments */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Subscription and Payments</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.1 Premium Services</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Certain features require a paid subscription. By subscribing, you agree to pay all applicable fees.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.2 Billing</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change pricing with 30 days' notice</li>
                <li>You are responsible for all applicable taxes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.3 Cancellation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may cancel your subscription at any time from your account settings. Cancellation takes effect at the
                end of the current billing period.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>The Service is provided "AS IS" without warranties of any kind</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid us in the past 12 months</li>
                <li>We are not responsible for third-party content or services</li>
              </ul>
            </section>

            {/* Indemnification */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to indemnify and hold harmless Umbrella Stock, its officers, directors, employees, and agents
                from any claims, damages, losses, or expenses arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any content you submit to the Service</li>
              </ul>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">11.1 Governing Law</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by the laws of India, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">11.2 Arbitration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration
                in Mumbai, India, except where prohibited by law.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via
                email or through the Service. Continued use of the Service after changes constitutes acceptance of the
                revised Terms.
              </p>
            </section>

            {/* Severability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Severability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall
                remain in full force and effect.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> <a href="mailto:legal@umbrellastock.com" className="text-blue-600 hover:text-blue-700">legal@umbrellastock.com</a></p>
                <p className="text-gray-700 mb-2"><strong>Phone:</strong> +91 123 456 7890</p>
                <p className="text-gray-700"><strong>Address:</strong> Mumbai, Maharashtra, India</p>
              </div>
            </section>

            {/* Acceptance */}
            <section className="mb-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
                <p className="text-gray-700 leading-relaxed font-semibold">
                  By using Umbrella Stock, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
              </div>
            </section>
          </div>
        </div>

          {/* Quick Links */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/privacy" className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">Privacy Policy</h3>
                  <p className="text-sm text-gray-600">How we protect your data</p>
                </div>
              </div>
            </a>
            <a href="/disclaimer" className="group bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-orange-700 transition-colors">Disclaimer</h3>
                  <p className="text-sm text-gray-600">Important legal disclaimers</p>
                </div>
              </div>
            </a>
            <a href="/cookies" className="group bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">Cookie Policy</h3>
                  <p className="text-sm text-gray-600">Learn about our cookie usage</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
