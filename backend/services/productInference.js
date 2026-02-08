// Product mapping and inference logic
export const HPCL_PRODUCTS = {
  'Industrial Fuels': {
    'MS': {
      name: 'Motor Spirit',
      keywords: ['motor spirit', 'petrol', 'gasoline', 'ms'],
      useCases: ['automotive', 'generators', 'light vehicles']
    },
    'HSD': {
      name: 'High Speed Diesel',
      keywords: ['diesel', 'hsd', 'high speed diesel'],
      useCases: ['trucks', 'buses', 'generators', 'heavy vehicles', 'captive power']
    },
    'LDO': {
      name: 'Light Diesel Oil',
      keywords: ['ldo', 'light diesel', 'light diesel oil'],
      useCases: ['furnaces', 'boilers', 'kilns', 'industrial heating']
    },
    'FO': {
      name: 'Furnace Oil',
      keywords: ['furnace oil', 'fo', 'fuel oil', 'heavy fuel'],
      useCases: ['boilers', 'furnaces', 'power generation', 'industrial heating', 'captive power']
    },
    'LSHS': {
      name: 'Low Sulphur Heavy Stock',
      keywords: ['lshs', 'low sulphur', 'heavy stock'],
      useCases: ['power plants', 'marine', 'industrial boilers']
    },
    'SKO': {
      name: 'Superior Kerosene Oil',
      keywords: ['kerosene', 'sko', 'superior kerosene'],
      useCases: ['heating', 'lighting', 'industrial applications']
    }
  },
  'Specialty Products': {
    'Hexane': {
      name: 'Hexane',
      keywords: ['hexane', 'n-hexane'],
      useCases: ['solvent extraction', 'oil extraction', 'edible oil', 'vegetable oil extraction']
    },
    'Solvent 1425': {
      name: 'Solvent 1425',
      keywords: ['solvent 1425', 'solvent', 'industrial solvent'],
      useCases: ['paint', 'coating', 'printing ink', 'adhesives']
    },
    'MTO': {
      name: 'Mineral Turpentine Oil',
      keywords: ['turpentine', 'mto', 'mineral turpentine', 'mto 2445'],
      useCases: ['paint thinner', 'solvent', 'cleaning agent']
    },
    'JBO': {
      name: 'Jute Batch Oil',
      keywords: ['jute batch oil', 'jbo', 'jute oil'],
      useCases: ['jute processing', 'jute mills', 'textile']
    }
  },
  'Other DS Portfolio': {
    'Bitumen': {
      name: 'Bitumen',
      keywords: ['bitumen', 'asphalt', 'road construction'],
      useCases: ['road construction', 'highways', 'infrastructure', 'waterproofing']
    },
    'Marine Bunker Fuels': {
      name: 'Marine Bunker Fuels',
      keywords: ['bunker', 'marine fuel', 'shipping fuel', 'vessel fuel'],
      useCases: ['shipping', 'vessels', 'maritime', 'ports']
    },
    'Sulphur': {
      name: 'Sulphur',
      keywords: ['sulphur', 'sulfur', 'molten sulphur'],
      useCases: ['fertilizer', 'chemical', 'pharmaceutical']
    },
    'Propylene': {
      name: 'Propylene',
      keywords: ['propylene', 'propene'],
      useCases: ['petrochemical', 'plastic', 'chemical manufacturing']
    }
  }
};

// Industry to product mapping
export const INDUSTRY_PRODUCT_MAP = {
  'power': ['FO', 'LSHS', 'HSD', 'LDO'],
  'chemicals': ['FO', 'LDO', 'Hexane', 'Solvent 1425', 'Propylene'],
  'fertilizers': ['FO', 'Sulphur', 'HSD'],
  'shipping': ['Marine Bunker Fuels', 'LSHS'],
  'mining': ['HSD', 'FO', 'LDO'],
  'textile': ['JBO', 'FO', 'LDO'],
  'jute': ['JBO'],
  'edible_oil': ['Hexane'],
  'paint': ['Solvent 1425', 'MTO'],
  'road_construction': ['Bitumen', 'HSD'],
  'steel': ['FO', 'LDO'],
  'cement': ['FO', 'LDO', 'Bitumen']
};

// Equipment to product mapping
export const EQUIPMENT_PRODUCT_MAP = {
  'boiler': ['FO', 'LDO', 'LSHS'],
  'furnace': ['FO', 'LDO'],
  'genset': ['HSD', 'FO'],
  'generator': ['HSD', 'FO'],
  'captive power': ['FO', 'HSD', 'LSHS'],
  'diesel generator': ['HSD'],
  'power plant': ['FO', 'LSHS'],
  'extraction plant': ['Hexane'],
  'jute mill': ['JBO'],
  'solvent plant': ['Hexane', 'Solvent 1425']
};

/**
 * Infer product needs from text signals
 */
export function inferProducts(text, industry = null) {
  const recommendations = [];
  const normalizedText = text.toLowerCase();
  
  // Check for direct product mentions
  Object.entries(HPCL_PRODUCTS).forEach(([category, products]) => {
    Object.entries(products).forEach(([productCode, productData]) => {
      const matches = productData.keywords.filter(keyword => 
        normalizedText.includes(keyword.toLowerCase())
      );
      
      if (matches.length > 0) {
        recommendations.push({
          product: productCode,
          productName: productData.name,
          category,
          confidence: Math.min(0.9, 0.6 + (matches.length * 0.1)),
          reasonCodes: [`Direct mention: ${matches.join(', ')}`],
          keywords: matches
        });
      }
    });
  });
  
  // Industry-based inference
  if (industry) {
    const industryProducts = INDUSTRY_PRODUCT_MAP[industry.toLowerCase()] || [];
    industryProducts.forEach(productCode => {
      if (!recommendations.find(r => r.product === productCode)) {
        const productData = findProduct(productCode);
        if (productData) {
          recommendations.push({
            product: productCode,
            productName: productData.name,
            category: productData.category,
            confidence: 0.5,
            reasonCodes: [`Industry match: ${industry}`],
            keywords: []
          });
        }
      }
    });
  }
  
  // Equipment-based inference
  Object.entries(EQUIPMENT_PRODUCT_MAP).forEach(([equipment, products]) => {
    if (normalizedText.includes(equipment)) {
      products.forEach(productCode => {
        const existing = recommendations.find(r => r.product === productCode);
        if (existing) {
          existing.confidence = Math.min(0.95, existing.confidence + 0.15);
          existing.reasonCodes.push(`Equipment match: ${equipment}`);
        } else {
          const productData = findProduct(productCode);
          if (productData) {
            recommendations.push({
              product: productCode,
              productName: productData.name,
              category: productData.category,
              confidence: 0.65,
              reasonCodes: [`Equipment match: ${equipment}`],
              keywords: [equipment]
            });
          }
        }
      });
    }
  });
  
  // Sort by confidence and return top 3
  return recommendations
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function findProduct(productCode) {
  for (const [category, products] of Object.entries(HPCL_PRODUCTS)) {
    if (products[productCode]) {
      return {
        ...products[productCode],
        category
      };
    }
  }
  return null;
}

/**
 * Calculate lead score
 */
export function calculateLeadScore(lead, signals) {
  const scores = {
    intentStrength: 0,
    freshness: 0,
    companySize: 0,
    proximity: 0
  };
  
  // Intent strength (0-30 points)
  const hasTender = signals.some(s => s.sourceType === 'tender');
  const hasMultipleSignals = signals.length > 1;
  scores.intentStrength = hasTender ? 30 : (hasMultipleSignals ? 20 : 10);
  
  // Freshness (0-25 points)
  if (signals.length > 0) {
    const latestSignal = signals.reduce((latest, s) => 
      new Date(s.timestamp) > new Date(latest.timestamp) ? s : latest
    );
    const daysSinceSignal = (Date.now() - new Date(latestSignal.timestamp)) / (1000 * 60 * 60 * 24);
    scores.freshness = Math.max(0, 25 - (daysSinceSignal * 2));
  }
  
  // Company size (0-25 points)
  if (lead.companyDetails?.turnover) {
    const turnover = parseFloat(lead.companyDetails.turnover);
    scores.companySize = turnover > 1000 ? 25 : (turnover > 100 ? 20 : 15);
  } else {
    scores.companySize = 10;
  }
  
  // Proximity placeholder (0-20 points)
  scores.proximity = 15;
  
  const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
  
  return {
    total,
    ...scores
  };
}

/**
 * Determine urgency level
 */
export function determineUrgency(leadScore, signals) {
  const hasTender = signals.some(s => s.sourceType === 'tender');
  const recentSignal = signals.some(s => {
    const daysSince = (Date.now() - new Date(s.timestamp)) / (1000 * 60 * 60 * 24);
    return daysSince < 7;
  });
  
  if (hasTender && recentSignal) return 'critical';
  if (leadScore.total > 70) return 'high';
  if (leadScore.total > 50) return 'medium';
  return 'low';
}
