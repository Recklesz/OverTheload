console.log('Content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === "getText") {
        try {
            // Get all text content from the page
            const pageText = extractPageText();
            console.log('Extracted text length:', pageText.length);
            sendResponse({ text: pageText });
        } catch (error) {
            console.error('Error extracting text:', error);
            sendResponse({ error: error.message });
        }
    }
    return true; // Keep the message channel open
});

function extractPageText() {
    // Get all text content from the page
    const allText = [];
    
    // Get the post title (try multiple selectors)
    const titleSelectors = ['h1', '[data-testid="post-title"]', '.Post__title'];
    for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement) {
            allText.push(titleElement.textContent.trim());
            break;
        }
    }

    // Get all comments (try multiple selectors)
    const commentSelectors = [
        '[data-testid="comment"] p',
        '.Comment__body p',
        '[data-test-id="comment-content"]'
    ];
    
    for (const selector of commentSelectors) {
        const comments = Array.from(document.querySelectorAll(selector))
            .map(comment => comment.textContent.trim())
            .filter(text => text.length > 0);
        
        if (comments.length > 0) {
            allText.push(...comments);
            break;
        }
    }

    // Get the post content (try multiple selectors)
    const contentSelectors = [
        '[data-test-id="post-content"]',
        '.Post__content',
        '[data-click-id="text"]'
    ];
    
    for (const selector of contentSelectors) {
        const contentElement = document.querySelector(selector);
        if (contentElement) {
            allText.push(contentElement.textContent.trim());
            break;
        }
    }

    // If we couldn't get text through specific selectors, get all visible text
    if (allText.length === 0) {
        const bodyText = document.body.innerText;
        allText.push(bodyText);
    }

    return allText.join('\n\n');
}
