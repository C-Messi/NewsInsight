const API_BASE = "https://gamma-api.polymarket.com";

const sanitizeTerms = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s,.-]/g, " ")
    .split(/[\s,.-]+/)
    .filter((term) => term.length >= 3);

const dedupe = (items) => Array.from(new Set(items));

const buildSearchTerms = ({ title = "", description = "", keywords = "" }) => {
  const keywordTerms = keywords ? keywords.split(",") : [];
  const combined = [title, description, ...keywordTerms].join(" ");
  const terms = sanitizeTerms(combined);
  return dedupe(terms).slice(0, 8);
};

const flattenMarkets = (events = []) => {
  const markets = [];
  for (const event of events) {
    if (!Array.isArray(event?.markets)) {
      continue;
    }
    for (const market of event.markets) {
      const outcomes = normalizeArrayField(market.outcomes);
      const outcomePrices = normalizeArrayField(market.outcomePrices);
      markets.push({
        id: market.id ?? market.slug ?? market.question,
        question: market.question || market.title || event.title || "Untitled",
        outcomes,
        outcomePrices,
        closed: Boolean(market.closed),
        endDate: market.endDate || market.closeTime || event.endDate || "",
        liquidity: market.liquidity ?? market.liquidityNum ?? null,
        volume: market.volume ?? market.volumeNum ?? null,
        volume24hr: market.volume24hr ?? market.volume24hrNum ?? null
      });
    }
  }
  return markets;
};

const normalizeArrayField = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const scoreMarket = (market, terms) => {
  if (!terms.length) {
    return 0;
  }
  const haystack = market.question.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) {
      score += 1;
    }
  }
  return score;
};

export const searchMarkets = async ({ pageInfo, limit = 10 }) => {
  const terms = buildSearchTerms(pageInfo || {});
  const url = new URL(`${API_BASE}/events`);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("limit", "50");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Gamma API error: ${response.status}`);
  }

  const events = await response.json();
  const normalizedEvents = Array.isArray(events) ? events : [];
  const markets = flattenMarkets(normalizedEvents);
  const scored = markets
    .map((market) => ({ market, score: scoreMarket(market, terms) }))
    .filter(({ score }) => score > 0 || terms.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ market }) => market);

  const scoredIds = new Set(scored.map((market) => market.id));
  const matchedEvents = normalizedEvents.filter((event) =>
    Array.isArray(event?.markets)
      ? event.markets.some((market) =>
          scoredIds.has(market.id ?? market.slug ?? market.question)
        )
      : false
  );

  return { terms, markets: scored, events: matchedEvents };
};
