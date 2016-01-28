"use strict";

var safeFarm = [];
var missingVillages = []
var changedOwner = [];
var attacking = false;
var farming = false;


var scanIndex = 0;
function scanVillageOwners () {
	console.log('loggin ' + scanIndex);
	var timeoutSet = false;
    if (scanIndex < safeFarm.length) {
        if (safeFarm[scanIndex].owner == undefined) {
			timeoutSet = true;
			alert('asdf');
            inputFarm(safeFarm[scanIndex].coordinate);
            window.setTimeout(function () {
                var owner = getOwner();
                safeFarm[scanIndex].owner = owner;
                window.setTimeout(scanVillageOwner, 10);
            }, 500);
        }
        scanIndex++;
        if (scanIndex === safeFarm.length) {     
            storeData();
        } else if (!timeoutSet) {
			window.setTimeout(scanVillageOwner, 10);
		}
    }
}

function getOwner(village) {
		var node = document.querySelector('#ds_body > div.target-select-autocomplete > div > span.village-info');
		if (node != undefined) {
			var child = node.childNodes[0];
			return child.innerHTML.trim();
		} else {
			moveToAnotherList(village, missingVillages);
		}
		return undefined;
}

function storeData() {
	console.log('Storing: ', safeFarm, missingVillages, changedOwner);
    chrome.storage.sync.set({safeFarms: safeFarm, missing: missingVillages, changedOwner: changedOwner});
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
    });

    if (!running.runningElsewhere) {
        chrome.extension.sendMessage({text: 'showAction'}, undefined);
        window.onbeforeunload = function (e) {
            if (farming && !attacking) {
                return 'This is your farm tab, are you sure you want to leave?';
            }
        };

        window.onunload = function () {
            if (farming && !attacking) {
                disconnect();
            }
        }

        chrome.runtime.onMessage.addListener(function (message, sender, callback) {
            if (message.text === 'start') {
                if (safeFarm.length > 0) {
                    alert('Tribal Wars farm bot started!');
   					scanVillageOwners();
                    farming = true;
                    loop();
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
            if (farming && !attacking) {
                loop();
            } else if (attacking) {
                window.setTimeout(function () {sendAttack(response.village, 5)}, 1000);
            }
        });
    } else {
        console.log('TribalWarsFarmer: Detected to be running in another tab.');
    }
};

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

            if (verifyOwnership()) {
                setBackgroundData(true, true, selectedFarm.coordinate);

                document.getElementById('target_attack').click();
                attacking = true;   
            } else {
                moveToAnotherList(selectedFarm, changedOwner);
            }
        }
    }
};

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

function verifyOwnership() {
    return false;
}

function inputFarm(coordinates) {
    var coord_input = document.querySelector('#place_target > input');
    coord_input.value = coordinates;
}

var doubleCheckRefresh = false;
function checkRefreshRequired() {
    var refreshRequiredCheck = document.querySelector('#content_value > table:nth-child(10) > tbody > tr:nth-child(2) > td:nth-child(3) > span');
    if (refreshRequiredCheck != undefined && refreshRequiredCheck.innerHTML.trim() === '0:00:00') {
        if (doubleCheckRefresh) {
            window.onbeforeunload = undefined;
            window.onunload = undefined;
            location.reload();
        } else {
            doubleCheckRefresh = true;
        }
    }
}

var sendAttack = function (currentAttack, remainingAttempts) {
    var errorBox = document.getElementsByClassName('error_box')[0];
    if (errorBox == undefined) {
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
