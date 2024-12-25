// Background service worker
console.log('Service Worker Initialized');

// Message handling
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "getText") {
      chrome.tabs.sendMessage(
        sender.tab.id,
        request,
        function(response) {
          sendResponse(response);
        }
      );
      return true;  // Will respond asynchronously
    }
  }
);
