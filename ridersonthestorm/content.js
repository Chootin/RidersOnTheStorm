"use strict";

var isFarmTab = false;
var defaultParty = {lc: "5"};
var priorityParty = {lc: "5"};
var safeFarm = [];
var missingVillages = []
var changedOwner = [];
var priorityVillages = [];
var attacking = false;
var farming = false;
var haltLoop = false;
var stuck = false;

var windowLoaded;

function cleanURL() {
    var url = window.location.href.split('&try')[0];
    var alreadyThere = window.location.href == url;
    if (!alreadyThere) {
		cleanEndListeners();
        window.location.href = url;
    }
    return alreadyThere;
}

function scanVillageOwners (index) { //Types the coord into the box and hits the attack button - page will reload with the village details loaded in. Uses this information for the logic
    if (index < safeFarm.length) {
        chrome.extension.sendMessage({text: 'runScan'}, undefined);

        var confirmAttackList = document.getElementsByClassName('troop_confirm_go');
        if (confirmAttackList.length > 0) { //We are already scanning
            var tempOwner = '';

            var owner = document.querySelector('#command-data-form > table:nth-child(8) > tbody > tr:nth-child(3) > td:nth-child(2) > a');
            if (owner != undefined) {
                tempOwner = owner.innerHTML.trim();
            }

            safeFarm[index].owner = tempOwner;
            storeData();

            chrome.extension.sendMessage({text: 'incScanIndex'}, undefined);

            cleanURL();

        } else if (checkVillageMissing()) {
            chrome.extension.sendMessage({text: 'incScanIndex'}, undefined);
            cleanURL();
        } else if (safeFarm[index].owner == undefined) {
            inputFarm(safeFarm[index].coordinate);
            cleanEndListeners();

            var lc_input = document.getElementById('unit_input_light');
            lc_input.value = 1;
			cleanEndListeners();
            clickAttack();
        } else if (safeFarm[index].owner != undefined) {
            chrome.extension.sendMessage({text: 'incScanIndex'}, undefined);
            chrome.extension.sendMessage({text: 'scanIndex'}, scanVillageOwners);
        }
    } else {
        console.log('Scan completed!');
        deleteSelectedFarm();
        chrome.extension.sendMessage({text: 'scanComplete'}, undefined);
        beginLoop();
    }
}

function deleteSelectedFarm() {
    var deleteFarm = document.getElementsByClassName('village-delete');
    if (deleteFarm.length > 0) {
        deleteFarm = deleteFarm[0];
        deleteFarm.click();
    }
}

function storeData () {
	console.log('Storing: ', safeFarm, missingVillages, changedOwner);
    chrome.storage.sync.set({safeFarms: safeFarm, missing: missingVillages, changedOwner: changedOwner});
}

function beginLoop () {
    if (!attacking) {
        farming = true;
		setupEndListeners();
        loop();
    }
}

function cleanEndListeners () {
    window.onbeforeunload = function () {};

    window.onunload = function () {}
}

function setupEndListeners () {
    window.onbeforeunload = function (e) {
        if (isFarmTab) {
            return 'This is your farm tab, are you sure you want to leave?';
        }
    };
}

var loop = function () {
    if (farming) {
        verifyAndFarm();
    }
};

var setBackgroundData = function (attackValue, farmingValue, village) {
    chrome.runtime.sendMessage({text:'setData', value: attackValue, farming: farmingValue, village: village}, undefined);
};

var start = function (running) {
	if (!running.runningElsewhere) {
		isFarmTab = true;
		chrome.storage.sync.get({safeFarms: [], changedOwner: [], missing: [], defaultFarmParty: {lc: 5}, priorityFarmParty: {lc: 5}}, function (data) {
		    safeFarm = data.safeFarms;
		    missingVillages = data.missing;
		    changedOwner = data.changedOwner;
		    defaultParty = data.defaultFarmParty;
		    priorityParty = data.priorityFarmParty;
		    generatePriorityFarmList();
		    
		    dataRetrieved();
		});
	} else {
        console.log('TribalWarsFarmer: Detected to be running in another tab.');
    }
};

function generatePriorityFarmList () {
    for (var a = 0; a < safeFarm.length; a++) {
        if (safeFarm[a].priority != undefined && safeFarm[a].priority === true) {
            priorityVillages.push(safeFarm[a]);
        }
    }
}

function dataRetrieved () {
    chrome.extension.sendMessage({text: 'showAction'}, undefined);

    chrome.runtime.onMessage.addListener(function (message, sender, callback) {
        if (message.text === 'start') {
            if (safeFarm.length > 0) {
                alert('Tribal Wars farm bot started!');
				setupEndListeners();
				isFarmTab = true;
                console.log('Starting owner scan!');
                if (cleanURL()) {
                    chrome.extension.sendMessage({text: 'scanIndex'}, scanVillageOwners);
                }
            } else {
				notEnoughFarms();
            }
        } else if (message.text === 'stop') {
            alert('Tribal Wars farm bot stopped.');
            farming = false;
            cleanEndListeners();
            disconnect();
        } else if (message.text === 'checkActive') {
            if (farming) {
                callback();
            }
        }
    });

    chrome.extension.sendMessage({text: 'getData'}, function (response) {
        attacking = response.attacking;
        farming = response.farming;
        if (response.scanRunning) {
            console.log('Continuing scan...');
            chrome.extension.sendMessage({text: 'scanIndex'}, scanVillageOwners);
        } else {
            if (farming && !attacking) {
                beginLoop();
            } else if (attacking) {
                window.setTimeout(function () {sendAttack(response.village, 5)}, 1000);
            }
        }
    });
}

function notEnoughFarms () {
	alert('Please set at least one safe farm in the extension options.');
	disconnect();
}

function disconnect () {
    console.log('TribalWarsFarmer: Disconnecting...');
    chrome.extension.sendMessage({text: 'disconnect'}, undefined);
}

var verifyAndFarm = function () {
    if (!checkRefreshRequired()) {
        if (unitsAvailable()) {
            var selectedFarm = selectFarm();
            inputFarm(selectedFarm.farm.coordinate);
            console.log('Attacking: ' + selectedFarm.farm.coordinate);

            enterDefaultUnits(selectedFarm.priority);

            setBackgroundData(true, true, selectedFarm.farm.coordinate);
            clickAttack();
            attacking = true;
        }

        window.setTimeout(loop, 1000);
    }
};

function unitsAvailable (priority) {
    //defaultParty
    var party = defaultParty;

    if (priority == true) {
        party = priorityParty;
    }

    if (party.lc != undefined && party.lc.trim() != '') {
        if (getQuantityOfUnitsAvailable('units_entry_all_light') < party.lc) {
            return false;
        }
    }

    if (party.hc != undefined && party.hc.trim() != '') {
        if (getQuantityOfUnitsAvailable('units_entry_all_heavy') < party.hc) {
            return false;
        }
    }

    if (party.ma != undefined && party.ma.trim() != '') {
        if (getQuantityOfUnitsAvailable('units_entry_all_marcher') < party.ma) {
            return false;
        }
    }

    if (party.ms != undefined && party.ms.trim() != '') {
        if (getQuantityOfUnitsAvailable('units_entry_all_spy') < party.ms) {
            return false;
        }
    }

    return true;
}

function getQuantityOfUnitsAvailable (id) {
    var quantity = document.getElementById(id);
    if (quantity != undefined) {
        quantity = quantity.innerHTML;
        return parseInt(quantity.replace('(', '').replace(')', ''));
    }
    return 0;    
}

function enterDefaultUnits (priority) { //TODO: check if priority party is possible
    if (priority && unitsAvailable(true)) {
        enterUnits('unit_input_light', priorityParty.lc);
        enterUnits('unit_input_heavy', priorityParty.hc);
        enterUnits('unit_input_marcher', priorityParty.ma);
        enterUnits('unit_input_spy', priorityParty.ms);
    } else {
        enterUnits('unit_input_light', defaultParty.lc);
        enterUnits('unit_input_heavy', defaultParty.hc);
        enterUnits('unit_input_marcher', defaultParty.ma);
        enterUnits('unit_input_spy', defaultParty.ms);
    }
}

function enterUnits (id, number) {
    var input = document.getElementById(id);
    input.value = number
}

function clickAttack () {
	cleanEndListeners();
    document.getElementById('target_attack').click();
}

function moveToAnotherList (selectedFarm, list) {
    var index = getSafeFarmIndex(selectedFarm);
    var farm = safeFarm[index];
    list.push(farm);
    safeFarm.splice(index, 1);

    storeData();

	if (list === missingVillages) {
		if (safeFarm.length === 0) {
			notEnoughFarms();
		}
	}

    generatePriorityFarmList();
}

function inputFarm (coordinates) {
    var coord_input = document.querySelector('#place_target > input');
    coord_input.value = coordinates;
}

var refreshTick = 0;
function checkRefreshRequired () {
    var refreshRequiredCheck = document.querySelector('#content_value > table:nth-child(10) > tbody > tr:nth-child(2) > td:nth-child(3) > span');
    if (refreshRequiredCheck != undefined && refreshRequiredCheck.innerHTML.trim() === '0:00:00') {
        console.log('Game might be timing out...');
        console.log('Checking ' + (6 - refreshTick) + ' more times.');
        if (refreshTick > 5) {
            console.log('Game has timed out, refreshing.');
            reloadPage();
            return true;
        } else {
            refreshTick++;
            return false;
        }
    }
}

function sendAttack (currentAttack, remainingAttempts) {
    var stop = false;
	chrome.extension.sendMessage({text: 'getStuck'}, function (response) {stuck = response});
    if (!checkVillageMissing()) {
        var owner = document.querySelector('#command-data-form > table:nth-child(8) > tbody > tr:nth-child(3) > td:nth-child(2) > a');
        if (owner != undefined) {
            owner = owner.innerHTML.trim();
        }
        if (owner != undefined && owner != '' && owner != '---' && owner != safeFarm[getSafeFarmIndex(currentAttack)].owner) {
            //BAD Owner has changed!
            console.log('Village owned by: ' + owner + ' has changed owner to: ' + safeFarm[getSafeFarmIndex(currentAttack)].owner);
            moveToAnotherList(currentAttack, changedOwner);
            setBackgroundData(false, true, undefined);
            cleanURL();
            stop = true;
        }

        if (!stop) {
            var sendAttackButton = document.getElementById('troop_confirm_go');
            if (sendAttackButton != undefined) {
                setBackgroundData(false, true, undefined);
                sendAttackButton.click();
            } else {
                console.log('Confirm button could not be found.');
                if (remainingAttempts !== 0) {
                    remainingAttempts--;
                    window.setTimeout(function () {sendAttack(currentAttack, remainingAttempts)}, 1000);
                } else {
					if (!stuck) {
    				    chrome.extension.sendMessage({text: 'setStuck', stuck: true}, undefined);
                    	reloadPage();
					} else {
                        console.log('Bot is stuck, cancelling attack attempt.');
						setBackgroundData(false, true, undefined);
    				    chrome.extension.sendMessage({text: 'setStuck', stuck: false}, undefined);
						if (cleanURL()) {
                            reloadPage();
                        }
					}
                }
            }
        }
    } else {
        moveToAnotherList (currentAttack, missingVillages);
        setBackgroundData(false, true, undefined);
        reloadPage();
    }
};

function checkVillageMissing () {
    var errorBox = document.getElementsByClassName('error_box')[0];
    return (errorBox != undefined && errorBox.innerHTML.trim() === 'Target does not exist')
}

function selectFarm () {
    console.log('Selecting a farm.');
    var tempIndex = 2;
    
    var priorityFarm = selectPriorityFarm();

    if (priorityFarm != undefined) {
        console.log('Priority farm available - sending attack to it.');
        return {farm: priorityFarm, priority: true};
    } else {
        return {farm: selectAnyFarm(), priority: false};
    }
};

function selectAnyFarm () {
    var index;
    var randoAttempts = 0;
    var maxAttempts = safeFarm.length * 2;

    while (true) {
        index = parseInt(Math.random() * safeFarm.length);
        if (randoAttempts == maxAttempts) {
            return safeFarm[index];
        }

        if (!alreadyAttackingFarm(safeFarm[index].coordinate)) {
            return safeFarm[index];
        }
        randoAttempts++;
    }
}

function selectPriorityFarm () {
    var priorityNotUnderAttack = [];
    for (var a = 0; a < priorityVillages.length; a++) {
        if (!alreadyAttackingFarm(priorityVillages[a].coordinate)) {
            priorityNotUnderAttack.push(priorityVillages[a]);
        }
    }

    if (priorityNotUnderAttack.length > 0) {
        var index = parseInt(Math.random() * priorityNotUnderAttack.length);
        return priorityNotUnderAttack[index];
    } else {
        return undefined;
    }
}

function alreadyAttackingFarm (coordinates) {
    var currentAttack;
    var rowIndex = 2;
    while (true) {
        currentAttack = document.querySelector('#content_value > table:nth-child(10) > tbody > tr:nth-child(' + rowIndex + ') > td:nth-child(1) > span.quickedit-out > span > a > span');
        if (currentAttack != undefined && currentAttack.innerHTML.indexOf('(') > -1) {
            currentAttack = currentAttack.innerHTML.split('(')[1].split(')')[0];
            if (currentAttack === coordinates) {
                return true;
            }
        } else {
            break;
        }
        rowIndex++;
    }
    return false;
}

function getSafeFarmIndex (coordinate) {
    for (var a = 0; a < safeFarm.length; a++) {
        if (safeFarm[a].coordinate === coordinate) {
            return a;
        }
    }
    return -1;
}

function reloadPage () {
	cleanEndListeners();
    setTimeout(function () {location.reload()}, 1000);
}

function botCheckCheck () {
    var botCheck = document.getElementById('bot_check');
    if (botCheck != undefined) {
        window.setTimeout(botCheckCheck, 1000);
    } else {
        getRunning();
    }
}

function getRunning () {
    chrome.extension.sendMessage({text: 'alreadyRunning'}, start);
}

window.setTimeout(function () {
    if (!windowLoaded) {
        console.log('Page failed to load after 20 seconds, refreshing.');
        reloadPage();
    }
}, 20000);

window.onunload = function () {
    disconnect();
}

window.addEventListener('load', function () {
    windowLoaded = true;
	botCheckCheck();
});
