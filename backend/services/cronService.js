import cron from 'node-cron';
import Source from '../models/Source.js';
import Lead from '../models/Lead.js';
import webScraperService from './webScraper.js';
import { inferProducts, calculateLeadScore, determineUrgency } from './productInference.js';
import { logger } from '../utils/logger.js';

/**
 * Start cron jobs for periodic web scraping
 */
export function startCronJobs() {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting daily web scraping job');
    await scrapeDailySources();
  });

  // Run hourly scraping for high-frequency sources
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting hourly web scraping job');
    await scrapeHourlySources();
  });

  logger.info('Cron jobs started successfully');
}

/**
 * Scrape daily sources
 */
async function scrapeDailySources() {
  try {
    const sources = await Source.find({
      crawlFrequency: 'daily',
      crawlStatus: 'active'
    });

    for (const source of sources) {
      try {
        await scrapeSourceAndCreateLeads(source);
      } catch (error) {
        logger.error(`Error scraping source ${source.domain}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in daily scraping job:', error);
  }
}

/**
 * Scrape hourly sources
 */
async function scrapeHourlySources() {
  try {
    const sources = await Source.find({
      crawlFrequency: 'hourly',
      crawlStatus: 'active'
    });

    for (const source of sources) {
      try {
        await scrapeSourceAndCreateLeads(source);
      } catch (error) {
        logger.error(`Error scraping source ${source.domain}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in hourly scraping job:', error);
  }
}

/**
 * Scrape a source and create leads
 */
async function scrapeSourceAndCreateLeads(source) {
  logger.info(`Scraping source: ${source.domain}`);
  
  // For news sources
  if (source.category === 'news') {
    const articles = await webScraperService.scrapeNewsSource(`https://${source.domain}`);
    
    for (const article of articles) {
      await createLeadFromSignal(article, source, 'news');
    }
  }
  
  // For tender sources, company sites, etc., implement similar logic
  
  logger.info(`Completed scraping ${source.domain}`);
}

/**
 * Create a lead from a discovered signal
 */
async function createLeadFromSignal(data, source, type) {
  try {
    // Extract company name
    const companyName = data.organization || data.title?.split('-')[0].trim() || 'Unknown Company';
    
    // Check if lead already exists for this company
    const existingLead = await Lead.findOne({ companyName });
    
    const signal = {
      source: source.domain,
      sourceUrl: data.link || `https://${source.domain}`,
      sourceType: type,
      extractedText: data.title + ' ' + data.description,
      timestamp: new Date(),
      keywords: data.keywords || []
    };

    if (existingLead) {
      // Add signal to existing lead
      existingLead.signals.push(signal);
      
      // Recalculate products and score
      const allSignalText = existingLead.signals.map(s => s.extractedText).join(' ');
      existingLead.productRecommendations = inferProducts(allSignalText, existingLead.companyDetails?.industry);
      existingLead.leadScore = calculateLeadScore(existingLead, existingLead.signals);
      existingLead.urgency = determineUrgency(existingLead.leadScore, existingLead.signals);
      
      await existingLead.save();
      logger.info(`Updated existing lead: ${companyName}`);
    } else {
      // Create new lead
      const productRecommendations = inferProducts(signal.extractedText);
      const leadScore = calculateLeadScore({}, [signal]);
      const urgency = determineUrgency(leadScore, [signal]);

      const newLead = new Lead({
        companyName,
        companyDetails: {
          industry: data.industry || null
        },
        signals: [signal],
        productRecommendations,
        leadScore,
        urgency,
        status: 'new'
      });

      await newLead.save();
      
      // Update source statistics
      await Source.updateOne(
        { _id: source._id },
        { $inc: { 'statistics.leadsGenerated': 1 } }
      );
      
      logger.info(`Created new lead: ${companyName}`);
    }
  } catch (error) {
    logger.error('Error creating lead from signal:', error);
  }
}
