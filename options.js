// options.js content
document.addEventListener('DOMContentLoaded', function () {
  const saveButton = document.getElementById('save-api-key');
  const apiKeyInput = document.getElementById('api-key');
  const abbrevCheckbox = document.getElementById('abbrev-numbers');

  saveButton.addEventListener('click', function () {
    const apiKey = apiKeyInput.value;
    const abbreviation = abbrevCheckbox.checked;
    chrome.storage.local.set({ apiKey: apiKey, abbreviation: abbreviation }, function () {
      console.log('API key and abbreviation saved');
    });
  });

  chrome.storage.local.get(['apiKey', 'abbreviation'], function (result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.abbreviation !== undefined) {
      abbrevCheckbox.checked = result.abbreviation;
    }
  });
});