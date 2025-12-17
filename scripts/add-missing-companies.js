/**
 * Script to add missing companies from all-klse-companies.txt
 * to company-data.ts and stock-codes.ts
 */

const fs = require('fs');
const path = require('path');

// Read files
const allCompaniesFile = fs.readFileSync(
  path.join(__dirname, '../data/analysis/all-klse-companies.txt'),
  'utf-8'
);

const companyDataFile = fs.readFileSync(
  path.join(__dirname, '../src/lib/company-data.ts'),
  'utf-8'
);

const stockCodesFile = fs.readFileSync(
  path.join(__dirname, '../src/lib/stock-codes.ts'),
  'utf-8'
);

// Parse existing company codes from company-data.ts
const existingCodes = new Set();
const codeMatches = companyDataFile.matchAll(/code:\s*["']([^"']+)["']/g);
for (const match of codeMatches) {
  existingCodes.add(match[1].toUpperCase());
}

console.log(`Found ${existingCodes.size} existing companies in company-data.ts`);

// Parse existing stock codes from stock-codes.ts
const existingStockCodes = new Set();
const stockMatches = stockCodesFile.matchAll(/"([A-Z0-9&]+)":\s*"(\d+)"/g);
for (const match of stockMatches) {
  existingStockCodes.add(match[1].toUpperCase());
}

console.log(`Found ${existingStockCodes.size} existing stock codes in stock-codes.ts`);

// Parse companies from all-klse-companies.txt
// Format: MAYBANK (1155) | Malayan Banking Berhad | Banking | Main | 10.30 | 124.44B
const companyRegex = /^([A-Z0-9&]+)\s*\((\d+)\)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+[BMK]?)/gm;

const newCompanies = [];
const newStockCodes = [];

let match;
while ((match = companyRegex.exec(allCompaniesFile)) !== null) {
  const [_, code, stockCode, name, sector, market, price, marketCap] = match;

  const upperCode = code.toUpperCase().trim();
  const cleanStockCode = stockCode.trim();
  const cleanName = name.trim();
  const cleanSector = sector.trim();
  const cleanMarket = market.trim();

  // Check if this company is missing
  if (!existingCodes.has(upperCode)) {
    newCompanies.push({
      code: upperCode,
      stockCode: cleanStockCode,
      name: cleanName,
      sector: cleanSector,
      market: cleanMarket
    });
  }

  // Check if stock code mapping is missing
  if (!existingStockCodes.has(upperCode)) {
    newStockCodes.push({
      code: upperCode,
      stockCode: cleanStockCode
    });
  }
}

console.log(`\nFound ${newCompanies.length} new companies to add`);
console.log(`Found ${newStockCodes.length} new stock code mappings to add`);

// Normalize sector names
const sectorMap = {
  'Banking': 'Finance',
  'Financial Services': 'Finance',
  'Consumer': 'Consumer',
  'Construction': 'Construction',
  'Healthcare': 'Healthcare',
  'Industrial Products': 'Industrial',
  'Oil & Gas': 'Energy',
  'Plantation': 'Plantation',
  'Property': 'Property',
  'REIT': 'REIT',
  'Technology': 'Technology',
  'Telecommunications': 'Telecommunications',
  'Transportation': 'Transportation',
  'Utilities': 'Utilities',
  'Chemicals': 'Industrial',
  'Infrastructure': 'Construction',
  'Media': 'Media',
  'Retail': 'Retail',
  'Education': 'Education',
  'Automotive': 'Automotive',
};

function normalizeSector(sector) {
  return sectorMap[sector] || sector;
}

// Generate company-data.ts entries
console.log('\n=== NEW COMPANY DATA ENTRIES ===\n');
const companyDataEntries = newCompanies.map(c => {
  const sector = normalizeSector(c.sector);
  const market = c.market === 'Main' ? 'Main' : c.market === 'ACE' ? 'ACE' : 'LEAP';
  return `  { code: "${c.code}", name: "${c.name}", stockCode: "${c.stockCode}", sector: "${sector}", market: "${market}" },`;
});

// Generate stock-codes.ts entries
console.log('\n=== NEW STOCK CODE ENTRIES ===\n');
const stockCodeEntries = newStockCodes.map(c => {
  return `  "${c.code}": "${c.stockCode}",`;
});

// Write to output files
fs.writeFileSync(
  path.join(__dirname, 'new-company-data.txt'),
  companyDataEntries.join('\n'),
  'utf-8'
);

fs.writeFileSync(
  path.join(__dirname, 'new-stock-codes.txt'),
  stockCodeEntries.join('\n'),
  'utf-8'
);

console.log(`\nWritten ${newCompanies.length} entries to scripts/new-company-data.txt`);
console.log(`Written ${newStockCodes.length} entries to scripts/new-stock-codes.txt`);

// Print summary
console.log('\n=== SUMMARY ===');
console.log(`Existing companies: ${existingCodes.size}`);
console.log(`New companies to add: ${newCompanies.length}`);
console.log(`Total after adding: ${existingCodes.size + newCompanies.length}`);
console.log(`Target (Bursa Malaysia): ~1060`);
console.log(`Still missing: ~${1060 - (existingCodes.size + newCompanies.length)}`);
