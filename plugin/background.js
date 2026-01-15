import { searchMarkets } from "./api/polymarket.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SEARCH_MARKETS") {
    return;
  }

  searchMarkets(message.payload)
    .then((result) => {
      console.log("Matched events from Polymarket:", result.events);
      sendResponse({ ok: true, data: result });
    })
    .catch((error) => {
      sendResponse({ ok: false, error: error?.message || "Unknown error" });
    });

  return true;
});
