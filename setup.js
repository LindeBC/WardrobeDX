//add listener for getting outfit data and sending it to popup
window.addEventListener("message", function(event) {
    chrome.runtime.sendMessage({
        type: event.data.type,
        outfit: event.data.outfit,
        name: event.data.name
    });
});
