'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function ShippingDelivery() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping and Delivery Policy</h1>
            <p className="text-gray-600">
              <strong>Last Updated:</strong> October 29, 2025
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                IncomeGrow Stock is a digital service platform providing stock market analysis, research, and investment tools. As we provide digital services and products, this Shipping and Delivery Policy outlines how our services and digital products are delivered to users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nature of Services</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Digital Services - No Physical Shipping</h3>

              <p className="text-gray-700 mb-3">IncomeGrow Stock provides exclusively digital services, including:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
                <li>Stock market analysis and insights</li>
                <li>Investment research reports</li>
                <li>Portfolio tracking and management tools</li>
                <li>Real-time market data and alerts</li>
                <li>Educational content and resources</li>
                <li>API access for developers</li>
              </ul>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                <p className="text-blue-900 font-semibold">
                  <strong>Important:</strong> We do not ship physical products. All services and products are delivered electronically.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Delivery</h2>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Subscription Services</h3>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Immediate Delivery:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
                  <li>Account activation: Instant upon successful payment</li>
                  <li>Access to platform features: Immediate</li>
                  <li>Dashboard and tools: Available immediately after subscription</li>
                  <li>Premium features: Activated within minutes</li>
                </ul>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Delivery Method:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Access through web platform: <a href="https://www.stock.incomegrow.in/" className="text-blue-600 hover:text-blue-700">https://www.stock.incomegrow.in/</a></li>
                  <li>Mobile applications (if applicable)</li>
                  <li>API endpoints for integrated services</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Digital Products and Reports</h3>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Research Reports:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
                  <li>Delivered via email within 24 hours of purchase</li>
                  <li>Accessible through user dashboard immediately</li>
                  <li>Downloadable in PDF format</li>
                  <li>No physical copies provided</li>
                </ul>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Data Exports:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
                  <li>Generated upon request</li>
                  <li>Delivered within 1-2 business days</li>
                  <li>Available for download through secure link</li>
                  <li>Link valid for 30 days</li>
                </ul>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Custom Research:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Delivery timeline specified at time of order</li>
                  <li>Typically 5-10 business days depending on scope</li>
                  <li>Progress updates provided via email</li>
                  <li>Final report delivered digitally</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">3. API Access</h3>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">API Credentials:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Delivered immediately upon subscription activation</li>
                  <li>Access details sent to registered email</li>
                  <li>Documentation available in user dashboard</li>
                  <li>Support for integration provided</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery Timeframes</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        Product/Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">Subscription Activation</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Immediate</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">Platform Access</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Immediate</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">Standard Reports</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">24 hours</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">Custom Research</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">5-10 business days</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">Data Exports</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">1-2 business days</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">API Credentials</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Immediate</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">Email Alerts Setup</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">1 hour</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery Issues</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Access Problems</h3>
              <p className="text-gray-700 mb-3">If you experience issues accessing your purchased services:</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">1. Verify Payment Confirmation</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Check your email for payment confirmation</li>
                    <li>Verify transaction in your payment method records</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">2. Check Your Email</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Look for delivery confirmation and access instructions</li>
                    <li>Check spam/junk folders</li>
                    <li>Ensure email address is correct in your account</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">3. Login Issues</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Reset your password if needed</li>
                    <li>Clear browser cache and cookies</li>
                    <li>Try a different browser or device</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">4. Contact Support</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Email: <a href="mailto:vinay.qss@gmail.com" className="text-blue-600 hover:text-blue-700">vinay.qss@gmail.com</a></li>
                    <li>Response time: Within 2 business hours during business days</li>
                    <li>24/7 support for critical access issues</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Support and Assistance</h2>
              <p className="text-gray-700 mb-3">For delivery-related questions or issues:</p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li><strong>Email:</strong> <a href="mailto:vinay.qss@gmail.com" className="text-blue-600 hover:text-blue-700">vinay.qss@gmail.com</a></li>
                <li><strong>Website:</strong> <a href="https://www.stock.incomegrow.in/" className="text-blue-600 hover:text-blue-700">https://www.stock.incomegrow.in/</a></li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-800 mb-2">Support Hours:</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Monday - Friday: 9:00 AM - 6:00 PM IST</li>
                <li>Saturday: 10:00 AM - 4:00 PM IST</li>
                <li>Sunday: Closed (Email support available)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Force Majeure</h2>
              <p className="text-gray-700 mb-3">Delivery may be delayed due to circumstances beyond our control, including:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Internet service disruptions</li>
                <li>Server outages</li>
                <li>Natural disasters</li>
                <li>Government actions</li>
                <li>Other acts of force majeure</li>
              </ul>
              <p className="text-gray-700 mt-3">
                We will notify users promptly and resume service delivery as soon as possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                This Shipping and Delivery Policy may be updated periodically. Users will be notified of significant changes via email and platform notifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 font-semibold mb-2">IncomeGrow Stock</p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> <a href="mailto:vinay.qss@gmail.com" className="text-blue-600 hover:text-blue-700">vinay.qss@gmail.com</a></li>
                <li><strong>Website:</strong> <a href="https://www.stock.incomegrow.in/" className="text-blue-600 hover:text-blue-700">https://www.stock.incomegrow.in/</a></li>
                <li><strong>Address:</strong> Krishan Vihar, New Delhi 110086</li>
              </ul>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 italic">
                <strong>Note:</strong> This policy applies exclusively to digital product and service delivery. No physical goods are shipped by IncomeGrow Stock.
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
