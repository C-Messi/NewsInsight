const WIDGET_ID = "truth-widget-root";

const buildPageInfo = () => {
  const title = document.title || "";
  const description =
    document.querySelector('meta[name="description"]')?.getAttribute("content") ||
    "";
  const keywords =
    document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
  const bodyText = document.body?.innerText || "";
  const snippet = bodyText.replace(/\s+/g, " ").trim().slice(0, 500);
  return { title, description, keywords, snippet };
};

const ensureWidgetRoot = () => {
  if (document.getElementById(WIDGET_ID)) {
    return null;
  }
  const root = document.createElement("div");
  root.id = WIDGET_ID;
  document.body.appendChild(root);
  return root;
};

const createWidget = () => {
  const root = ensureWidgetRoot();
  if (!root) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "truth-widget";

  const header = document.createElement("div");
  header.className = "truth-header";

  const title = document.createElement("div");
  title.className = "truth-title";
  title.textContent = "Truth Markets";

  const controls = document.createElement("div");
  controls.className = "truth-controls";

  const refreshButton = document.createElement("button");
  refreshButton.className = "truth-button";
  refreshButton.textContent = "Refresh";

  const toggleButton = document.createElement("button");
  toggleButton.className = "truth-button";
  toggleButton.textContent = "Collapse";

  controls.append(refreshButton, toggleButton);
  header.append(title, controls);

  const body = document.createElement("div");
  body.className = "truth-body";

  const status = document.createElement("div");
  status.className = "truth-status";
  status.textContent = "Ready to search markets.";

  const list = document.createElement("div");
  list.className = "truth-list";

  body.append(status, list);
  wrapper.append(header, body);
  root.appendChild(wrapper);

  let collapsed = false;

  const setStatus = (text) => {
    status.textContent = text;
  };

  const clearList = () => {
    list.innerHTML = "";
  };

  const formatOutcomePrice = (label, value) => {
    const price = Number(value);
    if (Number.isNaN(price)) {
      return `${label}: —`;
    }
    const percent = Math.max(0, Math.min(100, price * 100));
    return `${label}: ${price.toFixed(2)} (${percent.toFixed(0)}%)`;
  };

  const getYesNoPrices = (outcomes, prices) => {
    if (!outcomes.length || !prices.length) {
      return null;
    }
    const normalized = outcomes.map((outcome) => outcome.toLowerCase());
    const yesIndex = normalized.indexOf("yes");
    const noIndex = normalized.indexOf("no");
    if (yesIndex !== -1 && noIndex !== -1) {
      return { yes: prices[yesIndex], no: prices[noIndex] };
    }
    if (prices.length >= 2) {
      return { yes: prices[0], no: prices[1] };
    }
    return null;
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

  const renderBar = (market) => {
    const bar = document.createElement("div");
    bar.className = "truth-bar";

    const yes = document.createElement("div");
    yes.className = "truth-bar-yes";
    yes.style.width = `${getYesPercent(market)}%`;

    const no = document.createElement("div");
    no.className = "truth-bar-no";
    no.style.width = `${100 - getYesPercent(market)}%`;

    bar.append(yes, no);
    return bar;
  };

  const renderMarkets = (markets) => {
    clearList();
    if (!markets.length) {
      setStatus("No related markets found.");
      return;
    }

    markets.forEach((market) => {
      const item = document.createElement("div");
      item.className = "truth-item";

      const itemTitle = document.createElement("p");
      itemTitle.className = "truth-item-title";
      itemTitle.textContent = market.question || "Untitled market";

      const outcomes = Array.isArray(market.outcomes) ? market.outcomes : [];
      const prices = Array.isArray(market.outcomePrices)
        ? market.outcomePrices
        : [];
      const yesNo = getYesNoPrices(outcomes, prices);
      const meta = document.createElement("p");
      meta.className = "truth-item-meta";
      if (yesNo) {
        meta.textContent = `${formatOutcomePrice("Yes", yesNo.yes)} · ${formatOutcomePrice(
          "No",
          yesNo.no
        )}`;
      } else {
        meta.textContent = "No price data.";
      }

      item.append(itemTitle, meta, renderBar(market));
      list.appendChild(item);
    });
  };

  const fetchMarkets = () => {
    const pageInfo = buildPageInfo();
    setStatus("Searching Polymarket...");
    clearList();

    chrome.runtime.sendMessage(
      { type: "SEARCH_MARKETS", payload: { pageInfo } },
      (response) => {
        if (chrome.runtime.lastError) {
          setStatus("Background service not available.");
          return;
        }
        if (!response?.ok) {
          setStatus(response?.error || "Search failed.");
          return;
        }
        renderMarkets(response.data.markets || []);
        if (response.data.terms?.length) {
          setStatus(`Matched terms: ${response.data.terms.join(", ")}`);
        } else {
          setStatus("Showing latest active markets.");
        }
      }
    );
  };

  refreshButton.addEventListener("click", fetchMarkets);
  toggleButton.addEventListener("click", () => {
    collapsed = !collapsed;
    wrapper.classList.toggle("truth-collapsed", collapsed);
    toggleButton.textContent = collapsed ? "Expand" : "Collapse";
  });

  fetchMarkets();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createWidget);
} else {
  createWidget();
}
