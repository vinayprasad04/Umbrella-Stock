'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function CancellationRefund() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Cancellation and Refund Policy</h1>
            <p className="text-gray-600">
              <strong>Last Updated:</strong> October 29, 2025
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                This Cancellation and Refund Policy outlines the terms and conditions for cancellations and refunds for services provided through IncomeGrow Stock.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Services</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cancellation Policy</h3>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">1. Subscription Cancellation</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Users may cancel their subscription at any time through their account settings</li>
                  <li>Cancellation will take effect at the end of the current billing cycle</li>
                  <li>No partial refunds will be provided for unused time within the current billing period</li>
                  <li>Access to premium features will continue until the end of the paid period</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">2. How to Cancel</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Log in to your account</li>
                  <li>Navigate to Account Settings &gt; Subscription</li>
                  <li>Click on "Cancel Subscription"</li>
                  <li>Follow the confirmation prompts</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Refund Policy</h3>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">1. Eligibility for Refunds</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Refunds may be provided within 7 days of the initial subscription purchase</li>
                  <li>Refund requests must be made in writing to our support team</li>
                  <li>Technical issues preventing service access may qualify for prorated refunds</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">2. Non-Refundable Circumstances</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Subscription renewals (after the initial purchase period)</li>
                  <li>Partial month/period usage</li>
                  <li>Change of mind after 7 days</li>
                  <li>Violation of Terms of Service</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">3. Refund Processing</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Approved refunds will be processed within 7-10 business days</li>
                  <li>Refunds will be credited to the original payment method</li>
                  <li>Processing time may vary depending on your bank or payment provider</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data and Research Services</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">One-Time Purchases</h3>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">1. Digital Products</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Due to the nature of digital products (reports, data exports), these are generally non-refundable once delivered</li>
                  <li>Refunds may be considered if the product is significantly different from what was described</li>
                  <li>Technical delivery failures will be resolved or refunded</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">2. Custom Research Requests</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Cancellations must be made before work begins</li>
                  <li>Once research has commenced, cancellation fees may apply based on work completed</li>
                  <li>Completed work is non-refundable</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Request Process</h2>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">1. How to Request a Refund</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Email: <a href="mailto:vinay.qss@gmail.com" className="text-blue-600 hover:text-blue-700">vinay.qss@gmail.com</a></li>
                  <li>Include your order/transaction ID</li>
                  <li>Provide reason for refund request</li>
                  <li>Include any supporting documentation</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">2. Response Time</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Initial response within 2 business days</li>
                  <li>Resolution within 5-7 business days</li>
                  <li>Complex cases may require additional time</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Failures</h2>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">1. Failed Transactions</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>If a payment fails but your account was charged, please contact us immediately</li>
                  <li>Duplicate charges will be refunded in full</li>
                  <li>Payment gateway issues will be investigated and resolved promptly</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">2. Disputed Charges</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Contact us before filing a chargeback with your bank</li>
                  <li>We will work with you to resolve any billing disputes</li>
                  <li>Chargebacks may result in account suspension pending resolution</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Exceptions and Special Circumstances</h2>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">1. Service Outages</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Significant service disruptions may qualify for service credits or partial refunds</li>
                    <li>Prorated refunds calculated based on downtime duration</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">2. Promotional Offers</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Discounted or promotional subscriptions follow the same refund policy</li>
                    <li>Refund amount will be based on the actual amount paid</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">3. Force Majeure</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Cancellations or refunds due to circumstances beyond our control will be handled on a case-by-case basis</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Subscription Plans</h2>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">1. Upgrades</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Immediate access to new tier features</li>
                    <li>Prorated billing adjustment for remainder of billing cycle</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">2. Downgrades</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Changes take effect at the next billing cycle</li>
                    <li>No refunds for the difference in current billing period</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 mb-2">For cancellations, refund requests, or questions about this policy:</p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> <a href="mailto:vinay.qss@gmail.com" className="text-blue-600 hover:text-blue-700">vinay.qss@gmail.com</a></li>
                <li><strong>Address:</strong> Krishan Vihar, New Delhi 110086</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify this Cancellation and Refund Policy at any time. Changes will be effective immediately upon posting to our website. Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                This policy is governed by the laws of New Delhi, India and complies with applicable consumer protection regulations.
              </p>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 italic">
                <strong>Note:</strong> This policy is part of our Terms of Service. By using IncomeGrow Stock services, you agree to this Cancellation and Refund Policy.
              </p>
            </div>

            {/* Back to Home Link */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
