// Keyword heuristic: the activity feed carries no category, so titles are bucketed.
const RULES = [
  ['Sports', /\b(nba|nfl|mlb|nhl|ufc|mma|fifa|uefa|premier league|la liga|serie a|bundesliga|champions league|world cup|super bowl|stanley cup|world series|grand slam|wimbledon|us open|atp|wta|f1|formula 1|grand prix|nascar|pga|golf|boxing|tennis|soccer|football|basketball|baseball|hockey|cricket|ipl|vs\.?|match|game \d|o\/u|spread|playoffs?|finals?|mvp|esports?|lol|cs2|dota|valorant)\b/i],
  ['Crypto', /\b(bitcoin|btc|ethereum|eth|solana|sol|xrp|doge|dogecoin|crypto|token|airdrop|fdv|memecoin|binance|coinbase|stablecoin|usdt|usdc|etf flows?|microstrategy|up or down)\b/i],
  ['Politics', /\b(election|elected|president|presidential|senate|congress|house|governor|mayor|parliament|prime minister|trump|biden|harris|vance|newsom|democrat|republican|gop|primary|nominee|cabinet|impeach|supreme court|scotus|poll|vote|referendum|tariffs?|executive order|white house|minister)\b/i],
  ['Geopolitics', /\b(war|ceasefire|invade|invasion|russia|ukraine|israel|gaza|iran|china|taiwan|nato|putin|zelensky|netanyahu|hamas|hezbollah|missile|strike|sanctions|north korea|military)\b/i],
  ['Economy', /\b(fed|fomc|interest rates?|rate cut|rate hike|bps|inflation|cpi|gdp|recession|unemployment|jobs report|nfp|treasury|yield|s&p|nasdaq|dow|stock|ipo|earnings|market cap|tesla|nvidia|apple|oil|gold)\b/i],
  ['Tech & AI', /\b(ai|openai|chatgpt|gpt-?\d|claude|anthropic|gemini|grok|xai|llm|spacex|starship|launch|apple event|iphone|google|meta|microsoft|deepmind)\b/i],
  ['Culture', /\b(oscars?|grammys?|emmys?|golden globes?|box office|movie|film|album|song|billboard|spotify|taylor swift|kanye|drake|mrbeast|youtube|tiktok|twitter|tweets?|elon musk|celebrity|wedding|pregnant|time person of the year|eurovision)\b/i],
  ['Weather & Science', /\b(temperature|weather|hurricane|earthquake|rain|snow|heat|climate|nasa|asteroid|pandemic|covid|measles|bird flu|h5n1)\b/i],
];

export function categorize(title = '', slug = '') {
  const text = `${title} ${slug.replace(/-/g, ' ')}`;
  for (const [name, re] of RULES) if (re.test(text)) return name;
  return 'Other';
}
