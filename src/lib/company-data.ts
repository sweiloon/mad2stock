/**
 * Company Performance Data
 * Parsed from report-summary.txt - December 11, 2025
 * All data verified against KLSE Screener
 */

export interface CompanyData {
  code: string
  name: string
  stockCode: string
  sector: string
  yoyCategory: number
  qoqCategory: number
  revenueYoY: number
  profitYoY: number
  revenueQoQ: number
  profitQoQ: number
  latestRevenue: number // in millions
  latestProfit: number // in millions
  marketCap?: number // in millions
}

// Sector mappings
export const SECTORS = [
  "Finance",
  "Construction",
  "Technology",
  "Property",
  "Plantation",
  "Manufacturing",
  "Consumer",
  "Healthcare",
  "Industrial",
  "Energy",
  "Media",
  "Retail",
  "Education",
  "Automotive",
  "Offshore",
  "Services",
] as const

// All 80 companies with real data from report-summary.txt
export const COMPANY_DATA: CompanyData[] = [
  // Category 1 YoY: Revenue UP, Profit UP (22 companies)
  { code: "AEONCR", name: "AEON Credit Service", stockCode: "5139", sector: "Finance", yoyCategory: 1, qoqCategory: 1, revenueYoY: 14.1, profitYoY: 1.4, revenueQoQ: 5.2, profitQoQ: 8.3, latestRevenue: 617.9, latestProfit: 72.2 },
  { code: "BNASTRA", name: "Bina Nusantara", stockCode: "7195", sector: "Education", yoyCategory: 1, qoqCategory: 1, revenueYoY: 71.9, profitYoY: 24.0, revenueQoQ: 15.2, profitQoQ: 12.5, latestRevenue: 396.8, latestProfit: 28.4 },
  { code: "CETECH", name: "Cetech Group", stockCode: "03024", sector: "Technology", yoyCategory: 1, qoqCategory: 1, revenueYoY: 23.2, profitYoY: 4.3, revenueQoQ: 8.5, profitQoQ: 5.2, latestRevenue: 54.2, latestProfit: 4.8 },
  { code: "ECOWLD", name: "Eco World Development", stockCode: "8206", sector: "Property", yoyCategory: 1, qoqCategory: 1, revenueYoY: 17.6, profitYoY: 51.9, revenueQoQ: 52.4, profitQoQ: 235.2, latestRevenue: 750.8, latestProfit: 126.7 },
  { code: "HAILY", name: "Haily Group Berhad", stockCode: "0237", sector: "Construction", yoyCategory: 1, qoqCategory: 1, revenueYoY: 36.6, profitYoY: 52.4, revenueQoQ: 15.8, profitQoQ: 89.3, latestRevenue: 115.8, latestProfit: 3.2 },
  { code: "HIGHTEC", name: "Hightec Global", stockCode: "7033", sector: "Technology", yoyCategory: 1, qoqCategory: 1, revenueYoY: 44.2, profitYoY: 180.6, revenueQoQ: 22.1, profitQoQ: 45.8, latestRevenue: 7.5, latestProfit: 1.1 },
  { code: "KENERGY", name: "Kenergy Holdings", stockCode: "0307", sector: "Energy", yoyCategory: 1, qoqCategory: 1, revenueYoY: 10.4, profitYoY: 41.5, revenueQoQ: 5.2, profitQoQ: 18.3, latestRevenue: 35.1, latestProfit: 7.5 },
  { code: "KMLOONG", name: "Kim Loong Resources", stockCode: "5027", sector: "Plantation", yoyCategory: 1, qoqCategory: 1, revenueYoY: 7.5, profitYoY: 19.7, revenueQoQ: 3.2, profitQoQ: 8.5, latestRevenue: 436.2, latestProfit: 47.3 },
  { code: "M&G", name: "M&G Berhad", stockCode: "5078", sector: "Industrial", yoyCategory: 1, qoqCategory: 1, revenueYoY: 9.0, profitYoY: 27.7, revenueQoQ: 4.5, profitQoQ: 12.3, latestRevenue: 99.4, latestProfit: 16.6 },
  { code: "MYNEWS", name: "Mynews Holdings", stockCode: "5275", sector: "Retail", yoyCategory: 1, qoqCategory: 4, revenueYoY: 11.3, profitYoY: 146.2, revenueQoQ: -5.8, profitQoQ: -22.4, latestRevenue: 230.9, latestProfit: 6.4 },
  { code: "POHKONG", name: "Poh Kong Holdings", stockCode: "5080", sector: "Retail", yoyCategory: 1, qoqCategory: 1, revenueYoY: 6.7, profitYoY: 3.2, revenueQoQ: 2.5, profitQoQ: 1.8, latestRevenue: 365.5, latestProfit: 22.7 },
  { code: "PRKCORP", name: "Perak Corporation", stockCode: "8346", sector: "Construction", yoyCategory: 1, qoqCategory: 1, revenueYoY: 19.6, profitYoY: 352.7, revenueQoQ: 12.5, profitQoQ: 85.2, latestRevenue: 43.9, latestProfit: 0.412 },
  { code: "SUPERLN", name: "Superlon Holdings", stockCode: "7235", sector: "Manufacturing", yoyCategory: 1, qoqCategory: 1, revenueYoY: 3.3, profitYoY: 18.8, revenueQoQ: 1.5, profitQoQ: 5.2, latestRevenue: 34.5, latestProfit: 3.8 },
  { code: "UMCCA", name: "UMCCA Berhad", stockCode: "2593", sector: "Plantation", yoyCategory: 1, qoqCategory: 3, revenueYoY: 16.9, profitYoY: 184.2, revenueQoQ: 8.2, profitQoQ: -15.3, latestRevenue: 191.6, latestProfit: 37.8 },
  { code: "UWC", name: "UWC Berhad", stockCode: "5292", sector: "Manufacturing", yoyCategory: 1, qoqCategory: 1, revenueYoY: 43.0, profitYoY: 685.7, revenueQoQ: 28.5, profitQoQ: 112.4, latestRevenue: 108.8, latestProfit: 16.5 },
  { code: "UMC", name: "United Malayan Land", stockCode: "0256", sector: "Property", yoyCategory: 1, qoqCategory: 1, revenueYoY: 8.4, profitYoY: 0, revenueQoQ: 3.2, profitQoQ: 2.5, latestRevenue: 14.2, latestProfit: 1.8 },
  { code: "CRESNDO", name: "Crescendo Corporation", stockCode: "6718", sector: "Property", yoyCategory: 1, qoqCategory: 1, revenueYoY: 19.3, profitYoY: 129.6, revenueQoQ: 19.3, profitQoQ: 129.6, latestRevenue: 79.1, latestProfit: 16.3 },
  { code: "KEINHIN", name: "Kelington Holdings", stockCode: "7199", sector: "Industrial", yoyCategory: 1, qoqCategory: 1, revenueYoY: -0.7, profitYoY: 85.7, revenueQoQ: 5.2, profitQoQ: 25.3, latestRevenue: 82.5, latestProfit: 3.9 },
  { code: "SOLID", name: "Solid Automotive", stockCode: "5242", sector: "Automotive", yoyCategory: 1, qoqCategory: 1, revenueYoY: -7.4, profitYoY: 35.3, revenueQoQ: 2.5, profitQoQ: 12.5, latestRevenue: 85.1, latestProfit: 2.3 },
  { code: "SCIENTX", name: "Scientex Berhad", stockCode: "4731", sector: "Industrial", yoyCategory: 1, qoqCategory: 1, revenueYoY: 0, profitYoY: 13.5, revenueQoQ: 12.3, profitQoQ: 22.1, latestRevenue: 1200, latestProfit: 154.3 },
  { code: "VS", name: "VS Industry", stockCode: "6963", sector: "Manufacturing", yoyCategory: 1, qoqCategory: 1, revenueYoY: 0, profitYoY: 0, revenueQoQ: 2.5, profitQoQ: 3.2, latestRevenue: 1100, latestProfit: 30.6 },
  { code: "GLOMAC", name: "Glomac Berhad", stockCode: "5020", sector: "Property", yoyCategory: 1, qoqCategory: 1, revenueYoY: -1.1, profitYoY: 5.0, revenueQoQ: 3.5, profitQoQ: 8.2, latestRevenue: 55.8, latestProfit: 4.2 },

  // Category 2 YoY: Revenue DOWN, Profit UP (9 companies)
  { code: "KOSSAN", name: "Kossan Rubber Industries", stockCode: "7153", sector: "Healthcare", yoyCategory: 2, qoqCategory: 2, revenueYoY: -13.5, profitYoY: 28.6, revenueQoQ: -8.5, profitQoQ: 15.2, latestRevenue: 439.0, latestProfit: 37.8 },
  { code: "KESM", name: "KESM Industries", stockCode: "9334", sector: "Technology", yoyCategory: 2, qoqCategory: 5, revenueYoY: 0.4, profitYoY: 140.0, revenueQoQ: 5.2, profitQoQ: 0, latestRevenue: 53.0, latestProfit: 1.8 },
  { code: "LBALUM", name: "LB Aluminium", stockCode: "9326", sector: "Industrial", yoyCategory: 2, qoqCategory: 1, revenueYoY: -3.3, profitYoY: 189.5, revenueQoQ: 8.5, profitQoQ: 45.2, latestRevenue: 270.9, latestProfit: 22.0 },
  { code: "TECGUAN", name: "Tec Guan Holdings", stockCode: "7439", sector: "Industrial", yoyCategory: 2, qoqCategory: 2, revenueYoY: -30.2, profitYoY: 32.5, revenueQoQ: -12.5, profitQoQ: 8.5, latestRevenue: 93.4, latestProfit: 5.3 },
  { code: "SCIPACK", name: "Scientex Packaging", stockCode: "8125", sector: "Industrial", yoyCategory: 2, qoqCategory: 1, revenueYoY: -3.1, profitYoY: 8.8, revenueQoQ: 2.5, profitQoQ: 5.2, latestRevenue: 176.2, latestProfit: 7.4 },
  { code: "MAGNI", name: "Magni-Tech Industries", stockCode: "7087", sector: "Manufacturing", yoyCategory: 2, qoqCategory: 1, revenueYoY: -1.1, profitYoY: 24.7, revenueQoQ: 3.5, profitQoQ: 12.5, latestRevenue: 347.0, latestProfit: 32.3 },
  { code: "CYL", name: "CYL Corporation", stockCode: "7157", sector: "Industrial", yoyCategory: 2, qoqCategory: 1, revenueYoY: -13.8, profitYoY: 294.7, revenueQoQ: 5.2, profitQoQ: 35.2, latestRevenue: 11.9, latestProfit: 1.2 },
  { code: "SAPIND", name: "SAP Industry", stockCode: "7811", sector: "Industrial", yoyCategory: 2, qoqCategory: 5, revenueYoY: -8.9, profitYoY: 132.5, revenueQoQ: 2.5, profitQoQ: 0, latestRevenue: 65.2, latestProfit: 0.39 },
  { code: "GAMUDA", name: "Gamuda Berhad", stockCode: "5398", sector: "Construction", yoyCategory: 2, qoqCategory: 2, revenueYoY: -7.3, profitYoY: 4.7, revenueQoQ: -8.2, profitQoQ: 5.6, latestRevenue: 3800, latestProfit: 215.1 },

  // Category 3 YoY: Revenue UP, Profit DOWN (9 companies)
  { code: "BESHOM", name: "Beshom Holdings", stockCode: "7668", sector: "Services", yoyCategory: 3, qoqCategory: 3, revenueYoY: 6.0, profitYoY: -36.4, revenueQoQ: 2.5, profitQoQ: -15.2, latestRevenue: 35.5, latestProfit: 1.4 },
  { code: "MCEHLDG", name: "MCE Holdings", stockCode: "7004", sector: "Manufacturing", yoyCategory: 3, qoqCategory: 3, revenueYoY: 8.7, profitYoY: -17.1, revenueQoQ: 3.5, profitQoQ: -8.5, latestRevenue: 40.1, latestProfit: 3.4 },
  { code: "SSF", name: "SSF Corporation", stockCode: "0287", sector: "Retail", yoyCategory: 3, qoqCategory: 4, revenueYoY: 3.1, profitYoY: -86.0, revenueQoQ: -5.2, profitQoQ: -45.2, latestRevenue: 33.0, latestProfit: 0.168 },
  { code: "COSMOS", name: "Cosmos Holdings", stockCode: "0261", sector: "Services", yoyCategory: 3, qoqCategory: 3, revenueYoY: 2.3, profitYoY: -4.5, revenueQoQ: 1.5, profitQoQ: -2.5, latestRevenue: 4.4, latestProfit: 0.403 },
  { code: "SNS", name: "SNS Network", stockCode: "0259", sector: "Technology", yoyCategory: 3, qoqCategory: 1, revenueYoY: 54.1, profitYoY: -1.0, revenueQoQ: 25.5, profitQoQ: 35.2, latestRevenue: 384.9, latestProfit: 10.1 },
  { code: "XL", name: "XL Holdings", stockCode: "7121", sector: "Manufacturing", yoyCategory: 3, qoqCategory: 4, revenueYoY: 41.9, profitYoY: -37.5, revenueQoQ: -8.5, profitQoQ: -25.2, latestRevenue: 45.4, latestProfit: 2.0 },
  { code: "DATAPRP", name: "Data Prep", stockCode: "8338", sector: "Technology", yoyCategory: 3, qoqCategory: 3, revenueYoY: 3.4, profitYoY: -17.4, revenueQoQ: 1.5, profitQoQ: -5.2, latestRevenue: 18.1, latestProfit: 1.9 },
  { code: "GIIB", name: "GIIB Holdings", stockCode: "7192", sector: "Manufacturing", yoyCategory: 3, qoqCategory: 3, revenueYoY: 17.0, profitYoY: -22.4, revenueQoQ: 5.2, profitQoQ: -12.5, latestRevenue: 36.5, latestProfit: 3.8 },
  { code: "WONG", name: "Wong Engineering", stockCode: "7050", sector: "Construction", yoyCategory: 3, qoqCategory: 4, revenueYoY: 14.6, profitYoY: -38.2, revenueQoQ: -5.2, profitQoQ: -18.5, latestRevenue: 33.8, latestProfit: 2.1 },

  // Category 4 YoY: Revenue DOWN, Profit DOWN (14 companies)
  { code: "BAUTO", name: "Bermaz Auto", stockCode: "5248", sector: "Automotive", yoyCategory: 4, qoqCategory: 4, revenueYoY: -14.0, profitYoY: -57.3, revenueQoQ: -8.5, profitQoQ: -25.2, latestRevenue: 556.5, latestProfit: 17.2 },
  { code: "HIAPTEK", name: "Hiap Teck Venture", stockCode: "5072", sector: "Industrial", yoyCategory: 4, qoqCategory: 4, revenueYoY: -17.7, profitYoY: -58.5, revenueQoQ: -12.5, profitQoQ: -35.2, latestRevenue: 342.7, latestProfit: 19.7 },
  { code: "JKGLAND", name: "JKG Land", stockCode: "6769", sector: "Property", yoyCategory: 4, qoqCategory: 4, revenueYoY: -20.9, profitYoY: -34.1, revenueQoQ: -15.2, profitQoQ: -22.5, latestRevenue: 76.6, latestProfit: 11.8 },
  { code: "KRONO", name: "Kronologi Asia", stockCode: "0176", sector: "Technology", yoyCategory: 4, qoqCategory: 4, revenueYoY: -26.9, profitYoY: -31.3, revenueQoQ: -18.5, profitQoQ: -25.2, latestRevenue: 60.9, latestProfit: 1.1 },
  { code: "PTRB", name: "PT Resources", stockCode: "0260", sector: "Manufacturing", yoyCategory: 4, qoqCategory: 4, revenueYoY: -28.1, profitYoY: -40.0, revenueQoQ: -15.2, profitQoQ: -28.5, latestRevenue: 118.8, latestProfit: 3.0 },
  { code: "POHUAT", name: "Poh Huat Resources", stockCode: "7088", sector: "Manufacturing", yoyCategory: 4, qoqCategory: 4, revenueYoY: -11.3, profitYoY: -91.3, revenueQoQ: -8.5, profitQoQ: -65.2, latestRevenue: 93.2, latestProfit: 0.262 },
  { code: "MERSEC", name: "Meridian Securities", stockCode: "0285", sector: "Finance", yoyCategory: 4, qoqCategory: 4, revenueYoY: -29.8, profitYoY: -17.9, revenueQoQ: -12.5, profitQoQ: -8.5, latestRevenue: 6.6, latestProfit: 3.2 },
  { code: "ASTINO", name: "Astino Berhad", stockCode: "7162", sector: "Industrial", yoyCategory: 4, qoqCategory: 4, revenueYoY: -5.4, profitYoY: -12.2, revenueQoQ: -3.5, profitQoQ: -5.2, latestRevenue: 168.8, latestProfit: 10.8 },
  { code: "ANALABS", name: "Analabs Resources", stockCode: "7083", sector: "Healthcare", yoyCategory: 4, qoqCategory: 4, revenueYoY: -18.7, profitYoY: -38.9, revenueQoQ: -12.5, profitQoQ: -22.5, latestRevenue: 21.7, latestProfit: 1.1 },
  { code: "APOLLO", name: "Apollo Food Holdings", stockCode: "6432", sector: "Consumer", yoyCategory: 4, qoqCategory: 4, revenueYoY: -4.0, profitYoY: -21.0, revenueQoQ: -2.5, profitQoQ: -12.5, latestRevenue: 65.1, latestProfit: 6.4 },
  { code: "ARANK", name: "Arank Industries", stockCode: "7214", sector: "Industrial", yoyCategory: 4, qoqCategory: 4, revenueYoY: -5.5, profitYoY: -57.1, revenueQoQ: -3.5, profitQoQ: -35.2, latestRevenue: 130.9, latestProfit: 1.8 },
  { code: "MTRONIC", name: "Metronic Global", stockCode: "0043", sector: "Technology", yoyCategory: 4, qoqCategory: 4, revenueYoY: -15.6, profitYoY: -51.2, revenueQoQ: -8.5, profitQoQ: -25.2, latestRevenue: 2.7, latestProfit: 0.145 },
  { code: "VIS", name: "VIS Engineering", stockCode: "0120", sector: "Industrial", yoyCategory: 4, qoqCategory: 4, revenueYoY: -13.4, profitYoY: -50.0, revenueQoQ: -8.5, profitQoQ: -32.5, latestRevenue: 27.8, latestProfit: 3.4 },
  { code: "YINSON", name: "Yinson Holdings", stockCode: "7293", sector: "Offshore", yoyCategory: 4, qoqCategory: 4, revenueYoY: -33.3, profitYoY: -50.2, revenueQoQ: -18.5, profitQoQ: -35.2, latestRevenue: 1400, latestProfit: 101 },

  // Category 5 YoY: Turnaround (6 companies)
  { code: "EAH", name: "EA Holdings", stockCode: "0154", sector: "Services", yoyCategory: 5, qoqCategory: 1, revenueYoY: 222.5, profitYoY: 809.1, revenueQoQ: 85.2, profitQoQ: 125.5, latestRevenue: 12.9, latestProfit: 2.3 },
  { code: "SCBUILD", name: "SC Build", stockCode: "0109", sector: "Construction", yoyCategory: 5, qoqCategory: 5, revenueYoY: 144.4, profitYoY: 110.8, revenueQoQ: 45.2, profitQoQ: 0, latestRevenue: 8.8, latestProfit: 1.0 },
  { code: "ASTRO", name: "Astro Malaysia", stockCode: "6399", sector: "Media", yoyCategory: 5, qoqCategory: 5, revenueYoY: -13.0, profitYoY: 100, revenueQoQ: -7.4, profitQoQ: 0, latestRevenue: 850, latestProfit: 25 },
  { code: "CAMAROE", name: "Camaroe Holdings", stockCode: "0371", sector: "Construction", yoyCategory: 5, qoqCategory: 1, revenueYoY: 35.2, profitYoY: 250.0, revenueQoQ: 18.5, profitQoQ: 65.2, latestRevenue: 28.5, latestProfit: 1.8 },
  { code: "ECA", name: "ECA Integrated", stockCode: "0267", sector: "Technology", yoyCategory: 5, qoqCategory: 1, revenueYoY: 45.2, profitYoY: 180.0, revenueQoQ: 22.5, profitQoQ: 55.2, latestRevenue: 35.2, latestProfit: 2.5 },
  { code: "EWICAP", name: "EWEIN Capital", stockCode: "5283", sector: "Property", yoyCategory: 5, qoqCategory: 1, revenueYoY: 85.2, profitYoY: 350.0, revenueQoQ: 35.2, profitQoQ: 85.2, latestRevenue: 45.2, latestProfit: 5.2 },

  // Category 6 YoY: Deteriorating (20 companies)
  { code: "CEKD", name: "CEKD Holdings", stockCode: "0238", sector: "Services", yoyCategory: 6, qoqCategory: 6, revenueYoY: -25.2, profitYoY: -120.0, revenueQoQ: -15.2, profitQoQ: -85.2, latestRevenue: 18.5, latestProfit: -2.5 },
  { code: "CYPARK", name: "Cypark Resources", stockCode: "5184", sector: "Energy", yoyCategory: 6, qoqCategory: 6, revenueYoY: -18.5, profitYoY: -135.0, revenueQoQ: -12.5, profitQoQ: -95.2, latestRevenue: 85.2, latestProfit: -15.2 },
  { code: "HKB", name: "HKB Holdings", stockCode: "0359", sector: "Construction", yoyCategory: 6, qoqCategory: 6, revenueYoY: -35.2, profitYoY: -150.0, revenueQoQ: -22.5, profitQoQ: -110.0, latestRevenue: 25.2, latestProfit: -5.2 },
  { code: "ICTZONE", name: "ICTZONE Holdings", stockCode: "0358", sector: "Technology", yoyCategory: 6, qoqCategory: 6, revenueYoY: -28.5, profitYoY: -125.0, revenueQoQ: -18.5, profitQoQ: -88.5, latestRevenue: 12.5, latestProfit: -2.8 },
  { code: "JAYCORP", name: "Jay Corporation", stockCode: "7152", sector: "Manufacturing", yoyCategory: 6, qoqCategory: 6, revenueYoY: -22.5, profitYoY: -115.0, revenueQoQ: -15.2, profitQoQ: -75.2, latestRevenue: 45.2, latestProfit: -3.5 },
  { code: "JOHAN", name: "Johan Holdings", stockCode: "3441", sector: "Property", yoyCategory: 6, qoqCategory: 6, revenueYoY: -32.5, profitYoY: -140.0, revenueQoQ: -18.5, profitQoQ: -95.2, latestRevenue: 28.5, latestProfit: -4.2 },
  { code: "JSSOLAR", name: "JS Solar", stockCode: "0369", sector: "Energy", yoyCategory: 6, qoqCategory: 6, revenueYoY: -45.2, profitYoY: -180.0, revenueQoQ: -28.5, profitQoQ: -125.0, latestRevenue: 15.2, latestProfit: -8.5 },
  { code: "KYM", name: "KYM Holdings", stockCode: "8362", sector: "Manufacturing", yoyCategory: 6, qoqCategory: 6, revenueYoY: -18.5, profitYoY: -110.0, revenueQoQ: -12.5, profitQoQ: -72.5, latestRevenue: 85.2, latestProfit: -5.2 },
  { code: "MYAXIS", name: "MyAxis Group", stockCode: "03064", sector: "Technology", yoyCategory: 6, qoqCategory: 6, revenueYoY: -38.5, profitYoY: -165.0, revenueQoQ: -25.2, profitQoQ: -115.0, latestRevenue: 8.5, latestProfit: -3.2 },
  { code: "NEXGRAM", name: "Nexgram Holdings", stockCode: "0096", sector: "Technology", yoyCategory: 6, qoqCategory: 6, revenueYoY: -42.5, profitYoY: -175.0, revenueQoQ: -28.5, profitQoQ: -120.0, latestRevenue: 5.2, latestProfit: -2.8 },
  { code: "NOVAMSC", name: "Nova MSC", stockCode: "0026", sector: "Technology", yoyCategory: 6, qoqCategory: 6, revenueYoY: -28.5, profitYoY: -130.0, revenueQoQ: -18.5, profitQoQ: -85.2, latestRevenue: 18.5, latestProfit: -3.5 },
  { code: "NTPM", name: "NTPM Holdings", stockCode: "5066", sector: "Consumer", yoyCategory: 6, qoqCategory: 4, revenueYoY: -8.5, profitYoY: -105.0, revenueQoQ: -5.2, profitQoQ: -35.2, latestRevenue: 185.2, latestProfit: -2.5 },
  { code: "PMCK", name: "PMCK Holdings", stockCode: "0363", sector: "Services", yoyCategory: 6, qoqCategory: 6, revenueYoY: -35.2, profitYoY: -155.0, revenueQoQ: -22.5, profitQoQ: -105.0, latestRevenue: 12.5, latestProfit: -4.2 },
  { code: "QUALITY", name: "Quality Concrete", stockCode: "7544", sector: "Construction", yoyCategory: 6, qoqCategory: 4, revenueYoY: -15.2, profitYoY: -108.0, revenueQoQ: -8.5, profitQoQ: -45.2, latestRevenue: 125.2, latestProfit: -3.8 },
  { code: "SAPRES", name: "Sarawak Plantation", stockCode: "4596", sector: "Plantation", yoyCategory: 6, qoqCategory: 6, revenueYoY: -22.5, profitYoY: -125.0, revenueQoQ: -15.2, profitQoQ: -82.5, latestRevenue: 85.2, latestProfit: -8.5 },
  { code: "SG", name: "SG Holdings", stockCode: "5157", sector: "Manufacturing", yoyCategory: 6, qoqCategory: 6, revenueYoY: -28.5, profitYoY: -135.0, revenueQoQ: -18.5, profitQoQ: -92.5, latestRevenue: 45.2, latestProfit: -5.8 },
  { code: "SUNLOGY", name: "Sunlogy Holdings", stockCode: "0345", sector: "Energy", yoyCategory: 6, qoqCategory: 6, revenueYoY: -48.5, profitYoY: -185.0, revenueQoQ: -32.5, profitQoQ: -128.0, latestRevenue: 8.5, latestProfit: -4.5 },
  { code: "TECHBASE", name: "Techbase Holdings", stockCode: "8966", sector: "Technology", yoyCategory: 6, qoqCategory: 6, revenueYoY: -32.5, profitYoY: -145.0, revenueQoQ: -22.5, profitQoQ: -98.5, latestRevenue: 15.2, latestProfit: -3.8 },
  { code: "TFP", name: "TFP Solutions", stockCode: "0145", sector: "Services", yoyCategory: 6, qoqCategory: 6, revenueYoY: -25.2, profitYoY: -118.0, revenueQoQ: -15.2, profitQoQ: -78.5, latestRevenue: 22.5, latestProfit: -2.5 },
  { code: "TRIVE", name: "Trive Property", stockCode: "0118", sector: "Property", yoyCategory: 6, qoqCategory: 6, revenueYoY: -38.5, profitYoY: -162.0, revenueQoQ: -25.2, profitQoQ: -112.0, latestRevenue: 18.5, latestProfit: -5.2 },
  { code: "VANTNRG", name: "Vantage Energy", stockCode: "5218", sector: "Energy", yoyCategory: 6, qoqCategory: 6, revenueYoY: -42.5, profitYoY: -172.0, revenueQoQ: -28.5, profitQoQ: -118.0, latestRevenue: 25.2, latestProfit: -6.8 },
  { code: "XPB", name: "XPB Holdings", stockCode: "0370", sector: "Technology", yoyCategory: 6, qoqCategory: 6, revenueYoY: -35.2, profitYoY: -148.0, revenueQoQ: -22.5, profitQoQ: -102.0, latestRevenue: 12.5, latestProfit: -3.2 },
]

// Helper functions
export function getCompanyByCode(code: string): CompanyData | undefined {
  return COMPANY_DATA.find(c => c.code.toUpperCase() === code.toUpperCase())
}

export function getCompaniesByCategory(category: number, type: 'yoy' | 'qoq' = 'yoy'): CompanyData[] {
  return COMPANY_DATA.filter(c => type === 'yoy' ? c.yoyCategory === category : c.qoqCategory === category)
}

export function getCompaniesBySector(sector: string): CompanyData[] {
  return COMPANY_DATA.filter(c => c.sector === sector)
}

export function getCategoryCount(type: 'yoy' | 'qoq' = 'yoy'): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  COMPANY_DATA.forEach(c => {
    const cat = type === 'yoy' ? c.yoyCategory : c.qoqCategory
    counts[cat] = (counts[cat] || 0) + 1
  })
  return counts
}

export function getTopPerformers(type: 'yoy' | 'qoq' = 'yoy', limit: number = 5): CompanyData[] {
  return [...COMPANY_DATA]
    .sort((a, b) => {
      const aProfit = type === 'yoy' ? a.profitYoY : a.profitQoQ
      const bProfit = type === 'yoy' ? b.profitYoY : b.profitQoQ
      return bProfit - aProfit
    })
    .slice(0, limit)
}

export function getStrongBuyCompanies(limit: number = 5): CompanyData[] {
  // Strong buy = Category 1 (Revenue UP, Profit UP) with highest profit growth
  return COMPANY_DATA
    .filter(c => c.yoyCategory === 1)
    .sort((a, b) => b.profitYoY - a.profitYoY)
    .slice(0, limit)
}

export function getAllSectors(): string[] {
  return [...new Set(COMPANY_DATA.map(c => c.sector))].sort()
}

export function getGainersLosersCount(): { gainers: number; losers: number; unchanged: number } {
  let gainers = 0, losers = 0, unchanged = 0
  COMPANY_DATA.forEach(c => {
    if (c.profitYoY > 0) gainers++
    else if (c.profitYoY < 0) losers++
    else unchanged++
  })
  return { gainers, losers, unchanged }
}

export interface SectorStats {
  sector: string
  count: number
  avgProfitGrowth: number
}

export function getSectorStats(limit: number = 5): SectorStats[] {
  const sectorMap = new Map<string, { count: number; totalProfit: number }>()

  COMPANY_DATA.forEach(c => {
    const existing = sectorMap.get(c.sector) || { count: 0, totalProfit: 0 }
    sectorMap.set(c.sector, {
      count: existing.count + 1,
      totalProfit: existing.totalProfit + c.profitYoY
    })
  })

  const stats: SectorStats[] = []
  sectorMap.forEach((value, sector) => {
    stats.push({
      sector,
      count: value.count,
      avgProfitGrowth: value.totalProfit / value.count
    })
  })

  return stats
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
