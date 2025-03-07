// background.js
async function updateIcon(priceText) {
  console.log('updateIcon called with priceText:', priceText);
  try {
    const canvasSize = 48;
    const canvas = new OffscreenCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // Fetch and draw the base icon
    console.log('Fetching base icon from:', chrome.runtime.getURL('icon48.png'));
    const response = await fetch(chrome.runtime.getURL('icon48.png'));
    if (!response.ok) throw new Error('Failed to load base icon');
    const blob = await response.blob();
    console.log('Base icon blob loaded successfully');
    const bitmap = await createImageBitmap(blob);
    console.log('Image bitmap created');
    ctx.drawImage(bitmap, 0, 0, canvasSize, canvasSize);
    console.log('Base icon drawn on canvas');

    // Shorten price to fit
    const shortPrice = priceText === 'Error' || priceText === 'No Key'
      ? priceText
      : parseFloat(priceText).toFixed(0);
    console.log('Drawing price text:', shortPrice);

    // Dynamically scale font to maximize width
    let fontSize = 20; // Start with a larger size
    ctx.font = `bold ${fontSize}px Arial`;
    let textWidth = ctx.measureText(shortPrice).width;
    const maxWidth = canvasSize; // Target width (canvasSizepx canvas - 2px margin on each side)

    while (textWidth > maxWidth && fontSize > 8) { // Minimum size of 8px
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px Arial`;
      textWidth = ctx.measureText(shortPrice).width;
    }
    console.log(`Adjusted font size to ${fontSize}px, text width: ${textWidth}px`);

    // Calculate dimensions for the background rectangle
    const textHeight = fontSize; // Approximate height based on font size
    const padding = 2; // Padding around text
    const rectWidth = textWidth + padding * 2;
    const rectHeight = textHeight + padding * 2;
    const rectX = (canvasSize - rectWidth) / 2; // Center horizontally
    const rectY = canvasSize - rectHeight; // Position at bottom with 2px margin
    const cornerRadius = 4; // Rounded corner radius

    // Draw black background with rounded corners
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
    ctx.fill();
    console.log('Black background drawn at:', { x: rectX, y: rectY, width: rectWidth, height: rectHeight });

    // Draw the price text in white
    ctx.fillStyle = 'white'; // Text color
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textX = canvasSize / 2; // Center of the canvas
    const textY = rectY + rectHeight / 2; // Center of the rectangle
    ctx.fillText(shortPrice, textX, textY);
    console.log('White text drawn at:', { x: textX, y: textY });

    // Update the icon
    const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
    console.log('Updating icon with new image data');
    chrome.action.setIcon({ imageData: imageData });
    console.log('Icon updated successfully');
  } catch (error) {
    console.error('Error updating icon:', error);
    const canvas = new OffscreenCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Err', canvasSize / 2, canvasSize / 2);
    chrome.action.setIcon({ imageData: ctx.getImageData(0, 0, canvasSize, canvasSize) });
    console.log('Fallback error icon set');
  }
}

function fetchGoldPrice(forceUpdate = false) {
  console.log('fetchGoldPrice called');
  chrome.storage.local.get(['apiKey', 'price', 'lastUpdate'], (result) => {
    console.log('Storage data retrieved:', result);
    if (!result.apiKey) {
      console.log('No API key found');
      updateIcon('No Key');
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
          updateIcon(newPrice);
        })
        .catch(error => {
          if (error instanceof TypeError) {
            console.error('Fetch error: Failed to fetch. Retrying in 30 seconds');
            setTimeout(fetchGoldPrice, 30000);
          } else {
            console.error('Fetch error:', error);
            updateIcon('Error');
          }
        });
    } else if (result.price) {
      console.log('Using cached price:', result.price);
      updateIcon(result.price); // Use cached price
    } else {
      console.log('No cached price available');
      updateIcon('No Data');
    }
  });
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