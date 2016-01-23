var views = chrome.extension.getViews();
var isAttacking = false;
var isFarming = false;

chrome.extension.onMessage.addListener(function(message,sender,sendResponse){
  if (message.text == "getData") {
    sendResponse({attacking:isAttacking, farming:isFarming});
  } else if (message.text == "setData") {
		isAttacking = message.value;
		isFarming = message.farming;
		sendResponse(null);
  } else if (message.text == "showAction") {
		chrome.pageAction.show(sender.tab.id);
		sendResponse(null);
	}
});

chrome.pageAction.onClicked.addListener(function(tab){
	if (isFarming) {
		isFarming = false;
		chrome.pageAction.setTitle({tabId:tab.id, title:'Enable Tribal Wars Farmer'});
		chrome.tabs.sendMessage(tab.id, {text:"stop"}, function() {});
	} else {
		isFarming = true;
		chrome.pageAction.setTitle({tabId:tab.id, title:'Disable Tribal Wars Farmer'});
		chrome.tabs.sendMessage(tab.id, {text:"start"}, function() {});
	}
});
