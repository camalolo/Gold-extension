// Function to update the badge with price text
function updateBadge(priceText) {
  console.log('updateBadge called with priceText:', priceText);
  try {
    // Shorten price to fit badge (max 4 characters)
    let shortPrice;
    if (priceText === 'Error') {
      shortPrice = 'Err';
    } else {
      const numberPrice = Number.parseFloat(priceText);
      const abbreviation = chrome.storage.local.get('abbreviation').then(result => result.abbreviation || false);
      return abbreviation.then(abbrev => {
        shortPrice = (abbrev && numberPrice >= 1000) ? (numberPrice / 1000).toFixed(1) + 'k' : numberPrice.toFixed(0);
        shortPrice = shortPrice.slice(0, 4); // Ensure it fits (e.g., "1234" or "1.2k")
        chrome.action.setBadgeText({ text: shortPrice });
        chrome.action.setBadgeBackgroundColor({ color: '#222222' }); // Dark grey
        console.log('Badge updated with:', shortPrice);
      });
    }

    // Handle non-numeric cases immediately
    if (shortPrice) {
      chrome.action.setBadgeText({ text: shortPrice });
      chrome.action.setBadgeBackgroundColor({ color: '#222222' }); // Dark grey
      console.log('Badge updated with:', shortPrice);
    }
  } catch (error) {
    console.error('Error updating badge:', error);
    chrome.action.setBadgeText({ text: 'Err' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); // Red for error
  }
}

async function fetchWithRetry(url, options = {}, maxRetries = 6, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
    }
  }
}

async function fetchGoldPrice(forceUpdate = false) {
  console.log('fetchGoldPrice called');
  chrome.storage.local.get(['price', 'lastUpdate'], async (result) => {
    console.log('Storage data retrieved:', result);
    
    const now = Date.now();
    const lastUpdate = result.lastUpdate || 0;
    console.log('Current time:', now, 'Last update:', lastUpdate);

    if ((now - lastUpdate > 30 * 60 * 1000) || forceUpdate) {
      console.log('Fetching new price from API');
      try {
        const response = await fetchWithRetry('https://api.gold-api.com/price/XAU');
        console.log('API response status:', response.status);
        const data = await response.json();
        console.log('API response data:', data);
        const newPrice = data.price;
        console.log('New price:', newPrice);
        chrome.storage.local.set({ price: newPrice, lastUpdate: now }, () => {
          console.log('Price and lastUpdate saved to storage');
        });
        updateBadge(newPrice);
      } catch (error) {
        console.error('Fetch error:', error);
        updateBadge('Error');
      }
    } else if (result.price) {
      console.log('Using cached price:', result.price);
      updateBadge(result.price);
    } else {
      console.log('No cached price available');
      updateBadge('Error');
    }
  });
}

// Add click listener to refresh price
chrome.action.onClicked.addListener(() => {
  console.log('Icon clicked, refreshing gold price');
  fetchGoldPrice(true);
});

// Initial fetch when the extension loads
console.log('Extension loaded, initiating first fetch');
fetchGoldPrice();

// Schedule periodic updates
console.log('Creating alarm for periodic updates');
chrome.alarms.create('updateGoldPrice', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);
  if (alarm.name === 'updateGoldPrice') {
    fetchGoldPrice();
  }
});