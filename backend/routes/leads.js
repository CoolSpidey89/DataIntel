import express from 'express';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import { inferProducts, calculateLeadScore, determineUrgency } from '../services/productInference.js';
import notificationService from '../services/notificationService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all leads with filtering and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      status,
      urgency,
      assignedTo,
      territory,
      page = 1,
      limit = 20,
      sortBy = '-metadata.discoveredAt'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (territory) filter.territory = territory;

    // Sales officers only see their own leads
    if (req.user.role === 'sales_officer') {
      filter.assignedTo = req.user._id;
    }

    const leads = await Lead.find(filter)
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('assignedTo', 'name email territory')
      .exec();

    const count = await Lead.countDocuments(filter);

    res.json({
      leads,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single lead by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email phone territory');

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Check authorization
    if (req.user.role === 'sales_officer' && lead.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this lead' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new lead
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      companyName,
      companyDetails,
      facilities,
      signals,
      territory,
      dsro,
      depot
    } = req.body;

    // Infer products from signals
    const allSignalText = signals.map(s => s.extractedText).join(' ');
    const productRecommendations = inferProducts(allSignalText, companyDetails?.industry);

    // Calculate lead score
    const leadScore = calculateLeadScore({ companyDetails }, signals);

    // Determine urgency
    const urgency = determineUrgency(leadScore, signals);

    // Find appropriate sales officer for territory
    const assignedUser = await User.findOne({ 
      territory,
      role: 'sales_officer',
      isActive: true 
    });

    // Suggest next action
    const nextAction = {
      action: signals.some(s => s.sourceType === 'tender') 
        ? 'Review tender requirements and prepare proposal'
        : 'Initial contact call to introduce HPCL products',
      dueDate: new Date(Date.now() + (urgency === 'critical' ? 1 : 3) * 24 * 60 * 60 * 1000)
    };

    const lead = new Lead({
      companyName,
      companyDetails,
      facilities,
      signals,
      productRecommendations,
      leadScore,
      urgency,
      assignedTo: assignedUser?._id,
      territory,
      dsro,
      depot,
      nextAction,
      status: 'new'
    });

    await lead.save();

    // Send notifications to assigned user
    if (assignedUser) {
      const notificationResults = await notificationService.sendNotification(assignedUser, lead);
      lead.metadata.notificationSent = true;
      lead.metadata.notificationSentAt = new Date();
      await lead.save();
    }

    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lead
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Check authorization
    if (req.user.role === 'sales_officer' && lead.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this lead' });
    }

    const allowedUpdates = [
      'status',
      'nextAction',
      'contactAttempts',
      'companyDetails',
      'facilities'
    ];

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        lead[key] = req.body[key];
      }
    });

    await lead.save();
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit feedback on lead
router.post('/:id/feedback', authMiddleware, async (req, res) => {
  try {
    const { accepted, converted, rejectionReason, notes } = req.body;
    
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.feedback = {
      accepted,
      converted,
      rejectionReason,
      notes,
      feedbackDate: new Date()
    };

    if (converted) {
      lead.status = 'won';
    } else if (!accepted) {
      lead.status = 'rejected';
    }

    await lead.save();
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add contact attempt
router.post('/:id/contact', authMiddleware, async (req, res) => {
  try {
    const { method, outcome, notes } = req.body;
    
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.contactAttempts.push({
      date: new Date(),
      method,
      outcome,
      notes
    });

    if (outcome === 'connected') {
      lead.status = 'contacted';
    }

    await lead.save();
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lead (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
