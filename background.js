//ensure we only display popup in the tab with the game running
chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {urlMatches: 'bondageprojects.*\.com\/.*'},  
            })
            ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});