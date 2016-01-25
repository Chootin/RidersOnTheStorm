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

var setBackgroundData = function (attackValue, farmingValue) {
    chrome.runtime.sendMessage({text:'setData', value:attackValue, farming:farmingValue}, undefined);
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
                console.log('Disconnecting farm bot');
                chrome.extension.sendMessage({text: 'disconnect'}, undefined);
            }
        }

        chrome.runtime.onMessage.addListener(function (message, sender, callback) {
            if (message.text === 'start') {
                alert('Tribal Wars farm bot started!');
                farming = true;
                loop();
            } else if (message.text === 'stop') {
                alert('Tribal Wars farm bot stopped.');
                farming = false;
            }
        });

        chrome.extension.sendMessage({text: 'getData'}, function (response) {
            attacking = response.attacking;
            farming = response.farming;
            if (farming && !attacking) {
                loop();
            } else if (attacking) {
                setBackgroundData(false, true);
                window.setTimeout(sendAttack, 1000);
            }
        });
    }
};

var verifyAndFarm = function () {
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

            setBackgroundData(true, true);

            document.getElementById('target_attack').click();
            attacking = true;
        }
    }
};

var sendAttack = function () {
    document.getElementById('troop_confirm_go').click();
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
