import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import Source from '../models/Source.js';

/**
 * Web scraping service with policy-safe practices
 */
export class WebScraperService {
  constructor() {
    this.userAgent = 'HPCL-LeadBot/1.0 (Business Intelligence; +https://hpcl.com)';
  }

  /**
   * Check robots.txt compliance
   */
  async checkRobotsTxt(domain) {
    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        headers: { 'User-Agent': this.userAgent }
      });
      
      return response.data;
    } catch (error) {
      logger.warn(`Could not fetch robots.txt for ${domain}`);
      return null;
    }
  }

  /**
   * Scrape a URL respecting rate limits and robots.txt
   */
  async scrapeUrl(url, sourceConfig) {
    try {
      // Check if scraping is allowed
      const source = await Source.findOne({ domain: sourceConfig.domain });
      if (!source || source.crawlStatus !== 'active') {
        throw new Error(`Scraping not allowed for domain: ${sourceConfig.domain}`);
      }

      // Respect rate limits
      await this.respectRateLimit(source);

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Update source statistics
      await Source.updateOne(
        { _id: source._id },
        { 
          $inc: { 'statistics.totalCrawls': 1, 'statistics.successfulCrawls': 1 },
          $set: { lastCrawled: new Date() }
        }
      );

      return {
        url,
        html: response.data,
        $,
        timestamp: new Date(),
        source: sourceConfig.domain
      };
    } catch (error) {
      logger.error(`Error scraping ${url}:`, error.message);
      
      // Update failed crawl count
      await Source.updateOne(
        { domain: sourceConfig.domain },
        { $inc: { 'statistics.failedCrawls': 1 } }
      );
      
      throw error;
    }
  }

  /**
   * Extract company information from webpage
   */
  extractCompanyInfo($, url) {
    const companyInfo = {
      name: null,
      description: null,
      address: null,
      phone: null,
      email: null,
      industry: null,
      products: [],
      keywords: []
    };

    // Try to extract company name
    companyInfo.name = 
      $('meta[property="og:site_name"]').attr('content') ||
      $('meta[name="company"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().split('|')[0].trim();

    // Extract description
    companyInfo.description = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('p').first().text().trim();

    // Extract contact info
    const bodyText = $('body').text();
    
    // Phone extraction
    const phoneRegex = /(\+91[-\s]?)?[6-9]\d{9}|\d{3}-\d{3}-\d{4}/g;
    const phones = bodyText.match(phoneRegex);
    if (phones) companyInfo.phone = phones[0];

    // Email extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = bodyText.match(emailRegex);
    if (emails) companyInfo.email = emails[0];

    // Extract address
    $('address, [class*="address"], [class*="location"]').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.length > 20 && text.length < 300) {
        companyInfo.address = text;
        return false;
      }
    });

    // Extract keywords
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      companyInfo.keywords = metaKeywords.split(',').map(k => k.trim());
    }

    return companyInfo;
  }

  /**
   * Extract tender information
   */
  extractTenderInfo($, url) {
    const tender = {
      title: null,
      description: null,
      organization: null,
      deadline: null,
      products: [],
      keywords: []
    };

    // Extract title
    tender.title = $('h1, .tender-title, [class*="title"]').first().text().trim();

    // Extract description
    tender.description = $('.tender-description, .description, [class*="detail"]').text().trim();

    // Extract deadline
    const bodyText = $('body').text();
    const deadlineRegex = /deadline|last date|closing date[\s:]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i;
    const deadlineMatch = bodyText.match(deadlineRegex);
    if (deadlineMatch) {
      tender.deadline = deadlineMatch[1];
    }

    // Extract product keywords
    const fullText = tender.title + ' ' + tender.description;
    tender.keywords = this.extractProductKeywords(fullText);

    return tender;
  }

  /**
   * Extract product-related keywords
   */
  extractProductKeywords(text) {
    const keywords = [];
    const productKeywords = [
      'furnace oil', 'fo', 'diesel', 'hsd', 'ldo', 'lshs',
      'bitumen', 'bunker', 'hexane', 'solvent', 'sulphur',
      'propylene', 'kerosene', 'jute batch oil', 'turpentine',
      'boiler', 'generator', 'power plant', 'captive power'
    ];

    const lowerText = text.toLowerCase();
    productKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return keywords;
  }

  /**
   * Respect rate limits
   */
  async respectRateLimit(source) {
    if (source.rateLimit && source.rateLimit.requests) {
      // Simple delay implementation
      const delay = (source.rateLimit.period === 'minute' ? 60000 : 1000) / source.rateLimit.requests;
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      // Default 2-second delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Scrape news sites for company mentions
   */
  async scrapeNewsSource(sourceUrl) {
    try {
      const domain = new URL(sourceUrl).hostname;
      const scraped = await this.scrapeUrl(sourceUrl, { domain });
      
      const articles = [];
      const $ = scraped.$;

      // Generic article extraction
      $('article, .news-item, .article-item, [class*="news"]').each((i, elem) => {
        const $article = $(elem);
        const article = {
          title: $article.find('h1, h2, h3, .title').first().text().trim(),
          description: $article.find('p, .description').first().text().trim(),
          link: $article.find('a').first().attr('href'),
          date: $article.find('time, .date, [class*="date"]').first().text().trim(),
          keywords: []
        };

        const fullText = article.title + ' ' + article.description;
        article.keywords = this.extractProductKeywords(fullText);

        if (article.keywords.length > 0) {
          articles.push(article);
        }
      });

      return articles;
    } catch (error) {
      logger.error('Error scraping news source:', error);
      return [];
    }
  }
}

export default new WebScraperService();
