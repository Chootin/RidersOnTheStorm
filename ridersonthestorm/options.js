"use strict";

var counter = 0;
var totalCount = 0;

window.onload = function() {
    restore();
    document.getElementById('add').onclick = addExtraEntry;
    document.getElementById('save').onclick = save;
};

function addExtraEntry(status, priority) {
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
    var priorityBox = document.createElement('input');
    priorityBox.type = 'checkbox';
    buttonNode.innerHTML = 'Remove';
    buttonNode.onclick = function() {
        listDiv.removeChild(priorityBox);
        listDiv.removeChild(inputNode);
        listDiv.removeChild(buttonNode);
        listDiv.removeChild(warningText);
        listDiv.removeChild(br);
        totalCount--;
        updateQuantity();
    }

    listDiv.appendChild(br);
    listDiv.appendChild(priorityBox);
    listDiv.appendChild(inputNode);
    listDiv.appendChild(buttonNode);

	if (status === 'changed' || status === 'missing') {
    	listDiv.appendChild(warningText);
		inputNode.status = true;
	} else {
		inputNode.status = false;
	}

    inputNode.data = {};
    inputNode.priorityBox = priorityBox;

    if (priority) {
        priorityBox.checked = true;
    }

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
			if (fields[a].status != true) {
		        if (fields[a].data.coordinate === fields[a].value.trim()) {
		            console.log('Preserving old owner information of: ' + fields[a].value + ' ' + fields[a].data.owner);
		            owner = fields[a].data.owner;
		        } else {
		            fields[a].data.owner = undefined;
		        }
			}
            safeFarms[a] = {coordinate: fields[a].value.trim(), owner: owner, priority: fields[a].priorityBox.checked};
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
        key = defaultFarmInputs[a].className;
        if (key != undefined) {
            defaultFarmParty[key] = defaultFarmInputs[a].value;
        }
    }

    var priorityFarmParty = {};
    var priorityFarmInputs = document.getElementById('priorityFarm').childNodes;
    for (var a = 0; a < priorityFarmInputs.length; a++) {
        key = priorityFarmInputs[a].className;
        if (key != undefined && key != '') {
            priorityFarmParty[key] = priorityFarmInputs[a].value;
        }
    }

    console.log(priorityFarmParty);

	var saveJSON = {safeFarms: safeFarms, missing: [], changedOwner: [], defaultFarmParty: defaultFarmParty, priorityFarmParty: priorityFarmParty};

	console.log(saveJSON);

    chrome.storage.sync.set(saveJSON, function() {
        var d = new Date();
        var confirmNode = document.getElementById('status');
        confirmNode.innerHTML = 'Save completed at ' + d.getHours() + ':' + d.getMinutes() + '.';
    });
    chrome.extension.sendMessage({text: 'disconnect'}, undefined);
}

function restore() {
    chrome.storage.sync.get({safeFarms: [], changedOwner: [], missing: [], defaultFarmParty: {lc: 5}, priorityFarmParty: {lc: 5}}, function(data) {
        var safeFarms = data.safeFarms;
        var changedOwner = data.changedOwner;
        var missing = data.missing;
        var defaultFarmParty = data.defaultFarmParty;
        var priorityFarmParty = data.priorityFarmParty;

        console.log(data.priorityFarmParty);

        if (safeFarms.length > 0) {
            if (safeFarms[0].constructor !== {}.constructor) { //Check if the first element is a JSON object
                for (var a = 0; a < safeFarms.length; a++) {
                    safeFarms[a] = {coordinate: safeFarms[a], owner: undefined, priority: false};
                }
            }
            addRestoredData(safeFarms, missing, changedOwner, defaultFarmParty, priorityFarmParty);        
        }
    });
}

function addRestoredData(safeFarms, missing, changedOwner, defaultFarmParty, priorityFarmParty) {
	console.log(safeFarms);
	console.log(missing);
	console.log(changedOwner);
	console.log(defaultFarmParty);
    for (var a = 0; a < safeFarms.length; a++) {
		if (safeFarms[a] != null) {
            var node;
            if (safeFarms[a].priority != undefined) {
		        node = addExtraEntry('normal', safeFarms[a].priority);
            } else {
                node = addExtraEntry('normal', false);
            }
		    node.value = safeFarms[a].coordinate;
            node.data = {coordinate: safeFarms[a].coordinate, owner: safeFarms[a].owner};
		}
    }
    for (var a = 0; a < missing.length; a++) {
		if (missing[a] != null) {
            var node;
            if (missing[a].priority != undefined) {
		        node = addExtraEntry('missing', missing[a].priority);
            } else {
                node = addExtraEntry('missing', false);
            }
		    node.value = missing[a].coordinate;
            node.data = {};
		}
    }
    for (var a = 0; a < changedOwner.length; a++) {
		if (changedOwner[a] != null) {
            var node;
            if (changedOwner[a].priority != undefined) {
		        node = addExtraEntry('changed', changedOwner[a].priority);
            } else {
                node = addExtraEntry('changed', false);
            }
		    node.value = changedOwner[a].coordinate;
            node.data = {};
		}
    }

    var defaultFarmDiv = document.getElementById('defaultFarm');

    for (var key in defaultFarmParty) {
        defaultFarmDiv.getElementsByClassName(key)[0].value = defaultFarmParty[key];
    }

    var priorityFarmDiv = document.getElementById('priorityFarm');

    for (var key in priorityFarmParty) {
        priorityFarmDiv.getElementsByClassName(key)[0].value = priorityFarmParty[key];
    }
}
