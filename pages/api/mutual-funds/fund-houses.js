const { connectToDatabase } = require('@/lib/db');

/**
 * API endpoint to get all unique mutual fund houses
 * Method: GET
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Connect to database
    const { db } = await connectToDatabase();
    const collection = db.collection('mutualfunds');

    // Get distinct fund houses with counts
    const fundHousesWithCounts = await collection.aggregate([
      {
        $group: {
          _id: "$fundHouse",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 } // Alphabetical order
      }
    ]).toArray();

    // Format the response
    const fundHouses = fundHousesWithCounts.map(item => ({
      value: item._id,
      label: item._id,
      count: item.count
    }));

    console.log(`🏛️ Found ${fundHouses.length} fund houses`);

    return res.status(200).json({
      success: true,
      data: fundHouses,
      total: fundHouses.length
    });

  } catch (error) {
    console.error('❌ Error fetching fund houses:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}