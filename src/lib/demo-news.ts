// Demo news data for the News section
// This will be replaced with real data from various news sources later

export type NewsCategory =
  | 'all'
  | 'market'
  | 'tech'
  | 'crypto'
  | 'forex'
  | 'economy'
  | 'politics'
  | 'breaking'

export interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  category: Exclude<NewsCategory, 'all'>
  source: string
  sourceUrl: string
  imageUrl: string
  publishedAt: string
  author?: string
  isBreaking?: boolean
  relatedStocks?: string[]
  sentiment?: 'bullish' | 'bearish' | 'neutral'
}

export const NEWS_CATEGORIES: { value: NewsCategory; label: string; color: string }[] = [
  { value: 'all', label: 'All News', color: 'bg-gray-500' },
  { value: 'breaking', label: 'Breaking', color: 'bg-red-500' },
  { value: 'market', label: 'Market', color: 'bg-blue-500' },
  { value: 'tech', label: 'Technology', color: 'bg-purple-500' },
  { value: 'crypto', label: 'Crypto', color: 'bg-orange-500' },
  { value: 'forex', label: 'Forex', color: 'bg-green-500' },
  { value: 'economy', label: 'Economy', color: 'bg-cyan-500' },
  { value: 'politics', label: 'Politics', color: 'bg-rose-500' },
]

// Generate timestamps for demo data
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString()

export const DEMO_NEWS: NewsItem[] = [
  // Breaking News
  {
    id: 'news-1',
    title: 'Fed Signals Potential Rate Cut in Early 2026 as Inflation Cools',
    summary: 'Federal Reserve officials hint at possible monetary policy easing as December CPI data shows inflation dropping to 2.3%',
    content: `The Federal Reserve has signaled it may begin cutting interest rates in early 2026 following the latest inflation data that showed prices rising at the slowest pace in three years.

December's Consumer Price Index came in at 2.3% year-over-year, down from 2.7% in November, prompting renewed optimism among investors that the central bank's aggressive rate hiking campaign may finally be coming to an end.

"The data is encouraging and suggests we're making real progress toward our 2% inflation target," said Fed Chair Jerome Powell in a statement. "While we remain data-dependent, the trajectory is certainly positive."

Markets rallied on the news, with the S&P 500 gaining 1.8% and tech stocks leading the charge. The Malaysian ringgit also strengthened against the dollar, trading at 4.42 per USD.`,
    category: 'breaking',
    source: 'Reuters',
    sourceUrl: 'https://reuters.com',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    publishedAt: minutesAgo(15),
    author: 'Sarah Chen',
    isBreaking: true,
    sentiment: 'bullish',
  },
  {
    id: 'news-2',
    title: 'Petronas Reports Record Q4 Earnings, Boosts Dividend',
    summary: 'Malaysia\'s national oil company exceeds analyst expectations with RM28.5 billion profit',
    content: `Petroliam Nasional Berhad (Petronas) reported record fourth-quarter earnings of RM28.5 billion, driven by higher oil prices and increased production from its global operations.

The state oil company announced a special dividend of RM35 billion to the Malaysian government, bringing total dividends for the year to RM50 billion. CEO Tengku Muhammad Taufik highlighted the company's successful cost optimization efforts and strategic investments in renewable energy.

"Despite global uncertainties, Petronas has delivered exceptional results while advancing our sustainability agenda," he said during the earnings call.

The strong results lifted sentiment across the local energy sector, with Petronas-linked stocks such as PCHEM and PETDAG seeing gains of 3-5%.`,
    category: 'market',
    source: 'The Edge Markets',
    sourceUrl: 'https://theedgemarkets.com',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    publishedAt: hoursAgo(1),
    author: 'Ahmad Rahman',
    relatedStocks: ['PETRONAS', 'PCHEM', 'PETDAG'],
    sentiment: 'bullish',
  },
  {
    id: 'news-3',
    title: 'Bitcoin Breaks $100,000 Barrier, Altcoins Rally',
    summary: 'Cryptocurrency king reaches new all-time high as institutional adoption accelerates',
    content: `Bitcoin has surpassed the psychological $100,000 mark for the first time in its history, driven by continued institutional adoption and the successful launch of spot Bitcoin ETFs globally.

The flagship cryptocurrency touched $101,200 during Asian trading hours before settling around $99,500. Ethereum also benefited from the rally, climbing above $4,800 as investors rotated into major altcoins.

Analysts point to several factors driving the surge: increased adoption by pension funds, favorable regulatory developments in the US and Europe, and the upcoming Bitcoin halving event in April 2024.

"We're seeing a fundamental shift in how institutions view Bitcoin," said Marcus Lee, crypto strategist at Galaxy Digital. "The $100K milestone is psychologically important but the fundamentals suggest further upside."`,
    category: 'crypto',
    source: 'CoinDesk',
    sourceUrl: 'https://coindesk.com',
    imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800',
    publishedAt: hoursAgo(2),
    author: 'Jason Wei',
    isBreaking: true,
    sentiment: 'bullish',
  },
  {
    id: 'news-4',
    title: 'Nvidia Unveils Next-Gen AI Chips, Stock Jumps 8%',
    summary: 'Tech giant announces Blackwell Ultra GPUs with 3x performance improvement',
    content: `Nvidia has unveiled its next-generation Blackwell Ultra AI chips, promising a threefold improvement in performance over current models while maintaining similar power consumption.

The announcement sent Nvidia shares soaring 8% in pre-market trading, pushing the company's market cap above $3.5 trillion. The new chips are designed specifically for training and running large language models, positioning Nvidia to maintain its dominance in the AI hardware market.

CEO Jensen Huang described the Blackwell Ultra as "the biggest leap forward in AI computing in a decade." Major cloud providers including Microsoft, Amazon, and Google have already committed to deploying the new chips.

The announcement boosted the broader semiconductor sector, with AMD, TSMC, and ASML also seeing gains.`,
    category: 'tech',
    source: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    publishedAt: hoursAgo(3),
    author: 'Mike Zhang',
    sentiment: 'bullish',
  },
  {
    id: 'news-5',
    title: 'Ringgit Strengthens to 4.35 Against USD on Export Data',
    summary: 'Malaysian currency hits 18-month high following strong December trade figures',
    content: `The Malaysian ringgit strengthened to 4.35 against the US dollar, its highest level in 18 months, following better-than-expected December trade data.

Malaysia's exports rose 12.3% year-on-year in December, driven by strong demand for electronics, palm oil, and LNG. The trade surplus widened to RM22.1 billion, exceeding analyst forecasts.

Bank Negara Malaysia's decision to maintain the overnight policy rate at 3.00% has also supported the currency, as real interest rates remain attractive for carry trades.

Currency strategists expect the ringgit to continue strengthening, with targets of 4.20-4.30 by mid-2026. However, they caution that global uncertainties and potential trade tensions could introduce volatility.`,
    category: 'forex',
    source: 'Bloomberg',
    sourceUrl: 'https://bloomberg.com',
    imageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800',
    publishedAt: hoursAgo(4),
    author: 'Lisa Tan',
    sentiment: 'bullish',
  },
  {
    id: 'news-6',
    title: 'Malaysia GDP Growth Accelerates to 5.8% in Q4 2025',
    summary: 'Economy outperforms expectations on strong domestic consumption and investment',
    content: `Malaysia's economy grew 5.8% year-on-year in the fourth quarter of 2025, exceeding forecasts of 5.2% and marking the fastest expansion in two years.

The strong performance was driven by robust domestic consumption, increased government spending on infrastructure projects, and a recovery in manufacturing activity. Services sector growth of 6.4% led the expansion.

Finance Minister YB Rafizi Ramli highlighted the success of recent economic reforms and targeted subsidies. "These numbers validate our approach to fiscal policy and show that Malaysia remains one of Southeast Asia's most dynamic economies."

For full-year 2025, GDP growth came in at 5.3%, above the government's initial target of 4.5-5.0%. The outlook for 2026 remains positive, with economists forecasting growth of 5.0-5.5%.`,
    category: 'economy',
    source: 'The Star',
    sourceUrl: 'https://thestar.com.my',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    publishedAt: hoursAgo(5),
    author: 'David Lim',
    sentiment: 'bullish',
  },
  {
    id: 'news-7',
    title: 'Johor-Singapore RTS Link Opens, Boosting Property Stocks',
    summary: 'Long-awaited cross-border rail connection finally operational after years of delays',
    content: `The Johor Bahru-Singapore Rapid Transit System (RTS) Link has officially opened to the public, connecting Bukit Chagar in Johor Bahru to Woodlands North in Singapore in just 5 minutes.

The 4km rail link is expected to ferry up to 10,000 passengers per hour per direction, significantly easing congestion at the causeway. Full operations will ramp up over the next few months.

Property developers with exposure to Johor, including Sunway, UEM Sunrise, and Eco World, saw their shares jump 5-8% on the news. Analysts expect the RTS Link to boost property values in the Iskandar Malaysia region.

"This is a game-changer for Johor's real estate market," said property analyst Wong Mei Ling. "We expect rental yields in transit-oriented developments to increase by 15-20%."`,
    category: 'market',
    source: 'New Straits Times',
    sourceUrl: 'https://nst.com.my',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    publishedAt: hoursAgo(6),
    relatedStocks: ['SUNWAY', 'UEMS', 'ECOWLD'],
    sentiment: 'bullish',
  },
  {
    id: 'news-8',
    title: 'OpenAI Launches GPT-5, Promises "Human-Level Reasoning"',
    summary: 'Latest AI model demonstrates significant improvements in logic and scientific understanding',
    content: `OpenAI has released GPT-5, its latest large language model that the company claims approaches human-level reasoning capabilities on complex tasks.

Early benchmarks show GPT-5 outperforming previous models and human experts on standardized tests in mathematics, coding, and scientific reasoning. The model also demonstrates improved factual accuracy and reduced hallucinations.

"GPT-5 represents a significant step toward artificial general intelligence," said OpenAI CEO Sam Altman. "While there's still work to be done, the capability improvements are substantial."

The announcement intensifies the AI race, with competitors including Anthropic, Google, and Meta expected to announce their own next-generation models in the coming months.`,
    category: 'tech',
    source: 'The Verge',
    sourceUrl: 'https://theverge.com',
    imageUrl: 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=800',
    publishedAt: hoursAgo(7),
    author: 'Emily Park',
    sentiment: 'neutral',
  },
  {
    id: 'news-9',
    title: 'China Announces Massive Economic Stimulus Package',
    summary: 'Beijing unveils ¥5 trillion fiscal stimulus to boost flagging economy',
    content: `China has announced a ¥5 trillion ($700 billion) stimulus package aimed at reviving its struggling economy, the largest such intervention since the 2008 financial crisis.

The package includes infrastructure spending, property sector support, and consumption vouchers for citizens. The People's Bank of China also cut the reserve requirement ratio by 50 basis points, releasing more liquidity into the banking system.

Asian markets rallied on the news, with Hong Kong's Hang Seng Index jumping 4.2%. Malaysian stocks with China exposure, including Genting and Gamuda, saw significant gains.

Economists welcomed the move but cautioned that implementation will be key. "This is a positive step, but China's structural challenges in property and demographics will take years to address," said HSBC's chief Asia economist.`,
    category: 'economy',
    source: 'SCMP',
    sourceUrl: 'https://scmp.com',
    imageUrl: 'https://images.unsplash.com/photo-1523942839745-7db4a527b4e7?w=800',
    publishedAt: hoursAgo(8),
    relatedStocks: ['GENTING', 'GAMUDA'],
    sentiment: 'bullish',
  },
  {
    id: 'news-10',
    title: 'Ethereum ETFs See Record Inflows as Institutional Interest Grows',
    summary: 'Spot Ethereum ETFs attract $1.2 billion in single day as altcoin rally continues',
    content: `Spot Ethereum exchange-traded funds (ETFs) recorded their biggest single-day inflow of $1.2 billion, signaling growing institutional appetite for the second-largest cryptocurrency.

BlackRock's iShares Ethereum Trust led the inflows, followed by Fidelity's offering. The surge comes as Ethereum's price approaches $5,000, driven by the broader crypto bull market and increased DeFi activity.

"Institutions are starting to view Ethereum as more than just a cryptocurrency - it's infrastructure for the decentralized web," said Katie Stockton, founder of Fairlead Strategies. "The ETF inflows reflect this maturing perspective."

Total assets under management for Ethereum ETFs now exceed $15 billion, compared to over $50 billion for Bitcoin ETFs.`,
    category: 'crypto',
    source: 'CoinTelegraph',
    sourceUrl: 'https://cointelegraph.com',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    publishedAt: hoursAgo(9),
    sentiment: 'bullish',
  },
  {
    id: 'news-11',
    title: 'Top Glove Shares Surge 12% on Strong Quarterly Results',
    summary: 'World\'s largest glove maker returns to profitability amid demand recovery',
    content: `Top Glove Corporation saw its shares surge 12% after reporting a return to profitability in its latest quarterly results, marking a turnaround from losses during the post-pandemic demand slump.

The company posted a net profit of RM85 million, compared to a loss of RM120 million in the same quarter last year. Revenue rose 8% to RM1.2 billion as average selling prices stabilized and demand from healthcare sectors recovered.

CEO Wong Chin Toh expressed optimism about the outlook: "We've right-sized our operations and are well-positioned to capitalize on the demand recovery. The worst is behind us."

The positive results lifted the entire rubber glove sector, with Hartalega and Kossan also seeing gains of 5-7%.`,
    category: 'market',
    source: 'The Edge Markets',
    sourceUrl: 'https://theedgemarkets.com',
    imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800',
    publishedAt: hoursAgo(10),
    relatedStocks: ['TOPGLOVE', 'HARTA', 'KOSSAN'],
    sentiment: 'bullish',
  },
  {
    id: 'news-12',
    title: 'US Treasury Yields Fall as Recession Fears Ease',
    summary: '10-year yield drops to 3.8% as soft landing narrative gains traction',
    content: `US Treasury yields fell across the curve, with the 10-year yield dropping to 3.8%, as investors increasingly bet on a soft landing for the American economy.

The decline in yields reflects growing confidence that the Federal Reserve can bring inflation back to target without triggering a recession. Recent economic data, including strong employment figures and cooling inflation, support this view.

Lower US yields have positive implications for emerging market assets, including Malaysian bonds and equities. The yield differential between US and Malaysian government bonds has narrowed, potentially supporting the ringgit.

"The bond market is telling us that the worst of the rate hiking cycle is over," said bond strategist Michelle Wong. "This is constructive for risk assets globally."`,
    category: 'forex',
    source: 'Financial Times',
    sourceUrl: 'https://ft.com',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    publishedAt: hoursAgo(11),
    sentiment: 'bullish',
  },
  {
    id: 'news-13',
    title: 'Malaysia Announces National AI Strategy 2030',
    summary: 'Government commits RM10 billion to develop artificial intelligence ecosystem',
    content: `Prime Minister Datuk Seri Anwar Ibrahim has unveiled the National AI Strategy 2030, a comprehensive plan to position Malaysia as a regional AI hub with RM10 billion in committed investments.

The strategy includes establishing AI research centers, training 100,000 AI professionals, and attracting global tech companies to set up AI operations in Malaysia. Tax incentives and regulatory sandboxes will be offered to AI startups.

"AI is not just a technology - it's the foundation of our future economy," said the Prime Minister. "We must embrace it or risk being left behind."

Local tech stocks rallied on the announcement, with companies like MyEG, Datasonic, and Revenue Group seeing gains of 4-8%.`,
    category: 'politics',
    source: 'Bernama',
    sourceUrl: 'https://bernama.com',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    publishedAt: hoursAgo(12),
    relatedStocks: ['MYEG', 'DSONIC', 'REVENUE'],
    sentiment: 'bullish',
  },
  {
    id: 'news-14',
    title: 'Solana Hits New All-Time High, Outpaces Bitcoin Returns',
    summary: 'SOL tokens surge to $280 as ecosystem growth attracts developers and capital',
    content: `Solana has reached a new all-time high of $280, outperforming Bitcoin and Ethereum in year-to-date returns. The blockchain platform has seen a resurgence in developer activity and user adoption.

The rally is driven by several factors: growing DeFi activity, increased NFT trading volume, and the launch of major applications on the Solana network. Institutional interest has also picked up, with several hedge funds adding SOL to their portfolios.

"Solana has proven its resilience after the FTX collapse," said crypto analyst Ryan Watkins. "The technology is fast, cheap, and increasingly battle-tested."

Trading volume on Solana-based decentralized exchanges has exceeded that of Ethereum in recent weeks, highlighting the platform's growing market share.`,
    category: 'crypto',
    source: 'Decrypt',
    sourceUrl: 'https://decrypt.co',
    imageUrl: 'https://images.unsplash.com/photo-1644088379091-d574269d422f?w=800',
    publishedAt: hoursAgo(13),
    sentiment: 'bullish',
  },
  {
    id: 'news-15',
    title: 'Apple Announces Record iPhone Sales in Southeast Asia',
    summary: 'Tech giant reports 35% growth in ASEAN markets, driven by iPhone 16 demand',
    content: `Apple has reported record iPhone sales in Southeast Asia for the holiday quarter, with revenue from the region growing 35% year-on-year. The iPhone 16 series has been particularly popular in markets including Malaysia, Thailand, and Indonesia.

CEO Tim Cook highlighted the importance of the ASEAN market: "Southeast Asia represents one of our fastest-growing regions globally. The combination of rising middle-class incomes and young demographics makes this a priority market for Apple."

The strong results bode well for Apple's local suppliers and retail partners. Malaysian companies in Apple's supply chain, including Vitrox and Inari, may benefit from increased orders.`,
    category: 'tech',
    source: 'Bloomberg',
    sourceUrl: 'https://bloomberg.com',
    imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
    publishedAt: hoursAgo(14),
    relatedStocks: ['VITROX', 'INARI'],
    sentiment: 'bullish',
  },
  {
    id: 'news-16',
    title: 'Bank Negara Maintains OPR at 3.0%, Signals Data Dependence',
    summary: 'Central bank holds rates steady amid global uncertainties',
    content: `Bank Negara Malaysia has kept the Overnight Policy Rate (OPR) unchanged at 3.00% for the eighth consecutive meeting, citing the need to balance growth and inflation objectives.

In its statement, the central bank noted that domestic economic conditions remain supportive while inflation has moderated. However, global uncertainties, including trade policy shifts and geopolitical tensions, warrant a cautious approach.

"The current level of the OPR is appropriate given the economic conditions," said Governor Datuk Nor Shamsiah. "We will continue to monitor incoming data and adjust policy as needed."

Economists expect the OPR to remain on hold through the first half of 2026, with potential for cuts later in the year if inflation continues to trend lower.`,
    category: 'economy',
    source: 'The Edge Markets',
    sourceUrl: 'https://theedgemarkets.com',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800',
    publishedAt: hoursAgo(15),
    sentiment: 'neutral',
  },
  {
    id: 'news-17',
    title: 'Japanese Yen Rebounds Sharply on BOJ Policy Speculation',
    summary: 'Currency surges 3% as markets anticipate end of negative interest rates',
    content: `The Japanese yen has rebounded sharply against major currencies, gaining 3% against the US dollar, on growing speculation that the Bank of Japan may finally exit its negative interest rate policy.

The move came after BOJ Governor Kazuo Ueda made comments suggesting that wage growth data in the coming months could support a policy shift. The yen strengthened to 140 per dollar from 145 earlier in the week.

The yen's strength has implications for Asian currencies and markets. A stronger yen could reduce competitive pressures on other Asian exporters and potentially support regional currencies including the ringgit.

Currency traders are positioning for continued yen strength, with some forecasting a move toward 130 per dollar by mid-2026.`,
    category: 'forex',
    source: 'Reuters',
    sourceUrl: 'https://reuters.com',
    imageUrl: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800',
    publishedAt: hoursAgo(16),
    sentiment: 'bullish',
  },
  {
    id: 'news-18',
    title: 'KLCI Hits 5-Year High as Foreign Funds Return',
    summary: 'Benchmark index closes above 1,700 points for first time since 2020',
    content: `The FBM KLCI has closed above 1,700 points for the first time in five years, driven by sustained foreign buying and improved economic outlook. The index rose 1.2% to finish at 1,712.35, its highest level since January 2020.

Foreign investors have turned net buyers of Malaysian equities for four consecutive months, attracted by relatively attractive valuations, improving economic fundamentals, and a stable political environment.

"Malaysia is benefiting from the 'China plus one' strategy as companies diversify their supply chains," said equity strategist Tan Wei Ming. "The data center investment wave is particularly positive for the market."

Top gainers included technology and construction stocks, with CTOS, Gamuda, and IJM leading the advance.`,
    category: 'market',
    source: 'The Star',
    sourceUrl: 'https://thestar.com.my',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
    publishedAt: hoursAgo(17),
    relatedStocks: ['CTOS', 'GAMUDA', 'IJM'],
    sentiment: 'bullish',
  },
  {
    id: 'news-19',
    title: 'XRP Settles SEC Lawsuit, Price Doubles Overnight',
    summary: 'Ripple Labs reaches settlement agreement, removing major regulatory overhang',
    content: `Ripple Labs has reached a settlement with the US Securities and Exchange Commission, effectively ending a multi-year legal battle over whether XRP should be classified as a security.

Under the settlement, Ripple will pay a $125 million fine but is not required to admit wrongdoing. Crucially, XRP will be treated as a commodity for retail transactions, a major win for the company and token holders.

XRP's price doubled overnight following the announcement, jumping from $1.50 to over $3.00. The settlement removes a major overhang that had kept institutional investors on the sidelines.

"This is a watershed moment for the crypto industry," said Ripple CEO Brad Garlinghouse. "Regulatory clarity allows us to finally operate with confidence in the US market."`,
    category: 'crypto',
    source: 'CoinDesk',
    sourceUrl: 'https://coindesk.com',
    imageUrl: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800',
    publishedAt: hoursAgo(18),
    isBreaking: true,
    sentiment: 'bullish',
  },
  {
    id: 'news-20',
    title: 'Tesla Opens Gigafactory Malaysia, Creating 5,000 Jobs',
    summary: 'Electric vehicle giant begins production at new Penang facility',
    content: `Tesla has officially opened its first Southeast Asian manufacturing facility in Penang, Malaysia, marking a major milestone in the country's push to become a regional EV hub.

The $2 billion Gigafactory will initially produce battery packs and drive units, with potential to expand into full vehicle assembly. At full capacity, the facility is expected to employ over 5,000 workers and generate significant downstream economic activity.

CEO Elon Musk attended the opening ceremony virtually, praising Malaysia's investment climate and skilled workforce. "Malaysia is strategically positioned to serve growing EV demand across ASEAN," he said.

The announcement boosted sentiment in local EV-related stocks, including Press Metal (aluminum supplier) and Scientex (potential packaging supplier).`,
    category: 'market',
    source: 'The Edge Markets',
    sourceUrl: 'https://theedgemarkets.com',
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
    publishedAt: hoursAgo(19),
    relatedStocks: ['PMETAL', 'SCIENTX'],
    sentiment: 'bullish',
  },
  {
    id: 'news-21',
    title: 'EU Carbon Tax to Impact Malaysian Palm Oil Exports',
    summary: 'New regulations could affect $5 billion in annual exports to European markets',
    content: `The European Union's Carbon Border Adjustment Mechanism (CBAM) is set to impact Malaysian palm oil exports, with new regulations requiring compliance with strict sustainability standards.

Industry groups estimate that $5 billion in annual exports could be affected, prompting calls for government intervention and industry adaptation. Major producers including Sime Darby Plantation and IOI Corp are investing in sustainability certifications.

"We support sustainable practices but urge the EU to recognize our existing certification schemes," said the Malaysian Palm Oil Council. "Arbitrary restrictions would hurt smallholder farmers who depend on palm oil for their livelihoods."

The government is in talks with EU officials to negotiate favorable terms for Malaysian producers who meet sustainability requirements.`,
    category: 'economy',
    source: 'Reuters',
    sourceUrl: 'https://reuters.com',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
    publishedAt: hoursAgo(20),
    relatedStocks: ['SIMEPLT', 'IOI'],
    sentiment: 'bearish',
  },
  {
    id: 'news-22',
    title: 'Microsoft Acquires AI Startup for $15 Billion',
    summary: 'Tech giant expands AI capabilities with purchase of Inflection AI',
    content: `Microsoft has announced the acquisition of AI startup Inflection AI for $15 billion, its largest purchase since the $69 billion Activision Blizzard deal.

Inflection, founded by former DeepMind executives, has developed advanced conversational AI technology that Microsoft plans to integrate into its Copilot suite. The deal includes key personnel and intellectual property.

"This acquisition accelerates our AI roadmap and brings world-class talent to Microsoft," said CEO Satya Nadella. "The future of computing is AI-first, and we're investing to lead that transition."

The deal highlights the premium valuations being placed on AI companies and could spark further M&A activity in the sector.`,
    category: 'tech',
    source: 'The Verge',
    sourceUrl: 'https://theverge.com',
    imageUrl: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=800',
    publishedAt: hoursAgo(21),
    sentiment: 'bullish',
  },
  {
    id: 'news-23',
    title: 'Singapore Dollar Strengthens on Safe Haven Flows',
    summary: 'Regional currency gains as investors seek stability amid global tensions',
    content: `The Singapore dollar has strengthened against major currencies as investors seek safe haven assets amid rising geopolitical tensions in the Middle East and Eastern Europe.

The SGD gained 1.2% against the US dollar, approaching 1.30 per USD, its strongest level since 2014. The currency's strength reflects Singapore's role as a stable financial hub with strong foreign reserves.

The movement has implications for the ringgit, which typically moves in correlation with regional currencies. A stronger SGD could provide support for the Malaysian currency, though direct trade links mean a too-strong SGD could hurt Malaysia's competitiveness.

Currency analysts expect the SGD to remain well-supported given Singapore's economic fundamentals and monetary policy stance.`,
    category: 'forex',
    source: 'Bloomberg',
    sourceUrl: 'https://bloomberg.com',
    imageUrl: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
    publishedAt: hoursAgo(22),
    sentiment: 'neutral',
  },
  {
    id: 'news-24',
    title: 'Malaysia Hosts ASEAN Summit, Trade Agreements Expected',
    summary: 'Regional leaders convene in Kuala Lumpur to discuss economic cooperation',
    content: `Malaysia is hosting the ASEAN Summit in Kuala Lumpur, with trade and economic cooperation at the top of the agenda. Leaders from the 10-member bloc are expected to sign several agreements on digital trade and investment facilitation.

Prime Minister Datuk Seri Anwar Ibrahim emphasized the importance of regional unity in his opening address. "ASEAN's combined GDP of $4 trillion makes us a global economic force. Together, we can achieve more than apart."

Key topics include harmonizing digital trade rules, accelerating the ASEAN Economic Community, and addressing climate change. Business leaders are also attending, exploring opportunities for cross-border investment.

The summit is expected to boost confidence in the regional economic outlook and could lead to increased intra-ASEAN investment flows.`,
    category: 'politics',
    source: 'Bernama',
    sourceUrl: 'https://bernama.com',
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
    publishedAt: hoursAgo(23),
    sentiment: 'bullish',
  },
  {
    id: 'news-25',
    title: 'Genting Berhad Reports Strong Resort Recovery',
    summary: 'Gaming and hospitality giant sees visitor numbers surpass pre-pandemic levels',
    content: `Genting Berhad has reported that visitor numbers at its flagship Resorts World Genting have surpassed pre-pandemic levels for the first time, driving a strong recovery in its hospitality segment.

The company saw a 25% increase in revenue from its Malaysian operations, with hotel occupancy rates averaging 85%. The opening of new attractions, including the outdoor theme park, has attracted both domestic and international tourists.

"The tourism recovery has exceeded our expectations," said CEO Lim Kok Thay. "We're investing in new experiences to maintain momentum and attract the next generation of visitors."

Analysts have upgraded their price targets for Genting shares, citing the strong operational recovery and potential for further margin expansion.`,
    category: 'market',
    source: 'The Edge Markets',
    sourceUrl: 'https://theedgemarkets.com',
    imageUrl: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
    publishedAt: hoursAgo(24),
    relatedStocks: ['GENTING', 'GENM'],
    sentiment: 'bullish',
  },
  {
    id: 'news-26',
    title: 'DOT Crypto Token Surges 40% on Polkadot 2.0 Launch',
    summary: 'Major upgrade brings improved scalability and cross-chain capabilities',
    content: `The DOT token has surged 40% following the successful launch of Polkadot 2.0, a major upgrade that significantly improves the blockchain platform's scalability and cross-chain communication capabilities.

The upgrade introduces "elastic scaling," allowing parachains to access computing resources on-demand, and "agile coretime," which lets developers purchase block space more efficiently. These improvements address previous criticisms about Polkadot's complexity and cost.

"Polkadot 2.0 represents our vision for a truly scalable, interoperable multi-chain ecosystem," said founder Gavin Wood. "We're making it easier for developers to build and users to interact across chains."

The positive momentum has extended to the broader Layer 1 ecosystem, with competitors like Cosmos and Avalanche also seeing gains.`,
    category: 'crypto',
    source: 'Decrypt',
    sourceUrl: 'https://decrypt.co',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    publishedAt: hoursAgo(25),
    sentiment: 'bullish',
  },
  {
    id: 'news-27',
    title: 'Maybank Launches AI-Powered Banking Platform',
    summary: 'Malaysia\'s largest bank introduces advanced digital banking features',
    content: `Malayan Banking Berhad (Maybank) has launched an AI-powered banking platform called "MAE Prime," featuring personalized financial insights, automated investment recommendations, and enhanced security features.

The platform uses machine learning to analyze spending patterns and provide customized advice. It also includes a chatbot powered by GPT-4 that can handle complex customer queries and transactions.

"MAE Prime represents the future of banking in Malaysia," said Group CEO Datuk Khairussaleh Ramli. "We're combining the trust of traditional banking with the convenience of cutting-edge technology."

The launch is part of Maybank's broader digital transformation strategy, which includes RM5 billion in technology investments over the next five years.`,
    category: 'tech',
    source: 'The Star',
    sourceUrl: 'https://thestar.com.my',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    publishedAt: hoursAgo(26),
    relatedStocks: ['MAYBANK'],
    sentiment: 'bullish',
  },
  {
    id: 'news-28',
    title: 'Gold Prices Hit Record High Amid Central Bank Buying',
    summary: 'Precious metal tops $2,500 per ounce as reserve diversification continues',
    content: `Gold prices have hit a record high of $2,500 per ounce, driven by continued central bank purchases and investor demand for safe haven assets amid global uncertainties.

Central banks, led by China, Russia, and India, have been net buyers of gold for five consecutive years. In 2025, combined purchases are expected to exceed 1,200 tonnes, well above historical averages.

"Gold remains a key component of reserve diversification strategies," said World Gold Council analyst Juan Carlos Artigas. "Central banks are reducing their exposure to dollar-denominated assets in favor of physical gold."

The rally has implications for Malaysian gold-related stocks and the local jewelry industry, with consumers facing higher prices for gold products.`,
    category: 'market',
    source: 'Reuters',
    sourceUrl: 'https://reuters.com',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
    publishedAt: hoursAgo(27),
    sentiment: 'bullish',
  },
  {
    id: 'news-29',
    title: 'IMF Upgrades Global Growth Forecast for 2026',
    summary: 'International organization raises projections on easing inflation and resilient demand',
    content: `The International Monetary Fund has upgraded its global growth forecast for 2026 to 3.4%, up from a previous estimate of 3.1%, citing easing inflation pressures and resilient consumer demand in major economies.

The revised forecast reflects better-than-expected performance in the United States and emerging markets, offsetting slower growth in China and Europe. The IMF also noted that central banks have successfully navigated the inflation challenge without triggering deep recessions.

For ASEAN, the outlook remains positive with growth projected at 4.6%. Malaysia is expected to grow at 5.0%, benefiting from strong exports and domestic investment.

"The global economy has proven more resilient than expected," said IMF Managing Director Kristalina Georgieva. "However, risks remain elevated and policymakers must remain vigilant."`,
    category: 'economy',
    source: 'Financial Times',
    sourceUrl: 'https://ft.com',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800',
    publishedAt: hoursAgo(28),
    sentiment: 'bullish',
  },
  {
    id: 'news-30',
    title: 'Bursa Malaysia Introduces Extended Trading Hours',
    summary: 'Stock exchange to pilot evening session to attract international investors',
    content: `Bursa Malaysia has announced plans to introduce extended trading hours starting Q2 2026, with an evening session from 7pm to 10pm aimed at attracting more international investors.

The extended hours will allow European and Middle Eastern investors to trade Malaysian stocks during their business hours, potentially increasing foreign participation and liquidity. The pilot program will initially cover the top 100 stocks by market cap.

"This is a significant step in our journey to become a premier ASEAN exchange," said Bursa Malaysia CEO Datuk Muhamad Umar Swift. "Extended hours will improve accessibility and deepen our market."

Market participants have generally welcomed the move, though some have raised concerns about operational challenges and the need for adequate infrastructure support.`,
    category: 'market',
    source: 'The Edge Markets',
    sourceUrl: 'https://theedgemarkets.com',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
    publishedAt: hoursAgo(29),
    sentiment: 'bullish',
  },
]

// Get filtered news by category
export function getNewsByCategory(category: NewsCategory): NewsItem[] {
  if (category === 'all') {
    return DEMO_NEWS
  }
  if (category === 'breaking') {
    return DEMO_NEWS.filter(news => news.isBreaking)
  }
  return DEMO_NEWS.filter(news => news.category === category)
}

// Get single news item by ID
export function getNewsById(id: string): NewsItem | undefined {
  return DEMO_NEWS.find(news => news.id === id)
}

// Get related news by category (excluding current)
export function getRelatedNews(id: string, limit: number = 4): NewsItem[] {
  const current = getNewsById(id)
  if (!current) return []

  return DEMO_NEWS
    .filter(news => news.id !== id && news.category === current.category)
    .slice(0, limit)
}
