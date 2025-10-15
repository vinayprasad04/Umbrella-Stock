'use client';

import React from 'react';
import Header from '@/components/Header';

export default function CookiePolicy() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pt-20">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Cookie Policy</h1>
              <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
                Learn how we use cookies to enhance your experience
              </p>
              <div className="mt-8 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-purple-100">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit
                a website. They are widely used to make websites work more efficiently, provide a better user experience,
                and provide information to website owners.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Cookie Policy explains how Umbrella Stock uses cookies and similar technologies, what information
                they collect, and how you can control them.
              </p>
            </section>

            {/* Why We Use Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Why We Use Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our platform</li>
                <li>Improve our services and user experience</li>
                <li>Provide personalized content and recommendations</li>
                <li>Analyze site traffic and performance</li>
                <li>Detect and prevent fraud and security issues</li>
              </ul>
            </section>

            {/* Types of Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Essential Cookies</h3>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Required for the website to function properly.</strong> These cookies are necessary for core
                  functionality and cannot be disabled.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Authentication cookies:</strong> Keep you logged in and secure your session</li>
                <li><strong>Security cookies:</strong> Protect against unauthorized access and security threats</li>
                <li><strong>Load balancing cookies:</strong> Distribute traffic across servers for optimal performance</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Functional Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies enable enhanced functionality and personalization:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Preference cookies:</strong> Remember your settings (language, theme, layout)</li>
                <li><strong>Feature cookies:</strong> Enable specific features you've requested</li>
                <li><strong>Watchlist cookies:</strong> Store your saved stocks and mutual funds</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Analytics Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies help us understand how visitors interact with our platform:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Usage tracking:</strong> Pages visited, time spent, navigation patterns</li>
                <li><strong>Performance monitoring:</strong> Page load times, errors, and technical issues</li>
                <li><strong>User behavior:</strong> Feature usage, click patterns, and engagement metrics</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                <em>We use services like Google Analytics for this purpose. These cookies are anonymized and aggregated.</em>
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.4 Marketing/Advertising Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies track your browsing habits to show relevant advertisements:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Ad targeting:</strong> Show relevant advertisements based on your interests</li>
                <li><strong>Remarketing:</strong> Display ads to you on other websites</li>
                <li><strong>Campaign measurement:</strong> Track effectiveness of marketing campaigns</li>
              </ul>
            </section>

            {/* Cookie Details Table */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Specific Cookies We Use</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">authToken</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Authenticate user sessions</td>
                      <td className="px-6 py-4 text-sm text-gray-700">7 days</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Essential</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">refreshToken</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Maintain login sessions</td>
                      <td className="px-6 py-4 text-sm text-gray-700">30 days</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Essential</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">preferences</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Store user preferences</td>
                      <td className="px-6 py-4 text-sm text-gray-700">1 year</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Functional</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">_ga</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Google Analytics tracking</td>
                      <td className="px-6 py-4 text-sm text-gray-700">2 years</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Analytics</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">_gid</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Google Analytics session ID</td>
                      <td className="px-6 py-4 text-sm text-gray-700">24 hours</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Analytics</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use services from trusted third-party providers that may set their own cookies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Google Analytics:</strong> Website analytics and performance monitoring</li>
                <li><strong>Payment Processors:</strong> Secure payment processing (Stripe, Razorpay)</li>
                <li><strong>CDN Providers:</strong> Content delivery and performance optimization</li>
                <li><strong>Social Media:</strong> Social sharing buttons and widgets</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                These third parties have their own privacy policies and cookie policies. We encourage you to review them.
              </p>
            </section>

            {/* Managing Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. How to Manage Cookies</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.1 Browser Settings</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Most web browsers allow you to control cookies through their settings:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 Cookie Preferences</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can customize your cookie preferences on our platform through the cookie consent banner or your
                account settings.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Note:</strong> Disabling essential cookies may prevent you from using certain features of the
                  website, including logging in and accessing your account.
                </p>
              </div>
            </section>

            {/* Do Not Track */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Do Not Track Signals</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Some browsers support "Do Not Track" (DNT) signals. Currently, there is no industry standard for
                interpreting DNT signals. We do not respond to DNT signals, but you can manage cookies through your
                browser settings as described above.
              </p>
            </section>

            {/* Local Storage */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Local Storage and Similar Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In addition to cookies, we may use other technologies such as:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Local Storage:</strong> Store data locally in your browser for improved performance</li>
                <li><strong>Session Storage:</strong> Temporary storage that clears when you close your browser</li>
                <li><strong>IndexedDB:</strong> Store structured data for offline functionality</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                These technologies serve similar purposes to cookies and are subject to the same controls.
              </p>
            </section>

            {/* Updates to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or
                our practices. We will notify you of significant changes by posting the updated policy on this page
                and updating the "Last updated" date.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about our use of cookies:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> <a href="mailto:privacy@umbrellastock.com" className="text-blue-600 hover:text-blue-700">privacy@umbrellastock.com</a></p>
                <p className="text-gray-700 mb-2"><strong>Phone:</strong> +91 123 456 7890</p>
                <p className="text-gray-700"><strong>Address:</strong> Mumbai, Maharashtra, India</p>
              </div>
            </section>

            {/* More Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Learn More</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For more information about cookies and online privacy:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><a href="https://www.allaboutcookies.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">All About Cookies</a></li>
                <li><a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Your Online Choices</a></li>
                <li><a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Network Advertising Initiative</a></li>
              </ul>
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
          </div>
        </div>
      </div>
    </>
  );
}
