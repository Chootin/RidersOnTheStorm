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
            safeFarms[a] = {coordinate: fields[a].value.trim(), owner: undefined};
        }
    }
    safeFarms.sort();
    chrome.storage.sync.set({safeFarms: safeFarms, missing: [], changedOwner: []}, function() {
        var d = new Date();
        var confirmNode = document.getElementById('status');
        confirmNode.innerHTML = 'Save completed at ' + d.getHours() + ':' + d.getMinutes() + '.';
    });
}

function restore() {
    chrome.storage.sync.get({safeFarms: [], changedOwner: [], missing: []}, function(data) {
        var safeFarms = data.safeFarms;
        var changedOwner = data.changedOwner;
        var missing = data.missing;

        if (safeFarms.length > 0) {
            if (safeFarms[0].constructor !== {}.constructor) { //Check if the first element is a JSON object
                for (var a = 0; a < safeFarms.length; a++) {
                    safeFarms[a] = {coordinate: safeFarms[a], owner: undefined};
                }
            }
            addRestoredData(safeFarms, missing, changedOwner);        
        }
    });
}

function addRestoredData(safeFarms, missing, changedOwner) {
		console.log(safeFarms);
		console.log(missing);
		console.log(changedOwner);
    for (var a = 0; a < safeFarms.length; a++) {
		if (safeFarms[a] != null) {
		    var node = addExtraEntry('normal');
		    node.value = safeFarms[a].coordinate;
		}
    }
    for (var a = 0; a < missing.length; a++) {
		if (missing[a] != null) {
		    var node = addExtraEntry('missing');
		    node.value = missing[a].coordinate;
		}
    }
    for (var a = 0; a < changedOwner.length; a++) {
		if (changedOwner[a] != null) {
		    var node = addExtraEntry('changed');
		    node.value = changedOwner[a].coordinate;
		}
    }
}
