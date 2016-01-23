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
