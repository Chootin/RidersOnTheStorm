var cleanReportsButton;
var reportTable;

window.onload = function () {
    buttonDiv = document.querySelector('#content_value > table > tbody > tr > td:nth-child(2) > form > table:nth-child(2) > tbody > tr > td');

    createButton();

    buttonDiv.appendChild(cleanReportsButton);
}

function createButton () {   
    cleanReportsButton = document.createElement('input');
    cleanReportsButton.className = 'btn btn-cancel';
    cleanReportsButton.type = 'button';
    cleanReportsButton.value = 'Clean';
    cleanReportsButton.onclick = clean;
}

function clean () {
    var index = 2;
    var row = getRow(index);
    var deleteRequired = false;

    while (row != undefined && !lastRow(row)) {
        if (greenRow(row) && !spyExists(row)) {
            checkRow(row);
            deleteRequired = true;
        }

        index++;
        row = getRow(index);
    }
    if (deleteRequired === true) {
        pressDelete();
    }
}

function pressDelete () {
    var deleteButton = document.querySelector('#content_value > table > tbody > tr > td:nth-child(2) > form > table:nth-child(2) > tbody > tr > td > input:nth-child(4)');
    if (deleteButton != undefined) {
        deleteButton.click();
    }
}

function checkRow (row) {
    row.children[0].children[0].checked = true;
}

function greenRow (row) {
    var img = row.children[1].children[1];
    if (img != undefined) {
        return (img.src.indexOf('green.png') > -1);
    }
    return false;
}

function spyExists (row) {
    var iconContainer = row.children[1].children[0].children;
    if (iconContainer != undefined) {
        for (var a = 0; a < iconContainer.length; a++) {
            if (iconContainer[a].src.indexOf('spy') > -1) {
                return true;
            }
        }
    }    
    return false;
}

function getRow (index) {
    return document.querySelector('#report_list > tbody > tr:nth-child(' + index + ')');
}

function lastRow (row) {
    var header = row.children[0];
    if (header.tagName == 'th') {
        return true;
    }
    return false;
}
