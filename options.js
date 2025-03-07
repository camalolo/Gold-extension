// options.js content
document.addEventListener('DOMContentLoaded', function () {
  const saveButton = document.getElementById('save-api-key');
  const apiKeyInput = document.getElementById('api-key');

  saveButton.addEventListener('click', function () {
    const apiKey = apiKeyInput.value;
    chrome.storage.local.set({ apiKey: apiKey }, function () {
      console.log('API key saved');
    });
  });

  chrome.storage.local.get('apiKey', function (result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });
});