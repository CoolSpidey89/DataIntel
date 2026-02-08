import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['news', 'tender', 'company_site', 'directory', 'filing', 'industry_portal'],
    required: true
  },
  accessMethod: {
    type: String,
    enum: ['api', 'rss', 'scraping', 'manual'],
    default: 'scraping'
  },
  crawlFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  robotsTxt: String,
  allowedPaths: [String],
  blockedPaths: [String],
  rateLimit: {
    requests: Number,
    period: String
  },
  lastCrawled: Date,
  crawlStatus: {
    type: String,
    enum: ['active', 'paused', 'failed', 'pending'],
    default: 'pending'
  },
  statistics: {
    totalCrawls: { type: Number, default: 0 },
    successfulCrawls: { type: Number, default: 0 },
    failedCrawls: { type: Number, default: 0 },
    leadsGenerated: { type: Number, default: 0 }
  },
  metadata: {
    addedBy: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }
}, {
  timestamps: true
});

sourceSchema.index({ category: 1, crawlStatus: 1 });

export default mongoose.model('Source', sourceSchema);
