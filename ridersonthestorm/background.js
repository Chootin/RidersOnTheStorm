"use strict";

var farmTabId;
var isAttacking = false;
var isFarming = false;
var currentAttack;

chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.text === 'alreadyRunning') {
        var runningOnAnotherTab = (farmTabId != undefined && sender.tab.id != farmTabId);
        sendResponse({runningElsewhere: runningOnAnotherTab});
    } else if (message.text === 'getData') {
        sendResponse({attacking: isAttacking, farming: isFarming, village: currentAttack});
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
        farmTabId = undefined;
        isAttacking = false;
        isFarming = false;
        setActionTitle(sender.tab.id);
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
    if (isFarming) {
        chrome.pageAction.setTitle({tabId: tabId, title: 'Disable Tribal Wars Farmer'});
        chrome.pageAction.setIcon({tabId: tabId, path: 'farm_assistent_active.png'});
    } else {
        chrome.pageAction.setTitle({tabId: tabId, title: 'Enable Tribal Wars Farmer'});
        chrome.pageAction.setIcon({tabId: tabId, path: 'farm_assistent_inactive.png'});
    }
};

chrome.tabs.onTabReplaced.addListener(function (newId, oldId) {
    if (oldId === farmTabId) {
        farmTabId = newId;
    }
});
