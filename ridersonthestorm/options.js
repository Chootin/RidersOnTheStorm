"use strict";

var counter = 0;
var totalCount = 0;

window.onload = function() {
    restore();
    document.getElementById('add').onclick = addExtraEntry;
    document.getElementById('save').onclick = save;
};

function addExtraEntry(status) {
    var listDiv = document.getElementById('fields');
    var inputNode = document.createElement('input');
    inputNode.type = 'text';
    inputNode.className = 'safeFarm';
    inputNode.id = 'safeFarm' + counter;

    var warningText = document.createElement('span');
    if (status === 'changed') {
        warningText.innerHTML = '   Warning! This village was found to have changed owners since the first run.';
    } else if (status === 'missing') {
        warningText.innerHTML = '   Warning! This village no longer exists.';
    }

    var br = document.createElement('br');
    var buttonNode = document.createElement('button');
    buttonNode.innerHTML = 'Remove';
    buttonNode.onclick = function() {
        listDiv.removeChild(inputNode);
        listDiv.removeChild(buttonNode);
        listDiv.removeChild(warningText);
        listDiv.removeChild(br);
        totalCount--;
        updateQuantity();
    }

    listDiv.appendChild(br);
    listDiv.appendChild(inputNode);
    listDiv.appendChild(buttonNode);
    listDiv.appendChild(warningText);

    inputNode.data = {};

    totalCount++;

    updateQuantity();

    counter++;

    return inputNode;
}

function updateQuantity() {
    var quantityField = document.getElementById('quantity');
    quantityField.innerHTML = totalCount + ' farms available.';
}

function save() {
    var fields = document.getElementsByClassName('safeFarm');
    var safeFarms = [];
    for (var a = 0; a < fields.length; a++) {
        if (fields[a].value.trim() != '') {
            var owner = undefined;
            if (fields[a].data.coordinate === fields[a].value.trim()) {
                console.log('Preserving old owner information of: ' + fields[a].value + ' ' + fields[a].data.owner);
                owner = fields[a].data.owner;
            } else {
                fields[a].data.owner = undefined;
            }
            safeFarms[a] = {coordinate: fields[a].value.trim(), owner: owner};
        }
    }
    safeFarms.sort(
        function (a, b) {
            if (a.coordinate < b.coordinate) {
                return -1;
            } else if (a.coordinate > b.coordinate) {
                return 1;
            }
            return 0;
        }
    );

    //Default farm
    var key;
    var value;
    var defaultFarmParty = {};
    var defaultFarmInputs = document.getElementById('defaultFarm').childNodes;
    for (var a = 0; a < defaultFarmInputs.length; a++) {
        key = defaultFarmInputs[a].id;
        defaultFarmParty[key] = defaultFarmInputs[a].value;
    }

    chrome.storage.sync.set({safeFarms: safeFarms, missing: [], changedOwner: [], defaultFarmParty: defaultFarmParty}, function() {
        var d = new Date();
        var confirmNode = document.getElementById('status');
        confirmNode.innerHTML = 'Save completed at ' + d.getHours() + ':' + d.getMinutes() + '.';
    });
    chrome.extension.sendMessage({text: 'disconnect'}, undefined);
}

function restore() {
    chrome.storage.sync.get({safeFarms: [], changedOwner: [], missing: [], defaultFarmParty: {lc: 5}}, function(data) {
        var safeFarms = data.safeFarms;
        var changedOwner = data.changedOwner;
        var missing = data.missing;
        var defaultFarmParty = data.defaultFarmParty;

        if (safeFarms.length > 0) {
            if (safeFarms[0].constructor !== {}.constructor) { //Check if the first element is a JSON object
                for (var a = 0; a < safeFarms.length; a++) {
                    safeFarms[a] = {coordinate: safeFarms[a], owner: undefined};
                }
            }
            addRestoredData(safeFarms, missing, changedOwner, defaultFarmParty);        
        }
    });
}

function addRestoredData(safeFarms, missing, changedOwner, defaultFarmParty) {
	console.log(safeFarms);
	console.log(missing);
	console.log(changedOwner);
	console.log(defaultFarmParty);
    for (var a = 0; a < safeFarms.length; a++) {
		if (safeFarms[a] != null) {
		    var node = addExtraEntry('normal');
		    node.value = safeFarms[a].coordinate;
            node.data = {coordinate: safeFarms[a].coordinate, owner: safeFarms[a].owner};
		}
    }
    for (var a = 0; a < missing.length; a++) {
		if (missing[a] != null) {
		    var node = addExtraEntry('missing');
		    node.value = missing[a].coordinate;
            node.data = {};
		}
    }
    for (var a = 0; a < changedOwner.length; a++) {
		if (changedOwner[a] != null) {
		    var node = addExtraEntry('changed');
		    node.value = changedOwner[a].coordinate;
            node.data = {};
		}
    }
    var key;
    for (var key in defaultFarmParty) {
        document.getElementById(key).value = defaultFarmParty[key];
    }
}
