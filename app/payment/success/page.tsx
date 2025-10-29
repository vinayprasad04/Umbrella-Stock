'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCrown, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Reload user data to get updated subscription
    const reloadUserData = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (error) {
          console.error('Failed to reload user data:', error);
        }
      }
    };

    reloadUserData();
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/30" style={{ paddingTop: '66px' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6 shadow-lg">
                <FontAwesomeIcon icon={faCheckCircle} className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Payment Successful!</h1>
              <p className="text-xl text-white/90">
                Welcome to Premium! Your subscription is now active.
              </p>
            </div>

            {/* Success Details */}
            <div className="px-8 py-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white px-6 py-3 rounded-full font-bold text-lg mb-6 shadow-lg">
                  <FontAwesomeIcon icon={faCrown} className="w-6 h-6" />
                  Premium Member
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">You're all set!</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Your Premium subscription has been activated successfully. You now have access to all premium features including:
                </p>
              </div>

              {/* Premium Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">10</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Scanner Queries</h3>
                      <p className="text-sm text-gray-600">Save up to 10 custom scanner queries</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Advanced Analytics</h3>
                      <p className="text-sm text-gray-600">Access to advanced market insights</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Priority Support</h3>
                      <p className="text-sm text-gray-600">Get help faster with priority support</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Export Reports</h3>
                      <p className="text-sm text-gray-600">Download data in PDF and Excel formats</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/scanner">
                  <button className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Start Using Scanner
                    <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="bg-white border-2 border-gray-300 text-gray-700 font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
                    Go to Dashboard
                  </button>
                </Link>
              </div>

              {/* Additional Info */}
              <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Subscription Valid:</span> 1 year from today<br/>
                  A confirmation email has been sent to your registered email address.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
