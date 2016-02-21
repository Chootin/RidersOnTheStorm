"use strict";

var farmTabId;
var isAttacking = false;
var isFarming = false;
var currentAttack;

var scanIndex = 0;
var scanRunning = false;

var purgeTabId;
var purging = false;
var page = 0;
var purgeStuck = false;

var stuck = false;

var keepingAlive = false;
var aliveTabs = [];

//Farm Listeners
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.text === 'alreadyRunning') {
		console.log(farmTabId, sender.tab.id);
        var runningOnAnotherTab = (farmTabId != undefined && sender.tab.id != farmTabId);
        sendResponse({runningElsewhere: runningOnAnotherTab});
    } else if (message.text === 'getData') {
        sendResponse({attacking: isAttacking, farming: isFarming, village: currentAttack, scanRunning: scanRunning});
    } else if (message.text === 'setData') {
        isAttacking = message.value;
        isFarming = message.farming;
        currentAttack = message.village;
        sendResponse({});
    } else if (message.text === 'showAction') {
        chrome.pageAction.show(sender.tab.id);
        setActionTitle(sender.tab.id);
        sendResponse({});
    } else if (message.text === 'disconnect') {
        if (sender.tab.id == farmTabId) {
            farmTabId = undefined;
            isAttacking = false;
            isFarming = false;
		    currentAttack = undefined;
		    scanRunning = false;
		    stuck = false;
		    scanIndex = 0;
            setActionTitle();
        }
    } else if (message.text === 'scanIndex') {
        sendResponse(scanIndex);
    } else if (message.text === 'incScanIndex') {
        scanIndex++;
    } else if (message.text === 'runScan') {
        scanRunning = true;
    } else if (message.text === 'scanComplete') {
        scanRunning = false;
    } else if (message.text === 'setStuck') {
		stuck = message.stuck;
	} else if (message.text === 'getStuck') {
		sendResponse(stuck);
	}
});

//Auto Report Cleaner Listeners
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.text === 'purge') {
        purging = message.value;
		if (purging) {
			purgeTabId = sender.tab.id;
		} else {
			purgeTabId = undefined;
		}
        page = message.nextPage;
    } else if (message.text === 'getPurgeData') {
		if (sender.tab.id == purgeTabId || purgeTabId == undefined) {
        	sendResponse({purge: purging, newPage: page});
		}
    } else if (message.text === 'purgeStuck') {
		purgeStuck = message.value;
	} else if (message.text === 'getPurgeStuck') {
		sendResponse({purgeStuck: purgeStuck});
	}
});

chrome.pageAction.onClicked.addListener(function (tab) {
    if (isFarming) {
        if (tab.id === farmTabId) {
            isFarming = false;
            farmTabId = undefined;
            chrome.tabs.sendMessage(tab.id, {text: 'stop'}, undefined);
        } else {
            chrome.pageAction.hide(tab.id);
        }
    } else {
        isFarming = true;
        farmTabId = tab.id;
        chrome.tabs.sendMessage(tab.id, {text: 'start'}, undefined);
    }
    setActionTitle(tab.id);
});

var setActionTitle = function (tabId) {
    var tab;
    if (tabId != undefined || farmTabId == undefined) {
        tab = tabId;
    } else {
        tab = farmTabId;
    }
    if (isFarming) {
            chrome.pageAction.setTitle({tabId: tab, title: 'Disable Tribal Wars Farmer'});
            chrome.pageAction.setIcon({tabId: tab, path: 'graphics/farm_assistent_active.png'});
    } else {
        chrome.pageAction.setTitle({tabId: tab, title: 'Enable Tribal Wars Farmer'});
        chrome.pageAction.setIcon({tabId: tab, path: 'graphics/farm_assistent_inactive.png'});
    }
};


