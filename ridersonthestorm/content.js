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
g
    if (!running.runningElsewhere) {
        chrome.extension.sendMessage({text: 'showAction'}, undefined);
        window.onbeforeunload = function (e) {
            if (farming && !attacking) {
                return 'This is your farm tab, are you sure you want to leave?';
            }
        };

        window.onunload = function () {
            if (farming && !attacking) {
                console.log('Disconnecting farm bot');
                diconnect();
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
                    diconnect();
                }
            } else if (message.text === 'stop') {
                alert('Tribal Wars farm bot stopped.');
                farming = false;
                diconnect();
            }
        });

        chrome.extension.sendMessage({text: 'getData'}, function (response) {
            attacking = response.attacking;
            farming = response.farming;
            if (farming && !attacking) {
                loop();
            } else if (attacking) {
                setBackgroundData(false, true);
                window.setTimeout(function () {sendAttack(response.village)}, 1000);
            }
        });
    }
};

function diconnect() {
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
            location.reload();
        } else {
            doubleCheckRefresh = true;
        }
    }
}

var sendAttack = function (currentAttack) {
    var errorBox = document.getElementsByClassName('error_box')[0];
    if (errorBox == undefined) {
        var sendAttackButton = document.getElementById('troop_confirm_go');
        if (sendAttackButton != undefined) {
            click();
        } else {
            document.setTimeout(sendAttack, 1000);
        }
    } else {
        alert('Safe farm at: ' + currentAttack + ' does not exist, please remove it from the list and reload.');
        diconnect();
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
