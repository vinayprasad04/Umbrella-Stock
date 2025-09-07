const { connectToDatabase } = require('@/lib/db');

/**
 * API endpoint to get all unique mutual fund categories
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

    // Get distinct categories with counts
    const categoriesWithCounts = await collection.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    // Format the response
    const categories = categoriesWithCounts.map(item => ({
      value: item._id,
      label: item._id,
      count: item.count
    }));

    console.log(`📊 Found ${categories.length} categories`);

    return res.status(200).json({
      success: true,
      data: categories,
      total: categories.length
    });

  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}