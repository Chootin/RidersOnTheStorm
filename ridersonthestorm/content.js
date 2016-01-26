"use strict";

var safeFarm = [];
var attacking = false;
var farming = false;

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
    chrome.storage.sync.get({safeFarms: []}, function (data) {
        safeFarm = data.safeFarms;
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
                    farming = true;
                    loop();
                } else {
                    alert('Please set at least one safe farm in the extension options.');
                    disconnect();
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
            var coord_input = document.querySelector('#place_target > input');
            var selectedFarm = selectFarm();
            coord_input.value = selectedFarm;
            console.log('Attacking: ' + selectedFarm);

            setBackgroundData(true, true, selectedFarm);

            document.getElementById('target_attack').click();
            attacking = true;
        }
    }
};

var doubleCheckRefresh = false;
function checkRefreshRequired() {
    var refreshRequiredCheck = document.querySelector('#content_value > table:nth-child(10) > tbody > tr:nth-child(2) > td:nth-child(3) > span');
    if (refreshRequiredCheck != undefined && refreshRequiredCheck.innerHTML === '0:00:00') {
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
        alert('Safe farm at: ' + currentAttack + ' does not exist, please remove it from the list and reload.');
        disconnect();
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
            if (currentAttackString.indexOf(safeFarm[index]) > -1) {
                return selectFarm();
            }
            tempIndex++;
        } else {
            break;
        }
    }
    return safeFarm[index];
};

window.onload = function () {
    chrome.extension.sendMessage({text: 'alreadyRunning'}, start);
};
