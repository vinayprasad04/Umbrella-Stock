import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Initialize Cron Job API
 *
 * This endpoint should be called once when the server starts
 * It initializes the daily stock activities sync cron job
 *
 * Call this endpoint manually or from server startup script
 */

let cronInitialized = false;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (cronInitialized) {
      return res.status(200).json({
        success: true,
        message: 'Cron job already initialized',
        status: 'running'
      });
    }

    // Import and initialize cron job
    const { initCronJob } = require('@/lib/cron/activities-sync-cron');
    initCronJob();

    cronInitialized = true;

    return res.status(200).json({
      success: true,
      message: 'Cron job initialized successfully',
      schedule: 'Daily at 2:00 AM (Asia/Kolkata)',
      status: 'running'
    });

  } catch (error: any) {
    console.error('Failed to initialize cron job:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize cron job'
    });
  }
}
