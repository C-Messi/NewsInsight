const extractPageInfo = () => {
  const title = document.title || "";
  const description =
    document.querySelector('meta[name="description"]')?.getAttribute("content") ||
    "";
  const keywords =
    document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
  const bodyText = document.body?.innerText || "";
  const snippet = bodyText.replace(/\s+/g, " ").trim().slice(0, 500);

  return {
    title,
    description,
    keywords,
    snippet
  };
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "GET_PAGE_INFO") {
    return;
  }

  sendResponse({ ok: true, data: extractPageInfo() });
});
