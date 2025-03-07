// Function to update the badge with price text
function updateBadge(priceText) {
  console.log('updateBadge called with priceText:', priceText);
  try {
    // Shorten price to fit badge (max 4 characters)
    let shortPrice;
    if (priceText === 'Error' || priceText === 'No Key') {
      shortPrice = priceText.slice(0, 4); // "Erro" or "No K"
    } else {
      const numPrice = parseFloat(priceText);
      const abbreviation = chrome.storage.local.get('abbreviation').then(result => result.abbreviation || false);
      return abbreviation.then(abbrev => {
        if (abbrev && numPrice >= 1000) {
          shortPrice = (numPrice / 1000).toFixed(1) + 'k'; // e.g., "1.2k"
        } else {
          shortPrice = numPrice.toFixed(0); // e.g., "1234"
        }
        shortPrice = shortPrice.slice(0, 4); // Ensure it fits (e.g., "1234" or "1.2k")
        chrome.action.setBadgeText({ text: shortPrice });
        chrome.action.setBadgeBackgroundColor({ color: '#222222' }); // Dark grey
        console.log('Badge updated with:', shortPrice);
      });
    }

    // Handle non-numeric cases immediately
    shortPrice = shortPrice.slice(0, 4);
    chrome.action.setBadgeText({ text: shortPrice });
    chrome.action.setBadgeBackgroundColor({ color: '#222222' }); // Dark grey
    console.log('Badge updated with:', shortPrice);
  } catch (error) {
    console.error('Error updating badge:', error);
    chrome.action.setBadgeText({ text: 'Err' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); // Red for error
  }
}

// Function to fetch gold price and update badge
function fetchGoldPrice(forceUpdate = false) {
  console.log('fetchGoldPrice called');
  chrome.storage.local.get(['apiKey', 'price', 'lastUpdate'], (result) => {
    console.log('Storage data retrieved:', result);
    if (!result.apiKey) {
      console.log('No API key found');
      updateBadge('No Key');
      return;
    }

    const apiKey = result.apiKey;
    const url = 'https://www.goldapi.io/api/XAU/USD';
    const now = Date.now();
    const lastUpdate = result.lastUpdate || 0;
    console.log('Current time:', now, 'Last update:', lastUpdate);

    if ((now - lastUpdate > 30 * 60 * 1000) || forceUpdate) { // Update every 30 minutes
      console.log('Fetching new price from API');
      fetch(url, {
        mode: 'cors',
        headers: { 'x-access-token': apiKey }
      })
        .then(response => {
          console.log('API response status:', response.status);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(data => {
          console.log('API response data:', data);
          const newPrice = data.price;
          console.log('New price:', newPrice);
          chrome.storage.local.set({ price: newPrice, lastUpdate: now }, () => {
            console.log('Price and lastUpdate saved to storage');
          });
          updateBadge(newPrice);
        })
        .catch(error => {
          if (error instanceof TypeError) {
            console.error('Fetch error: Failed to fetch. Retrying in 30 seconds');
            setTimeout(fetchGoldPrice, 30000);
          } else {
            console.error('Fetch error:', error);
            updateBadge('Error');
          }
        });
    } else if (result.price) {
      console.log('Using cached price:', result.price);
      updateBadge(result.price); // Use cached price
    } else {
      console.log('No cached price available');
      updateBadge('No Data');
    }
  });

  // Add click listener to refresh price
  chrome.action.onClicked.addListener(() => {
    console.log('Icon clicked, refreshing gold price');
    fetchGoldPrice(true);
  });
}

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