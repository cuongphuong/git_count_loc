/* global chrome */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });

  if (message.from === "github") {
    chrome.browserAction.setBadgeText({
      tabId: sender.tab.id,
      text: message.badgeText,
    }, () => chrome.runtime.lastError);
  }

  if (message.from === "gitlab") {
    chrome.browserAction.setBadgeText({
      tabId: sender.tab.id,
      text: message.badgeText,
    }, () => chrome.runtime.lastError);
  }
});