"use strict";

var counter = 0;
var totalCount = 0;

window.onload = function() {
    restore();
    document.getElementById('add').onclick = addExtraEntry;
    document.getElementById('save').onclick = save;
};

function addExtraEntry() {
    var listDiv = document.getElementById('fields');
    var inputNode = document.createElement('input');
    inputNode.type = 'text';
    inputNode.className = 'safeFarm';
    inputNode.id = 'safeFarm' + counter;

    var br = document.createElement('br');
    var buttonNode = document.createElement('button');
    buttonNode.innerHTML = 'Remove';
    buttonNode.onclick = function() {
        listDiv.removeChild(inputNode);
        listDiv.removeChild(buttonNode);
        listDiv.removeChild(br);
        totalCount--;
        updateQuantity();
    }

    listDiv.appendChild(br);
    listDiv.appendChild(inputNode);
    listDiv.appendChild(buttonNode);

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
            safeFarms[a] = fields[a].value.trim();
        }
    }
    safeFarms.sort();
    chrome.storage.sync.set({safeFarms: safeFarms}, function() {
        var d = new Date();
        var confirmNode = document.getElementById('status');
        confirmNode.innerHTML = 'Save completed at ' + d.getHours() + ':' + d.getMinutes() + '.';
    });
}

function restore() {
    chrome.storage.sync.get({safeFarms: []}, function(data) {
        for (var a = 0; a < data.safeFarms.length; a++) {
            var node = addExtraEntry();
            node.value = data.safeFarms[a];
        }
    });
}
