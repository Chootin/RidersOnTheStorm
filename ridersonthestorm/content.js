"use strict";

var safeFarm = [];
var missingVillages = []
var changedOwner = [];
var attacking = false;
var farming = false;


function scanVillageOwners (index) { //Types the coord into the box and hits the attack button - page will reload with the village details loaded in. Uses this information for the logic0
	var timeoutSet = false;
    if (index < safeFarm.length) {
        chrome.extension.sendMessage({text: 'runScan'}, undefined);
	    var node = document.querySelector('#place_target > div > span.village-info');
        if (node != undefined) { //We are already scanning
            var tempOwner = node.innerHTML.trim().split(' ');
            tempOwner = tempOwner[1];

            safeFarm[index].owner = tempOwner;
            storeData();

            deleteSelectedFarm();

        } else if (safeFarm[index].owner == undefined) {
            inputFarm(safeFarm[index].coordinate);
            window.onbeforeonunload = undefined;
            window.onunload = undefined;
            clickAttack();
        }

        chrome.extension.sendMessage({text: 'incScanIndex'}, undefined);
        chrome.extension.sendMessage({text: 'scanIndex'}, scanVillageOwners);
    } else {
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
    console.log('Starting loop');
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
    console.log('data retrieved');

    if (!running.runningElsewhere) {
        chrome.extension.sendMessage({text: 'showAction'}, undefined);

        chrome.runtime.onMessage.addListener(function (message, sender, callback) {
            if (message.text === 'start') {
                if (safeFarm.length > 0) {
                    alert('Tribal Wars farm bot started!');
                    console.log('running the scan');
                    chrome.extension.sendMessage({text: 'scanIndex'}, scanVillageOwners);

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
                console.log('continuing scan');
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
    document.getElementById('target_attack').click();
}

function moveToAnotherList(selectedFarm, list) {
    var index = getSafeFarmIndex(selectedFarm);
    var farm = safeFarm[index];
    list.push(farm);
    safeFarm.splice(index, 1);

    console.log('2');
    //storeData();

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

var sendAttack = function (currentAttack, remainingAttempts) {
    var errorBox = document.getElementsByClassName('error_box')[0];
    if (errorBox == undefined) {
        var owner = document.querySelector('#command-data-form > table:nth-child(8) > tbody > tr:nth-child(3) > td:nth-child(2) > a_').innerHTML.trim();
        if (owner != safeFarm[getSafeFarmIndex(currentAttack)].owner) {
            //BAD Owner has changed!
            moveToAnotherList(selectedFarm, changedOwner);
            setBackgroundData(false, true, undefined);
            window.history.back();
        }

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
                location.reload();
            }
        }
    } else {
        //alert('Safe farm at: ' + currentAttack + ' does not exist, please remove it from the list and reload.');
        //disconnect();
        moveToAnotherList(currentAttack, missingVillages);
        setBackgroundData(false, true, undefined);
        location.reload();
    }
};

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
                return selectFarm();
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
