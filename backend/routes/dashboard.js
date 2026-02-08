import express from 'express';
import Lead from '../models/Lead.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, territory } = req.query;
    
    const filter = {};
    
    if (req.user.role === 'sales_officer') {
      filter.assignedTo = req.user._id;
    } else if (territory) {
      filter.territory = territory;
    }
    
    if (startDate || endDate) {
      filter['metadata.discoveredAt'] = {};
      if (startDate) filter['metadata.discoveredAt'].$gte = new Date(startDate);
      if (endDate) filter['metadata.discoveredAt'].$lte = new Date(endDate);
    }

    // Total leads
    const totalLeads = await Lead.countDocuments(filter);

    // Leads by status
    const leadsByStatus = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Leads by urgency
    const leadsByUrgency = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: '$urgency', count: { $sum: 1 } } }
    ]);

    // Top products
    const topProducts = await Lead.aggregate([
      { $match: filter },
      { $unwind: '$productRecommendations' },
      { $group: { 
        _id: '$productRecommendations.product',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$productRecommendations.confidence' }
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top sectors
    const topSectors = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: '$companyDetails.industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Conversion funnel
    const conversionFunnel = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          contacted: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
          qualified: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
          negotiation: { $sum: { $cond: [{ $eq: ['$status', 'negotiation'] }, 1, 0] } },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } }
        }
      }
    ]);

    // Leads per week (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    
    const leadsPerWeek = await Lead.aggregate([
      { $match: { ...filter, 'metadata.discoveredAt': { $gte: twelveWeeksAgo } } },
      {
        $group: {
          _id: {
            week: { $week: '$metadata.discoveredAt' },
            year: { $year: '$metadata.discoveredAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    // Geography heatmap
    const geographyData = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: '$territory', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average lead score
    const avgLeadScore = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: null, avgScore: { $avg: '$leadScore.total' } } }
    ]);

    res.json({
      totalLeads,
      leadsByStatus,
      leadsByUrgency,
      topProducts,
      topSectors,
      conversionFunnel: conversionFunnel[0] || {},
      leadsPerWeek,
      geographyData,
      avgLeadScore: avgLeadScore[0]?.avgScore || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent activity
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'sales_officer' 
      ? { assignedTo: req.user._id }
      : {};

    const recentLeads = await Lead.find(filter)
      .sort('-metadata.discoveredAt')
      .limit(10)
      .select('companyName status urgency leadScore metadata productRecommendations')
      .lean();

    res.json(recentLeads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
