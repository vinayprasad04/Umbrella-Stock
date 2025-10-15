'use client';

import React from 'react';
import Header from '@/components/Header';

export default function Disclaimer() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pt-20">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-orange-600 via-red-600 to-pink-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Disclaimer</h1>
              <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
                Important legal disclaimers regarding the use of Umbrella Stock
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Warning Banner */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-8 mb-8 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-yellow-900 mb-3">Please Read Carefully</h3>
                <p className="text-yellow-800 leading-relaxed text-lg">
                  This disclaimer contains important information about the limitations and risks associated with using
                  Umbrella Stock. By accessing or using our platform, you acknowledge that you have read, understood,
                  and agree to this disclaimer.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="prose prose-lg max-w-none">
            {/* General Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. General Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The information provided on Umbrella Stock is for general informational purposes only. While we strive
                to keep the information accurate and up-to-date, we make no representations or warranties of any kind,
                express or implied, about the completeness, accuracy, reliability, suitability, or availability of the
                information, products, services, or related graphics contained on the platform.
              </p>
            </section>

            {/* Not Financial Advice */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Not Financial Advice</h2>
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
                <p className="text-red-800 font-bold mb-3">IMPORTANT: Not Investment Advice</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>None of the content on Umbrella Stock constitutes financial, investment, trading, tax, legal,
                  or any other type of professional advice.</strong> All information provided is for educational and
                  informational purposes only.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>We are not registered investment advisors, financial planners, or broker-dealers</li>
                <li>We do not provide personalized investment recommendations</li>
                <li>We do not assess your individual financial situation, risk tolerance, or investment objectives</li>
                <li>All investment decisions should be made after consulting with qualified financial professionals</li>
                <li>You are solely responsible for evaluating the risks and benefits of any investment decision</li>
              </ul>
            </section>

            {/* Investment Risks */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Investment Risks</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>All investments involve risk, including the potential loss of principal.</strong> Before making
                any investment decisions, you should carefully consider:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Market Risk:</strong> Stock and mutual fund prices can fluctuate significantly</li>
                <li><strong>Liquidity Risk:</strong> Some investments may be difficult to sell quickly</li>
                <li><strong>Credit Risk:</strong> Issuers may default on their obligations</li>
                <li><strong>Currency Risk:</strong> Exchange rate fluctuations can affect returns</li>
                <li><strong>Inflation Risk:</strong> Returns may not keep pace with inflation</li>
                <li><strong>Concentration Risk:</strong> Over-concentration in specific sectors or securities</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>Past performance is not indicative of future results.</strong> Historical returns, ratings,
                and performance data do not guarantee future performance.
              </p>
            </section>

            {/* Data Accuracy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Accuracy and Completeness</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                While we make reasonable efforts to ensure data accuracy:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>We do not guarantee the accuracy, completeness, or timeliness of any data</li>
                <li>Data may be delayed, inaccurate, or contain errors</li>
                <li>We rely on third-party data providers who may have their own limitations</li>
                <li>Technical issues may cause data delays or interruptions</li>
                <li>Users should verify all data before making investment decisions</li>
                <li>We are not liable for any losses resulting from inaccurate or incomplete data</li>
              </ul>
            </section>

            {/* Third-Party Content */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Content and Links</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform may contain links to third-party websites, services, or content:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>We do not endorse or take responsibility for third-party content</li>
                <li>Third-party websites have their own terms and privacy policies</li>
                <li>We are not liable for any harm resulting from third-party services</li>
                <li>Links are provided for convenience only and do not imply endorsement</li>
              </ul>
            </section>

            {/* No Guarantees */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. No Guarantees of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We provide the platform "as is" without guarantees:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>We do not guarantee uninterrupted, timely, secure, or error-free service</li>
                <li>The platform may be temporarily unavailable due to maintenance or technical issues</li>
                <li>Features and services may be modified or discontinued without notice</li>
                <li>We are not responsible for losses caused by service interruptions</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>We shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages</li>
                <li>This includes damages for lost profits, revenue, data, or business opportunities</li>
                <li>Our liability is limited even if we have been advised of the possibility of such damages</li>
                <li>We are not liable for investment losses or trading decisions</li>
                <li>Users assume all risks associated with using the platform</li>
              </ul>
            </section>

            {/* Regulatory Compliance */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Regulatory Compliance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Umbrella Stock is not a SEBI-registered investment advisor or portfolio manager.</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>We do not facilitate trading or execute transactions</li>
                <li>We do not manage investment portfolios on behalf of users</li>
                <li>Users must comply with all applicable securities laws and regulations</li>
                <li>Users are responsible for their own tax obligations</li>
              </ul>
            </section>

            {/* User Responsibility */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. User Responsibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using Umbrella Stock, you acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>You are solely responsible for your investment decisions</li>
                <li>You have the knowledge and experience necessary to evaluate investments</li>
                <li>You will conduct your own due diligence before making any investment</li>
                <li>You understand the risks associated with investing in financial markets</li>
                <li>You will consult with qualified professionals before making investment decisions</li>
                <li>You will not rely solely on information provided by our platform</li>
              </ul>
            </section>

            {/* Forward-Looking Statements */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Forward-Looking Statements</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Any forward-looking statements, projections, or forecasts on the platform are subject to risks and
                uncertainties. Actual results may differ materially from projected results. Forward-looking statements
                should not be relied upon as predictions of future events.
              </p>
            </section>

            {/* Jurisdiction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Jurisdiction and Governing Law</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This disclaimer is governed by the laws of India. Users accessing the platform from other jurisdictions
                do so at their own risk and are responsible for compliance with local laws.
              </p>
            </section>

            {/* Changes to Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify this disclaimer at any time. Changes become effective immediately upon
                posting. Your continued use of the platform constitutes acceptance of the modified disclaimer.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about this disclaimer:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> <a href="mailto:legal@umbrellastock.com" className="text-blue-600 hover:text-blue-700">legal@umbrellastock.com</a></p>
                <p className="text-gray-700 mb-2"><strong>Phone:</strong> +91 123 456 7890</p>
                <p className="text-gray-700"><strong>Address:</strong> Mumbai, Maharashtra, India</p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="mb-8">
              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl">
                <p className="text-gray-700 leading-relaxed">
                  <strong>By using Umbrella Stock, you acknowledge that you have read, understood, and agree to this
                  disclaimer. If you do not agree with this disclaimer, you must immediately cease using the platform.</strong>
                </p>
              </div>
            </section>
          </div>
        </div>

          {/* Quick Links */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/terms" className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">Terms of Service</h3>
                  <p className="text-sm text-gray-600">Read our terms and conditions</p>
                </div>
              </div>
            </a>
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
