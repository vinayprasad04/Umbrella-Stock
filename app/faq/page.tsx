'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqs: FAQItem[] = [
    // General
    {
      category: 'general',
      question: 'What is Umbrella Stock?',
      answer: 'Umbrella Stock is a comprehensive investment platform that provides real-time stock market data, mutual fund information, portfolio tracking, and advanced analytics tools. We help investors make informed decisions by providing accurate, timely data and powerful analytical tools.'
    },
    {
      category: 'general',
      question: 'Is Umbrella Stock free to use?',
      answer: 'Yes! Umbrella Stock offers a free tier with access to essential features including real-time stock prices, basic mutual fund data, and portfolio tracking. We also offer premium plans with advanced features for serious investors.'
    },
    {
      category: 'general',
      question: 'How accurate is your data?',
      answer: 'We source our data from reliable financial data providers and exchanges. Stock prices are updated in real-time during market hours, and mutual fund NAVs are updated daily. We maintain strict quality controls to ensure data accuracy.'
    },

    // Account
    {
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button in the top right corner, fill in your details including name, email, and password. You\'ll receive a verification email - click the link to verify your account and start using Umbrella Stock.'
    },
    {
      category: 'account',
      question: 'I forgot my password. How do I reset it?',
      answer: 'Click on "Forgot Password" on the login page. Enter your registered email address, and we\'ll send you a password reset link. Follow the instructions in the email to set a new password.'
    },
    {
      category: 'account',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account from the Settings page under the "Danger Zone" section. Please note that this action is permanent and will remove all your data including watchlists and portfolio information.'
    },
    {
      category: 'account',
      question: 'How do I change my email address?',
      answer: 'Go to Settings > Account and update your email address. You\'ll need to verify the new email address before the change takes effect.'
    },

    // Stocks
    {
      category: 'stocks',
      question: 'What stock exchanges do you cover?',
      answer: 'We currently cover NSE (National Stock Exchange) and BSE (Bombay Stock Exchange) in India, providing comprehensive data for thousands of listed companies.'
    },
    {
      category: 'stocks',
      question: 'How often is stock data updated?',
      answer: 'Stock prices are updated in real-time during market hours (9:15 AM to 3:30 PM IST on trading days). Historical data, financial statements, and other company information are updated regularly.'
    },
    {
      category: 'stocks',
      question: 'Can I track my stock portfolio?',
      answer: 'Yes! You can add stocks to your portfolio, track their performance, view gains/losses, and analyze your overall portfolio allocation. This feature is available to all registered users.'
    },
    {
      category: 'stocks',
      question: 'What financial metrics do you provide?',
      answer: 'We provide comprehensive financial metrics including P/E ratio, P/B ratio, dividend yield, market cap, EPS, ROE, debt-to-equity ratio, and many more. You can also view detailed financial statements and ratios.'
    },

    // Mutual Funds
    {
      category: 'mutual-funds',
      question: 'How many mutual funds are listed on your platform?',
      answer: 'We have a comprehensive database of over 10,000+ mutual funds across all categories including equity, debt, hybrid, index funds, and more.'
    },
    {
      category: 'mutual-funds',
      question: 'How do I compare mutual funds?',
      answer: 'Use our mutual fund comparison tool to compare up to 4 funds side-by-side. You can compare returns, expense ratios, AUM, fund manager details, and portfolio holdings.'
    },
    {
      category: 'mutual-funds',
      question: 'When are mutual fund NAVs updated?',
      answer: 'Mutual fund NAVs are updated daily after market hours, typically by 10 PM IST. We sync with official AMC (Asset Management Company) data to ensure accuracy.'
    },
    {
      category: 'mutual-funds',
      question: 'Can I track my mutual fund investments?',
      answer: 'Yes, you can add your mutual fund investments to your portfolio and track their performance, SIP returns, and overall allocation.'
    },

    // Technical
    {
      category: 'technical',
      question: 'Do you have a mobile app?',
      answer: 'Currently, Umbrella Stock is a web-based platform optimized for mobile browsers. We\'re working on native iOS and Android apps that will be launched soon.'
    },
    {
      category: 'technical',
      question: 'Which browsers are supported?',
      answer: 'Umbrella Stock works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.'
    },
    {
      category: 'technical',
      question: 'Is my data secure?',
      answer: 'Yes, we take security seriously. All data is encrypted in transit using SSL/TLS, and sensitive information is encrypted at rest. We never share your personal information with third parties without your consent.'
    },

    // Premium
    {
      category: 'premium',
      question: 'What are the benefits of premium membership?',
      answer: 'Premium members get access to advanced screening tools, real-time alerts, detailed technical analysis, export features, ad-free experience, and priority customer support.'
    },
    {
      category: 'premium',
      question: 'How much does premium cost?',
      answer: 'Our premium plans start at ₹499/month or ₹4,999/year (save 17%). We also offer a 7-day free trial so you can try all premium features before committing.'
    },
    {
      category: 'premium',
      question: 'Can I cancel my premium subscription?',
      answer: 'Yes, you can cancel your premium subscription anytime from your account settings. You\'ll continue to have access to premium features until the end of your billing period.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions', icon: '📋' },
    { id: 'general', name: 'General', icon: '🏠' },
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'stocks', name: 'Stocks', icon: '📈' },
    { id: 'mutual-funds', name: 'Mutual Funds', icon: '💰' },
    { id: 'technical', name: 'Technical', icon: '⚙️' },
    { id: 'premium', name: 'Premium', icon: '⭐' }
  ];

  const filteredFaqs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Frequently Asked Questions</h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Find answers to common questions about Umbrella Stock
              </p>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500 text-blue-700 shadow-lg'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium">{category.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory === 'all'
                ? `All Questions (${filteredFaqs.length})`
                : `${categories.find(c => c.id === selectedCategory)?.name} (${filteredFaqs.length})`}
            </h2>
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                  openIndex === index
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="text-left font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-6 h-6 text-blue-600 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-t-2 border-blue-200 animate-fadeIn">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-3">Still have questions?</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-blue-600 bg-white hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Contact Support
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="mailto:support@umbrellastock.com"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-base font-semibold rounded-xl text-white hover:bg-white hover:text-blue-600 transition-all duration-200 hover:scale-105"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
