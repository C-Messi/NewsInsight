const statusEl = document.getElementById("status");
const refreshButton = document.getElementById("refreshButton");
const pageTitleEl = document.getElementById("pageTitle");
const pageDescriptionEl = document.getElementById("pageDescription");
const pageKeywordsEl = document.getElementById("pageKeywords");
const pageSnippetEl = document.getElementById("pageSnippet");
const searchButton = document.getElementById("searchButton");
const marketStatusEl = document.getElementById("marketStatus");
const marketListEl = document.getElementById("marketList");

let latestPageInfo = null;

const setStatus = (text) => {
  statusEl.textContent = text;
};

const setValue = (el, value) => {
  el.textContent = value && value.trim() ? value : "—";
};

const setMarketStatus = (text) => {
  marketStatusEl.textContent = text;
};

const clearMarkets = () => {
  marketListEl.innerHTML = "";
};

const renderMarkets = (markets) => {
  clearMarkets();
  if (!markets.length) {
    setMarketStatus("No related markets found.");
    return;
  }

  for (const market of markets) {
    const item = document.createElement("div");
    item.className = "market-item";

    const title = document.createElement("p");
    title.className = "market-title";
    title.textContent = market.question || "Untitled market";

    const meta = document.createElement("p");
    meta.className = "market-meta";
    meta.textContent = formatMarketMeta(market);

    const bar = renderOutcomeBar(market);
    const details = document.createElement("p");
    details.className = "market-details";
    details.textContent = formatMarketDetails(market);

    item.append(title, meta, bar, details);
    marketListEl.appendChild(item);
  }
};

const formatMarketMeta = (market) => {
  const status = market.closed ? "Closed" : "Open";
  const prices = Array.isArray(market.outcomePrices)
    ? market.outcomePrices
    : [];
  const outcomes = Array.isArray(market.outcomes) ? market.outcomes : [];
  const yesNo = getYesNoPrices(outcomes, prices);
  if (yesNo) {
    const yesText = formatOutcomePrice("Yes", yesNo.yes);
    const noText = formatOutcomePrice("No", yesNo.no);
    return `${status} | ${yesText} · ${noText}`;
  }

  const pricePairs = outcomes.map((outcome, index) => {
    const price = prices[index];
    if (price === undefined) {
      return outcome;
    }
    return formatOutcomePrice(outcome, price);
  });
  return `${status} | ${pricePairs.join(" · ")}`;
};

const renderOutcomeBar = (market) => {
  const bar = document.createElement("div");
  bar.className = "market-bar";

  const yesFill = document.createElement("div");
  yesFill.className = "market-bar-fill market-bar-yes";
  yesFill.style.width = `${getYesPercent(market)}%`;

  const noFill = document.createElement("div");
  noFill.className = "market-bar-fill market-bar-no";
  noFill.style.width = `${100 - getYesPercent(market)}%`;

  bar.append(yesFill, noFill);
  return bar;
};

const getYesNoPrices = (outcomes, prices) => {
  if (!outcomes.length || !prices.length) {
    return null;
  }

  const normalized = outcomes.map((outcome) => outcome.toLowerCase());
  const yesIndex = normalized.indexOf("yes");
  const noIndex = normalized.indexOf("no");

  if (yesIndex !== -1 && noIndex !== -1) {
    return {
      yes: prices[yesIndex],
      no: prices[noIndex]
    };
  }

  if (prices.length >= 2) {
    return {
      yes: prices[0],
      no: prices[1]
    };
  }

  return null;
};

const formatOutcomePrice = (label, value) => {
  const price = Number(value);
  if (Number.isNaN(price)) {
    return `${label}: —`;
  }
  const percent = Math.max(0, Math.min(100, price * 100));
  return `${label}: ${price.toFixed(2)} (${percent.toFixed(0)}%)`;
};

const getYesPercent = (market) => {
  const prices = Array.isArray(market.outcomePrices)
    ? market.outcomePrices.map((price) => Number(price))
    : [];
  if (prices.length < 2 || Number.isNaN(prices[0])) {
    return 50;
  }
  const yes = prices[0];
  const total = prices.reduce((sum, value) => sum + (Number(value) || 0), 0);
  if (!total) {
    return Math.max(0, Math.min(100, yes * 100));
  }
  return Math.max(0, Math.min(100, (yes / total) * 100));
};

const formatMarketDetails = (market) => {
  const parts = [];
  if (market.liquidity !== null && market.liquidity !== undefined) {
    parts.push(`Liquidity: ${formatNumber(market.liquidity)}`);
  }
  if (market.volume !== null && market.volume !== undefined) {
    parts.push(`Volume: ${formatNumber(market.volume)}`);
  }
  if (market.volume24hr !== null && market.volume24hr !== undefined) {
    parts.push(`24h: ${formatNumber(market.volume24hr)}`);
  }
  if (market.endDate) {
    const formatted = formatDate(market.endDate);
    parts.push(`Ends: ${formatted}`);
  }
  return parts.length ? parts.join(" | ") : "No extra stats available.";
};

const formatNumber = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return value;
  }
  return number.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const requestPageInfo = async () => {
  setStatus("Capturing page info...");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("No active tab found.");
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_INFO" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus("Content script not available on this page.");
      return;
    }

    if (!response?.ok) {
      setStatus("Failed to capture page info.");
      return;
    }

    const { title, description, keywords, snippet } = response.data;
    latestPageInfo = { title, description, keywords, snippet };
    setValue(pageTitleEl, title);
    setValue(pageDescriptionEl, description);
    setValue(pageKeywordsEl, keywords);
    setValue(pageSnippetEl, snippet);
    setStatus("Capture complete.");
  });
};

const requestMarkets = () => {
  if (!latestPageInfo) {
    setMarketStatus("Capture page info first.");
    return;
  }

  setMarketStatus("Searching Polymarket...");
  clearMarkets();

  chrome.runtime.sendMessage(
    { type: "SEARCH_MARKETS", payload: { pageInfo: latestPageInfo } },
    (response) => {
      if (chrome.runtime.lastError) {
        setMarketStatus("Background service not available.");
        return;
      }
      if (!response?.ok) {
        setMarketStatus(response?.error || "Search failed.");
        return;
      }

      renderMarkets(response.data.markets || []);
      if (response.data.terms?.length) {
        setMarketStatus(`Matched terms: ${response.data.terms.join(", ")}`);
      } else {
        setMarketStatus("Showing latest active markets.");
      }
    }
  );
};

refreshButton.addEventListener("click", requestPageInfo);
searchButton.addEventListener("click", requestMarkets);

requestPageInfo();
