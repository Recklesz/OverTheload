document.addEventListener('DOMContentLoaded', function() {
    const scanButton = document.getElementById('scanButton');
    const scanButtonText = document.getElementById('scanButtonText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    const copyAllButton = document.getElementById('copyAllButton');

    // Hide results initially
    resultsDiv.style.display = 'none';

    // Use the Replit deployment URL
    const API_URL = 'https://music-miner-ivelin3.replit.app/api/extract';

    scanButton.addEventListener('click', async () => {
        try {
            setLoading(true);
            hideError();
            console.log('Starting scan...');

            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Got active tab:', tab.url);

            // Execute content script to get page text
            const response = await chrome.tabs.sendMessage(tab.id, { action: "getText" });
            console.log('Got text from page, length:', response?.text?.length);

            if (!response || !response.text) {
                throw new Error('Failed to extract text from page');
            }

            // Send to backend
            console.log('Sending to backend...');
            const results = await processText(response.text);
            console.log('Got results from backend:', results);
            
            displayResults(results);
            setLoading(false);

        } catch (error) {
            console.error('Error:', error);
            showError('Failed to scan page. Please try again.');
            setLoading(false);
        }
    });

    async function processText(text) {
        try {
            console.log('Making API request to:', API_URL);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            console.log('API response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API error data:', errorData);
                throw new Error(errorData.error || 'Backend processing failed');
            }

            const data = await response.json();
            console.log('API response data:', data);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Failed to process text. Please try again.');
        }
    }

    function displayResults(results) {
        console.log('Displaying results:', results);
        const lists = {
            artists: document.getElementById('artistsList'),
            songs: document.getElementById('songsList'),
            albums: document.getElementById('albumsList')
        };

        // Clear previous results
        Object.values(lists).forEach(list => {
            console.log('Clearing list:', list.id);
            list.innerHTML = '';
        });

        // Check if we have any results
        const hasResults = Object.values(results).some(arr => arr.length > 0);
        console.log('Has results:', hasResults);

        if (!hasResults) {
            console.log('No results found, showing error');
            showError('No music mentions found on this page.');
            resultsDiv.style.display = 'none';
            return;
        }

        // Show results div and hide error
        console.log('Showing results div');
        errorDiv.classList.add('d-none');
        resultsDiv.style.display = 'block';

        // Populate lists
        Object.entries(results).forEach(([category, items]) => {
            console.log(`Populating ${category} with:`, items);
            const list = lists[category];
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = item;
                list.appendChild(li);
                console.log(`Added item to ${category}:`, item);
            });
        });
    }

    function setLoading(loading) {
        scanButton.disabled = loading;
        scanButtonText.textContent = loading ? 'Scanning...' : 'Scan Page';
        loadingSpinner.classList.toggle('d-none', !loading);
        if (loading) {
            resultsDiv.style.display = 'none';
        }
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
        resultsDiv.style.display = 'none';
    }

    function hideError() {
        errorDiv.classList.add('d-none');
    }

    // Setup copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const listId = btn.getAttribute('data-target');
            const list = document.getElementById(listId);
            const text = Array.from(list.children)
                .map(item => item.textContent)
                .join('\n');
            copyToClipboard(text);
        });
    });

    // Copy all results
    copyAllButton.addEventListener('click', () => {
        const allLists = ['artistsList', 'songsList', 'albumsList'];
        const text = allLists
            .map(listId => {
                const list = document.getElementById(listId);
                const items = Array.from(list.children)
                    .map(item => item.textContent)
                    .join('\n');
                return `${listId.replace('List', '').toUpperCase()}:\n${items}`;
            })
            .join('\n\n');
        copyToClipboard(text);
    });

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }
});