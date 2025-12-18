// Real news data for the News section
// Scraped from various financial news sources - December 2025

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
    title: 'Federal Reserve Cuts Rates to 3.5%-3.75% in Divided Vote',
    summary: 'Fed lowers key rate by 25 basis points in 9-3 vote, signals tougher road ahead for further reductions',
    content: `The Federal Reserve lowered its key overnight borrowing rate by a quarter percentage point on December 10, 2025, putting it in a range between 3.5%-3.75%. This marks the third consecutive rate cut and puts the central bank's range at its lowest level since November 2022.

The FOMC voted to cut by 25 basis points with three dissenters - Chicago Fed President Austan Goolsbee and Kansas City Fed President Jeffrey Schmid dissented in favor of leaving interest rates unchanged, while Fed Governor Stephen Miran dissented in favor of a larger 50-basis-point cut.

It was the first time in six years that an interest rate vote was so divided. Chair Jerome Powell said additional rate cuts will be tougher to justify, stating "We are well positioned to wait to see how the economy evolves."

The closely watched "dot plot" of individual officials' expectations indicated just one cut in 2026 and another in 2027 before the federal funds rate hits a longer-run target around 3%.`,
    category: 'breaking',
    source: 'CNBC',
    sourceUrl: 'https://cnbc.com',
    imageUrl: 'https://picsum.photos/id/1067/800/450',
    publishedAt: minutesAgo(30),
    author: 'Federal Reserve Watch',
    isBreaking: true,
    sentiment: 'neutral',
  },
  {
    id: 'news-2',
    title: 'Tesla Stock Hits All-Time High at $489.88 on Robotaxi Progress',
    summary: 'EV giant reaches record valuation as driverless testing advances in Austin',
    content: `Tesla shares reached an all-time closing high of $489.88, jumping 3.1% on Tuesday. The stock is now up 21% for the year, with Tesla's market cap climbing to $1.63 trillion, making it the seventh-most valuable publicly traded company.

The rally comes as Tesla tests driverless vehicles in Austin without humans on board. "Testing is underway with no occupants in the car," CEO Elon Musk wrote in a post on X over the weekend. The Tesla Robotaxi fleet in Austin was comprised of 30 or fewer vehicles as of October, with plans to double that to 60 by year-end.

Despite stock gains, Tesla faces headwinds in its core EV business. Domestic sales fell 23% to 39,800 vehicles in November according to Cox Automotive, as overall U.S. EV sales plunged 41% following the cessation of $7,500 federal tax credits.

Mizuho raised its price target on Tesla to $530 from $475, maintaining its buy recommendation.`,
    category: 'market',
    source: 'Bloomberg',
    sourceUrl: 'https://bloomberg.com',
    imageUrl: 'https://picsum.photos/id/1071/800/450',
    publishedAt: hoursAgo(1),
    author: 'Auto Desk',
    relatedStocks: ['TSLA'],
    isBreaking: true,
    sentiment: 'bullish',
  },
  {
    id: 'news-3',
    title: 'Bitcoin Drops Below $86,000 Amid Post-Fed Selling',
    summary: 'Cryptocurrency faces pressure as Fed signals slower pace of rate cuts ahead',
    content: `Bitcoin is trading at $86,388, up just 0.1% since yesterday, as the cryptocurrency market navigates post-Federal Reserve volatility. The total crypto market capitalization now stands at $3.03 trillion with trading volume at $108 billion.

Despite recent volatile action, BTC remains rangebound above the late November lows of $80,000 and below the early December high of $94,000. Markets have been under pressure after Fed Chair Jerome Powell's speech hinted at a possible rate cut pause in January.

US BTC and ETH spot ETFs both saw outflows on Tuesday of $227.09 million and $224.26 million respectively. Tokens such as JUP, KAS and QNT posted double-digit weekly losses, while CoinMarketCap's altcoin season index fell to a cycle low of 16/100.

"This still looks more like late-year digestion than a structural regime shift," noted Wintermute OTC trader Jasper De Maere.`,
    category: 'crypto',
    source: 'CoinDesk',
    sourceUrl: 'https://coindesk.com',
    imageUrl: 'https://picsum.photos/id/24/800/450',
    publishedAt: hoursAgo(2),
    author: 'Crypto Markets',
    sentiment: 'bearish',
  },
  {
    id: 'news-4',
    title: 'Nvidia Stock Under Pressure Despite $500B AI Chip Order Book',
    summary: 'Shares down 17% from October peak amid AI bubble concerns and competition worries',
    content: `Nvidia stock is trading around $183.78 per share, valuing the company at roughly $4.5 trillion. However, the AI chipmaker has had a rough couple of months, with its stock down about 17% from its October peak.

November was particularly rough with NVDA falling about 12.6% as investors weighed worries about an "AI bubble" and increased scrutiny of sky-high valuations. Competition concerns emerged after reports that Meta is considering using Google's tensor processing units in its data centers.

On the positive side, the U.S. government reversed course on some AI chip export restrictions. The U.S. will allow exports of Nvidia's H200 AI processors to China under a regime that collects a 25% fee on sales.

Nvidia's revenue soared to a record $57 billion in fiscal Q3, a remarkable 62% year-over-year jump. Data center revenue reached $51.2 billion, up 66% YoY. Wall Street maintains a "Strong Buy" consensus with price targets in the mid-$240s to high-$250s.`,
    category: 'tech',
    source: 'The Motley Fool',
    sourceUrl: 'https://fool.com',
    imageUrl: 'https://picsum.photos/id/180/800/450',
    publishedAt: hoursAgo(3),
    author: 'Tech Analyst',
    relatedStocks: ['NVDA'],
    sentiment: 'neutral',
  },
  {
    id: 'news-5',
    title: 'FBM KLCI Trades at 1,640 as Malaysia Markets Hold Steady',
    summary: 'Malaysian benchmark index up 2.52% YoY despite slight daily decline',
    content: `Malaysia's main stock market index, the FBM KLCI, fell to 1,640 points, losing 0.52% from the previous session. However, over the past month, the index has climbed 1.60% and is up 2.52% compared to the same time last year.

The FKLCI increased to 1,644.00 Index Points earlier this week, the highest since October 2024. Gains were led by basic materials stocks, while healthcare emerged as the top-performing sector across Bursa Malaysia.

For the index, immediate resistance stays at the December 2024 high of 1,644, with the highs of 1,684 and 1,695 as tougher upside hurdles. Immediate support is capped at the 61.8%FR (1,564) with stronger supports at the 50%FR (1,527).

Key index heavyweights CIMB, Genting, Public Bank, Sime Darby, IWCity, and Unisem should attract bargain hunters according to analysts.`,
    category: 'market',
    source: 'KLSE Screener',
    sourceUrl: 'https://klsescreener.com',
    imageUrl: 'https://picsum.photos/id/1062/800/450',
    publishedAt: hoursAgo(4),
    relatedStocks: ['CIMB', 'GENTING', 'PBBANK', 'SIME'],
    sentiment: 'neutral',
  },
  {
    id: 'news-6',
    title: 'Gold Surges to $4,345 Per Ounce Near All-Time Highs',
    summary: 'Precious metal up 67% YoY as investors seek safe haven amid geopolitical tensions',
    content: `Gold climbed above $4,320 per ounce testing levels near all-time highs last seen in October, as investors see scope for additional easing by the Federal Reserve next year. On December 17, gold was valued at $4,345 per ounce.

Over the past month, gold's price has risen 6.25%, and is up 67.08% compared to the same time last year. Prices have soared to all-time highs, up over 25% since the beginning of 2025, fueled by inflation and uncertainty.

Geopolitical risks have resurfaced after President Trump ordered a blockade of sanctioned Venezuelan oil tankers. Russian President Putin signaled he has no intention of easing demands for Ukraine to surrender territory.

The US labor market showed cooling signs with unemployment rising to 4.6% in November, reinforcing expectations for up to two interest-rate cuts in 2026.`,
    category: 'market',
    source: 'Fortune',
    sourceUrl: 'https://fortune.com',
    imageUrl: 'https://picsum.photos/id/259/800/450',
    publishedAt: hoursAgo(5),
    sentiment: 'bullish',
  },
  {
    id: 'news-7',
    title: 'Apple iPhone Shipments to Hit Record 247 Million in 2025',
    summary: 'iPhone 17 demand drives record year as China sales surge 17% YoY',
    content: `Apple is expected to ship 247.4 million iPhones in 2025, up just over 6% year-on-year, according to IDC forecasts. That's more than the 236 million sold in 2021, when the iPhone 13 was released.

The phenomenal success is thanks to the iPhone 17 series, with massive demand significantly accelerating Apple's performance in China. Apple ranked first in October and November in China with more than 20% market share, leading IDC to revise Apple's Q4 forecast from 9% to 17% YoY.

The iPhone 16 was the best-selling smartphone globally in Q3 2025. Apple captured the top four spots on the Counterpoint Research top-10 list. The iPhone 17 Pro Max became the best-selling smartphone in September 2025.

2025 will not only be a record period in shipments but also in value, forecast to exceed $261 billion with 7.2% YoY growth. Apple reported fiscal Q4 2025 revenue of $102.5 billion (up 8% YoY).`,
    category: 'tech',
    source: 'MacRumors',
    sourceUrl: 'https://macrumors.com',
    imageUrl: 'https://picsum.photos/id/1/800/450',
    publishedAt: hoursAgo(6),
    author: 'Apple Watch',
    relatedStocks: ['AAPL'],
    sentiment: 'bullish',
  },
  {
    id: 'news-8',
    title: 'Oil Prices Tumble to $55.5 Per Barrel, Worst Year Since 2018',
    summary: 'WTI crude extends YTD losses to 22% amid oversupply concerns',
    content: `Oil prices fell more than 2% on Tuesday, with WTI crude futures trading near $55.5 a barrel, the lowest level since early 2021. This extends year-to-date losses to around 22%, marking the worst annual performance since 2018.

Prices recovered to around $56 per barrel on Wednesday after President Trump ordered a "total and complete" blockade of sanctioned oil tankers linked to Venezuela.

Oil has struggled this year on ample supply as OPEC+ steadily restores shut-in capacity and non-OPEC producers ramp up output. Early signs of demand weakness are emerging across China, the Middle East, and the US.

The IEA reports global oil demand is set to rise by 830 kb/d in 2025. Russia's total oil exports fell by 400 kb/d in November to 6.9 mb/d, with Urals prices plunging to $43.52/bbl.`,
    category: 'market',
    source: 'Trading Economics',
    sourceUrl: 'https://tradingeconomics.com',
    imageUrl: 'https://picsum.photos/id/1015/800/450',
    publishedAt: hoursAgo(7),
    sentiment: 'bearish',
  },
  {
    id: 'news-9',
    title: 'Malaysia Industrial Production Rises 6.0% YoY in October',
    summary: 'All sectors maintain positive momentum as Wholesale Trade hits RM160.9bn',
    content: `Malaysia's industrial production index rose 6.0% YoY in October 2025, maintaining positive momentum in all sectors. The Wholesale and Retail Trade sector recorded robust growth with total sales value reaching RM160.9bn, marking a 7.2% YoY increase.

Corporate activity remains strong with Kerjaya Prospek Group securing a RM225.0mn contract for a 50-storey serviced apartment and commercial development. Khee San Bhd raised RM77.1mn from its renounceable rights issue with a subscription rate of 80.3%.

The ringgit traded at 4.0900 against the US dollar. Analysts note that Malaysia is benefiting from the 'China plus one' strategy as companies diversify their supply chains.

The data center investment wave is particularly positive for the market, with tech and construction stocks leading advances.`,
    category: 'economy',
    source: 'The Edge Markets',
    sourceUrl: 'https://theedgemarkets.com',
    imageUrl: 'https://picsum.photos/id/42/800/450',
    publishedAt: hoursAgo(8),
    relatedStocks: ['KPG', 'KHEESAN'],
    sentiment: 'bullish',
  },
  {
    id: 'news-10',
    title: 'US-China AI Chip Export Rules Ease, Nvidia Allowed to Sell H200',
    summary: 'Government reverses course, allows chip exports with 25% fee',
    content: `On December 8-9, 2025, the U.S. government reversed course on some AI chip export restrictions. The U.S. will allow exports of Nvidia's H200 AI processors to China under a regime that collects a 25% fee on those sales.

The same framework is expected to apply to chips from AMD and Intel. Nvidia shares rose around 2% in after-hours trading following the announcement.

However, on December 4, a bipartisan group of U.S. senators introduced the SAFE CHIPS Act, which would block the Trump administration from loosening restrictions on AI chip exports to China, Russia, Iran, and North Korea for 30 months.

Nvidia controls an estimated 80% of the AI chip market according to Susquehanna. The company's AI chip order book is worth $500 billion for 2025 and 2026 combined.`,
    category: 'politics',
    source: 'Reuters',
    sourceUrl: 'https://reuters.com',
    imageUrl: 'https://picsum.photos/id/201/800/450',
    publishedAt: hoursAgo(9),
    relatedStocks: ['NVDA', 'AMD', 'INTC'],
    sentiment: 'bullish',
  },
  {
    id: 'news-11',
    title: 'Ethereum ETFs See Major Outflows Amid Crypto Weakness',
    summary: 'Spot ETH ETFs record $224.26M outflow as Ether falls below $3,000',
    content: `Spot Ethereum exchange-traded funds recorded $224.26 million in outflows on Tuesday, as the second-largest cryptocurrency fell below $3,000 for the first time in weeks.

The outflows mirror the broader crypto market weakness, with Bitcoin ETFs also seeing $227.09 million in redemptions. The decline comes as investors digest the Federal Reserve's hawkish tone on future rate cuts.

CoinDesk's Memecoin Index is down 59% year-to-date versus a 7.3% decline in the CD10. Altcoin performance has been particularly weak, with the altcoin season index falling to a cycle low of 16/100.

Despite the short-term weakness, institutional interest in Ethereum remains strong, with total assets under management for Ethereum ETFs still exceeding $15 billion.`,
    category: 'crypto',
    source: 'CoinDesk',
    sourceUrl: 'https://coindesk.com',
    imageUrl: 'https://picsum.photos/id/26/800/450',
    publishedAt: hoursAgo(10),
    sentiment: 'bearish',
  },
  {
    id: 'news-12',
    title: 'Fed Expected to Hold Rates in January 2026',
    summary: 'CME FedWatch shows 75.6% probability of no change at next meeting',
    content: `Markets expect the Federal Reserve to hold interest rates steady at its January 2026 meeting, with a 75.6% probability of remaining at the 3.5% to 3.75% range according to the CME FedWatch tool.

Chair Jerome Powell indicated additional rate cuts will be tougher to justify. "We are well positioned to wait to see how the economy evolves," he stated after the December meeting.

The decision was clouded by a lack of timely data due to the six-week government shutdown. Furloughed federal workers were unable to measure inflation and unemployment in October, and November's readings were delayed.

Policymakers had to rely on somewhat stale economic data from September, when annual inflation was clocked at 2.8% while unemployment stood at 4.4%.`,
    category: 'economy',
    source: 'CNN Business',
    sourceUrl: 'https://cnn.com/business',
    imageUrl: 'https://picsum.photos/id/1070/800/450',
    publishedAt: hoursAgo(11),
    sentiment: 'neutral',
  },
  {
    id: 'news-13',
    title: 'Marshall Islands Launches Crypto-Powered Universal Basic Income',
    summary: 'Every citizen receives $800 annually via cryptocurrency payments',
    content: `The Marshall Islands has launched a nationwide universal basic income (UBI) program that allows citizens to receive payments via cryptocurrency. Every resident citizen is entitled to quarterly payments of roughly $200, or about $800 annually.

First payments were distributed in late November. The program marks one of the first national implementations of crypto-based government benefits distribution.

The initiative aims to provide financial inclusion for citizens who may lack access to traditional banking services. The Marshall Islands has been at the forefront of crypto adoption, having previously considered a national digital currency.

The program is being closely watched by other nations considering similar crypto-powered social welfare initiatives.`,
    category: 'crypto',
    source: 'CoinTelegraph',
    sourceUrl: 'https://cointelegraph.com',
    imageUrl: 'https://picsum.photos/id/48/800/450',
    publishedAt: hoursAgo(12),
    sentiment: 'bullish',
  },
  {
    id: 'news-14',
    title: 'Venezuela Oil Blockade Lifts Crude Prices',
    summary: 'Trump orders "total and complete" blockade of sanctioned tankers',
    content: `WTI crude oil futures rose more than 1% to around $56 per barrel, recovering from near a five-year low after President Donald Trump ordered a "total and complete" blockade of sanctioned oil tankers linked to Venezuela.

The move comes as oil prices had extended year-to-date losses to around 22%, the worst annual performance since 2018. The average price of the OPEC basket stands at $62.36 per barrel in December.

Progress toward a Russia-Ukraine peace agreement had raised the prospect of easing restrictions on Russian oil flows, adding to oversupply concerns. Russia's total oil exports fell by 400 kb/d in November.

The U.S. Energy Information Administration expects global oil inventories to continue rising through 2026, with Brent crude forecast to average $55 per barrel in Q1 2026.`,
    category: 'market',
    source: 'OilPrice.com',
    sourceUrl: 'https://oilprice.com',
    imageUrl: 'https://picsum.photos/id/1016/800/450',
    publishedAt: hoursAgo(13),
    sentiment: 'neutral',
  },
  {
    id: 'news-15',
    title: 'US Jobless Claims Surge to 236,000, Fastest in 5 Years',
    summary: 'Labor market cooling reinforces rate cut expectations for 2026',
    content: `Initial jobless claims surged to 236,000 in the week ending December 6, the fastest pace in nearly five years. The data reinforces expectations that the Federal Reserve may cut interest rates up to twice in 2026.

Unemployment rose to 4.6% in November, showing continued cooling in the US labor market. The weakening employment picture has made gold and other safe-haven assets more attractive to investors.

The labor market data comes as the Fed navigates between supporting economic growth and managing inflation. September's annual inflation was 2.8%, still above the Fed's 2% target.

Economists note that while the job market is cooling, it remains relatively healthy compared to historical standards during economic downturns.`,
    category: 'economy',
    source: 'Fox Business',
    sourceUrl: 'https://foxbusiness.com',
    imageUrl: 'https://picsum.photos/id/60/800/450',
    publishedAt: hoursAgo(14),
    sentiment: 'bearish',
  },
  {
    id: 'news-16',
    title: 'Meta Considering Google TPUs Over Nvidia Chips for 2027',
    summary: 'Report sparks competition concerns for AI chip leader',
    content: `Reports emerged that Meta is considering using Google's tensor processing units (TPUs) in its data centers in 2027, and may also rent TPUs from Google's cloud unit next year.

The news contributed to Nvidia's stock falling about 12.6% in November, as investors weighed worries about growing competition in the AI chip market despite Nvidia's dominant 80% market share.

Nvidia's November selloff came amid increased scrutiny of sky-high AI valuations and concerns about an "AI bubble." New frontier models from Google have added to competitive pressures.

Despite the competition concerns, Nvidia maintains a "Strong Buy" consensus rating from Wall Street, with average 12-month price targets implying roughly 40% upside from current levels.`,
    category: 'tech',
    source: 'CNBC',
    sourceUrl: 'https://cnbc.com',
    imageUrl: 'https://picsum.photos/id/0/800/450',
    publishedAt: hoursAgo(15),
    relatedStocks: ['META', 'GOOGL', 'NVDA'],
    sentiment: 'bearish',
  },
  {
    id: 'news-17',
    title: 'iPhone 18 Base Model May Be Delayed to 2027',
    summary: 'Bloomberg reports Apple could break regular fall release cycle',
    content: `Bloomberg reported that Apple could delay the release of the base model iPhone 18 until 2027, potentially breaking its regular fall release cycle for the first time.

If confirmed, IDC said this could mean Apple's shipments may drop by 4.2% next year. The report comes amid Apple's record 2025, with expected shipments of 247.4 million iPhones.

Apple CEO Tim Cook said the company expects to set a new all-time revenue record in the December quarter. The company reported fiscal Q4 2025 revenue of $102.5 billion, up 8% year-over-year.

The iPhone 17 series has been a phenomenal success, particularly in China where Apple achieved more than 20% market share in October and November.`,
    category: 'tech',
    source: '9to5Mac',
    sourceUrl: 'https://9to5mac.com',
    imageUrl: 'https://picsum.photos/id/2/800/450',
    publishedAt: hoursAgo(16),
    relatedStocks: ['AAPL'],
    sentiment: 'neutral',
  },
  {
    id: 'news-18',
    title: 'Russia Oil Revenue Hits Lowest Since Ukraine Invasion',
    summary: 'Urals prices plunge to $43.52/bbl as exports fall 400 kb/d',
    content: `Russia's total oil exports fell by roughly 400 kb/d in November to 6.9 mb/d, and Urals prices plunged by $8.2/bbl to $43.52/bbl, dragging export revenues to their lowest since Russia's invasion of Ukraine in February 2022.

Global oil supply fell by 610 kb/d in November, with OPEC+ accounting for over three-quarters of the total decrease. Russia led the decline, along with significant unplanned outages in Kuwait and Kazakhstan.

Progress toward a Russia-Ukraine peace agreement has raised the prospect of easing restrictions on Russian oil flows, though this remains uncertain.

The IEA reports global oil demand is set to rise by 830 kb/d in 2025, with the 2026 forecast upgraded by 90 kb/d to 860 kb/d year-over-year.`,
    category: 'economy',
    source: 'IEA',
    sourceUrl: 'https://iea.org',
    imageUrl: 'https://picsum.photos/id/1019/800/450',
    publishedAt: hoursAgo(17),
    sentiment: 'neutral',
  },
  {
    id: 'news-19',
    title: 'US EV Sales Plunge 41% After Tax Credit Ends',
    summary: 'Tesla domestic sales down 23% as federal incentive expires',
    content: `Overall U.S. electric vehicle sales plunged 41% in November as the sector navigates the Trump administration's cessation of $7,500 federal tax credits at the end of September.

Tesla's domestic sales fell 23% to 39,800 vehicles in November according to Cox Automotive. Despite the sales decline, Tesla stock hit an all-time high as investors focus on the company's robotaxi ambitions rather than traditional EV metrics.

Throughout 2025, Tesla's stock reacted less to delivery numbers and more to updates around Full Self-Driving, autonomy milestones, and Optimus robot demonstrations.

The company didn't abandon EVs, but quietly repositioned them as the foundation rather than the future. The real debate around Tesla now centers on autonomy and robotics.`,
    category: 'market',
    source: 'Cox Automotive',
    sourceUrl: 'https://coxautomotive.com',
    imageUrl: 'https://picsum.photos/id/111/800/450',
    publishedAt: hoursAgo(18),
    relatedStocks: ['TSLA'],
    sentiment: 'bearish',
  },
  {
    id: 'news-20',
    title: 'Altcoin Season Index Hits Cycle Low of 16/100',
    summary: 'Memecoins down 59% YTD as crypto market struggles',
    content: `CoinMarketCap's altcoin season index fell to a cycle low of 16/100, indicating extreme Bitcoin dominance in the current crypto market. CoinDesk's Memecoin Index is down 59% year-to-date versus a 7.3% decline in the CD10.

Tokens such as JUP, KAS and QNT posted double-digit weekly losses. The broader altcoin market has underperformed significantly as investors reduce risk exposure heading into year-end.

Bitcoin remains rangebound above $80,000 and below $94,000, with neither the flagship cryptocurrency nor the broader crypto market behaving as expected following the Fed rate cut.

Analysts note that while chances for a year-end crypto rally appear to be slipping away, the selling has remained orderly rather than indicating a structural regime shift.`,
    category: 'crypto',
    source: 'CoinMarketCap',
    sourceUrl: 'https://coinmarketcap.com',
    imageUrl: 'https://picsum.photos/id/27/800/450',
    publishedAt: hoursAgo(19),
    sentiment: 'bearish',
  },
  {
    id: 'news-21',
    title: 'Ford Exits $6.5 Billion Battery Deal',
    summary: 'EV maker pulls back on battery investment amid market challenges',
    content: `Ford announced it is exiting a $6.5 billion battery deal as the automaker recalibrates its EV strategy amid challenging market conditions.

The decision comes as overall U.S. EV sales have declined following the end of federal tax credits. Ford joins other legacy automakers in scaling back aggressive EV investment plans.

The pullback reflects broader uncertainty in the EV market, with consumers showing hesitation about electric vehicle adoption without government incentives.

Despite the setback, Ford continues to develop its EV lineup but is taking a more measured approach to production capacity expansion.`,
    category: 'market',
    source: 'Fox Business',
    sourceUrl: 'https://foxbusiness.com',
    imageUrl: 'https://picsum.photos/id/133/800/450',
    publishedAt: hoursAgo(20),
    relatedStocks: ['F'],
    sentiment: 'bearish',
  },
  {
    id: 'news-22',
    title: 'Nvidia Data Center Revenue Hits Record $51.2 Billion',
    summary: 'Q3 earnings show 66% YoY growth as AI demand continues',
    content: `Nvidia's data center revenue reached a record $51.2 billion in fiscal Q3, marking a 66% year-over-year increase. Total company revenue soared to $57 billion, a remarkable 62% jump from the same period last year.

The results demonstrate continued strong demand for AI computing infrastructure despite concerns about an AI bubble. Nvidia's AI chip order book is worth $500 billion for 2025 and 2026 combined.

Major cloud providers including Microsoft, Amazon, and Google continue to deploy Nvidia's latest chips. The company's Blackwell architecture is seeing strong early adoption.

Wall Street maintains a "Strong Buy" consensus on NVDA, with average 12-month price targets clustering in the mid-$240s to high-$250s, implying roughly 40% upside from current levels.`,
    category: 'tech',
    source: 'The Motley Fool',
    sourceUrl: 'https://fool.com',
    imageUrl: 'https://picsum.photos/id/181/800/450',
    publishedAt: hoursAgo(21),
    relatedStocks: ['NVDA'],
    sentiment: 'bullish',
  },
  {
    id: 'news-23',
    title: 'China Demand Drives Apple Record Quarter',
    summary: 'iPhone maker ranks first in China with 20%+ market share',
    content: `Apple ranked first in China in October and November with more than 20% market share, leading IDC to revise Apple's Q4 forecast in China from 9% to 17% year-over-year growth.

This turns a previously projected 1% decline in China for 2025 into a positive 3% growth. Massive demand for iPhone 17 has significantly accelerated Apple's performance in its largest market.

The success comes despite increased competition from domestic Chinese smartphone makers and ongoing geopolitical tensions between the US and China.

Apple CEO Tim Cook has consistently emphasized the importance of the Chinese market, and the latest results validate the company's continued investment in the region.`,
    category: 'tech',
    source: 'IDC',
    sourceUrl: 'https://idc.com',
    imageUrl: 'https://picsum.photos/id/3/800/450',
    publishedAt: hoursAgo(22),
    relatedStocks: ['AAPL'],
    sentiment: 'bullish',
  },
  {
    id: 'news-24',
    title: 'Ringgit Trades at 4.09 Against Dollar',
    summary: 'Malaysian currency weakens slightly as regional markets adjust',
    content: `The Malaysian ringgit traded at 4.0900 against the US dollar, showing slight weakness as regional currency markets adjust to the Federal Reserve's latest policy signals.

The currency remains relatively stable compared to earlier in 2025, benefiting from Malaysia's strong economic fundamentals and sustained foreign investment inflows.

Malaysia's industrial production continues to show strength with 6.0% YoY growth in October. The Wholesale and Retail Trade sector reached RM160.9bn in sales.

Analysts expect the ringgit to remain supported by the country's data center investment wave and the "China plus one" diversification strategy benefiting Malaysian manufacturers.`,
    category: 'forex',
    source: 'Bank Negara Malaysia',
    sourceUrl: 'https://bnm.gov.my',
    imageUrl: 'https://picsum.photos/id/122/800/450',
    publishedAt: hoursAgo(23),
    sentiment: 'neutral',
  },
  {
    id: 'news-25',
    title: 'Tesla Autopilot Faces California DMV Action',
    summary: 'Regulatory scrutiny continues over autonomous driving marketing',
    content: `Tesla faces a California Department of Motor Vehicles (DMV) action tied to "Autopilot" marketing claims, as regulators continue to scrutinize the company's autonomous driving technology.

The action comes even as Tesla advances its robotaxi testing in Austin, where vehicles are now operating without human occupants. The company aims to double its Austin robotaxi fleet from 30 to 60 vehicles by year-end.

Despite regulatory challenges, investors remain focused on Tesla's autonomy progress. The stock hit an all-time high of $489.88, with a market cap of $1.63 trillion.

The company's shift from traditional EV metrics to autonomy and robotics as key value drivers has been largely successful with investors.`,
    category: 'market',
    source: 'California DMV',
    sourceUrl: 'https://dmv.ca.gov',
    imageUrl: 'https://picsum.photos/id/112/800/450',
    publishedAt: hoursAgo(24),
    relatedStocks: ['TSLA'],
    sentiment: 'neutral',
  },
  {
    id: 'news-26',
    title: 'SAFE CHIPS Act Targets AI Export Restrictions',
    summary: 'Bipartisan bill would block loosening of China chip controls for 30 months',
    content: `A bipartisan group of U.S. senators introduced the SAFE CHIPS Act on December 4, which would block the Trump administration from loosening restrictions on AI chip exports to China, Russia, Iran, and North Korea for 30 months.

The bill would require the Commerce Department to deny licenses for AI chips more advanced than what those countries can already buy.

The legislation comes as the administration reversed course on some restrictions, allowing Nvidia's H200 exports to China with a 25% fee.

The conflicting policy signals create uncertainty for chipmakers trying to navigate export controls while maintaining access to lucrative international markets.`,
    category: 'politics',
    source: 'U.S. Senate',
    sourceUrl: 'https://senate.gov',
    imageUrl: 'https://picsum.photos/id/193/800/450',
    publishedAt: hoursAgo(25),
    relatedStocks: ['NVDA', 'AMD', 'INTC'],
    sentiment: 'neutral',
  },
  {
    id: 'news-27',
    title: 'Fed Dot Plot Shows One Cut in 2026, One in 2027',
    summary: 'Officials project slower pace of rate reductions ahead',
    content: `The Federal Reserve's closely watched "dot plot" of individual officials' expectations indicated just one rate cut in 2026 and another in 2027 before the federal funds rate hits a longer-run target around 3%.

This represents a more hawkish outlook than markets had anticipated, contributing to volatility in both equity and cryptocurrency markets.

The projections reflect the Fed's data-dependent approach, with Chair Powell noting that additional cuts will be harder to justify given current economic conditions.

The outlook contributed to the first 9-3 split vote in six years, with three dissenters reflecting divided views on the appropriate pace of monetary policy normalization.`,
    category: 'economy',
    source: 'Federal Reserve',
    sourceUrl: 'https://federalreserve.gov',
    imageUrl: 'https://picsum.photos/id/1068/800/450',
    publishedAt: hoursAgo(26),
    sentiment: 'neutral',
  },
  {
    id: 'news-28',
    title: 'Malaysia Sees Strong Foreign Investment in Tech Sector',
    summary: 'Data center wave drives optimism for KLCI heavyweights',
    content: `Malaysia continues to attract strong foreign investment, particularly in the technology and data center sectors. Analysts note the country is benefiting significantly from the "China plus one" strategy as companies diversify supply chains.

Key index heavyweights CIMB, Genting, Public Bank, Sime Darby, IWCity, and Unisem are expected to attract bargain hunters according to market analysts.

The FBM KLCI reached 1,644.00 Index Points, the highest since October 2024. Basic materials stocks led gains while healthcare emerged as the top-performing sector.

Corporate activity remains robust, with notable deals including Kerjaya Prospek's RM225.0mn construction contract and Khee San's successful RM77.1mn rights issue.`,
    category: 'market',
    source: 'i3investor',
    sourceUrl: 'https://i3investor.com',
    imageUrl: 'https://picsum.photos/id/96/800/450',
    publishedAt: hoursAgo(27),
    relatedStocks: ['CIMB', 'GENTING', 'PBBANK'],
    sentiment: 'bullish',
  },
  {
    id: 'news-29',
    title: 'Global Oil Inventories Expected to Rise Through 2026',
    summary: 'EIA forecast puts downward pressure on crude prices',
    content: `The U.S. Energy Information Administration expects global oil inventories to continue to rise through 2026, putting downward pressure on oil prices.

They forecast Brent crude oil price will fall to an average of $55 per barrel in the first quarter of 2026 and remain near that price for the rest of next year.

OPEC+ faces challenges as it steadily restores shut-in capacity while non-OPEC producers ramp up output. Early signs of demand weakness are emerging across China, the Middle East, and the US.

The oversupply concerns have driven WTI crude to near five-year lows, with year-to-date losses of around 22%.`,
    category: 'economy',
    source: 'U.S. EIA',
    sourceUrl: 'https://eia.gov',
    imageUrl: 'https://picsum.photos/id/1020/800/450',
    publishedAt: hoursAgo(28),
    sentiment: 'bearish',
  },
  {
    id: 'news-30',
    title: 'Crypto Year-End Rally Hopes Fade',
    summary: 'Analysts see "late-year digestion" rather than structural shift',
    content: `As chances for a year-end crypto rally appear to be slipping away, investors are reducing their risk exposure. However, the selling has remained orderly.

Wintermute OTC trader Jasper De Maere noted: "This still looks more like late-year digestion than a structural regime shift."

Bitcoin remains rangebound between $80,000 and $94,000, while altcoins have underperformed significantly. US spot Bitcoin and Ethereum ETFs continue to see outflows.

The market awaits clarity on Federal Reserve policy direction and potential regulatory developments in the new year that could catalyze the next major crypto move.`,
    category: 'crypto',
    source: 'Decrypt',
    sourceUrl: 'https://decrypt.co',
    imageUrl: 'https://picsum.photos/id/28/800/450',
    publishedAt: hoursAgo(29),
    sentiment: 'neutral',
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
