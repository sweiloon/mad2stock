/**
 * KLSE Stock Code Mapping
 * Maps company short names to their numeric Bursa Malaysia stock codes
 *
 * Format: { "COMPANY_NAME": "NUMERIC_CODE" }
 * Yahoo Finance format: {CODE}.KL (e.g., "5139.KL" for AEONCR)
 */

export const STOCK_CODE_MAP: Record<string, string> = {
  // A
  "AEONCR": "5139",
  "ANALABS": "7083",
  "APOLLO": "6432",
  "ARANK": "7214",
  "ASTINO": "7162",
  "ASTRO": "6399",

  // B
  "BAUTO": "5248",
  "BESHOM": "7668",
  "BNASTRA": "7195",

  // C
  "CAMAROE": "0371",
  "CEKD": "0238",
  "CETECH": "03024",
  "COSMOS": "0261",
  "CRESNDO": "6718",
  "CYL": "7157",
  "CYPARK": "5184",

  // D
  "DATAPRP": "8338",

  // E
  "EAH": "0154",
  "ECA": "0267",
  "ECOWLD": "8206",
  "EWICAP": "5283",

  // G
  "GAMUDA": "5398",
  "GIIB": "7192",
  "GLOMAC": "5020",

  // H
  "HAILY": "0237",
  "HIAPTEK": "5072",
  "HIGHTEC": "7033",
  "HKB": "0359",

  // I
  "ICTZONE": "0358",

  // J
  "JAYCORP": "7152",
  "JKGLAND": "6769",
  "JOHAN": "3441",
  "JSSOLAR": "0369",

  // K
  "KEINHIN": "7199",
  "KENERGY": "0307",
  "KESM": "9334",
  "KMLOONG": "5027",
  "KOSSAN": "7153",
  "KRONO": "0176",
  "KYM": "8362",

  // L
  "LBALUM": "9326",

  // M
  "M&G": "5078",
  "MAGNI": "7087",
  "MCEHLDG": "7004",
  "MERSEC": "0285",
  "MTRONIC": "0043",
  "MYAXIS": "03064",
  "MYNEWS": "5275",

  // N
  "NEXGRAM": "0096",
  "NOVAMSC": "0026",
  "NTPM": "5066",

  // P
  "PMCK": "0363",
  "POHKONG": "5080",
  "POHUAT": "7088",
  "PRKCORP": "8346",
  "PTRB": "0260",

  // Q
  "QUALITY": "7544",

  // S
  "SAPIND": "7811",
  "SAPRES": "4596",
  "SCBUILD": "0109",
  "SCIENTX": "4731",
  "SCIPACK": "8125",
  "SG": "5157",
  "SNS": "0259",
  "SOLID": "5242",
  "SSF": "0287",
  "SUNLOGY": "0345",
  "SUPERLN": "7235",

  // T
  "TECGUAN": "7439",
  "TECHBASE": "8966",
  "TFP": "0145",
  "TRIVE": "0118",

  // U
  "UMC": "0256",
  "UMCCA": "2593",
  "UWC": "5292",

  // V
  "VANTNRG": "5218",
  "VIS": "0120",
  "VS": "6963",

  // W
  "WONG": "7050",

  // X
  "XL": "7121",
  "XPB": "0370",

  // Y
  "YINSON": "7293",
}

// Reverse mapping: numeric code to company name
export const CODE_TO_NAME_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STOCK_CODE_MAP).map(([name, code]) => [code, name])
)

/**
 * Get numeric stock code from company name
 * Returns the input if already numeric or not found in mapping
 */
export function getStockCode(nameOrCode: string): string {
  const upperName = nameOrCode.toUpperCase().trim()

  // If it's already in our mapping, return the code
  if (STOCK_CODE_MAP[upperName]) {
    return STOCK_CODE_MAP[upperName]
  }

  // If it looks like a numeric code already (possibly with leading zeros)
  if (/^\d+$/.test(nameOrCode.replace(/^0+/, ''))) {
    return nameOrCode
  }

  // Return as-is if not found
  return nameOrCode
}

/**
 * Get company name from stock code
 */
export function getCompanyName(code: string): string | null {
  return CODE_TO_NAME_MAP[code] || null
}

/**
 * Check if a code/name exists in our database
 */
export function isKnownStock(nameOrCode: string): boolean {
  const upper = nameOrCode.toUpperCase().trim()
  return !!STOCK_CODE_MAP[upper] || !!CODE_TO_NAME_MAP[nameOrCode]
}

/**
 * Get all company names
 */
export function getAllCompanyNames(): string[] {
  return Object.keys(STOCK_CODE_MAP)
}

/**
 * Get all stock codes
 */
export function getAllStockCodes(): string[] {
  return Object.values(STOCK_CODE_MAP)
}
