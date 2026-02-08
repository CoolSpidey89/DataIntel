import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    index: true
  },
  companyDetails: {
    cin: String,
    gst: String,
    website: String,
    industry: String,
    sector: String,
    turnover: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  facilities: [{
    location: String,
    type: String,
    capacity: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  }],
  productRecommendations: [{
    product: String,
    category: {
      type: String,
      enum: ['Industrial Fuels', 'Specialty Products', 'Other DS Portfolio']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    reasonCodes: [String],
    keywords: [String]
  }],
  signals: [{
    source: String,
    sourceUrl: String,
    sourceType: {
      type: String,
      enum: ['news', 'tender', 'company_website', 'filing', 'directory']
    },
    extractedText: String,
    timestamp: Date,
    keywords: [String]
  }],
  leadScore: {
    total: {
      type: Number,
      default: 0
    },
    intentStrength: Number,
    freshness: Number,
    companySize: Number,
    proximity: Number
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'negotiation', 'won', 'lost', 'rejected'],
    default: 'new'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  territory: String,
  dsro: String,
  depot: String,
  nextAction: {
    action: String,
    dueDate: Date,
    notes: String
  },
  feedback: {
    accepted: Boolean,
    converted: Boolean,
    rejectionReason: String,
    feedbackDate: Date,
    notes: String
  },
  contactAttempts: [{
    date: Date,
    method: String,
    outcome: String,
    notes: String
  }],
  metadata: {
    discoveredAt: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    notificationSentAt: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
leadSchema.index({ status: 1, assignedTo: 1 });
leadSchema.index({ 'leadScore.total': -1 });
leadSchema.index({ 'metadata.discoveredAt': -1 });
leadSchema.index({ urgency: 1 });
leadSchema.index({ territory: 1 });

// Update lastUpdated on save
leadSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  next();
});

export default mongoose.model('Lead', leadSchema);
