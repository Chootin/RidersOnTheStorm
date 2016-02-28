"use strict";

//var farmTabId;
var farmTabs = []; //TODO: working on multiple farm tabs
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

//Farm Listeners
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.text === 'alreadyRunning') {
        var farmTab = getFarmTab(sender.tab.id);

        var runningOnAnotherTab = farmTab != null;
        //var runningOnAnotherTab = (farmTabId != undefined && sender.tab.id != farmTabId);
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
        var farmTab = getFarmTabObject(sender.tab.id);

        removeFarmTabObject(farmTab);
		scanIndex = 0;
	    scanRunning = false;

        setActionTitle(sender.tab.id);

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
    var farmTab = getFarmTabObject(tab.id);

    if (farmTab != null) {
        if (farmTab.isFarming) {
            removeFarmTabObject(farmTab);
            chrome.tabs.sendMessage(tab.id, {text: 'stop'}, undefined);
        }
    } else {
        farmTab = addFarmTabObject(tab.id, getVillage());
        farmTab.isFarming = true;
        chrome.tabs.sendMessage(tab.id, {text: 'start'}, undefined);
    }
    setActionTitle(tab.id, farmTab.isFarming);
});

function getVillage (url) {
    return url.split('?')[1].split('&')[0].split('=')[1];
}

function addFarmTabObject (tabId, village) {
    var newFarmTab = {id: tabId, village: village, isAttacking: false, isFarming: true, stuck: false};
    farmTabs.push(newFarmTab);
    return farmTabs;
}

function removeFarmTabObject (farmTab) {
    for (var a = 0; a < farmTabs.length; a++) {
        if (farmTabs[a].id == farmTab.id) {
            farmTabs.splice(a, 1);
        }
    }
}

function getFarmTabObject (tabId) {
    for (var a = 0; a < farmTabs.length; a++) {
        if (tabId == farmTabs[a].id) {
            return farmTabs[a]; 
        }
    }

    return null;
}

var setActionTitle = function (tabId, farming) {
    if (farming) {
        chrome.pageAction.setTitle({tabId: tabId, title: 'Disable Tribal Wars Farmer'});
        chrome.pageAction.setIcon({tabId: tabId, path: 'graphics/farm_assistent_active.png'});
    } else {
        chrome.pageAction.setTitle({tabId: tabId, title: 'Enable Tribal Wars Farmer'});
        chrome.pageAction.setIcon({tabId: tabId, path: 'graphics/farm_assistent_inactive.png'});
    }
};


