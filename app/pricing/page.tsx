'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faCrown, faRocket, faStar } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/lib/AuthContext';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create order
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // Initialize Razorpay
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'IncomeGrow Stock',
        description: 'Premium Annual Subscription',
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              router.push('/payment/success');
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
            router.push('/payment/failure');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        notes: {
          userId: user.id,
        },
        theme: {
          color: '#EA580C',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      tagline: 'Perfect to get started',
      price: 0,
      period: 'month',
      icon: faRocket,
      gradient: 'from-blue-500 to-cyan-500',
      features: [
        { text: 'Access to basic stock data', included: true },
        { text: 'Real-time market updates', included: true },
        { text: 'Portfolio tracking', included: true },
        { text: 'Save up to 2 scanner queries', included: true, highlight: true },
        { text: 'Basic watchlist', included: true },
        { text: 'Email support', included: true },
        { text: 'Advanced scanner (save up to 10)', included: false },
        { text: 'Priority support', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'Export reports', included: false },
      ],
      cta: 'Get Started Free',
      ctaLink: '/signup',
      popular: false,
    },
    {
      name: 'Premium',
      tagline: 'For serious investors',
      price: 99,
      originalPrice: 999,
      period: 'year',
      icon: faCrown,
      gradient: 'from-orange-500 to-pink-500',
      features: [
        { text: 'Everything in Free plan', included: true },
        { text: 'Save up to 10 scanner queries', included: true, highlight: true },
        { text: 'Advanced analytics & insights', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Export reports (PDF, Excel)', included: true },
        { text: 'Custom alerts & notifications', included: true },
        { text: 'Historical data access', included: true },
        { text: 'API access (coming soon)', included: true },
        { text: 'Ad-free experience', included: true },
        { text: 'Early access to new features', included: true },
      ],
      cta: 'Upgrade to Premium',
      ctaLink: '/signup',
      popular: true,
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30" style={{ paddingTop: '66px' }}>
        {/* Compact Hero Section with Offer */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              {/* Limited Time Offer Badge */}
              <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm mb-4 shadow-lg animate-pulse">
                <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
                LIMITED TIME OFFER!
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-3">
                🎉 New Year Special - 90% OFF! 🎉
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-2">
                Get Premium Annual Plan for just <span className="font-bold text-yellow-300 text-2xl">₹99</span> instead of <span className="line-through text-white/70">₹999</span>
              </p>
              <p className="text-sm md:text-base text-white/80">
                ⏰ Offer valid until <span className="font-bold text-yellow-300">Dec 31</span> • Limited spots available!
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                  plan.popular ? 'border-4 border-orange-500' : 'border border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2 text-sm font-bold rounded-bl-2xl shadow-lg">
                    <FontAwesomeIcon icon={faStar} className="mr-2" />
                    MOST POPULAR
                  </div>
                )}

                <div className="p-8 md:p-10">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl mb-4 shadow-lg`}>
                      <FontAwesomeIcon icon={plan.icon} className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600">{plan.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-8">
                    {plan.originalPrice ? (
                      <>
                        <div className="mb-2">
                          <span className="text-2xl text-gray-400 line-through">₹{plan.originalPrice}</span>
                          <span className="ml-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            90% OFF
                          </span>
                        </div>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                            ₹{plan.price}
                          </span>
                          <span className="text-gray-600 text-lg">/{plan.period}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">One-time annual payment • Offer ends Dec 31, 2025</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            ₹{plan.price}
                          </span>
                          <span className="text-gray-600 text-lg">/{plan.period}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  {plan.popular ? (
                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                        loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white'
                      }`}
                    >
                      {loading ? 'Processing...' : plan.cta}
                    </button>
                  ) : (
                    <Link href={plan.ctaLink}>
                      <button
                        className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        {plan.cta}
                      </button>
                    </Link>
                  )}

                  {/* Error Message */}
                  {error && plan.popular && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Features List */}
                  <div className="mt-8 space-y-4">
                    {plan.features.map((feature, fIndex) => (
                      <div
                        key={fIndex}
                        className={`flex items-start gap-3 ${
                          feature.highlight ? 'bg-blue-50 -mx-2 px-2 py-2 rounded-lg' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          feature.included
                            ? plan.popular
                              ? 'bg-gradient-to-br from-orange-500 to-pink-500'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                            : 'bg-gray-200'
                        }`}>
                          <FontAwesomeIcon
                            icon={feature.included ? faCheck : faTimes}
                            className={`w-3 h-3 ${feature.included ? 'text-white' : 'text-gray-400'}`}
                          />
                        </div>
                        <span className={`text-sm ${
                          feature.included ? 'text-gray-900 font-medium' : 'text-gray-400 line-through'
                        } ${feature.highlight ? 'font-bold text-blue-700' : ''}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Got questions? We've got answers.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What's the difference between Free and Premium?</h3>
              <p className="text-gray-600">
                The Free plan gives you access to basic features including saving up to 2 scanner queries.
                Premium unlocks advanced features like saving up to 10 scanner queries, advanced analytics, priority support, and more.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How does the 90% OFF offer work?</h3>
              <p className="text-gray-600">
                Get Premium for just ₹99/year (regular price ₹999/year) when you subscribe before Dec 31. This is a one-time annual payment that saves you ₹900!
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens after the first year?</h3>
              <p className="text-gray-600">
                After your first year, you can renew at the regular annual rate or switch to monthly billing. We'll notify you before your subscription ends.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We currently accept <span className="font-semibold text-blue-600">UPI payments only</span> for a quick and secure checkout. Simply scan the QR code or use any UPI app (Google Pay, PhonePe, Paytm, etc.) to complete your payment instantly.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free trial for Premium?</h3>
              <p className="text-gray-600">
                We don't offer a free trial, but our Free plan gives you full access to core features so you can experience the platform before upgrading.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do scanner query limits work?</h3>
              <p className="text-gray-600">
                Free users can save up to 2 custom scanner queries, while Premium users can save up to 10. You can always create and run unlimited queries, but only save your favorites within these limits.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm mb-4 shadow-lg">
              <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
              OFFER ENDS DEC 31
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Don't Miss Out!</h2>
            <p className="text-xl text-white/90 mb-2">
              Get Premium for <span className="font-bold text-yellow-300 text-3xl">₹99/year</span> - Save ₹900!
            </p>
            <p className="text-lg text-white/80 mb-8">
              Join thousands of investors already using IncomeGrow Stock to make smarter investment decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Claim 90% OFF Now
                </button>
              </Link>
              <Link href="/contact">
                <button className="bg-transparent border-2 border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-200">
                  Contact Sales
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
    </>
  );
}
