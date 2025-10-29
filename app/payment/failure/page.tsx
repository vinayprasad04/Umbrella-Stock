'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faArrowLeft, faQuestionCircle, faHeadset } from '@fortawesome/free-solid-svg-icons';

export default function PaymentFailure() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50/30" style={{ paddingTop: '66px' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Failure Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6 shadow-lg">
                <FontAwesomeIcon icon={faTimesCircle} className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Payment Failed</h1>
              <p className="text-xl text-white/90">
                We couldn't process your payment. Don't worry, your account is safe.
              </p>
            </div>

            {/* Failure Details */}
            <div className="px-8 py-12">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">What happened?</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                  Your payment could not be completed. This might be due to various reasons such as:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto mb-10">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faQuestionCircle} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Insufficient Funds</h3>
                        <p className="text-sm text-gray-600">Your UPI account may not have sufficient balance</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faQuestionCircle} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Network Issue</h3>
                        <p className="text-sm text-gray-600">Connection was interrupted during payment</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faQuestionCircle} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Payment Cancelled</h3>
                        <p className="text-sm text-gray-600">You may have cancelled the payment</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faQuestionCircle} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Technical Error</h3>
                        <p className="text-sm text-gray-600">A technical issue occurred during processing</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/pricing">
                  <button className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    Try Again
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="bg-white border-2 border-gray-300 text-gray-700 font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
                    <FontAwesomeIcon icon={faHeadset} className="mr-2" />
                    Contact Support
                  </button>
                </Link>
              </div>

              {/* Additional Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Note:</span> No charges have been made to your account.<br/>
                  If you have any questions or need assistance, please contact our support team.
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
