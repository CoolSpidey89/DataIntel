# DataIntel- HPCL Lead Intelligence Agent

A comprehensive B2B Lead Intelligence system for HPCL's Direct Sales business that automatically discovers, scores, and manages potential customer leads through intelligent web monitoring and product inference.

## 🎯 Overview

This system monitors public web signals (news, tenders, company websites, industry directories) to identify potential customers for HPCL's Direct Sales portfolio, which includes:

- **Industrial Fuels**: MS, HSD, LDO, FO, LSHS, SKO
- **Specialty Products**: Hexane, Solvent 1425, Mineral Turpentine Oil, Jute Batch Oil
- **Other DS Portfolio**: Bitumen, Marine Bunker Fuels, Sulphur, Propylene

## ✨ Key Features

### 1. **Intelligent Lead Discovery**
- Automated web scraping with policy-safe practices (robots.txt compliance, rate limiting)
- Multi-source aggregation (news, tenders, company sites, directories)
- Entity resolution and company profile building
- Duplicate detection and signal consolidation

### 2. **Product-Need Inference Engine**
- AI-powered keyword extraction
- Industry-to-product mapping
- Equipment-based inference (boilers → FO, gensets → HSD, etc.)
- Confidence scoring with explainable reason codes

### 3. **Lead Scoring & Prioritization**
- Multi-factor scoring algorithm:
  - Intent strength (tender mentions vs. vague signals)
  - Freshness (recency of signals)
  - Company size proxy
  - Geographic proximity to DSRO/depot
- Automatic urgency classification (Critical/High/Medium/Low)

### 4. **Mobile-First Workflow**
- Responsive React interface (PWA-ready)
- Real-time lead queue with filtering
- One-tap actions: call, email, schedule meeting
- Offline caching capability

### 5. **Multi-Channel Notifications**
- WhatsApp alerts (via Twilio - policy compliant)
- SMS notifications
- Email with rich HTML formatting
- Push notifications
- User-configurable preferences

### 6. **Executive Dashboard**
- Real-time analytics and KPIs
- Conversion funnel visualization
- Geographic heatmap
- Top products and sectors analysis
- Weekly lead trends

### 7. **Feedback Loop**
- Lead acceptance/rejection tracking
- Conversion tracking
- Model improvement through historical data

## 🏗️ Architecture

### Backend Stack
- **Framework**: Node.js + Express
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT-based
- **Web Scraping**: Axios + Cheerio
- **Scheduling**: node-cron for periodic scraping
- **Notifications**: Twilio (WhatsApp/SMS), Nodemailer (Email)
- **Logging**: Winston
- **Security**: Helmet, rate limiting

### Frontend Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

### Data Models

#### Lead Schema
```javascript
{
  companyName: String,
  companyDetails: {
    cin, gst, website, industry, sector, turnover, address, coordinates
  },
  facilities: [{ location, type, capacity, coordinates }],
  productRecommendations: [{
    product, category, confidence, reasonCodes, keywords
  }],
  signals: [{
    source, sourceUrl, sourceType, extractedText, timestamp, keywords
  }],
  leadScore: { total, intentStrength, freshness, companySize, proximity },
  urgency: enum['low', 'medium', 'high', 'critical'],
  status: enum['new', 'contacted', 'qualified', 'negotiation', 'won', 'lost'],
  assignedTo: User,
  nextAction: { action, dueDate, notes },
  feedback: { accepted, converted, rejectionReason }
}
```

#### Source Schema
```javascript
{
  domain: String,
  category: enum['news', 'tender', 'company_site', 'directory'],
  accessMethod: enum['api', 'rss', 'scraping'],
  crawlFrequency: enum['hourly', 'daily', 'weekly'],
  trustScore: Number,
  robotsTxt: String,
  rateLimit: { requests, period },
  statistics: { totalCrawls, successfulCrawls, leadsGenerated }
}
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6+
- (Optional) Twilio account for WhatsApp/SMS
- (Optional) SMTP server for emails

### Backend Setup

1. **Clone and install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Key environment variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hpcl-leads
JWT_SECRET=your-secret-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

3. **Start the server**
```bash
npm start          # Production
npm run dev        # Development with nodemon
```

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Start development server**
```bash
npm run dev        # Runs on http://localhost:5173
```

3. **Build for production**
```bash
npm run build
npm run preview    # Preview production build
```

## 📊 Product Inference Logic

### Direct Keyword Matching
The system scans text for product keywords:
- "furnace oil", "fo" → Furnace Oil
- "diesel", "hsd" → High Speed Diesel
- "bitumen" → Bitumen
- "hexane" → Hexane (for oil extraction)

### Industry Mapping
Industry-specific product recommendations:
- **Power** → FO, LSHS, HSD, LDO
- **Chemicals** → FO, Hexane, Propylene
- **Shipping** → Marine Bunker Fuels, LSHS
- **Road Construction** → Bitumen, HSD
- **Jute Mills** → Jute Batch Oil

### Equipment Inference
Equipment mentions trigger relevant products:
- **Boiler** → FO, LDO, LSHS
- **Generator/Genset** → HSD, FO
- **Captive Power** → FO, HSD, LSHS
- **Jute Mill** → JBO

### Confidence Scoring
- Direct keyword match: 60-90% confidence
- Industry match: 50% confidence
- Equipment match: 65% confidence
- Multiple signals boost confidence up to 95%

## 🔒 Security & Compliance

### Web Scraping Best Practices
- ✅ Robots.txt compliance checking
- ✅ Rate limiting (configurable per source)
- ✅ User-agent identification
- ✅ Request logging and provenance tracking
- ✅ Error handling and retry logic
- ✅ Respect for ToS and access policies

### WhatsApp Compliance
- ✅ Opt-in required for WhatsApp notifications
- ✅ Approved message templates
- ✅ 24-hour service window adherence
- ✅ Fallback to SMS/Email if WhatsApp unavailable

### Data Security
- JWT-based authentication
- Password hashing (bcrypt)
- Role-based access control
- Rate limiting on API endpoints
- Helmet.js for HTTP security headers
- Input validation and sanitization

## 📱 Mobile Features

### Responsive Design
- Mobile-first Tailwind CSS layout
- Touch-optimized buttons and interactions
- Collapsible sidebars on mobile

### Offline Support (Planned)
- Service worker for offline caching
- Background sync for updates
- IndexedDB for local storage

### PWA Capabilities
- Installable on mobile devices
- App-like experience
- Push notification support

## 📈 Analytics & Reporting

### Dashboard Metrics
- **Total Leads**: Count of all discovered leads
- **Avg Lead Score**: Mean score across all leads
- **This Week**: New leads in current week
- **High Priority**: Count of high/critical urgency leads

### Visualizations
- **Conversion Funnel**: New → Contacted → Qualified → Won
- **Priority Distribution**: Pie chart of urgency levels
- **Top Products**: Bar chart of most recommended products
- **Top Sectors**: Industry distribution
- **Weekly Trends**: Time series of lead discovery
- **Geographic Heatmap**: Leads by territory

### Exportable Data
Dashboard data can be exported for:
- Monthly reports
- Performance reviews
- Sales forecasting
- Territory planning

## 🔄 Feedback Loop & Model Improvement

The system learns from user feedback:

1. **Acceptance Tracking**: Which leads were valuable?
2. **Conversion Data**: Which leads resulted in sales?
3. **Rejection Reasons**: Why were leads rejected?
4. **Signal Correlation**: Which signals predict conversions?

Future enhancements:
- Machine learning model for improved scoring
- Automatic adjustment of product inference weights
- Source quality scoring based on conversion rates

## 🛠️ API Endpoints

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login - Login
GET /api/auth/me - Get current user
PUT /api/auth/preferences - Update notification preferences
```

### Leads
```
GET /api/leads - List leads (with filters)
GET /api/leads/:id - Get lead details
POST /api/leads - Create new lead
PUT /api/leads/:id - Update lead
POST /api/leads/:id/feedback - Submit feedback
POST /api/leads/:id/contact - Add contact attempt
DELETE /api/leads/:id - Delete lead (admin)
```

### Dashboard
```
GET /api/dashboard/stats - Get dashboard statistics
GET /api/dashboard/activity - Get recent activity
```

### Sources
```
GET /api/sources - List all sources
POST /api/sources - Add new source (admin)
PUT /api/sources/:id - Update source (admin)
DELETE /api/sources/:id - Delete source (admin)
```

### Notifications
```
POST /api/notifications/test - Test notification
```

## 🎨 UI Components

### Pages
- **Dashboard**: Analytics and KPIs
- **Leads**: Lead listing with filters
- **Lead Details**: Complete lead dossier
- **Sources**: Source management
- **Settings**: User preferences

### Reusable Components
- Layout with sidebar navigation
- Auth context provider
- Badge components (urgency, status)
- Card components
- Input components
- Button variants

## 🧪 Testing

### Manual Testing
1. Create sample leads via API
2. Test product inference with various keywords
3. Verify notification delivery
4. Test lead workflow (new → contacted → won)
5. Check dashboard calculations

### Demo Data
The system includes sample data generation:
- 200-500 sample companies
- Various industries and products
- Different signal sources
- Mixed urgency levels

## 🚢 Deployment

### Backend Deployment
```bash
# Build
cd backend
npm install --production

# Set environment variables
export MONGODB_URI=mongodb://your-production-db
export JWT_SECRET=your-secure-secret

# Run with PM2
pm2 start server.js --name hpcl-backend
```

### Frontend Deployment
```bash
cd frontend
npm run build

# Deploy dist/ folder to:
# - Netlify
# - Vercel
# - AWS S3 + CloudFront
# - Your web server
```


## 👥 Team AlphaMinds

Poorvanshi Rawat
Om Parida
Divyam Jain
Bhoomi Chaudhary

Developed for HPCL Productathon Round 3
