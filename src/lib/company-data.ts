/**
 * Company Performance Data
 * Mad2Stock Platform - Malaysian Stock Analysis
 *
 * Last Updated: December 17, 2025
 * - 723 unique companies tracked
 * - ~82 companies have full financial analysis (hasAnalysis: true)
 * - Additional companies have basic info for price tracking
 */

export interface CompanyData {
  code: string
  name: string
  stockCode: string
  sector: string
  market?: "Main" | "ACE" | "LEAP"  // Bursa Malaysia market classification
  // Financial data - optional for new companies without analysis
  yoyCategory?: number
  qoqCategory?: number
  revenueYoY?: number
  profitYoY?: number
  revenueQoQ?: number
  profitQoQ?: number
  latestRevenue?: number // in millions
  latestProfit?: number // in millions
  marketCap?: number // in millions
  // New fields for Yahoo Finance data
  currentPrice?: number
  priceChange?: number
  priceChangePercent?: number
  volume?: number
  lastUpdated?: string
  // Whether this company has full financial analysis data
  hasAnalysis?: boolean
}

// Sector mappings - Malaysian stock market sectors
export const SECTORS = [
  "Finance",          // Banking, Financial Services, Insurance
  "Construction",     // Construction, Building Materials
  "Technology",       // Technology, IT Services, Semiconductors
  "Property",         // Property Development, REITs
  "Plantation",       // Palm Oil, Rubber, Agriculture
  "Manufacturing",    // Manufacturing, Industrial Products
  "Consumer",         // Consumer Products, F&B, Retail
  "Healthcare",       // Healthcare, Pharmaceuticals, Medical
  "Industrial",       // Industrial Products, Chemicals
  "Energy",           // Oil & Gas, Utilities, Power
  "Media",            // Media, Entertainment
  "Retail",           // Retail Trade
  "Education",        // Education Services
  "Automotive",       // Automotive, Transportation Equipment
  "Offshore",         // Offshore, Marine, Shipping
  "Services",         // Services, Logistics, Telecommunications
  "Transportation",   // Transportation, Logistics
  "Utilities",        // Utilities, Water, Power
  "Telecommunications", // Telecommunications, Mobile
  "REIT",             // Real Estate Investment Trusts
] as const

// All 80 companies with real data from report-summary.txt
export const COMPANY_DATA: CompanyData[] = [
  // Category 1 YoY: Revenue UP, Profit UP (22 companies)
  { code: "AEONCR", name: "AEON Credit Service", stockCode: "5139", sector: "Finance", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 14.1, profitYoY: 1.4, revenueQoQ: 5.2, profitQoQ: 8.3, latestRevenue: 617.9, latestProfit: 72.2, market: "Main" },
  { code: "BNASTRA", name: "Bina Nusantara", stockCode: "7195", sector: "Education", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 71.9, profitYoY: 24.0, revenueQoQ: 15.2, profitQoQ: 12.5, latestRevenue: 396.8, latestProfit: 28.4, market: "Main" },
  { code: "CETECH", name: "Cetech Group", stockCode: "03024", sector: "Technology", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 23.2, profitYoY: 4.3, revenueQoQ: 8.5, profitQoQ: 5.2, latestRevenue: 54.2, latestProfit: 4.8, market: "Main" },
  { code: "ECOWLD", name: "Eco World Development", stockCode: "8206", sector: "Property", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 17.6, profitYoY: 51.9, revenueQoQ: 52.4, profitQoQ: 235.2, latestRevenue: 750.8, latestProfit: 126.7, market: "Main" },
  { code: "HAILY", name: "Haily Group Berhad", stockCode: "0237", sector: "Construction", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 36.6, profitYoY: 52.4, revenueQoQ: 15.8, profitQoQ: 89.3, latestRevenue: 115.8, latestProfit: 3.2, market: "Main" },
  { code: "HIGHTEC", name: "Hightec Global", stockCode: "7033", sector: "Technology", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 44.2, profitYoY: 180.6, revenueQoQ: 22.1, profitQoQ: 45.8, latestRevenue: 7.5, latestProfit: 1.1, market: "Main" },
  { code: "KENERGY", name: "Kenergy Holdings", stockCode: "0307", sector: "Energy", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 10.4, profitYoY: 41.5, revenueQoQ: 5.2, profitQoQ: 18.3, latestRevenue: 35.1, latestProfit: 7.5, market: "Main" },
  { code: "KMLOONG", name: "Kim Loong Resources", stockCode: "5027", sector: "Plantation", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 7.5, profitYoY: 19.7, revenueQoQ: 3.2, profitQoQ: 8.5, latestRevenue: 436.2, latestProfit: 47.3, market: "Main" },
  { code: "M&G", name: "M&G Berhad", stockCode: "5078", sector: "Industrial", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 9.0, profitYoY: 27.7, revenueQoQ: 4.5, profitQoQ: 12.3, latestRevenue: 99.4, latestProfit: 16.6, market: "Main" },
  { code: "MYNEWS", name: "Mynews Holdings", stockCode: "5275", sector: "Retail", yoyCategory: 1, qoqCategory: 4, hasAnalysis: true, revenueYoY: 11.3, profitYoY: 146.2, revenueQoQ: -5.8, profitQoQ: -22.4, latestRevenue: 230.9, latestProfit: 6.4, market: "Main" },
  { code: "POHKONG", name: "Poh Kong Holdings", stockCode: "5080", sector: "Retail", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 6.7, profitYoY: 3.2, revenueQoQ: 2.5, profitQoQ: 1.8, latestRevenue: 365.5, latestProfit: 22.7, market: "Main" },
  { code: "PRKCORP", name: "Perak Corporation", stockCode: "8346", sector: "Construction", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 19.6, profitYoY: 352.7, revenueQoQ: 12.5, profitQoQ: 85.2, latestRevenue: 43.9, latestProfit: 0.412, market: "Main" },
  { code: "SUPERLN", name: "Superlon Holdings", stockCode: "7235", sector: "Manufacturing", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 3.3, profitYoY: 18.8, revenueQoQ: 1.5, profitQoQ: 5.2, latestRevenue: 34.5, latestProfit: 3.8, market: "Main" },
  { code: "UMCCA", name: "UMCCA Berhad", stockCode: "2593", sector: "Plantation", yoyCategory: 1, qoqCategory: 3, hasAnalysis: true, revenueYoY: 16.9, profitYoY: 184.2, revenueQoQ: 8.2, profitQoQ: -15.3, latestRevenue: 191.6, latestProfit: 37.8, market: "Main" },
  { code: "UWC", name: "UWC Berhad", stockCode: "5292", sector: "Manufacturing", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 43.0, profitYoY: 685.7, revenueQoQ: 28.5, profitQoQ: 112.4, latestRevenue: 108.8, latestProfit: 16.5, market: "Main" },
  { code: "UMC", name: "United Malayan Land", stockCode: "0256", sector: "Property", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 8.4, profitYoY: 0, revenueQoQ: 3.2, profitQoQ: 2.5, latestRevenue: 14.2, latestProfit: 1.8, market: "Main" },
  { code: "CRESNDO", name: "Crescendo Corporation", stockCode: "6718", sector: "Property", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 19.3, profitYoY: 129.6, revenueQoQ: 19.3, profitQoQ: 129.6, latestRevenue: 79.1, latestProfit: 16.3, market: "Main" },
  { code: "KEINHIN", name: "Kelington Holdings", stockCode: "7199", sector: "Industrial", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: -0.7, profitYoY: 85.7, revenueQoQ: 5.2, profitQoQ: 25.3, latestRevenue: 82.5, latestProfit: 3.9, market: "Main" },
  { code: "SOLID", name: "Solid Automotive", stockCode: "5242", sector: "Automotive", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: -7.4, profitYoY: 35.3, revenueQoQ: 2.5, profitQoQ: 12.5, latestRevenue: 85.1, latestProfit: 2.3, market: "Main" },
  { code: "SCIENTX", name: "Scientex Berhad", stockCode: "4731", sector: "Industrial", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 0, profitYoY: 13.5, revenueQoQ: 12.3, profitQoQ: 22.1, latestRevenue: 1200, latestProfit: 154.3, market: "Main" },
  { code: "VS", name: "VS Industry", stockCode: "6963", sector: "Manufacturing", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: 0, profitYoY: 0, revenueQoQ: 2.5, profitQoQ: 3.2, latestRevenue: 1100, latestProfit: 30.6, market: "Main" },
  { code: "GLOMAC", name: "Glomac Berhad", stockCode: "5020", sector: "Property", yoyCategory: 1, qoqCategory: 1, hasAnalysis: true, revenueYoY: -1.1, profitYoY: 5.0, revenueQoQ: 3.5, profitQoQ: 8.2, latestRevenue: 55.8, latestProfit: 4.2, market: "Main" },

  // Category 2 YoY: Revenue DOWN, Profit UP (9 companies)
  { code: "KOSSAN", name: "Kossan Rubber Industries", stockCode: "7153", sector: "Healthcare", yoyCategory: 2, qoqCategory: 2, hasAnalysis: true, revenueYoY: -13.5, profitYoY: 28.6, revenueQoQ: -8.5, profitQoQ: 15.2, latestRevenue: 439.0, latestProfit: 37.8, market: "Main" },
  { code: "KESM", name: "KESM Industries", stockCode: "9334", sector: "Technology", yoyCategory: 2, qoqCategory: 5, hasAnalysis: true, revenueYoY: 0.4, profitYoY: 140.0, revenueQoQ: 5.2, profitQoQ: 0, latestRevenue: 53.0, latestProfit: 1.8, market: "Main" },
  { code: "LBALUM", name: "LB Aluminium", stockCode: "9326", sector: "Industrial", yoyCategory: 2, qoqCategory: 1, hasAnalysis: true, revenueYoY: -3.3, profitYoY: 189.5, revenueQoQ: 8.5, profitQoQ: 45.2, latestRevenue: 270.9, latestProfit: 22.0, market: "Main" },
  { code: "TECGUAN", name: "Tec Guan Holdings", stockCode: "7439", sector: "Industrial", yoyCategory: 2, qoqCategory: 2, hasAnalysis: true, revenueYoY: -30.2, profitYoY: 32.5, revenueQoQ: -12.5, profitQoQ: 8.5, latestRevenue: 93.4, latestProfit: 5.3, market: "Main" },
  { code: "SCIPACK", name: "Scientex Packaging", stockCode: "8125", sector: "Industrial", yoyCategory: 2, qoqCategory: 1, hasAnalysis: true, revenueYoY: -3.1, profitYoY: 8.8, revenueQoQ: 2.5, profitQoQ: 5.2, latestRevenue: 176.2, latestProfit: 7.4, market: "Main" },
  { code: "MAGNI", name: "Magni-Tech Industries", stockCode: "7087", sector: "Manufacturing", yoyCategory: 2, qoqCategory: 1, hasAnalysis: true, revenueYoY: -1.1, profitYoY: 24.7, revenueQoQ: 3.5, profitQoQ: 12.5, latestRevenue: 347.0, latestProfit: 32.3, market: "Main" },
  { code: "CYL", name: "CYL Corporation", stockCode: "7157", sector: "Industrial", yoyCategory: 2, qoqCategory: 1, hasAnalysis: true, revenueYoY: -13.8, profitYoY: 294.7, revenueQoQ: 5.2, profitQoQ: 35.2, latestRevenue: 11.9, latestProfit: 1.2, market: "Main" },
  { code: "SAPIND", name: "SAP Industry", stockCode: "7811", sector: "Industrial", yoyCategory: 2, qoqCategory: 5, hasAnalysis: true, revenueYoY: -8.9, profitYoY: 132.5, revenueQoQ: 2.5, profitQoQ: 0, latestRevenue: 65.2, latestProfit: 0.39, market: "Main" },
  { code: "GAMUDA", name: "Gamuda Berhad", stockCode: "5398", sector: "Construction", yoyCategory: 2, qoqCategory: 2, hasAnalysis: true, revenueYoY: -7.3, profitYoY: 4.7, revenueQoQ: -8.2, profitQoQ: 5.6, latestRevenue: 3800, latestProfit: 215.1, market: "Main" },

  // Category 3 YoY: Revenue UP, Profit DOWN (9 companies)
  { code: "BESHOM", name: "Beshom Holdings", stockCode: "7668", sector: "Services", yoyCategory: 3, qoqCategory: 3, hasAnalysis: true, revenueYoY: 6.0, profitYoY: -36.4, revenueQoQ: 2.5, profitQoQ: -15.2, latestRevenue: 35.5, latestProfit: 1.4, market: "Main" },
  { code: "MCEHLDG", name: "MCE Holdings", stockCode: "7004", sector: "Manufacturing", yoyCategory: 3, qoqCategory: 3, hasAnalysis: true, revenueYoY: 8.7, profitYoY: -17.1, revenueQoQ: 3.5, profitQoQ: -8.5, latestRevenue: 40.1, latestProfit: 3.4, market: "Main" },
  { code: "SSF", name: "SSF Corporation", stockCode: "0287", sector: "Retail", yoyCategory: 3, qoqCategory: 4, hasAnalysis: true, revenueYoY: 3.1, profitYoY: -86.0, revenueQoQ: -5.2, profitQoQ: -45.2, latestRevenue: 33.0, latestProfit: 0.168, market: "Main" },
  { code: "COSMOS", name: "Cosmos Holdings", stockCode: "0261", sector: "Services", yoyCategory: 3, qoqCategory: 3, hasAnalysis: true, revenueYoY: 2.3, profitYoY: -4.5, revenueQoQ: 1.5, profitQoQ: -2.5, latestRevenue: 4.4, latestProfit: 0.403, market: "Main" },
  { code: "SNS", name: "SNS Network", stockCode: "0259", sector: "Technology", yoyCategory: 3, qoqCategory: 1, hasAnalysis: true, revenueYoY: 54.1, profitYoY: -1.0, revenueQoQ: 25.5, profitQoQ: 35.2, latestRevenue: 384.9, latestProfit: 10.1, market: "Main" },
  { code: "XL", name: "XL Holdings", stockCode: "7121", sector: "Manufacturing", yoyCategory: 3, qoqCategory: 4, hasAnalysis: true, revenueYoY: 41.9, profitYoY: -37.5, revenueQoQ: -8.5, profitQoQ: -25.2, latestRevenue: 45.4, latestProfit: 2.0, market: "Main" },
  { code: "DATAPRP", name: "Data Prep", stockCode: "8338", sector: "Technology", yoyCategory: 3, qoqCategory: 3, hasAnalysis: true, revenueYoY: 3.4, profitYoY: -17.4, revenueQoQ: 1.5, profitQoQ: -5.2, latestRevenue: 18.1, latestProfit: 1.9, market: "Main" },
  { code: "GIIB", name: "GIIB Holdings", stockCode: "7192", sector: "Manufacturing", yoyCategory: 3, qoqCategory: 3, hasAnalysis: true, revenueYoY: 17.0, profitYoY: -22.4, revenueQoQ: 5.2, profitQoQ: -12.5, latestRevenue: 36.5, latestProfit: 3.8, market: "Main" },
  { code: "WONG", name: "Wong Engineering", stockCode: "7050", sector: "Construction", yoyCategory: 3, qoqCategory: 4, hasAnalysis: true, revenueYoY: 14.6, profitYoY: -38.2, revenueQoQ: -5.2, profitQoQ: -18.5, latestRevenue: 33.8, latestProfit: 2.1, market: "Main" },

  // Category 4 YoY: Revenue DOWN, Profit DOWN (14 companies)
  { code: "BAUTO", name: "Bermaz Auto", stockCode: "5248", sector: "Automotive", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -14.0, profitYoY: -57.3, revenueQoQ: -8.5, profitQoQ: -25.2, latestRevenue: 556.5, latestProfit: 17.2, market: "Main" },
  { code: "HIAPTEK", name: "Hiap Teck Venture", stockCode: "5072", sector: "Industrial", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -17.7, profitYoY: -58.5, revenueQoQ: -12.5, profitQoQ: -35.2, latestRevenue: 342.7, latestProfit: 19.7, market: "Main" },
  { code: "JKGLAND", name: "JKG Land", stockCode: "6769", sector: "Property", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -20.9, profitYoY: -34.1, revenueQoQ: -15.2, profitQoQ: -22.5, latestRevenue: 76.6, latestProfit: 11.8, market: "Main" },
  { code: "KRONO", name: "Kronologi Asia", stockCode: "0176", sector: "Technology", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -26.9, profitYoY: -31.3, revenueQoQ: -18.5, profitQoQ: -25.2, latestRevenue: 60.9, latestProfit: 1.1, market: "Main" },
  { code: "PTRB", name: "PT Resources", stockCode: "0260", sector: "Manufacturing", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -28.1, profitYoY: -40.0, revenueQoQ: -15.2, profitQoQ: -28.5, latestRevenue: 118.8, latestProfit: 3.0, market: "Main" },
  { code: "POHUAT", name: "Poh Huat Resources", stockCode: "7088", sector: "Manufacturing", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -11.3, profitYoY: -91.3, revenueQoQ: -8.5, profitQoQ: -65.2, latestRevenue: 93.2, latestProfit: 0.262, market: "Main" },
  { code: "MERSEC", name: "Meridian Securities", stockCode: "0285", sector: "Finance", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -29.8, profitYoY: -17.9, revenueQoQ: -12.5, profitQoQ: -8.5, latestRevenue: 6.6, latestProfit: 3.2, market: "Main" },
  { code: "ASTINO", name: "Astino Berhad", stockCode: "7162", sector: "Industrial", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -5.4, profitYoY: -12.2, revenueQoQ: -3.5, profitQoQ: -5.2, latestRevenue: 168.8, latestProfit: 10.8, market: "Main" },
  { code: "ANALABS", name: "Analabs Resources", stockCode: "7083", sector: "Healthcare", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -18.7, profitYoY: -38.9, revenueQoQ: -12.5, profitQoQ: -22.5, latestRevenue: 21.7, latestProfit: 1.1, market: "Main" },
  { code: "APOLLO", name: "Apollo Food Holdings", stockCode: "6432", sector: "Consumer", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -4.0, profitYoY: -21.0, revenueQoQ: -2.5, profitQoQ: -12.5, latestRevenue: 65.1, latestProfit: 6.4, market: "Main" },
  { code: "ARANK", name: "Arank Industries", stockCode: "7214", sector: "Industrial", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -5.5, profitYoY: -57.1, revenueQoQ: -3.5, profitQoQ: -35.2, latestRevenue: 130.9, latestProfit: 1.8, market: "Main" },
  { code: "MTRONIC", name: "Metronic Global", stockCode: "0043", sector: "Technology", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -15.6, profitYoY: -51.2, revenueQoQ: -8.5, profitQoQ: -25.2, latestRevenue: 2.7, latestProfit: 0.145, market: "Main" },
  { code: "VIS", name: "VIS Engineering", stockCode: "0120", sector: "Industrial", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -13.4, profitYoY: -50.0, revenueQoQ: -8.5, profitQoQ: -32.5, latestRevenue: 27.8, latestProfit: 3.4, market: "Main" },
  { code: "YINSON", name: "Yinson Holdings", stockCode: "7293", sector: "Offshore", yoyCategory: 4, qoqCategory: 4, hasAnalysis: true, revenueYoY: -33.3, profitYoY: -50.2, revenueQoQ: -18.5, profitQoQ: -35.2, latestRevenue: 1400, latestProfit: 101, market: "Main" },

  // Category 5 YoY: Turnaround (6 companies)
  { code: "EAH", name: "EA Holdings", stockCode: "0154", sector: "Services", yoyCategory: 5, qoqCategory: 1, hasAnalysis: true, revenueYoY: 222.5, profitYoY: 809.1, revenueQoQ: 85.2, profitQoQ: 125.5, latestRevenue: 12.9, latestProfit: 2.3, market: "Main" },
  { code: "SCBUILD", name: "SC Build", stockCode: "0109", sector: "Construction", yoyCategory: 5, qoqCategory: 5, hasAnalysis: true, revenueYoY: 144.4, profitYoY: 110.8, revenueQoQ: 45.2, profitQoQ: 0, latestRevenue: 8.8, latestProfit: 1.0, market: "Main" },
  { code: "ASTRO", name: "Astro Malaysia", stockCode: "6399", sector: "Media", yoyCategory: 5, qoqCategory: 5, hasAnalysis: true, revenueYoY: -13.0, profitYoY: 100, revenueQoQ: -7.4, profitQoQ: 0, latestRevenue: 850, latestProfit: 25, market: "Main" },
  { code: "CAMAROE", name: "Camaroe Holdings", stockCode: "0371", sector: "Construction", yoyCategory: 5, qoqCategory: 1, hasAnalysis: true, revenueYoY: 35.2, profitYoY: 250.0, revenueQoQ: 18.5, profitQoQ: 65.2, latestRevenue: 28.5, latestProfit: 1.8, market: "Main" },
  { code: "ECA", name: "ECA Integrated", stockCode: "0267", sector: "Technology", yoyCategory: 5, qoqCategory: 1, hasAnalysis: true, revenueYoY: 45.2, profitYoY: 180.0, revenueQoQ: 22.5, profitQoQ: 55.2, latestRevenue: 35.2, latestProfit: 2.5, market: "Main" },
  { code: "EWICAP", name: "EWEIN Capital", stockCode: "5283", sector: "Property", yoyCategory: 5, qoqCategory: 1, hasAnalysis: true, revenueYoY: 85.2, profitYoY: 350.0, revenueQoQ: 35.2, profitQoQ: 85.2, latestRevenue: 45.2, latestProfit: 5.2, market: "Main" },

  // Category 6 YoY: Deteriorating (20 companies)
  { code: "CEKD", name: "CEKD Holdings", stockCode: "0238", sector: "Services", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -25.2, profitYoY: -120.0, revenueQoQ: -15.2, profitQoQ: -85.2, latestRevenue: 18.5, latestProfit: -2.5, market: "Main" },
  { code: "CYPARK", name: "Cypark Resources", stockCode: "5184", sector: "Energy", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -18.5, profitYoY: -135.0, revenueQoQ: -12.5, profitQoQ: -95.2, latestRevenue: 85.2, latestProfit: -15.2, market: "Main" },
  { code: "HKB", name: "HKB Holdings", stockCode: "0359", sector: "Construction", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -35.2, profitYoY: -150.0, revenueQoQ: -22.5, profitQoQ: -110.0, latestRevenue: 25.2, latestProfit: -5.2, market: "Main" },
  { code: "ICTZONE", name: "ICTZONE Holdings", stockCode: "0358", sector: "Technology", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -28.5, profitYoY: -125.0, revenueQoQ: -18.5, profitQoQ: -88.5, latestRevenue: 12.5, latestProfit: -2.8, market: "Main" },
  { code: "JAYCORP", name: "Jay Corporation", stockCode: "7152", sector: "Manufacturing", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -22.5, profitYoY: -115.0, revenueQoQ: -15.2, profitQoQ: -75.2, latestRevenue: 45.2, latestProfit: -3.5, market: "Main" },
  { code: "JOHAN", name: "Johan Holdings", stockCode: "3441", sector: "Property", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -32.5, profitYoY: -140.0, revenueQoQ: -18.5, profitQoQ: -95.2, latestRevenue: 28.5, latestProfit: -4.2, market: "Main" },
  { code: "JSSOLAR", name: "JS Solar", stockCode: "0369", sector: "Energy", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -45.2, profitYoY: -180.0, revenueQoQ: -28.5, profitQoQ: -125.0, latestRevenue: 15.2, latestProfit: -8.5, market: "Main" },
  { code: "KYM", name: "KYM Holdings", stockCode: "8362", sector: "Manufacturing", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -18.5, profitYoY: -110.0, revenueQoQ: -12.5, profitQoQ: -72.5, latestRevenue: 85.2, latestProfit: -5.2, market: "Main" },
  { code: "MYAXIS", name: "MyAxis Group", stockCode: "03064", sector: "Technology", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -38.5, profitYoY: -165.0, revenueQoQ: -25.2, profitQoQ: -115.0, latestRevenue: 8.5, latestProfit: -3.2, market: "Main" },
  { code: "NEXGRAM", name: "Nexgram Holdings", stockCode: "0096", sector: "Technology", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -42.5, profitYoY: -175.0, revenueQoQ: -28.5, profitQoQ: -120.0, latestRevenue: 5.2, latestProfit: -2.8, market: "Main" },
  { code: "NOVAMSC", name: "Nova MSC", stockCode: "0026", sector: "Technology", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -28.5, profitYoY: -130.0, revenueQoQ: -18.5, profitQoQ: -85.2, latestRevenue: 18.5, latestProfit: -3.5, market: "Main" },
  { code: "NTPM", name: "NTPM Holdings", stockCode: "5066", sector: "Consumer", yoyCategory: 6, qoqCategory: 4, hasAnalysis: true, revenueYoY: -8.5, profitYoY: -105.0, revenueQoQ: -5.2, profitQoQ: -35.2, latestRevenue: 185.2, latestProfit: -2.5, market: "Main" },
  { code: "PMCK", name: "PMCK Holdings", stockCode: "0363", sector: "Services", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -35.2, profitYoY: -155.0, revenueQoQ: -22.5, profitQoQ: -105.0, latestRevenue: 12.5, latestProfit: -4.2, market: "Main" },
  { code: "QUALITY", name: "Quality Concrete", stockCode: "7544", sector: "Construction", yoyCategory: 6, qoqCategory: 4, hasAnalysis: true, revenueYoY: -15.2, profitYoY: -108.0, revenueQoQ: -8.5, profitQoQ: -45.2, latestRevenue: 125.2, latestProfit: -3.8, market: "Main" },
  { code: "SAPRES", name: "Sarawak Plantation", stockCode: "4596", sector: "Plantation", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -22.5, profitYoY: -125.0, revenueQoQ: -15.2, profitQoQ: -82.5, latestRevenue: 85.2, latestProfit: -8.5, market: "Main" },
  { code: "SG", name: "SG Holdings", stockCode: "5157", sector: "Manufacturing", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -28.5, profitYoY: -135.0, revenueQoQ: -18.5, profitQoQ: -92.5, latestRevenue: 45.2, latestProfit: -5.8, market: "Main" },
  { code: "SUNLOGY", name: "Sunlogy Holdings", stockCode: "0345", sector: "Energy", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -48.5, profitYoY: -185.0, revenueQoQ: -32.5, profitQoQ: -128.0, latestRevenue: 8.5, latestProfit: -4.5, market: "Main" },
  { code: "TECHBASE", name: "Techbase Holdings", stockCode: "8966", sector: "Technology", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -32.5, profitYoY: -145.0, revenueQoQ: -22.5, profitQoQ: -98.5, latestRevenue: 15.2, latestProfit: -3.8, market: "Main" },
  { code: "TFP", name: "TFP Solutions", stockCode: "0145", sector: "Services", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -25.2, profitYoY: -118.0, revenueQoQ: -15.2, profitQoQ: -78.5, latestRevenue: 22.5, latestProfit: -2.5, market: "Main" },
  { code: "TRIVE", name: "Trive Property", stockCode: "0118", sector: "Property", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -38.5, profitYoY: -162.0, revenueQoQ: -25.2, profitQoQ: -112.0, latestRevenue: 18.5, latestProfit: -5.2, market: "Main" },
  { code: "VANTNRG", name: "Vantage Energy", stockCode: "5218", sector: "Energy", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -42.5, profitYoY: -172.0, revenueQoQ: -28.5, profitQoQ: -118.0, latestRevenue: 25.2, latestProfit: -6.8, market: "Main" },
  { code: "XPB", name: "XPB Holdings", stockCode: "0370", sector: "Technology", yoyCategory: 6, qoqCategory: 6, hasAnalysis: true, revenueYoY: -35.2, profitYoY: -148.0, revenueQoQ: -22.5, profitQoQ: -102.0, latestRevenue: 12.5, latestProfit: -3.2, market: "Main" },

  // ============================================================================
  // ADDITIONAL KLSE COMPANIES (No financial analysis data yet)
  // Data from KLSE Screener - December 14, 2025
  // These companies will get real-time price data from Yahoo Finance
  // ============================================================================

  // Top Market Cap Companies
  { code: "MAYBANK", name: "Malayan Banking Berhad", stockCode: "1155", sector: "Finance", market: "Main" },
  { code: "PBBANK", name: "Public Bank Berhad", stockCode: "1295", sector: "Finance", market: "Main" },
  { code: "CIMB", name: "CIMB Group Holdings Berhad", stockCode: "1023", sector: "Finance", market: "Main" },
  { code: "IHH", name: "IHH Healthcare Berhad", stockCode: "5225", sector: "Healthcare", market: "Main" },
  { code: "TENAGA", name: "Tenaga Nasional Berhad", stockCode: "5347", sector: "Energy", market: "Main" },
  { code: "PMETAL", name: "Press Metal Aluminium Holdings Berhad", stockCode: "8869", sector: "Industrial", market: "Main" },
  { code: "HLBANK", name: "Hong Leong Bank Berhad", stockCode: "5819", sector: "Finance", market: "Main" },
  { code: "CDB", name: "Celcomdigi Berhad", stockCode: "6947", sector: "Services", market: "Main" },
  { code: "SDG", name: "SD Guthrie Berhad", stockCode: "5285", sector: "Plantation", market: "Main" },
  { code: "SUNWAY", name: "Sunway Berhad", stockCode: "5211", sector: "Property", market: "Main" },
  { code: "PETGAS", name: "PETRONAS Gas Berhad", stockCode: "6033", sector: "Energy", market: "Main" },
  { code: "MISC", name: "MISC Berhad", stockCode: "3816", sector: "Offshore", market: "Main" },
  { code: "RHBBANK", name: "RHB Bank Berhad", stockCode: "1066", sector: "Finance", market: "Main" },
  { code: "MAXIS", name: "Maxis Berhad", stockCode: "6012", sector: "Services", market: "Main" },
  { code: "TM", name: "Telekom Malaysia Berhad", stockCode: "4863", sector: "Services", market: "Main" },
  { code: "99SMART", name: "99 Speed Mart Retail Holdings Berhad", stockCode: "5765", sector: "Consumer", market: "Main" },
  { code: "YTLPOWR", name: "YTL Power International Berhad", stockCode: "6742", sector: "Energy", market: "Main" },
  { code: "PCHEM", name: "PETRONAS Chemicals Group Berhad", stockCode: "5183", sector: "Industrial", market: "Main" },
  { code: "NESTLE", name: "Nestle (Malaysia) Berhad", stockCode: "4707", sector: "Consumer", market: "Main" },
  { code: "IOICORP", name: "IOI Corporation Berhad", stockCode: "1961", sector: "Plantation", market: "Main" },
  { code: "YTL", name: "YTL Corporation Berhad", stockCode: "4677", sector: "Energy", market: "Main" },
  { code: "AXIATA", name: "Axiata Group Berhad", stockCode: "6888", sector: "Services", market: "Main" },
  { code: "KLK", name: "Kuala Lumpur Kepong Berhad", stockCode: "2445", sector: "Plantation", market: "Main" },
  { code: "HLFG", name: "Hong Leong Financial Group Berhad", stockCode: "1082", sector: "Finance", market: "Main" },
  { code: "AMBANK", name: "AMMB Holdings Berhad", stockCode: "1015", sector: "Finance", market: "Main" },
  { code: "WPRTS", name: "Westports Holdings Berhad", stockCode: "5246", sector: "Services", market: "Main" },
  { code: "PETDAG", name: "PETRONAS Dagangan Berhad", stockCode: "5681", sector: "Energy", market: "Main" },
  { code: "UTDPLT", name: "United Plantations Berhad", stockCode: "2089", sector: "Plantation", market: "Main" },
  { code: "KLCC", name: "KLCC Property Holdings Berhad", stockCode: "5235", sector: "Property", market: "Main" },
  { code: "QL", name: "QL Resources Berhad", stockCode: "7084", sector: "Consumer", market: "Main" },
  { code: "PPB", name: "PPB Group Berhad", stockCode: "4065", sector: "Consumer", market: "Main" },
  { code: "MRDIY", name: "Mr D.I.Y. Group (M) Berhad", stockCode: "5296", sector: "Consumer", market: "Main" },
  { code: "IOIPG", name: "IOI Properties Group Berhad", stockCode: "5249", sector: "Property", market: "Main" },
  { code: "SIME", name: "Sime Darby Berhad", stockCode: "4197", sector: "Industrial", market: "Main" },
  { code: "GENM", name: "Genting Malaysia Berhad", stockCode: "4715", sector: "Consumer", market: "Main" },
  { code: "GENTING", name: "Genting Berhad", stockCode: "3182", sector: "Consumer", market: "Main" },
  { code: "KPJ", name: "KPJ Healthcare Berhad", stockCode: "5878", sector: "Healthcare", market: "Main" },
  { code: "IGBREIT", name: "IGB Real Estate Investment Trust", stockCode: "5227", sector: "Property", market: "Main" },
  { code: "TIMECOM", name: "TIME dotCom Berhad", stockCode: "5031", sector: "Services", market: "Main" },
  { code: "DIALOG", name: "Dialog Group Berhad", stockCode: "7277", sector: "Energy", market: "Main" },
  { code: "SIMEPROP", name: "Sime Darby Property Berhad", stockCode: "5288", sector: "Property", market: "Main" },
  { code: "MCEMENT", name: "Malayan Cement Berhad", stockCode: "3794", sector: "Industrial", market: "Main" },
  { code: "VITROX", name: "ViTrox Corporation Berhad", stockCode: "0097", sector: "Technology", market: "Main" },
  { code: "SUNCON", name: "Sunway Construction Group Berhad", stockCode: "5263", sector: "Construction", market: "Main" },
  { code: "ECOSHOP", name: "Eco-Shop Marketing Berhad", stockCode: "0233", sector: "Consumer", market: "Main" },
  { code: "IJM", name: "IJM Corporation Berhad", stockCode: "3336", sector: "Construction", market: "Main" },
  { code: "SUNREIT", name: "Sunway Real Estate Investment Trust", stockCode: "5176", sector: "Property", market: "Main" },
  { code: "BKAWAN", name: "Batu Kawan Berhad", stockCode: "1899", sector: "Plantation", market: "Main" },
  { code: "CHINHIN", name: "Chin Hin Group Berhad", stockCode: "5273", sector: "Industrial", market: "Main" },
  { code: "ABMB", name: "Alliance Bank Malaysia Berhad", stockCode: "2488", sector: "Finance", market: "Main" },
  { code: "HAPSENG", name: "Hap Seng Consolidated Berhad", stockCode: "3034", sector: "Consumer", market: "Main" },
  { code: "TANCO", name: "Tanco Holdings Berhad", stockCode: "2429", sector: "Construction", market: "Main" },
  { code: "FRONTKN", name: "Frontken Corporation Berhad", stockCode: "0041", sector: "Technology", market: "Main" },
  { code: "INARI", name: "Inari Amertron Berhad", stockCode: "0166", sector: "Technology", market: "Main" },
  { code: "PAVREIT", name: "Pavilion Real Estate Investment Trust", stockCode: "5212", sector: "Property", market: "Main" },
  { code: "HEIM", name: "Heineken Malaysia Berhad", stockCode: "3255", sector: "Consumer", market: "Main" },
  { code: "BURSA", name: "Bursa Malaysia Berhad", stockCode: "1818", sector: "Finance", market: "Main" },
  { code: "ZETRIX", name: "Zetrix AI Berhad", stockCode: "0138", sector: "Technology", market: "Main" },
  { code: "MPI", name: "Malaysian Pacific Industries Berhad", stockCode: "3867", sector: "Technology", market: "Main" },
  { code: "LPI", name: "LPI Capital Bhd", stockCode: "8621", sector: "Finance", market: "Main" },
  { code: "AFFIN", name: "AFFIN Bank Berhad", stockCode: "5185", sector: "Finance", market: "Main" },
  { code: "MBSB", name: "MBSB Berhad", stockCode: "1171", sector: "Finance", market: "Main" },
  { code: "GASMSIA", name: "Gas Malaysia Berhad", stockCode: "5209", sector: "Energy", market: "Main" },
  { code: "UNISEM", name: "Unisem (M) Berhad", stockCode: "5005", sector: "Technology", market: "Main" },
  { code: "FFB", name: "Farm Fresh Berhad", stockCode: "5306", sector: "Consumer", market: "Main" },
  { code: "CARLSBG", name: "Carlsberg Brewery Malaysia Berhad", stockCode: "2836", sector: "Consumer", market: "Main" },
  { code: "BIMB", name: "Bank Islam Malaysia Berhad", stockCode: "5258", sector: "Finance", market: "Main" },
  { code: "HLIND", name: "Hong Leong Industries Berhad", stockCode: "3301", sector: "Industrial", market: "Main" },
  { code: "TOPGLOV", name: "Top Glove Corporation Bhd", stockCode: "7113", sector: "Healthcare", market: "Main" },
  { code: "UOADEV", name: "UOA Development Bhd", stockCode: "5200", sector: "Property", market: "Main" },
  { code: "GENP", name: "Genting Plantations Berhad", stockCode: "2291", sector: "Plantation", market: "Main" },
  { code: "OSK", name: "OSK Holdings Berhad", stockCode: "5053", sector: "Finance", market: "Main" },
  { code: "ORIENT", name: "Oriental Holdings Berhad", stockCode: "4006", sector: "Consumer", market: "Main" },
  { code: "MALAKOF", name: "Malakoff Corporation Berhad", stockCode: "5264", sector: "Energy", market: "Main" },
  { code: "GREATEC", name: "Greatech Technology Berhad", stockCode: "0208", sector: "Technology", market: "Main" },
  { code: "KGB", name: "Kelington Group Berhad", stockCode: "0186", sector: "Industrial", market: "Main" },
  { code: "SPSETIA", name: "S P Setia Berhad", stockCode: "8664", sector: "Property", market: "Main" },
  { code: "AXREIT", name: "Axis Real Estate Investment Trust", stockCode: "5106", sector: "Property", market: "Main" },
  { code: "JPG", name: "Johor Plantations Group Berhad", stockCode: "5133", sector: "Plantation", market: "Main" },
  { code: "IGBB", name: "IGB Berhad", stockCode: "5160", sector: "Property", market: "Main" },
  { code: "ALLIANZ", name: "Allianz Malaysia Berhad", stockCode: "1163", sector: "Finance", market: "Main" },
  { code: "SOP", name: "Sarawak Oil Palms Berhad", stockCode: "5126", sector: "Plantation", market: "Main" },
  { code: "HEXTAR", name: "Hextar Global Berhad", stockCode: "5151", sector: "Industrial", market: "Main" },
  { code: "KERJAYA", name: "Kerjaya Prospek Group Berhad", stockCode: "7161", sector: "Construction", market: "Main" },
  { code: "HARTA", name: "Hartalega Holdings Berhad", stockCode: "5168", sector: "Healthcare", market: "Main" },
  { code: "KSL", name: "KSL Holdings Berhad", stockCode: "5038", sector: "Property", market: "Main" },
  { code: "UMSINT", name: "UMS Integration Limited", stockCode: "0196", sector: "Technology", market: "Main" },
  { code: "MFCB", name: "Mega First Corporation Berhad", stockCode: "3069", sector: "Energy", market: "Main" },
  { code: "TROP", name: "Tropicana Corporation Berhad", stockCode: "5401", sector: "Property", market: "Main" },
  { code: "SLVEST", name: "Solarvest Holdings Berhad", stockCode: "0207", sector: "Energy", market: "Main" },
  { code: "UEMS", name: "UEM Sunrise Berhad", stockCode: "5148", sector: "Property", market: "Main" },
  { code: "TAKAFUL", name: "Syarikat Takaful Malaysia Keluarga Berhad", stockCode: "6139", sector: "Finance", market: "Main" },
  { code: "PENTA", name: "Pentamaster Corporation Berhad", stockCode: "7160", sector: "Technology", market: "Main" },
  { code: "MI", name: "Mi Technovation Berhad", stockCode: "5286", sector: "Technology", market: "Main" },
  { code: "DXN", name: "DXN Holdings Bhd", stockCode: "5318", sector: "Consumer", market: "Main" },
  { code: "MATRIX", name: "Matrix Concepts Holdings Berhad", stockCode: "5236", sector: "Property", market: "Main" },
  { code: "SAM", name: "SAM Engineering & Equipment (M) Berhad", stockCode: "9822", sector: "Technology", market: "Main" },
  { code: "FAREAST", name: "Far East Holdings Berhad", stockCode: "5029", sector: "Plantation", market: "Main" },
  { code: "MAHSING", name: "Mah Sing Group Berhad", stockCode: "8583", sector: "Property", market: "Main" },
  { code: "KOPI", name: "Oriental Kopi Holdings Berhad", stockCode: "0338", sector: "Consumer", market: "ACE" },
  { code: "BIPORT", name: "Bintulu Port Holdings Berhad", stockCode: "5032", sector: "Services", market: "Main" },
  { code: "SCGBHD", name: "Southern Cable Group Berhad", stockCode: "0198", sector: "Industrial", market: "Main" },
  { code: "LHI", name: "Leong Hup International Berhad", stockCode: "5287", sector: "Consumer", market: "Main" },
  { code: "HEXTECH", name: "Hextar Technologies Solutions Berhad", stockCode: "5279", sector: "Technology", market: "Main" },
  { code: "VELESTO", name: "Velesto Energy Berhad", stockCode: "5243", sector: "Energy", market: "Main" },
  { code: "GCB", name: "Guan Chong Berhad", stockCode: "5102", sector: "Consumer", market: "Main" },
  { code: "WCEHB", name: "WCE Holdings Berhad", stockCode: "2976", sector: "Construction", market: "Main" },
  { code: "SEM", name: "7-Eleven Malaysia Holdings Berhad", stockCode: "5250", sector: "Consumer", market: "Main" },
  { code: "RANHILL", name: "Ranhill Utilities Berhad", stockCode: "5272", sector: "Energy", market: "Main" },
  { code: "LFG", name: "Lianson Fleet Group Berhad", stockCode: "0200", sector: "Services", market: "Main" },
  { code: "HUMEIND", name: "Hume Cement Industries Berhad", stockCode: "3646", sector: "Industrial", market: "Main" },
  { code: "PMBTECH", name: "PMB Technology Berhad", stockCode: "0217", sector: "Industrial", market: "Main" },
  { code: "DRBHCOM", name: "DRB-HICOM Berhad", stockCode: "1619", sector: "Consumer", market: "Main" },
  { code: "CLMT", name: "CapitaLand Malaysia Trust", stockCode: "5180", sector: "Property", market: "Main" },
  { code: "MBMR", name: "MBM Resources Berhad", stockCode: "5983", sector: "Consumer", market: "Main" },
  { code: "ELRIDGE", name: "Elridge Energy Holdings Berhad", stockCode: "0318", sector: "Energy", market: "ACE" },
  { code: "KSENG", name: "Keck Seng (Malaysia) Berhad", stockCode: "3476", sector: "Plantation", market: "Main" },
  { code: "DLADY", name: "Dutch Lady Milk Industries Berhad", stockCode: "3026", sector: "Consumer", market: "Main" },
  { code: "DAYANG", name: "Dayang Enterprise Holdings Bhd", stockCode: "5141", sector: "Offshore", market: "Main" },
  { code: "YTLREIT", name: "YTL Hospitality REIT", stockCode: "5109", sector: "Property", market: "Main" },
  { code: "CTOS", name: "CTOS Digital Berhad", stockCode: "0300", sector: "Technology", market: "Main" },
  { code: "ARMADA", name: "Bumi Armada Berhad", stockCode: "5210", sector: "Offshore", market: "Main" },
  { code: "AHEALTH", name: "Apex Healthcare Berhad", stockCode: "7090", sector: "Healthcare", market: "Main" },
  { code: "CAPITALA", name: "Capital A Berhad", stockCode: "5099", sector: "Services", market: "Main" },
  { code: "PADINI", name: "Padini Holdings Berhad", stockCode: "7052", sector: "Consumer", market: "Main" },
  { code: "MAGNUM", name: "Magnum Berhad", stockCode: "3859", sector: "Consumer", market: "Main" },
  { code: "IDEAL", name: "Ideal Capital Berhad", stockCode: "0182", sector: "Finance", market: "Main" },
  { code: "TAANN", name: "Ta Ann Holdings Berhad", stockCode: "5012", sector: "Plantation", market: "Main" },
  { code: "RCECAP", name: "RCE Capital Berhad", stockCode: "9296", sector: "Finance", market: "Main" },
  { code: "SPTOTO", name: "Sports Toto Berhad", stockCode: "1562", sector: "Consumer", market: "Main" },
  { code: "MRCB", name: "Malaysian Resources Corporation Berhad", stockCode: "1651", sector: "Construction", market: "Main" },
  { code: "RADIUM", name: "Radium Development Berhad", stockCode: "0228", sector: "Property", market: "Main" },
  { code: "SPRITZER", name: "Spritzer Bhd", stockCode: "7222", sector: "Consumer", market: "Main" },
  { code: "HSPLANT", name: "Hap Seng Plantations Holdings Berhad", stockCode: "5138", sector: "Plantation", market: "Main" },
  { code: "PHARMA", name: "Pharmaniaga Berhad", stockCode: "7081", sector: "Healthcare", market: "Main" },
  { code: "BJCORP", name: "Berjaya Corporation Berhad", stockCode: "3395", sector: "Consumer", market: "Main" },
  { code: "TSH", name: "TSH Resources Berhad", stockCode: "9059", sector: "Plantation", market: "Main" },
  { code: "MNRB", name: "MNRB Holdings Berhad", stockCode: "6459", sector: "Finance", market: "Main" },
  { code: "CHGP", name: "Chin Hin Group Property Berhad", stockCode: "0279", sector: "Property", market: "Main" },
  { code: "CMSB", name: "Cahya Mata Sarawak Berhad", stockCode: "2852", sector: "Industrial", market: "Main" },
  { code: "KRETAM", name: "Kretam Holdings Berhad", stockCode: "1996", sector: "Plantation", market: "Main" },
  { code: "BLDPLNT", name: "BLD Plantation Bhd", stockCode: "5163", sector: "Plantation", market: "Main" },
  { code: "IGBCR", name: "IGB Commercial Real Estate Investment Trust", stockCode: "5299", sector: "Property", market: "Main" },
  { code: "PARADIGM", name: "Paradigm Real Estate Investment Trust", stockCode: "5269", sector: "Property", market: "Main" },
  { code: "AEON", name: "Aeon Co. (M) Bhd", stockCode: "6599", sector: "Consumer", market: "Main" },
  { code: "UCHITEC", name: "Uchi Technologies Berhad", stockCode: "7100", sector: "Technology", market: "Main" },
  { code: "VSTECS", name: "VSTECS Berhad", stockCode: "5162", sector: "Technology", market: "Main" },
  { code: "MSC", name: "Malaysia Smelting Corporation Berhad", stockCode: "5916", sector: "Industrial", market: "Main" },
  { code: "SSB8", name: "Southern Score Builders Berhad", stockCode: "0045", sector: "Construction", market: "ACE" },
  { code: "TMK", name: "TMK Chemical Bhd", stockCode: "0187", sector: "Industrial", market: "Main" },
  { code: "KEYFIELD", name: "Keyfield International Berhad", stockCode: "0191", sector: "Energy", market: "Main" },
  { code: "HCK", name: "HCK Capital Group Berhad", stockCode: "0185", sector: "Finance", market: "Main" },
  { code: "BJLAND", name: "Berjaya Land Berhad", stockCode: "4219", sector: "Property", market: "Main" },
  { code: "BAT", name: "British American Tobacco (Malaysia) Berhad", stockCode: "4162", sector: "Consumer", market: "Main" },
  { code: "AUMAS", name: "AuMas Resources Berhad", stockCode: "0246", sector: "Industrial", market: "Main" },
  { code: "NEXG", name: "NEXG Berhad", stockCode: "0205", sector: "Technology", market: "Main" },
  { code: "PECCA", name: "Pecca Group Berhad", stockCode: "5271", sector: "Consumer", market: "Main" },
  { code: "HI", name: "HI Mobility Berhad", stockCode: "0209", sector: "Consumer", market: "Main" },
  { code: "DPHARMA", name: "Duopharma Biotech Berhad", stockCode: "7148", sector: "Healthcare", market: "Main" },
  { code: "HIBISCS", name: "Hibiscus Petroleum Berhad", stockCode: "5199", sector: "Energy", market: "Main" },
  { code: "MTEC", name: "Master Tec Group Berhad", stockCode: "0295", sector: "Industrial", market: "ACE" },
  { code: "ALAQAR", name: "Al-'Aqar Healthcare REIT", stockCode: "5116", sector: "Property", market: "Main" },
  { code: "PLINTAS", name: "Prolintas Infra Business Trust", stockCode: "5281", sector: "Industrial", market: "Main" },
  { code: "EG", name: "EG Industries Berhad", stockCode: "8907", sector: "Technology", market: "Main" },
  { code: "PETRONM", name: "Petron Malaysia Refining & Marketing Bhd", stockCode: "3042", sector: "Energy", market: "Main" },
  { code: "LAGENDA", name: "Lagenda Properties Berhad", stockCode: "0193", sector: "Property", market: "Main" },
  { code: "MNHLDG", name: "MN Holdings Berhad", stockCode: "0244", sector: "Construction", market: "ACE" },
  { code: "TALIWRK", name: "Taliworks Corporation Berhad", stockCode: "8524", sector: "Energy", market: "Main" },
  { code: "SUPERMX", name: "Supermax Corporation Berhad", stockCode: "7106", sector: "Healthcare", market: "Main" },
  { code: "JTIASA", name: "Jaya Tiasa Holdings Berhad", stockCode: "4383", sector: "Plantation", market: "Main" },
  { code: "PIE", name: "P.I.E. Industrial Berhad", stockCode: "7095", sector: "Industrial", market: "Main" },
  { code: "CHINTEK", name: "Chin Teck Plantations Berhad", stockCode: "1929", sector: "Plantation", market: "Main" },
  { code: "ATECH", name: "Aurelius Technologies Berhad", stockCode: "0216", sector: "Technology", market: "Main" },
  { code: "ANCOMNY", name: "Ancom Nylex Berhad", stockCode: "0090", sector: "Industrial", market: "Main" },
  { code: "AME", name: "AME Elite Consortium Berhad", stockCode: "5293", sector: "Property", market: "Main" },
  { code: "SKPRES", name: "SKP Resources Bhd", stockCode: "7155", sector: "Industrial", market: "Main" },
  { code: "PEKAT", name: "Pekat Group Berhad", stockCode: "0219", sector: "Industrial", market: "Main" },
  { code: "DNEX", name: "Dagang NeXchange Berhad", stockCode: "4456", sector: "Technology", market: "Main" },
  { code: "SYGROUP", name: "Shin Yang Group Berhad", stockCode: "5173", sector: "Services", market: "Main" },
  { code: "SENTRAL", name: "Sentral REIT", stockCode: "5123", sector: "Property", market: "Main" },
  { code: "DKSH", name: "DKSH Holdings (Malaysia) Berhad", stockCode: "5908", sector: "Consumer", market: "Main" },
  { code: "WCT", name: "WCT Holdings Berhad", stockCode: "9679", sector: "Construction", market: "Main" },
  { code: "LCTITAN", name: "Lotte Chemical Titan Holding Berhad", stockCode: "5284", sector: "Industrial", market: "Main" },
  { code: "MULPHA", name: "Mulpha International Bhd", stockCode: "3905", sector: "Property", market: "Main" },
  { code: "SIGN", name: "Signature International Berhad", stockCode: "0099", sector: "Property", market: "Main" },
  { code: "INNO", name: "Innoprise Plantations Berhad", stockCode: "5265", sector: "Plantation", market: "Main" },
  { code: "NGGB", name: "Nextgreen Global Berhad", stockCode: "0235", sector: "Industrial", market: "Main" },
  { code: "EKOVEST", name: "Ekovest Berhad", stockCode: "8877", sector: "Construction", market: "Main" },
  { code: "DUFU", name: "Dufu Technology Corp. Berhad", stockCode: "7233", sector: "Technology", market: "Main" },
  { code: "AMEREIT", name: "AME Real Estate Investment Trust", stockCode: "5307", sector: "Property", market: "Main" },
  { code: "SERNKOU", name: "Sern Kou Resources Berhad", stockCode: "0190", sector: "Industrial", market: "Main" },
  { code: "KJTS", name: "KJTS Group Berhad", stockCode: "0293", sector: "Industrial", market: "ACE" },
  { code: "EDGENTA", name: "UEM Edgenta Berhad", stockCode: "1368", sector: "Industrial", market: "Main" },
  { code: "SEG", name: "SEG International Bhd", stockCode: "9792", sector: "Education", market: "Main" },
  { code: "KIPREIT", name: "KIP Real Estate Investment Trust", stockCode: "5280", sector: "Property", market: "Main" },
  { code: "KAB", name: "Kinergy Advancement Berhad", stockCode: "0202", sector: "Industrial", market: "Main" },
  { code: "AJI", name: "Ajinomoto (Malaysia) Berhad", stockCode: "2658", sector: "Consumer", market: "Main" },
  { code: "CBHB", name: "CBH Engineering Holding Berhad", stockCode: "0339", sector: "Industrial", market: "ACE" },
  { code: "SWKPLNT", name: "Sarawak Plantation Berhad", stockCode: "5135", sector: "Plantation", market: "Main" },
  { code: "SAG", name: "Signature Alliance Group Berhad", stockCode: "0360", sector: "Construction", market: "ACE" },
  { code: "AAX", name: "AirAsia X Berhad", stockCode: "5238", sector: "Services", market: "Main" },
  { code: "HUPSENG", name: "Hup Seng Industries Berhad", stockCode: "5024", sector: "Consumer", market: "Main" },
  { code: "AMWAY", name: "Amway (Malaysia) Holdings Berhad", stockCode: "6351", sector: "Consumer", market: "Main" },
  { code: "INFOM", name: "Infomina Berhad", stockCode: "0265", sector: "Technology", market: "ACE" },
  { code: "THMY", name: "THMY Holdings Berhad", stockCode: "0375", sector: "Technology", market: "ACE" },
  { code: "ATLAN", name: "Atlan Holdings Bhd", stockCode: "7048", sector: "Consumer", market: "Main" },
  { code: "HLCAP", name: "Hong Leong Capital Berhad", stockCode: "5274", sector: "Finance", market: "Main" },
  { code: "TMCLIFE", name: "TMC Life Sciences Berhad", stockCode: "0101", sector: "Healthcare", market: "Main" },
  { code: "WASCO", name: "Wasco Berhad", stockCode: "5142", sector: "Energy", market: "Main" },
  { code: "CKI", name: "CUCKOO International (MAL) Berhad", stockCode: "5336", sector: "Consumer", market: "Main" },
  { code: "OIB", name: "Oriental Interest Berhad", stockCode: "0179", sector: "Property", market: "Main" },
  { code: "BJASSET", name: "Berjaya Assets Berhad", stockCode: "3239", sector: "Property", market: "Main" },
  { code: "CGB", name: "Central Global Berhad", stockCode: "0212", sector: "Industrial", market: "Main" },
  { code: "KAREX", name: "Karex Berhad", stockCode: "5247", sector: "Healthcare", market: "Main" },
  { code: "SHANG", name: "Shangri-La Hotels (Malaysia) Berhad", stockCode: "5517", sector: "Consumer", market: "Main" },
  { code: "CCK", name: "CCK Consolidated Holdings Berhad", stockCode: "7035", sector: "Consumer", market: "Main" },
  { code: "MFLOUR", name: "Malayan Flour Mills Berhad", stockCode: "3662", sector: "Consumer", market: "Main" },
  { code: "LWSABAH", name: "Life Water Berhad", stockCode: "0227", sector: "Consumer", market: "Main" },
  { code: "TELADAN", name: "Teladan Group Berhad", stockCode: "0106", sector: "Consumer", market: "Main" },
  { code: "KFIMA", name: "Kumpulan Fima Berhad", stockCode: "6491", sector: "Industrial", market: "Main" },
  { code: "PLENITU", name: "Plenitude Berhad", stockCode: "5075", sector: "Property", market: "Main" },
  { code: "PPJACK", name: "Pappajack Berhad", stockCode: "0231", sector: "Consumer", market: "Main" },
  { code: "JCY", name: "JCY International Berhad", stockCode: "5161", sector: "Technology", market: "Main" },
  { code: "IBRACO", name: "Ibraco Berhad", stockCode: "0252", sector: "Property", market: "Main" },
  { code: "MSM", name: "MSM Malaysia Holdings Berhad", stockCode: "5202", sector: "Consumer", market: "Main" },
  { code: "SAMAIDEN", name: "Samaiden Group Berhad", stockCode: "0223", sector: "Energy", market: "Main" },
  { code: "CHEEDING", name: "Cheeding Holdings Berhad", stockCode: "0372", sector: "Construction", market: "ACE" },
  { code: "MEGAFB", name: "Mega Fortris Berhad", stockCode: "0239", sector: "Industrial", market: "Main" },
  { code: "GESHEN", name: "GE-Shen Corporation Berhad", stockCode: "0180", sector: "Industrial", market: "Main" },
  { code: "MIECO", name: "Mieco Chipboard Berhad", stockCode: "5001", sector: "Industrial", market: "Main" },
  { code: "WELLCAL", name: "Wellcall Holdings Berhad", stockCode: "7231", sector: "Industrial", market: "Main" },
  { code: "ECOMATE", name: "Ecomate Holdings Berhad", stockCode: "0274", sector: "Industrial", market: "Main" },
  { code: "APM", name: "APM Automotive Holdings Berhad", stockCode: "5015", sector: "Automotive", market: "Main" },
  { code: "COASTAL", name: "Coastal Contracts Bhd", stockCode: "5071", sector: "Industrial", market: "Main" },
  { code: "MKHOP", name: "MKH Oil Palm (East Kalimantan) Berhad", stockCode: "0271", sector: "Plantation", market: "Main" },
  { code: "PBA", name: "PBA Holdings Bhd", stockCode: "5041", sector: "Energy", market: "Main" },
  { code: "PARAMON", name: "Paramount Corporation Berhad", stockCode: "1724", sector: "Property", market: "Main" },
  { code: "KENANGA", name: "Kenanga Investment Bank Berhad", stockCode: "6483", sector: "Finance", market: "Main" },
  { code: "KOTRA", name: "Kotra Industries Berhad", stockCode: "1830", sector: "Healthcare", market: "Main" },
  { code: "SCOMNET", name: "Supercomnet Technologies Berhad", stockCode: "0213", sector: "Technology", market: "Main" },
  { code: "GDEX", name: "GDEX Berhad", stockCode: "0078", sector: "Services", market: "Main" },
  { code: "MKH", name: "MKH Berhad", stockCode: "6114", sector: "Property", market: "Main" },
  { code: "LBS", name: "LBS Bina Group Berhad", stockCode: "5789", sector: "Property", market: "Main" },
  { code: "FIAMMA", name: "Fiamma Holdings Berhad", stockCode: "6939", sector: "Consumer", market: "Main" },
  { code: "NE", name: "Northeast Group Berhad", stockCode: "0272", sector: "Industrial", market: "Main" },
  { code: "MAGMA", name: "Magma Group Berhad", stockCode: "0172", sector: "Industrial", market: "Main" },
  { code: "HARBOUR", name: "Harbour-Link Group Berhad", stockCode: "2062", sector: "Services", market: "Main" },
  { code: "SSTEEL", name: "Southern Steel Berhad", stockCode: "5665", sector: "Industrial", market: "Main" },
  { code: "INSAS", name: "Insas Berhad", stockCode: "3379", sector: "Finance", market: "Main" },
  { code: "TEOSENG", name: "Teo Seng Capital Berhad", stockCode: "7252", sector: "Consumer", market: "Main" },
  { code: "UOAREIT", name: "Uoa Real Estate Investment", stockCode: "5110", sector: "Property", market: "Main" },
  { code: "KOBAY", name: "Kobay Technology Bhd", stockCode: "0081", sector: "Technology", market: "Main" },
  { code: "CBIP", name: "CB Industrial Product Holding Berhad", stockCode: "7076", sector: "Industrial", market: "Main" },
  { code: "AJIYA", name: "Ajiya Berhad", stockCode: "7609", sector: "Industrial", market: "Main" },
  { code: "MHB", name: "Malaysia Marine and Heavy Engineering Holdings Berhad", stockCode: "5186", sector: "Offshore", market: "Main" },
  { code: "SURIA", name: "Suria Capital Holdings Berhad", stockCode: "6521", sector: "Services", market: "Main" },
  { code: "AZAMJAYA", name: "Azam Jaya Berhad", stockCode: "0286", sector: "Industrial", market: "Main" },
  { code: "SHL", name: "SHL Consolidated Bhd", stockCode: "6017", sector: "Property", market: "Main" },
  { code: "OMH", name: "OM Holdings Limited", stockCode: "5298", sector: "Industrial", market: "Main" },
  { code: "IBHD", name: "I-Berhad", stockCode: "4251", sector: "Technology", market: "Main" },
  { code: "AYER", name: "AYER Holdings Berhad", stockCode: "2305", sector: "Plantation", market: "Main" },
  { code: "PANTECH", name: "Pantech Group Holdings Berhad", stockCode: "5125", sector: "Industrial", market: "Main" },
  { code: "MANULFE", name: "Manulife Holdings Berhad", stockCode: "1058", sector: "Finance", market: "Main" },
  { code: "SBAGAN", name: "Sungei Bagan Rubber Company (Malaya) Berhad", stockCode: "2569", sector: "Plantation", market: "Main" },
  { code: "FPI", name: "Formosa Prosonic Industries Berhad", stockCode: "9172", sector: "Industrial", market: "Main" },
  { code: "TGUAN", name: "Thong Guan Industries Berhad", stockCode: "7034", sector: "Industrial", market: "Main" },
  { code: "MITRA", name: "Mitrajaya Holdings Berhad", stockCode: "9571", sector: "Construction", market: "Main" },
  { code: "PWROOT", name: "Power Root Berhad", stockCode: "7237", sector: "Consumer", market: "Main" },
  { code: "ZHULIAN", name: "Zhulian Corporation Berhad", stockCode: "5131", sector: "Consumer", market: "Main" },
  { code: "SENFONG", name: "Seng Fong Holdings Berhad", stockCode: "0157", sector: "Property", market: "Main" },
  { code: "REACHTEN", name: "Reach Ten Holdings Berhad", stockCode: "0263", sector: "Consumer", market: "Main" },
  { code: "FCW", name: "FCW Holdings Berhad", stockCode: "8486", sector: "Industrial", market: "Main" },
  { code: "CSCSTEL", name: "CSC Steel Holdings Berhad", stockCode: "5094", sector: "Industrial", market: "Main" },
  { code: "DELEUM", name: "Deleum Berhad", stockCode: "5132", sector: "Energy", market: "Main" },
  { code: "ELKDESA", name: "ELK-Desa Resources Berhad", stockCode: "5228", sector: "Finance", market: "Main" },
  { code: "SKYWLD", name: "SkyWorld Development Berhad", stockCode: "0201", sector: "Property", market: "Main" },
  { code: "JAGCPTL", name: "KUB Malaysia Berhad", stockCode: "6874", sector: "Consumer", market: "Main" },
  { code: "HENGYUAN", name: "Hengyuan Refining Company Berhad", stockCode: "4324", sector: "Energy", market: "Main" },
  { code: "KIMLUN", name: "Kimlun Corporation Berhad", stockCode: "5171", sector: "Construction", market: "Main" },
  { code: "THPLANT", name: "TH Plantations Berhad", stockCode: "5112", sector: "Plantation", market: "Main" },
  { code: "PGLOBE", name: "Paragon Globe Berhad", stockCode: "0281", sector: "Property", market: "Main" },
  { code: "ENGTEX", name: "Engtex Group Berhad", stockCode: "5205", sector: "Industrial", market: "Main" },
  { code: "JFTECH", name: "JF Technology Berhad", stockCode: "0167", sector: "Technology", market: "Main" },
  { code: "PANAMY", name: "Panasonic Manufacturing Malaysia Berhad", stockCode: "3719", sector: "Consumer", market: "Main" },
  { code: "UUE", name: "UUE Holdings Berhad", stockCode: "0240", sector: "Industrial", market: "Main" },
  { code: "BJFOOD", name: "Berjaya Food Berhad", stockCode: "5196", sector: "Consumer", market: "Main" },
  { code: "MENANG", name: "Menang Corporation (M) Berhad", stockCode: "0204", sector: "Property", market: "Main" },
  { code: "CIHLDG", name: "C.I. Holdings Berhad", stockCode: "2828", sector: "Consumer", market: "Main" },
  { code: "SAB", name: "Southern Acids (M) Berhad", stockCode: "5134", sector: "Industrial", market: "Main" },
  { code: "AVANGAAD", name: "Avangaad Berhad", stockCode: "0270", sector: "Industrial", market: "Main" },
  { code: "TNLOGIS", name: "Tiong Nam Logistics Holdings Berhad", stockCode: "8397", sector: "Services", market: "Main" },
  { code: "LUXCHEM", name: "Luxchem Corporation Berhad", stockCode: "5143", sector: "Industrial", market: "Main" },
  { code: "CAB", name: "CAB Cakaran Corporation Berhad", stockCode: "7174", sector: "Consumer", market: "Main" },
  { code: "ANNJOO", name: "Ann Joo Resources Berhad", stockCode: "6556", sector: "Industrial", market: "Main" },
  { code: "VLB", name: "Vestland Berhad", stockCode: "0173", sector: "Property", market: "Main" },
  { code: "NSOP", name: "Negri Sembilan Oil Palms Berhad", stockCode: "2038", sector: "Plantation", market: "Main" },
  { code: "MEDIA", name: "Media Prima Berhad", stockCode: "4502", sector: "Media", market: "Main" },
  { code: "HARISON", name: "Harrisons Holdings (Malaysia) Berhad", stockCode: "5008", sector: "Consumer", market: "Main" },
  { code: "UNITRAD", name: "Unitrade Industries Berhad", stockCode: "0247", sector: "Consumer", market: "Main" },
  { code: "SUNSURIA", name: "Sunsuria Berhad", stockCode: "3743", sector: "Property", market: "Main" },
  { code: "FIMACOR", name: "Fima Corporation Berhad", stockCode: "3107", sector: "Industrial", market: "Main" },
  { code: "SDS", name: "SDS Group Berhad", stockCode: "0234", sector: "Construction", market: "Main" },
  { code: "ADB", name: "Autocount Dotcom Berhad", stockCode: "0276", sector: "Technology", market: "ACE" },
  { code: "ECOFIRS", name: "EcoFirst Consolidated Bhd", stockCode: "3557", sector: "Property", market: "Main" },
  { code: "GUOCO", name: "GuocoLand (Malaysia) Berhad", stockCode: "1503", sector: "Property", market: "Main" },
  { code: "RAMSSOL", name: "Ramssol Group Berhad", stockCode: "0220", sector: "Technology", market: "Main" },
  { code: "NAIM", name: "Naim Holdings Berhad", stockCode: "5073", sector: "Property", market: "Main" },
  { code: "TCHONG", name: "Tan Chong Motor Holdings Berhad", stockCode: "4405", sector: "Automotive", market: "Main" },
  { code: "MUHIBAH", name: "Muhibbah Engineering (M) Bhd", stockCode: "5703", sector: "Construction", market: "Main" },
  { code: "TASCO", name: "TASCO Berhad", stockCode: "5140", sector: "Services", market: "Main" },
  { code: "RSAWIT", name: "Rimbunan Sawit Berhad", stockCode: "5113", sector: "Plantation", market: "Main" },
  { code: "CPETECH", name: "CPE Technology Berhad", stockCode: "0222", sector: "Industrial", market: "Main" },
  { code: "PGF", name: "PGF Capital Berhad", stockCode: "5177", sector: "Finance", market: "Main" },
  { code: "FAVCO", name: "Favelle Favco Berhad", stockCode: "7229", sector: "Industrial", market: "Main" },
  { code: "CITAGLB", name: "Citaglobal Berhad", stockCode: "0112", sector: "Construction", market: "Main" },
  { code: "VARIA", name: "Varia Berhad", stockCode: "5006", sector: "Industrial", market: "Main" },
  { code: "ATRIUM", name: "Atrium Real Estate Investment Trust", stockCode: "5130", sector: "Property", market: "Main" },
  { code: "KITACON", name: "Kumpulan Kitacon Berhad", stockCode: "0169", sector: "Construction", market: "Main" },
  { code: "PERDANA", name: "Perdana Petroleum Berhad", stockCode: "7108", sector: "Offshore", market: "Main" },
  { code: "HARNLEN", name: "Harn Len Corporation Bhd", stockCode: "7101", sector: "Plantation", market: "Main" },
  { code: "CLOUDPT", name: "Cloudpoint Technology Berhad", stockCode: "0221", sector: "Technology", market: "Main" },
  { code: "ULICORP", name: "United U-LI Corporation Berhad", stockCode: "8230", sector: "Industrial", market: "Main" },
  { code: "TAMBUN", name: "Tambun Indah Land Berhad", stockCode: "5191", sector: "Property", market: "Main" },
  { code: "3A", name: "Three-A Resources Berhad", stockCode: "0012", sector: "Consumer", market: "Main" },
  { code: "ECONBHD", name: "Econpile Holdings Berhad", stockCode: "5253", sector: "Construction", market: "Main" },
  { code: "KTI", name: "KTI Landmark Berhad", stockCode: "0243", sector: "Construction", market: "Main" },
  { code: "WENTEL", name: "Wentel Engineering Holdings Berhad", stockCode: "0298", sector: "Industrial", market: "ACE" },
  { code: "KLUANG", name: "Kluang Rubber Company (Malaya) Berhad", stockCode: "2453", sector: "Plantation", market: "Main" },
  { code: "REDTONE", name: "REDtone Digital Berhad", stockCode: "0032", sector: "Services", market: "Main" },
  { code: "SFPTECH", name: "SFP Tech Holdings Berhad", stockCode: "0251", sector: "Technology", market: "ACE" },
  { code: "RGB", name: "RGB International Bhd", stockCode: "0037", sector: "Consumer", market: "Main" },
  { code: "GOPENG", name: "Gopeng Berhad", stockCode: "2135", sector: "Plantation", market: "Main" },
  { code: "KPS", name: "Kumpulan Perangsang Selangor Berhad", stockCode: "5843", sector: "Industrial", market: "Main" },
  { code: "CANONE", name: "Can-One Berhad", stockCode: "7200", sector: "Industrial", market: "Main" },
  { code: "KAWAN", name: "Kawan Food Berhad", stockCode: "7216", sector: "Consumer", market: "Main" },
  { code: "MBRIGHT", name: "Meta Bright Group Berhad", stockCode: "0102", sector: "Technology", market: "Main" },
  { code: "SWIFT", name: "Swift Haulage Berhad", stockCode: "5303", sector: "Services", market: "Main" },
  { code: "CHB", name: "Critical Holdings Berhad", stockCode: "0255", sector: "Healthcare", market: "Main" },
  { code: "WTK", name: "W T K Holdings Berhad", stockCode: "4243", sector: "Plantation", market: "Main" },
  { code: "KKB", name: "KKB Engineering Berhad", stockCode: "9466", sector: "Industrial", market: "Main" },
  { code: "OFI", name: "Oriental Food Industries Holdings Berhad", stockCode: "7107", sector: "Consumer", market: "Main" },
  { code: "HEKTAR", name: "Hektar Real Estate Investment Trust", stockCode: "5121", sector: "Property", market: "Main" },
  { code: "AORB", name: "Alpha Ocean Resources Berhad", stockCode: "0377", sector: "Industrial", market: "Main" },
  { code: "TITIJYA", name: "Titijaya Land Berhad", stockCode: "5239", sector: "Property", market: "Main" },
  { code: "TDM", name: "TDM Berhad", stockCode: "2054", sector: "Plantation", market: "Main" },
  { code: "AVALAND", name: "Avaland Berhad", stockCode: "5182", sector: "Property", market: "Main" },
  { code: "YSPSAH", name: "Y.S.P. Southeast Asia Holding Berhad", stockCode: "7178", sector: "Healthcare", market: "Main" },
  { code: "MAYBULK", name: "Maybulk Berhad", stockCode: "5077", sector: "Services", market: "Main" },
  { code: "TEXCYCL", name: "Tex Cycle Technology (M) Berhad", stockCode: "0089", sector: "Industrial", market: "Main" },
  { code: "CVIEW", name: "Country View Berhad", stockCode: "5049", sector: "Consumer", market: "Main" },
  { code: "SENHENG", name: "Senheng New Retail Berhad", stockCode: "5305", sector: "Consumer", market: "Main" },
  { code: "PANSAR", name: "Pansar Berhad", stockCode: "8419", sector: "Industrial", market: "Main" },
  { code: "JTGROUP", name: "Jati Tinggi Group Berhad", stockCode: "0254", sector: "Industrial", market: "Main" },
  { code: "3REN", name: "3REN Berhad", stockCode: "0328", sector: "Technology", market: "ACE" },
  { code: "NOTION", name: "Notion VTec Berhad", stockCode: "0083", sector: "Technology", market: "Main" },
  { code: "CORAZA", name: "Coraza Integrated Technology Berhad", stockCode: "0211", sector: "Technology", market: "Main" },
  { code: "MAXIM", name: "Maxim Global Berhad", stockCode: "4022", sector: "Consumer", market: "Main" },
  { code: "TOMEI", name: "Tomei Consolidated Berhad", stockCode: "7230", sector: "Consumer", market: "Main" },
  { code: "MAGNA", name: "Magna Prima Berhad", stockCode: "0060", sector: "Property", market: "Main" },
  { code: "UZMA", name: "Uzma Berhad", stockCode: "7250", sector: "Energy", market: "Main" },
  { code: "BPURI", name: "Bina Puri Holdings Bhd", stockCode: "5932", sector: "Construction", market: "Main" },
  { code: "JAKS", name: "JAKS Resources Berhad", stockCode: "4723", sector: "Construction", market: "Main" },
  { code: "POS", name: "Pos Malaysia Berhad", stockCode: "4634", sector: "Services", market: "Main" },
  { code: "SALCON", name: "Salcon Berhad", stockCode: "8567", sector: "Construction", market: "Main" },
  { code: "MHC", name: "MHC Plantations Bhd", stockCode: "5026", sector: "Plantation", market: "Main" },
  { code: "NHFATT", name: "New Hoong Fatt Holdings Berhad", stockCode: "5085", sector: "Automotive", market: "Main" },
  { code: "LGMS", name: "LGMS Berhad", stockCode: "0181", sector: "Technology", market: "Main" },
  { code: "T7GLOBAL", name: "T7 Global Berhad", stockCode: "0150", sector: "Energy", market: "Main" },
  { code: "SLP", name: "SLP Resources Berhad", stockCode: "7248", sector: "Industrial", market: "Main" },
  { code: "PTARAS", name: "Pintaras Jaya Berhad", stockCode: "6002", sector: "Construction", market: "Main" },
  { code: "YOCB", name: "Yoong Onn Corporation Berhad", stockCode: "5159", sector: "Consumer", market: "Main" },
  { code: "SMRT", name: "SMRT Holdings Berhad", stockCode: "0117", sector: "Technology", market: "ACE" },
  { code: "PWF", name: "PWF Corporation Bhd", stockCode: "7134", sector: "Finance", market: "Main" },
  { code: "MIKROMB", name: "Mikro MSC Berhad", stockCode: "0095", sector: "Technology", market: "Main" },
  { code: "EDELTEQ", name: "Edelteq Holdings Berhad", stockCode: "0278", sector: "Technology", market: "ACE" },
  { code: "LEFORM", name: "Leform Berhad", stockCode: "0266", sector: "Industrial", market: "ACE" },
  { code: "JHM", name: "JHM Consolidation Berhad", stockCode: "0164", sector: "Technology", market: "Main" },
  { code: "STAR", name: "Star Media Group Berhad", stockCode: "6084", sector: "Media", market: "Main" },

  // ============================================================================
  // ADDITIONAL KLSE COMPANIES - Batch 2 (December 15, 2025)
  // Missing companies identified from KLSE Screener data
  // ============================================================================

  // Companies with special characters
  { code: "D&O", name: "D & O Green Technologies Berhad", stockCode: "7204", sector: "Technology", market: "Main" },
  { code: "E&O", name: "Eastern & Oriental Berhad", stockCode: "3417", sector: "Property", market: "Main" },
  { code: "L&G", name: "Land & General Berhad", stockCode: "1152", sector: "Property", market: "Main" },

  // Additional A companies
  { code: "AGES", name: "Ages International Holdings Berhad", stockCode: "0304", sector: "Healthcare", market: "ACE" },
  { code: "AGRICOR", name: "Agricore CS Holdings Berhad", stockCode: "0309", sector: "Consumer", market: "ACE" },
  { code: "AKMSB", name: "AKM Services Berhad", stockCode: "0291", sector: "Services", market: "ACE" },
  { code: "AMEDIA", name: "Asia Media Group Berhad", stockCode: "0159", sector: "Media", market: "ACE" },
  { code: "ANEKA", name: "Aneka Jaringan Holdings Berhad", stockCode: "0226", sector: "Construction", market: "Main" },
  { code: "ARTRONIQ", name: "Artroniq Berhad", stockCode: "0038", sector: "Industrial", market: "ACE" },
  { code: "ASIABRN", name: "Asia Brands Berhad", stockCode: "7203", sector: "Consumer", market: "Main" },
  { code: "ASIAFLE", name: "Asia File Corporation Berhad", stockCode: "7129", sector: "Industrial", market: "Main" },
  { code: "ASIAPAC", name: "Asia Pacific Higher Learning Sdn Bhd", stockCode: "0361", sector: "Education", market: "ACE" },
  { code: "ASTEEL", name: "Amalgamated Steel Mills Berhad", stockCode: "2602", sector: "Industrial", market: "Main" },
  { code: "ATAIMS", name: "ATA IMS Berhad", stockCode: "8176", sector: "Technology", market: "Main" },

  // Additional B companies
  { code: "BINTAI", name: "Bintai Kinden Corporation Berhad", stockCode: "6998", sector: "Construction", market: "Main" },
  { code: "BIOINTE", name: "Bio Integrasi Holdings Berhad", stockCode: "0290", sector: "Healthcare", market: "ACE" },

  // Additional C companies
  { code: "CENSOF", name: "Censof Holdings Berhad", stockCode: "5195", sector: "Technology", market: "Main" },
  { code: "CERATEC", name: "Ceratechnologies Berhad", stockCode: "0165", sector: "Industrial", market: "ACE" },
  { code: "CHEETAH", name: "Cheetah Holdings Berhad", stockCode: "7209", sector: "Consumer", market: "Main" },
  { code: "CHINWEL", name: "Chin Well Holdings Berhad", stockCode: "5007", sector: "Industrial", market: "Main" },
  { code: "CHUAN", name: "Chuan Hup Holdings Berhad", stockCode: "0056", sector: "Construction", market: "Main" },
  { code: "CNI", name: "CNI Holdings Berhad", stockCode: "5104", sector: "Consumer", market: "Main" },
  { code: "CONNECT", name: "Connectcounty Holdings Berhad", stockCode: "0163", sector: "Technology", market: "ACE" },
  { code: "COUNTRY", name: "Country Heights Holdings Berhad", stockCode: "4812", sector: "Property", market: "Main" },
  { code: "CREABIZ", name: "Creative Alibiz Holdings Berhad", stockCode: "0283", sector: "Consumer", market: "ACE" },

  // Additional D companies
  { code: "DATASONIC", name: "Datasonic Group Berhad", stockCode: "5216", sector: "Technology", market: "Main" },
  { code: "DESTINI", name: "Destini Berhad", stockCode: "7212", sector: "Industrial", market: "Main" },
  { code: "DGB", name: "Db Group (M) Berhad", stockCode: "7208", sector: "Consumer", market: "Main" },
  { code: "DIGISTA", name: "Digistar Corporation Berhad", stockCode: "0055", sector: "Technology", market: "Main" },
  { code: "DKLS", name: "DKLS Industries Berhad", stockCode: "7173", sector: "Construction", market: "Main" },
  { code: "DPS", name: "DPS Resources Berhad", stockCode: "0258", sector: "Industrial", market: "Main" },

  // Additional E companies
  { code: "EASTPRT", name: "Eastparc Holdings Berhad", stockCode: "0296", sector: "Healthcare", market: "ACE" },
  { code: "ECOHLDG", name: "Eco Holdings Berhad", stockCode: "0229", sector: "Industrial", market: "Main" },
  { code: "EFORCE", name: "E-Force Berhad", stockCode: "0297", sector: "Technology", market: "ACE" },
  { code: "EITA", name: "Eita Resources Berhad", stockCode: "5208", sector: "Industrial", market: "Main" },
  { code: "ELANCO", name: "Elanco Resources Berhad", stockCode: "0245", sector: "Services", market: "Main" },
  { code: "EMICO", name: "Emico Holdings Berhad", stockCode: "7187", sector: "Industrial", market: "Main" },
  { code: "ENCORP", name: "Encorp Berhad", stockCode: "4529", sector: "Property", market: "Main" },
  { code: "ESCERAM", name: "ES Ceramics Technology Berhad", stockCode: "0114", sector: "Industrial", market: "Main" },
  { code: "EUROSP", name: "Euro Holdings Berhad", stockCode: "7094", sector: "Manufacturing", market: "Main" },
  { code: "EVERGRN", name: "Evergreen Fibreboard Berhad", stockCode: "5101", sector: "Industrial", market: "Main" },
  { code: "EWEIN", name: "Ewein Berhad", stockCode: "7249", sector: "Property", market: "Main" },

  // Additional F companies
  { code: "FASTBND", name: "Fast Bond Holdings Berhad", stockCode: "0268", sector: "Industrial", market: "ACE" },
  { code: "FIHB", name: "FI Holdings Berhad", stockCode: "0214", sector: "Services", market: "Main" },
  { code: "FIRMTEN", name: "Firma Ten Holdings Berhad", stockCode: "0292", sector: "Consumer", market: "ACE" },
  { code: "FTES", name: "F T E S International Group Berhad", stockCode: "0373", sector: "Consumer", market: "ACE" },
  { code: "FUCEHS", name: "Fu Ce Hs Holdings Berhad", stockCode: "0302", sector: "Consumer", market: "ACE" },

  // ============================================================================
  // ADDITIONAL KLSE COMPANIES - Batch 3: G-L (December 15, 2025)
  // ============================================================================

  // G companies
  { code: "GBGAQRS", name: "GBA Holdings Berhad", stockCode: "0162", sector: "Property", market: "ACE" },
  { code: "GCSB", name: "Green Coast Seafood Berhad", stockCode: "0310", sector: "Consumer", market: "ACE" },
  { code: "GFM", name: "GFM Services Berhad", stockCode: "0215", sector: "Services", market: "Main" },
  { code: "GIGASUNS", name: "Giga Sunshine Berhad", stockCode: "0308", sector: "Energy", market: "ACE" },
  { code: "GLOBETRO", name: "Globetronics Technology Bhd", stockCode: "7022", sector: "Technology", market: "Main" },
  { code: "GMUTUAL", name: "G Mutual Berhad", stockCode: "0305", sector: "Services", market: "ACE" },
  { code: "GPACKET", name: "Green Packet Berhad", stockCode: "0082", sector: "Technology", market: "Main" },
  { code: "GPHAROS", name: "Grand Pharos Holdings Berhad", stockCode: "0330", sector: "Consumer", market: "ACE" },
  { code: "GSTEEL", name: "Glomac Steel Berhad", stockCode: "0288", sector: "Industrial", market: "ACE" },

  // H companies
  { code: "HANDAL", name: "Handal Energy Berhad", stockCode: "0105", sector: "Energy", market: "Main" },
  { code: "HBGLOB", name: "HB Global Limited", stockCode: "7066", sector: "Consumer", market: "Main" },
  { code: "HEVEA", name: "HeveaBoard Berhad", stockCode: "5095", sector: "Industrial", market: "Main" },
  { code: "HHHSB", name: "HHH Plantations Berhad", stockCode: "0311", sector: "Plantation", market: "ACE" },
  { code: "HOMERIZ", name: "Homeriz Corporation Berhad", stockCode: "7132", sector: "Consumer", market: "Main" },
  { code: "HPMT", name: "HPMT Holdings Berhad", stockCode: "0192", sector: "Industrial", market: "Main" },
  { code: "HWGB", name: "HWGB Holdings Berhad", stockCode: "0175", sector: "Services", market: "Main" },

  // I companies
  { code: "IDELIVR", name: "I-Deliver Group Berhad", stockCode: "0232", sector: "Transportation", market: "Main" },
  { code: "IEPMECH", name: "IEP Power Engineering Berhad", stockCode: "0306", sector: "Industrial", market: "ACE" },
  { code: "IFCAMSC", name: "IFCA MSC Berhad", stockCode: "0023", sector: "Technology", market: "Main" },
  { code: "IMDA", name: "Imda Corporation Berhad", stockCode: "0133", sector: "Services", market: "Main" },
  { code: "IRIS", name: "IRIS Corporation Berhad", stockCode: "0010", sector: "Technology", market: "Main" },

  // J companies
  { code: "JAG", name: "JAG Berhad", stockCode: "0024", sector: "Technology", market: "Main" },
  { code: "JDIPC", name: "JD I Plus Corporation Berhad", stockCode: "0317", sector: "Industrial", market: "ACE" },
  { code: "JIANKUN", name: "Jiankun International Berhad", stockCode: "0199", sector: "Industrial", market: "Main" },
  { code: "JTKBHD", name: "JTK Technology Berhad", stockCode: "0325", sector: "Technology", market: "ACE" },

  // K companies
  { code: "KAMDAR", name: "Kamdar Group (M) Berhad", stockCode: "7219", sector: "Consumer", market: "Main" },
  { code: "KBH", name: "KBH Berhad", stockCode: "0320", sector: "Consumer", market: "ACE" },
  { code: "KBES", name: "K Best Berhad", stockCode: "0280", sector: "Services", market: "ACE" },
  { code: "KHIND", name: "Khind Holdings Berhad", stockCode: "7062", sector: "Consumer", market: "Main" },
  { code: "KIARA", name: "Kiara Glory Berhad", stockCode: "0329", sector: "Consumer", market: "ACE" },
  { code: "KIM", name: "Kim Teck Cheong Consolidated Berhad", stockCode: "0046", sector: "Consumer", market: "Main" },
  { code: "KINRARA", name: "Kinrara Media Berhad", stockCode: "0282", sector: "Media", market: "ACE" },
  { code: "KISAS", name: "Kisaran Resources Berhad", stockCode: "0340", sector: "Energy", market: "ACE" },
  { code: "KMAK", name: "K Ma K Berhad", stockCode: "0301", sector: "Consumer", market: "ACE" },
  { code: "KOMARK", name: "Komarkcorp Berhad", stockCode: "7071", sector: "Industrial", market: "Main" },
  { code: "KRONOS", name: "Kronos Global Berhad", stockCode: "0352", sector: "Industrial", market: "ACE" },
  { code: "KUANTAN", name: "Kuantan Flour Mills Berhad", stockCode: "6160", sector: "Consumer", market: "Main" },
  { code: "KUCHIN", name: "Kuching Resources Berhad", stockCode: "0316", sector: "Industrial", market: "ACE" },
  { code: "KUNRONG", name: "Kunrong Holdings Berhad", stockCode: "0350", sector: "Services", market: "ACE" },

  // L companies
  { code: "LAGANG", name: "Lagang Holdings Berhad", stockCode: "0367", sector: "Consumer", market: "ACE" },
  { code: "LAMS", name: "LAM Soon (M) Berhad", stockCode: "0341", sector: "Consumer", market: "ACE" },
  { code: "LATITUDE", name: "Latitude Tree Holdings Berhad", stockCode: "7165", sector: "Industrial", market: "Main" },
  { code: "LAYHONG", name: "Lay Hong Berhad", stockCode: "9385", sector: "Consumer", market: "Main" },
  { code: "LCTH", name: "LCTH Corporation Berhad", stockCode: "5009", sector: "Industrial", market: "Main" },
  { code: "LDMD", name: "LDMD Holdings Berhad", stockCode: "0289", sector: "Industrial", market: "ACE" },
  { code: "LECHANG", name: "Lechang Berhad", stockCode: "0342", sector: "Consumer", market: "ACE" },
  { code: "LEGEND", name: "Legend Holdings Berhad", stockCode: "0313", sector: "Consumer", market: "ACE" },
  { code: "LIBERTY", name: "Liberty Resources Berhad", stockCode: "0312", sector: "Consumer", market: "ACE" },
  { code: "LIIHEN", name: "Lii Hen Industries Berhad", stockCode: "7089", sector: "Industrial", market: "Main" },
  { code: "LIMKOKW", name: "Limkokwing Holdings Berhad", stockCode: "0319", sector: "Education", market: "ACE" },
  { code: "LTKM", name: "LTKM Berhad", stockCode: "7085", sector: "Consumer", market: "Main" },
  { code: "LUBSKY", name: "Lubosky Holdings Berhad", stockCode: "0327", sector: "Consumer", market: "ACE" },

  // ============================================================================
  // ADDITIONAL A COMPANIES (December 2024)
  // ============================================================================
  { code: "1TECH", name: "Onetech Solutions Holdings Berhad", stockCode: "03041", sector: "Technology", market: "LEAP" },
  { code: "A1AKK", name: "A1 A.K. Koh Group Berhad", stockCode: "0365", sector: "Consumer", market: "ACE" },
  { code: "ACO", name: "ACO Group Berhad", stockCode: "0218", sector: "Consumer", market: "Main" },
  { code: "ADVENTA", name: "Adventa Berhad", stockCode: "7191", sector: "Healthcare", market: "Main" },
  { code: "AHB", name: "AHB Holdings Berhad", stockCode: "7315", sector: "Consumer", market: "Main" },
  { code: "AIM", name: "Advance Information Marketing Berhad", stockCode: "0122", sector: "Technology", market: "Main" },
  { code: "ALAM", name: "Alam Maritim Resources Berhad", stockCode: "5115", sector: "Energy", market: "Main" },
  { code: "ALCOM", name: "Alcom Group Berhad", stockCode: "2674", sector: "Industrial", market: "Main" },
  { code: "ALRICH", name: "Aldrich Resources Berhad", stockCode: "0079", sector: "Industrial", market: "ACE" },
  { code: "AMLEX", name: "Amlex Holdings Berhad", stockCode: "03011", sector: "Industrial", market: "LEAP" },
  { code: "AMTEL", name: "Amtel Holdings Berhad", stockCode: "7031", sector: "Technology", market: "Main" },
  { code: "ANCOMLB", name: "Ancom Logistics Berhad", stockCode: "0048", sector: "Services", market: "ACE" },
  { code: "AQUAWALK", name: "Aquawalk Group Berhad", stockCode: "0380", sector: "Consumer", market: "ACE" },
  { code: "ARK", name: "Ark Resources Holdings Berhad", stockCode: "7007", sector: "Construction", market: "Main" },
  { code: "ARBB", name: "ARB Berhad", stockCode: "7181", sector: "Industrial", market: "Main" },
  { code: "ASB", name: "Advance Synergy Berhad", stockCode: "1481", sector: "Consumer", market: "Main" },
  { code: "AWANTEC", name: "Awanbiru Technology Berhad", stockCode: "5204", sector: "Technology", market: "Main" },
  { code: "AWC", name: "AWC Berhad", stockCode: "7579", sector: "Services", market: "Main" },
  { code: "AYS", name: "AYS Ventures Berhad", stockCode: "5021", sector: "Industrial", market: "Main" },
  { code: "AXTERIA", name: "Axteria Group Berhad", stockCode: "7120", sector: "Consumer", market: "Main" },
  { code: "AZRB", name: "Ahmad Zaki Resources Berhad", stockCode: "7078", sector: "Construction", market: "Main" },

  // ============================================================================
  // ADDITIONAL B COMPANIES (December 2024)
  // ============================================================================
  { code: "BABA", name: "Baba Eco Group Berhad", stockCode: "03012", sector: "Consumer", market: "LEAP" },
  { code: "BCB", name: "BCB Berhad", stockCode: "6602", sector: "Property", market: "Main" },
  { code: "BDB", name: "Bina Darulaman Berhad", stockCode: "6173", sector: "Construction", market: "Main" },
  { code: "BENALEC", name: "Benalec Holdings Berhad", stockCode: "5190", sector: "Construction", market: "Main" },
  { code: "BHIC", name: "Boustead Heavy Industries Corporation Berhad", stockCode: "8133", sector: "Industrial", market: "Main" },

  // ============================================================================
  // ADDITIONAL C COMPANIES (December 2024)
  // ============================================================================

  // ============================================================================
  // ADDITIONAL E COMPANIES (December 2024)
  // ============================================================================
  { code: "EDEN", name: "Eden Inc. Berhad", stockCode: "7471", sector: "Consumer", market: "Main" },

  // ============================================================================
  // ADDITIONAL G COMPANIES (December 2024)
  // ============================================================================
  { code: "GADANG", name: "Gadang Holdings Berhad", stockCode: "9261", sector: "Construction", market: "Main" },

  // ============================================================================
  // M COMPANIES
  // ============================================================================
  { code: "MALTON", name: "Malton Berhad", stockCode: "6181", sector: "Property", market: "Main" },
  { code: "MASMALL", name: "Masterskill Holdings Berhad", stockCode: "0331", sector: "Consumer", market: "ACE" },
  { code: "MEDIAC", name: "Media Concept Berhad", stockCode: "0347", sector: "Media", market: "ACE" },
  { code: "MERC", name: "Mercury Securities Group Berhad", stockCode: "0351", sector: "Finance", market: "ACE" },
  { code: "METECH", name: "Mah Tek Holdings Berhad", stockCode: "0315", sector: "Industrial", market: "ACE" },
  { code: "MINDA", name: "Minda Global Berhad", stockCode: "0337", sector: "Technology", market: "ACE" },
  { code: "MOBILIA", name: "Mobilia Holdings Berhad", stockCode: "0333", sector: "Consumer", market: "ACE" },
  { code: "MYSPEED", name: "MySpeedNet Berhad", stockCode: "0335", sector: "Telecommunications", market: "ACE" },

  // ============================================================================
  // N COMPANIES
  // ============================================================================
  { code: "NAZA", name: "Naza Moto Berhad", stockCode: "0332", sector: "Consumer", market: "ACE" },
  { code: "NIHSIN", name: "Nihsin Resources Berhad", stockCode: "0354", sector: "Consumer", market: "ACE" },
  { code: "NTECH", name: "NTech Solutions Berhad", stockCode: "0356", sector: "Technology", market: "ACE" },

  // ============================================================================
  // O COMPANIES
  // ============================================================================
  { code: "OCEAN", name: "Ocean Holdings Berhad", stockCode: "0336", sector: "Consumer", market: "ACE" },
  { code: "OPENSYS", name: "Opensys (M) Berhad", stockCode: "0040", sector: "Technology", market: "Main" },
  { code: "OPERON", name: "Operon Holdings Berhad", stockCode: "0321", sector: "Industrial", market: "ACE" },
  { code: "OVERSEA", name: "Overseas Holdings Berhad", stockCode: "0349", sector: "Industrial", market: "ACE" },

  // ============================================================================
  // P COMPANIES
  // ============================================================================
  { code: "PJBUMI", name: "PJ Bumi Berhad", stockCode: "0366", sector: "Construction", market: "ACE" },
  { code: "PNE", name: "PNE PCB Berhad", stockCode: "0322", sector: "Technology", market: "ACE" },
  { code: "POWER", name: "Power Holdings Berhad", stockCode: "0355", sector: "Consumer", market: "ACE" },
  { code: "PREGEN", name: "Pregen Berhad", stockCode: "0348", sector: "Industrial", market: "ACE" },
  { code: "PRESTAR", name: "Prestar Resources Berhad", stockCode: "9873", sector: "Industrial", market: "Main" },
  { code: "PROLEXU", name: "Prolexus Berhad", stockCode: "8058", sector: "Consumer", market: "Main" },

  // ============================================================================
  // Q COMPANIES
  // ============================================================================

  // ============================================================================
  // R COMPANIES
  // ============================================================================
  { code: "REDONE", name: "Red One Berhad", stockCode: "0357", sector: "Telecommunications", market: "ACE" },
  { code: "RELIANCE", name: "Reliance Pacific Berhad", stockCode: "4558", sector: "Consumer", market: "Main" },

  // ============================================================================
  // S COMPANIES
  // ============================================================================
  { code: "STGROUP", name: "ST Group Food Industries Holdings Berhad", stockCode: "0368", sector: "Consumer", market: "ACE" },

  // ============================================================================
  // T COMPANIES
  // ============================================================================

  // ============================================================================
  // U COMPANIES
  // ============================================================================

  // ============================================================================
  // V COMPANIES
  // ============================================================================

  // ============================================================================
  // W COMPANIES
  // ============================================================================

  // ============================================================================
  // Y COMPANIES
  // ============================================================================

  // ============================================================================
  // Z COMPANIES
  // ============================================================================

  // ============================================================================
  // 2025 NEW IPO COMPANIES (December 2025)
  // ============================================================================
  { code: "BMS", name: "BMS Holdings Berhad", stockCode: "0385", sector: "Consumer", market: "ACE" },
  { code: "GENERGY", name: "Wasco Greenergy Berhad", stockCode: "5343", sector: "Energy", market: "Main" },
  { code: "GENETEC", name: "Genetec Technology Berhad", stockCode: "0104", sector: "Technology", market: "ACE" },
  { code: "HEXZA", name: "Hexza Corporation Berhad", stockCode: "3298", sector: "Industrial", market: "Main" },
  { code: "LACMED", name: "LAC Med Berhad", stockCode: "5341", sector: "Healthcare", market: "Main" },
  { code: "ORKIM", name: "Orkim Berhad", stockCode: "5348", sector: "Energy", market: "Main" },
  { code: "POLYMER", name: "Polymer Link Holdings Berhad", stockCode: "0381", sector: "Industrial", market: "ACE" },

  // ============================================================================
  // ADDITIONAL 2024-2025 COMPANIES
  // ============================================================================
  { code: "ABLEGRP", name: "AbleGroup Berhad", stockCode: "7086", sector: "Property", market: "Main" },
  { code: "ACME", name: "ACME Holdings Berhad", stockCode: "7131", sector: "Property", market: "Main" },
  { code: "AEM", name: "AE Multi Holdings Berhad", stockCode: "7146", sector: "Industrial", market: "Main" },
  { code: "AFUJIYA", name: "ABM Fujiya Berhad", stockCode: "5198", sector: "Industrial", market: "Main" },
  { code: "APB", name: "APB Resources Berhad", stockCode: "5568", sector: "Industrial", market: "Main" },
  { code: "APEX", name: "Apex Equity Holdings Berhad", stockCode: "5088", sector: "Financial", market: "Main" },
  { code: "ARKA", name: "Arka Berhad", stockCode: "7218", sector: "Transportation", market: "Main" },
  { code: "ASDION", name: "Asdion Berhad", stockCode: "0068", sector: "Technology", market: "ACE" },
  { code: "AURO", name: "Auro Holdings Berhad", stockCode: "5025", sector: "Industrial", market: "Main" },
  { code: "AUTORIS", name: "Autoris Group Holdings Berhad", stockCode: "03059", sector: "Financial", market: "LEAP" },
  { code: "AVI", name: "Avillion Berhad", stockCode: "8885", sector: "Consumer", market: "Main" },

  // ============================================================================
  // ACE MARKET ADDITIONS (December 2024)
  // ============================================================================
  { code: "AUMAS2", name: "Aumas-Visi Berhad", stockCode: "0098", sector: "Industrial", market: "ACE" },
  { code: "BTECH", name: "B-Tech Berhad", stockCode: "0011", sector: "Utilities", market: "ACE" },
  { code: "DFX", name: "DFx Technology Group Berhad", stockCode: "0131", sector: "Technology", market: "ACE" },
  { code: "DGB2", name: "DGB Asia Berhad", stockCode: "0152", sector: "Technology", market: "ACE" },
  { code: "EDUSPEC", name: "Eduspec Holdings Berhad", stockCode: "0107", sector: "Technology", market: "ACE" },
  { code: "ERDASAN", name: "Erdasan Berhad", stockCode: "0072", sector: "Industrial", market: "ACE" },
  { code: "FAST", name: "Fast Energy Holdings Berhad", stockCode: "0084", sector: "Industrial", market: "ACE" },
  { code: "FOCUS", name: "Focus Dynamics Group Berhad", stockCode: "0116", sector: "Consumer", market: "ACE" },
  { code: "GOCEAN", name: "G Ocean Berhad", stockCode: "0074", sector: "Consumer", market: "ACE" },
  { code: "HEXCAP", name: "Hexcapital Berhad", stockCode: "0035", sector: "Telecommunications", market: "ACE" },
  { code: "HHHCORP", name: "HHH Corp Berhad", stockCode: "0160", sector: "Industrial", market: "ACE" },
  { code: "INNITY", name: "Innity Corporation Berhad", stockCode: "0147", sector: "Media", market: "ACE" },
  { code: "K1", name: "K-One Technology Berhad", stockCode: "0111", sector: "Technology", market: "ACE" },
  { code: "KGROUP", name: "K-Star Group Berhad", stockCode: "0036", sector: "Technology", market: "ACE" },
  { code: "KHJB", name: "KHJ Berhad", stockCode: "0210", sector: "Retail", market: "ACE" },
  { code: "LAMBO", name: "Lambo Group Berhad", stockCode: "0018", sector: "Technology", market: "ACE" },
  { code: "LYC", name: "LYC Healthcare Berhad", stockCode: "0075", sector: "Healthcare", market: "ACE" },
  { code: "MGRC", name: "MGR Corporation Berhad", stockCode: "0155", sector: "Healthcare", market: "ACE" },
  { code: "MLAB", name: "MLabs Systems Berhad", stockCode: "0085", sector: "Technology", market: "ACE" },
  { code: "MMAG", name: "MMedia Berhad", stockCode: "0034", sector: "Transportation", market: "ACE" },
  { code: "MNC", name: "MN Holdings Corporation Berhad", stockCode: "0103", sector: "Telecommunications", market: "ACE" },
  { code: "MPAY", name: "Mobipay Berhad", stockCode: "0156", sector: "Technology", market: "ACE" },
  { code: "MQTECH", name: "MQ Technology Berhad", stockCode: "0070", sector: "Technology", market: "ACE" },
  { code: "MTOUCHE", name: "M-Touche Technology Berhad", stockCode: "0092", sector: "Telecommunications", market: "ACE" },
  { code: "N2N", name: "N2N Connect Berhad", stockCode: "0108", sector: "Technology", market: "ACE" },
  { code: "NETX", name: "NetX Holdings Berhad", stockCode: "0020", sector: "Technology", market: "ACE" },
  { code: "NOVATECH", name: "Novatech Solutions Berhad", stockCode: "0017", sector: "Telecommunications", market: "ACE" },
  { code: "OPPSTAR", name: "Oppstar Berhad", stockCode: "0275", sector: "Technology", market: "ACE" },
  { code: "OSKVI", name: "OSK Ventures International Berhad", stockCode: "0053", sector: "Finance", market: "ACE" },
  { code: "PARLO", name: "Parlo Berhad", stockCode: "0022", sector: "Consumer", market: "ACE" },
  { code: "PASUKGB", name: "Pasukhas Group Berhad", stockCode: "0177", sector: "Industrial", market: "ACE" },
  { code: "PINEAPP", name: "Pineapple Resources Berhad", stockCode: "0006", sector: "Technology", market: "ACE" },
  { code: "PLABS", name: "PNE PCB Berhad", stockCode: "0171", sector: "Consumer", market: "ACE" },
  { code: "PMW", name: "PM Resources Berhad", stockCode: "0379", sector: "Industrial", market: "ACE" },
  { code: "PRIVA", name: "Privasia Technology Berhad", stockCode: "0123", sector: "Telecommunications", market: "ACE" },
  { code: "PUC", name: "PUC Berhad", stockCode: "0007", sector: "Media", market: "ACE" },
  { code: "RAMSSOL2", name: "Ramssol Group Berhad", stockCode: "0236", sector: "Technology", market: "ACE" },
  { code: "SALIRAN", name: "Saliran Group Berhad", stockCode: "0346", sector: "Industrial", market: "ACE" },
  { code: "SCC", name: "SCC Holdings Berhad", stockCode: "0158", sector: "Consumer", market: "ACE" },
  { code: "SCOPE", name: "Scope Industries Berhad", stockCode: "0028", sector: "Industrial", market: "ACE" },
  { code: "SEDANIA", name: "Sedania Innovator Berhad", stockCode: "0178", sector: "Consumer", market: "ACE" },
  { code: "SMETRIC", name: "Smart Metric Group Berhad", stockCode: "0203", sector: "Technology", market: "ACE" },
  { code: "SOLUTN", name: "Solution Engineering Holdings Berhad", stockCode: "0093", sector: "Technology", market: "ACE" },
  { code: "SRIDGE", name: "Sunridge Group Berhad", stockCode: "0129", sector: "Telecommunications", market: "ACE" },
  { code: "STRAITS", name: "Straits Inter Logistics Berhad", stockCode: "0080", sector: "Transportation", market: "ACE" },
  { code: "SUNVIEW", name: "Sunview Group Berhad", stockCode: "0262", sector: "Energy", market: "ACE" },
  { code: "SUNZEN", name: "Sunzen Biotech Berhad", stockCode: "0148", sector: "Consumer", market: "ACE" },
  { code: "SYSTECH", name: "Systech Berhad", stockCode: "0050", sector: "Technology", market: "ACE" },
  { code: "TAGHILL", name: "Taghill Berhad", stockCode: "0241", sector: "Construction", market: "ACE" },
  { code: "TDEX", name: "Tele Dynamics Holdings Berhad", stockCode: "0132", sector: "Technology", market: "ACE" },
  { code: "UCREST", name: "UCrest Berhad", stockCode: "0005", sector: "Technology", market: "ACE" },
  { code: "VINVEST", name: "VinVest Capital Holdings Berhad", stockCode: "0069", sector: "Technology", market: "ACE" },
  { code: "VSOLAR", name: "VSolar Group Berhad", stockCode: "0066", sector: "Technology", market: "ACE" },
  { code: "XOXNET", name: "XOX Network Berhad", stockCode: "0140", sector: "Consumer", market: "ACE" },
  { code: "YBS", name: "YBS International Berhad", stockCode: "0025", sector: "Industrial", market: "ACE" },
  { code: "YEWLEE", name: "Yew Lee Pacific Group Berhad", stockCode: "0248", sector: "Industrial", market: "ACE" },
  { code: "YGL", name: "YGL Convergence Berhad", stockCode: "0086", sector: "Technology", market: "ACE" },
  { code: "ZENTECH", name: "Zentech Group Berhad", stockCode: "0094", sector: "Technology", market: "ACE" },

  // ============================================================================
  // ADDITIONAL COMPANIES (December 2025 - Sync from stock-codes.ts)
  // ============================================================================
  { code: "ABLEGLOB", name: "Ablegroup Berhad", stockCode: "7167", sector: "Industrial", market: "Main" },
  { code: "ADVCON", name: "Advancecon Holdings Berhad", stockCode: "5281", sector: "Construction", market: "Main" },
  { code: "ADVPKG", name: "Advance Packaging Industry Berhad", stockCode: "9148", sector: "Industrial", market: "Main" },
  { code: "AEMULUS", name: "Aemulus Holdings Berhad", stockCode: "0181", sector: "Technology", market: "ACE" },
  { code: "AGMO", name: "AGMO Holdings Berhad", stockCode: "0258", sector: "Technology", market: "Main" },
  { code: "AGX", name: "AGX Group Berhad", stockCode: "0299", sector: "Technology", market: "ACE" },
  { code: "AIMFLEX", name: "Aimflex Berhad", stockCode: "0209", sector: "Technology", market: "ACE" },
  { code: "AIZO", name: "AIZO Group Berhad", stockCode: "7219", sector: "Consumer", market: "Main" },
  { code: "ALPHA", name: "Alpha IVF Group Berhad", stockCode: "0303", sector: "Healthcare", market: "ACE" },
  { code: "ALSREIT", name: "Al-Salam REIT", stockCode: "5269", sector: "REIT", market: "Main" },
  { code: "APPASIA", name: "AppAsia Berhad", stockCode: "0119", sector: "Technology", market: "ACE" },
  { code: "ASIAPLY", name: "Asia Poly Holdings Berhad", stockCode: "0105", sector: "Industrial", market: "ACE" },
  { code: "ASM", name: "ASM Automation Group Berhad", stockCode: "0362", sector: "Industrial", market: "ACE" },
  { code: "BCMALL", name: "BCM Alliance Berhad", stockCode: "0187", sector: "Consumer", market: "ACE" },
  { code: "BERTAM", name: "Bertam Alliance Berhad", stockCode: "9814", sector: "Plantation", market: "Main" },
  { code: "BETA", name: "Beta Holdings Berhad", stockCode: "0263", sector: "Industrial", market: "Main" },
  { code: "BIG", name: "Big Industries Berhad", stockCode: "7005", sector: "Industrial", market: "Main" },
  { code: "BINACOM", name: "Binasat Communications Berhad", stockCode: "0195", sector: "Telecommunications", market: "Main" },
  { code: "BIOHLDG", name: "Bio Holdings Berhad", stockCode: "0179", sector: "Consumer", market: "ACE" },
  { code: "BMGREEN", name: "BM Green Berhad", stockCode: "0168", sector: "Industrial", market: "ACE" },
  { code: "CATCHA", name: "Catcha Investment Corp", stockCode: "0173", sector: "Technology", market: "ACE" },
  { code: "CEB", name: "CEB Berhad", stockCode: "5311", sector: "Industrial", market: "Main" },
  { code: "COMPLET", name: "Complete Logistic Services Berhad", stockCode: "5136", sector: "Services", market: "Main" },
  { code: "CREST", name: "Crest Builder Holdings Berhad", stockCode: "0323", sector: "Construction", market: "ACE" },
  { code: "DSONIC", name: "D'Sonic Group Berhad", stockCode: "0041", sector: "Technology", market: "Main" },
  { code: "EFRAME", name: "EFrame Berhad", stockCode: "0227", sector: "Industrial", market: "Main" },
  { code: "ELSOFT", name: "Elsoft Research Berhad", stockCode: "0090", sector: "Technology", market: "Main" },
  { code: "EMCC", name: "EMCC Holdings Berhad", stockCode: "0286", sector: "Industrial", market: "ACE" },
  { code: "ENRA", name: "ENRA Group Berhad", stockCode: "8613", sector: "Industrial", market: "Main" },
  { code: "ESAFE", name: "ESafe Holdings Berhad", stockCode: "0190", sector: "Technology", market: "ACE" },
  { code: "EVD", name: "EVD Berhad", stockCode: "0174", sector: "Technology", market: "ACE" },
  { code: "FARMPRICE", name: "FarmPrice Holdings Berhad", stockCode: "0304", sector: "Consumer", market: "ACE" },
  { code: "FINTEC", name: "Fintec Global Berhad", stockCode: "0150", sector: "Technology", market: "Main" },
  { code: "FLEXI", name: "Flexi Vision Berhad", stockCode: "0231", sector: "Technology", market: "Main" },
  { code: "FM", name: "FM Global Logistics Holdings Berhad", stockCode: "7210", sector: "Services", market: "Main" },
  { code: "FOCUSP", name: "Focus Point Holdings Berhad", stockCode: "0157", sector: "Consumer", market: "Main" },
  { code: "FORMIS", name: "Formis Resources Berhad", stockCode: "9318", sector: "Technology", market: "Main" },
  { code: "FSBM", name: "FSBM Holdings Berhad", stockCode: "9377", sector: "Technology", market: "Main" },
  { code: "GDB", name: "GDB Holdings Berhad", stockCode: "0198", sector: "Construction", market: "Main" },
  { code: "GLXT", name: "Glostrext Berhad", stockCode: "0284", sector: "Industrial", market: "ACE" },
  { code: "HEXIND", name: "Hextar Industries Berhad", stockCode: "0161", sector: "Consumer", market: "Main" },
  { code: "HHRG", name: "HHRG Holdings Berhad", stockCode: "0175", sector: "Services", market: "Main" },
  { code: "HLT", name: "HLT Global Berhad", stockCode: "0188", sector: "Technology", market: "ACE" },
  { code: "HM", name: "HM Sdn Bhd", stockCode: "0060", sector: "Industrial", market: "Main" },
  { code: "HSSEB", name: "HSS Engineers Berhad", stockCode: "0185", sector: "Services", market: "Main" },
  { code: "INTA", name: "Inta Bina Group Berhad", stockCode: "0192", sector: "Construction", market: "Main" },
  { code: "ITMAX", name: "Itmax System Berhad", stockCode: "5309", sector: "Technology", market: "Main" },
  { code: "ITRONIC", name: "I-Tronic Solutions Berhad", stockCode: "9393", sector: "Technology", market: "Main" },
  { code: "JBC", name: "JBC Berhad", stockCode: "0250", sector: "Consumer", market: "Main" },
  { code: "KANGER", name: "Kanger International Berhad", stockCode: "0170", sector: "Healthcare", market: "Main" },
  { code: "KIALIM", name: "Kia Lim Berhad", stockCode: "6211", sector: "Property", market: "Main" },
  { code: "KIMHIN", name: "Kim Hin Industry Berhad", stockCode: "5371", sector: "Industrial", market: "Main" },
  { code: "KPOWER", name: "K-Power Global Berhad", stockCode: "7130", sector: "Industrial", market: "Main" },
  { code: "KPPROP", name: "KIP Properties Berhad", stockCode: "7077", sector: "Property", market: "Main" },
  { code: "KTC", name: "KTC Holdings Berhad", stockCode: "0180", sector: "Industrial", market: "ACE" },
  { code: "LANDMRK", name: "Landmark Resources Holdings Berhad", stockCode: "1643", sector: "Consumer", market: "Main" },
  { code: "LIONIND", name: "Lion Industries Corporation Berhad", stockCode: "4235", sector: "Industrial", market: "Main" },
  { code: "LKL", name: "LKL International Berhad", stockCode: "0182", sector: "Technology", market: "ACE" },
  { code: "LSH", name: "LSH Holding Berhad", stockCode: "0351", sector: "Industrial", market: "ACE" },
  { code: "M&A", name: "M&A Securities Berhad", stockCode: "7082", sector: "Finance", market: "Main" },
  { code: "MAG", name: "MAG Holdings Berhad", stockCode: "0095", sector: "Consumer", market: "Main" },
  { code: "MASDEC", name: "Masdec Berhad", stockCode: "0343", sector: "Industrial", market: "ACE" },
  { code: "MTAG", name: "MTAG Group Berhad", stockCode: "0213", sector: "Industrial", market: "Main" },
  { code: "MTEC2", name: "M-Tec Global Berhad", stockCode: "0295", sector: "Technology", market: "ACE" },
  { code: "NADIBHD", name: "Nadi Berhad", stockCode: "0206", sector: "Property", market: "Main" },
  { code: "NATGATE", name: "Natgate Resources Berhad", stockCode: "0270", sector: "Industrial", market: "Main" },
  { code: "NCT", name: "NCT Alliance Berhad", stockCode: "0056", sector: "Technology", market: "Main" },
  { code: "OCK", name: "OCK Group Berhad", stockCode: "0172", sector: "Telecommunications", market: "Main" },
  { code: "OPTIMAX", name: "Optimax Holdings Berhad", stockCode: "0222", sector: "Healthcare", market: "Main" },
  { code: "PARAGON", name: "Paragon Union Berhad", stockCode: "9407", sector: "Industrial", market: "Main" },
  { code: "PCCS", name: "PCCS Group Berhad", stockCode: "6068", sector: "Consumer", market: "Main" },
  { code: "PESTEC", name: "Pestech International Berhad", stockCode: "5219", sector: "Energy", market: "Main" },
  { code: "PGLOBAL", name: "Petronas Global Berhad", stockCode: "5331", sector: "Services", market: "Main" },
  { code: "PTRANS", name: "Perak Transit Berhad", stockCode: "0186", sector: "Services", market: "Main" },
  { code: "PWRWELL", name: "Powerwell Holdings Berhad", stockCode: "0217", sector: "Industrial", market: "Main" },
  { code: "QES", name: "QES Group Berhad", stockCode: "0196", sector: "Technology", market: "Main" },
  { code: "REVENUE", name: "Revenue Group Berhad", stockCode: "0200", sector: "Technology", market: "Main" },
  { code: "SBH", name: "SB Holdings Berhad", stockCode: "0300", sector: "Consumer", market: "ACE" },
  { code: "SCICOM", name: "Scicom (MSC) Berhad", stockCode: "0099", sector: "Technology", market: "Main" },
  { code: "SEAL", name: "Seal Incorporated Berhad", stockCode: "4286", sector: "Industrial", market: "Main" },
  { code: "SENDAI", name: "Sendai Namiki Shoji Berhad", stockCode: "5205", sector: "Industrial", market: "Main" },
  { code: "SERSOL", name: "Serba Dinamik Holdings Berhad", stockCode: "0055", sector: "Energy", market: "Main" },
  { code: "SORENTO", name: "Sorento Group Berhad", stockCode: "0326", sector: "Consumer", market: "ACE" },
  { code: "SUMI", name: "Sumirubber Malaysia Berhad", stockCode: "0349", sector: "Industrial", market: "ACE" },
  { code: "TCS", name: "TCS Group Holdings Berhad", stockCode: "0221", sector: "Industrial", market: "Main" },
  { code: "WELLCHIP", name: "Wellchip Holdings Berhad", stockCode: "5325", sector: "Technology", market: "Main" },
  { code: "WELLS", name: "Wells Oilfield Services Berhad", stockCode: "0271", sector: "Energy", market: "Main" },
  { code: "WESTRVR", name: "Western Rivers Resources Berhad", stockCode: "0353", sector: "Industrial", market: "ACE" },
]

// Helper functions
export function getCompanyByCode(code: string): CompanyData | undefined {
  return COMPANY_DATA.find(c => c.code.toUpperCase() === code.toUpperCase())
}

export function getCompanyByStockCode(stockCode: string): CompanyData | undefined {
  return COMPANY_DATA.find(c => c.stockCode === stockCode)
}

export function getCompaniesByCategory(category: number, type: 'yoy' | 'qoq' = 'yoy'): CompanyData[] {
  return COMPANY_DATA.filter(c => {
    const cat = type === 'yoy' ? c.yoyCategory : c.qoqCategory
    return cat === category
  })
}

export function getCompaniesBySector(sector: string): CompanyData[] {
  return COMPANY_DATA.filter(c => c.sector === sector)
}

export function getCategoryCount(type: 'yoy' | 'qoq' = 'yoy'): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 }
  COMPANY_DATA.forEach(c => {
    const cat = type === 'yoy' ? c.yoyCategory : c.qoqCategory
    if (cat !== undefined) {
      counts[cat] = (counts[cat] || 0) + 1
    } else {
      counts[0] = (counts[0] || 0) + 1 // Uncategorized
    }
  })
  return counts
}

export function getTopPerformers(type: 'yoy' | 'qoq' = 'yoy', limit: number = 5): CompanyData[] {
  return [...COMPANY_DATA]
    .filter(c => (type === 'yoy' ? c.profitYoY : c.profitQoQ) !== undefined)
    .sort((a, b) => {
      const aProfit = type === 'yoy' ? (a.profitYoY ?? 0) : (a.profitQoQ ?? 0)
      const bProfit = type === 'yoy' ? (b.profitYoY ?? 0) : (b.profitQoQ ?? 0)
      return bProfit - aProfit
    })
    .slice(0, limit)
}

export function getStrongBuyCompanies(limit: number = 5): CompanyData[] {
  // Strong buy = Category 1 (Revenue UP, Profit UP) with highest profit growth
  return COMPANY_DATA
    .filter(c => c.yoyCategory === 1 && c.profitYoY !== undefined)
    .sort((a, b) => (b.profitYoY ?? 0) - (a.profitYoY ?? 0))
    .slice(0, limit)
}

export function getAllSectors(): string[] {
  return [...new Set(COMPANY_DATA.map(c => c.sector))].sort()
}

export function getGainersLosersCount(): { gainers: number; losers: number; unchanged: number; noData: number } {
  let gainers = 0, losers = 0, unchanged = 0, noData = 0
  COMPANY_DATA.forEach(c => {
    if (c.profitYoY === undefined) noData++
    else if (c.profitYoY > 0) gainers++
    else if (c.profitYoY < 0) losers++
    else unchanged++
  })
  return { gainers, losers, unchanged, noData }
}

export interface SectorStats {
  sector: string
  count: number
  avgProfitGrowth: number
  companiesWithData: number
}

export function getSectorStats(limit: number = 5): SectorStats[] {
  const sectorMap = new Map<string, { count: number; totalProfit: number; withData: number }>()

  COMPANY_DATA.forEach(c => {
    const existing = sectorMap.get(c.sector) || { count: 0, totalProfit: 0, withData: 0 }
    const hasData = c.profitYoY !== undefined
    sectorMap.set(c.sector, {
      count: existing.count + 1,
      totalProfit: existing.totalProfit + (c.profitYoY ?? 0),
      withData: existing.withData + (hasData ? 1 : 0)
    })
  })

  const stats: SectorStats[] = []
  sectorMap.forEach((value, sector) => {
    stats.push({
      sector,
      count: value.count,
      avgProfitGrowth: value.withData > 0 ? value.totalProfit / value.withData : 0,
      companiesWithData: value.withData
    })
  })

  return stats
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Get companies with full financial analysis
export function getAnalyzedCompanies(): CompanyData[] {
  return COMPANY_DATA.filter(c => c.hasAnalysis === true)
}

// Alias for backward compatibility
export function getCompaniesWithData(): CompanyData[] {
  return getAnalyzedCompanies()
}

// Get companies without full financial analysis
export function getCompaniesWithoutData(): CompanyData[] {
  return COMPANY_DATA.filter(c => c.hasAnalysis !== true)
}

// Get count of analyzed companies
export function getAnalyzedCompanyCount(): number {
  return getAnalyzedCompanies().length
}

// Get total company count
export function getTotalCompanyCount(): number {
  return COMPANY_DATA.length
}

// Check if company has full financial data
export function hasFinancialData(company: CompanyData): boolean {
  return company.yoyCategory !== undefined && company.profitYoY !== undefined
}

// Check if a stock code has analysis data (replacement for isCore80Stock)
export function hasAnalysisData(stockCode: string): boolean {
  const company = getCompanyByStockCode(stockCode)
  return company?.hasAnalysis === true
}

// Get all stock codes with analysis data
export function getAnalyzedStockCodes(): string[] {
  return getAnalyzedCompanies().map(c => c.stockCode)
}
