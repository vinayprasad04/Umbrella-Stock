"use client"

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RatioInfo {
  title: string;
  calculation: string;
  interpretation: {
    excellent: string;
    good: string;
    average: string;
    poor: string;
  };
  note?: string;
}

const ratioInfoData: Record<string, RatioInfo> = {
  'pe': {
    title: 'P/E Ratio (Price-to-Earnings)',
    calculation: 'Formula: Market Price per Share ÷ Earnings per Share (EPS)',
    interpretation: {
      excellent: '< 15: Undervalued or low-growth company',
      good: '15-25: Fair valuation for most companies',
      average: '25-35: Potentially overvalued or high-growth',
      poor: '> 35: Overvalued or speculative (Tech stocks may be exception)'
    },
    note: 'Lower P/E may indicate undervaluation, but also check growth prospects. Negative P/E means company is loss-making.'
  },
  'roce': {
    title: 'ROCE (Return on Capital Employed)',
    calculation: 'Formula: (EBIT ÷ Capital Employed) × 100',
    interpretation: {
      excellent: '> 20%: Excellent capital efficiency',
      good: '15-20%: Good returns on investment',
      average: '10-15%: Average capital utilization',
      poor: '< 10%: Poor capital efficiency'
    },
    note: 'ROCE shows how efficiently company uses its capital to generate profits. Higher is better. Compare with cost of capital.'
  },
  'roe': {
    title: 'ROE (Return on Equity)',
    calculation: 'Formula: (Net Income ÷ Shareholder\'s Equity) × 100',
    interpretation: {
      excellent: '> 20%: Exceptional returns to shareholders',
      good: '15-20%: Strong shareholder returns',
      average: '10-15%: Average performance',
      poor: '< 10%: Weak returns or high debt leverage'
    },
    note: 'ROE measures profitability from shareholders\' perspective. High ROE with high debt can be risky. Compare with ROA.'
  },
  'debt': {
    title: 'Debt-to-Equity Ratio',
    calculation: 'Formula: Total Debt ÷ Shareholder\'s Equity',
    interpretation: {
      excellent: '< 0.5: Very low financial risk',
      good: '0.5-1.0: Moderate, manageable debt',
      average: '1.0-2.0: Higher leverage, watch carefully',
      poor: '> 2.0: High financial risk, debt-heavy'
    },
    note: 'Lower ratio means less debt relative to equity. Capital-intensive industries (infrastructure) naturally have higher ratios.'
  },
  'pb': {
    title: 'P/B Ratio (Price-to-Book)',
    calculation: 'Formula: Market Price per Share ÷ Book Value per Share',
    interpretation: {
      excellent: '< 1: Trading below book value (undervalued)',
      good: '1-3: Fair valuation for most companies',
      average: '3-5: Premium valuation, check quality',
      poor: '> 5: High premium, verify growth & quality'
    },
    note: 'P/B < 1 may indicate undervaluation or poor asset quality. Growth companies often trade at higher P/B multiples.'
  },
  'dividend': {
    title: 'Dividend Yield',
    calculation: 'Formula: (Annual Dividend per Share ÷ Market Price per Share) × 100',
    interpretation: {
      excellent: '> 4%: High income for investors',
      good: '2-4%: Decent dividend returns',
      average: '1-2%: Low but stable dividends',
      poor: '< 1% or 0%: Minimal/no dividends (growth-focused)'
    },
    note: 'High yield attractive for income investors. Very high yield (>8%) may indicate distress. Growth companies often pay low/no dividends.'
  }
};

interface RatioInfoTooltipProps {
  ratio: 'pe' | 'roce' | 'roe' | 'debt' | 'pb' | 'dividend';
}

export default function RatioInfoTooltip({ ratio }: RatioInfoTooltipProps) {
  const info = ratioInfoData[ratio];

  if (!info) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 ml-1.5 text-indigo-600 hover:text-indigo-800 focus:outline-none"
            aria-label={`Information about ${info.title}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="start"
          className="max-w-sm p-4 bg-white border-indigo-200 shadow-lg"
          sideOffset={5}
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-indigo-900 mb-1">{info.title}</h4>
              <p className="text-xs text-slate-600 italic">{info.calculation}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-700">Interpretation:</p>
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="inline-block w-2 h-2 mt-1 rounded-full bg-green-500 flex-shrink-0"></span>
                  <p className="text-xs text-slate-700">{info.interpretation.excellent}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-block w-2 h-2 mt-1 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <p className="text-xs text-slate-700">{info.interpretation.good}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-block w-2 h-2 mt-1 rounded-full bg-yellow-500 flex-shrink-0"></span>
                  <p className="text-xs text-slate-700">{info.interpretation.average}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-block w-2 h-2 mt-1 rounded-full bg-red-500 flex-shrink-0"></span>
                  <p className="text-xs text-slate-700">{info.interpretation.poor}</p>
                </div>
              </div>
            </div>

            {info.note && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold">Note:</span> {info.note}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
