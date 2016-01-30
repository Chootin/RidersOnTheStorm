"use strict";

var safeFarm = [];
var missingVillages = []
var changedOwner = [];
var attacking = false;
var farming = false;

function cleanURL() {
    var url = window.location.href.split('&try')[0];
    var alreadyThere = window.location.href == url;
    if (!alreadyThere) {
        window.location.href = url;
    }
    return alreadyThere;
}

function scanVillageOwners (index) { //Types the coord into the box and hits the attack button - page will reload with the village details loaded in. Uses this information for the logic
    if (index < safeFarm.length) {
        chrome.extension.sendMessage({text: 'runScan'}, undefined);

        var confirmAttackList = document.getElementsByClassName('troop_confirm_go');
        if (confirmAttackList.length > 0) { //We are already scanning
            var tempOwner = undefined;

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
            window.onbeforeonunload = undefined;
            window.onunload = undefined;

            var lc_input = document.getElementById('unit_input_light');
            lc_input.value = 1;
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
        window.onbeforeunload = function (e) {
            if (farming) {
                return 'This is your farm tab, are you sure you want to leave?';
            }
        };

        window.onunload = function () {
            if (farming) {
                disconnect();
            }
        }
    }

    loop();
}

var loop = function () {
    if (!attacking && farming) {
        window.setTimeout(loop, 1000);
        verifyAndFarm();
    }
};

var setBackgroundData = function (attackValue, farmingValue, village) {
    chrome.runtime.sendMessage({text:'setData', value: attackValue, farming: farmingValue, village: village}, undefined);
};

var start = function (running) {
    chrome.storage.sync.get({safeFarms: [], changedOwner: [], missing: []}, function (data) {
        safeFarm = data.safeFarms;
        missingVillages = data.missing;
        changedOwner = data.changedOwner;
        dataRetrieved(running);
    });

    
};

function dataRetrieved(running) {
    if (!running.runningElsewhere) {
        chrome.extension.sendMessage({text: 'showAction'}, undefined);

        chrome.runtime.onMessage.addListener(function (message, sender, callback) {
            if (message.text === 'start') {
                if (safeFarm.length > 0) {
                    alert('Tribal Wars farm bot started!');
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
                disconnect();
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
    } else {
        console.log('TribalWarsFarmer: Detected to be running in another tab.');
    }
}

function notEnoughFarms() {
	alert('Please set at least one safe farm in the extension options.');
	disconnect();
}

function disconnect() {
    console.log('TribalWarsFarmer: Disconnecting...');
    chrome.extension.sendMessage({text: 'disconnect'}, undefined);
}

var verifyAndFarm = function () {
    checkRefreshRequired();

    var lc_numeral = document.getElementById('units_entry_all_light');
    if (lc_numeral != undefined) {
        var lc_count = lc_numeral.innerHTML;
        lc_count = lc_count.replace('(', '').replace(')', '');
        if (lc_count >= 5) {
            var lc_input = document.getElementById('unit_input_light');
            lc_input.value = 5;            

            randoAttempts = 0;
            var selectedFarm = selectFarm();
            inputFarm(selectedFarm.coordinate);
            console.log('Attacking: ' + selectedFarm.coordinate);

            setBackgroundData(true, true, selectedFarm.coordinate);
            clickAttack();
            attacking = true;
        }
    }
};

function clickAttack() {
    window.onbeforeunload = function () {};
    window.onunload = function () {};
    document.getElementById('target_attack').click();
}

function moveToAnotherList(selectedFarm, list) {
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
}

function inputFarm(coordinates) {
    var coord_input = document.querySelector('#place_target > input');
    coord_input.value = coordinates;
}

var refreshTick = 0;
function checkRefreshRequired() {
    var refreshRequiredCheck = document.querySelector('#content_value > table:nth-child(10) > tbody > tr:nth-child(2) > td:nth-child(3) > span');
    if (refreshRequiredCheck != undefined && refreshRequiredCheck.innerHTML.trim() === '0:00:00') {
        console.log('Game might be timing out...');
        if (refreshTick > 5) {
            console.log('Checking ' + 6 - refreshTick + ' more times.');
            window.onbeforeunload = function () {};
            window.onunload = function () {};
            location.reload();
        } else {
            refreshTick++;
        }
    }
}

var stuck = false;
var sendAttack = function (currentAttack, remainingAttempts) {
    var stop = false;
	chrome.extension.sendMessage({text: 'getStuck'}, function (response) {stuck = response});
    if (!checkVillageMissing()) {
        var owner = document.querySelector('#command-data-form > table:nth-child(8) > tbody > tr:nth-child(3) > td:nth-child(2) > a');
        if (owner != undefined) {
            owner = owner.innerHTML.trim();
        }
        if (owner != undefined && owner != safeFarm[getSafeFarmIndex(currentAttack)].owner) {
            //BAD Owner has changed!
            moveToAnotherList(selectedFarm, changedOwner);
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
    				chrome.extension.sendMessage({text: 'setStuck'}, undefined);
					if (!stuck) {
                    	location.reload();
					} else {
						setBackgroundData(false, true, undefined);
						cleanURL();
					}
                }
            }
        }
    } else {
        moveToAnotherList(currentAttack, missingVillages);
        setBackgroundData(false, true, undefined);
        location.reload();
    }
};

function checkVillageMissing() {
    var errorBox = document.getElementsByClassName('error_box')[0];
    return (errorBox != undefined && errorBox.innerHTML.trim() === 'Target does not exist')
}

var randoAttempts;
var selectFarm = function () {
    var index = parseInt(Math.random() * safeFarm.length);
    var currentAttack;
    var currentAttackString;
    var tempIndex = 2;
    //Check for current attack
    while (true) {
        currentAttack = document.querySelector('#content_value > table:nth-child(10) > tbody > tr:nth-child(' + tempIndex + ') > td:nth-child(1) > span.quickedit-out > span > a > span');
        if (currentAttack != undefined) {
            currentAttackString = currentAttack.innerHTML;
            if (getSafeFarmIndex(currentAttackString) > -1) {
                randoAttempts++;
                if (randoAttempts > safeFarms.length * 2) {
                    randoAttempts = 0;
                    return selectFarm();
                }
            }
            tempIndex++;
        } else {
            break;
        }
    }
    return safeFarm[index];
};

function getSafeFarmIndex(coordinate) {
    for (var a = 0; a < safeFarm.length; a++) {
        if (safeFarm[a].coordinate === coordinate) {
            return a;
        }
    }
    return -1;
}

window.onload = function () {
    chrome.extension.sendMessage({text: 'alreadyRunning'}, start);
};
