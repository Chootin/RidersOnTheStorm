var pageSize = 12;

var cleanReportsButton;
var purgeReportsButton;
var reportTable;

window.onload = function () {
    chrome.extension.sendMessage({text: 'getPurgeData'}, purge);
}

function purge (purging, page) {
    console.log(purging + ' ' + page);
    if (purging) {
        setupEndListeners();
        var thisPage = getPage();
        if (thisPage == page) {
            var numberSelected = clean();
            if (numberSelected > 0) {
                pressDelete();
            } else {
                chrome.extension.sendMessage({text: 'purge', value: true, page: thisPage + 1}, undefined);
            }
        } else {
            cleanEndListeners();
            window.location.href(getURL(page));
        }
    } else {
        firstRun();
    }
}

function cleanEndListeners () {
    window.onbeforeunload = function () {};

    window.onunload = function () {}
}

function setupEndListeners () {
    window.onbeforeunload = function (e) {
        return 'Would you like to stop the purging process?';
    };

    window.onunload = function () {
        console.log('oops');
        chrome.extension.sendMessage({text: 'purge', value: false, page: 0}, undefined);
    }
}

function getURL (page) {
    var url = window.location.href;
    var splitURL = url.split('&');
    var baseURL = splitURL[0] + '&' + splitURL[1] + '&' + 'from=' + page * pageSize;
}

function getPage () {
    var urlSplit = window.location.href.split('from=');
    if (urlSplit.length > 1) {
        return parseInt(urlSplit[1]) / pageSize; 
    }
    return 0;
}

function firstRun () {
    buttonDiv = document.querySelector('#content_value > table > tbody > tr > td:nth-child(2) > form > table:nth-child(2) > tbody > tr > td');

    createButtons();

    buttonDiv.appendChild(cleanReportsButton);
    buttonDiv.appendChild(purgeReportsButton);
}

function createButtons () {
    cleanReportsButton = document.createElement('input');
    cleanReportsButton.className = 'btn btn-cancel';
    cleanReportsButton.type = 'button';
    cleanReportsButton.value = 'Clean';
    cleanReportsButton.onclick = clean;

    purgeReportsButton = document.createElement('input');
    purgeReportsButton.className = 'btn btn-cancel';
    purgeReportsButton.type = 'button';
    purgeReportsButton.value = 'Purge';
    purgeReportsButton.onclick = function () {purge(true, 0);};
}

function clean () {
    var numberSelected = 0;
    var index = 2;
    var row = getRow(index);
    var deleteRequired = false;

    while (row != undefined && !lastRow(row)) {
        if (greenRow(row) && !spyExists(row) && wasAttack(row)) {
            checkRow(row);
            numberSelected++;
        }

        index++;
        row = getRow(index);
    }
    return numberSelected;
}

function pressDelete () {
    var deleteButton = document.querySelector('#content_value > table > tbody > tr > td:nth-child(2) > form > table:nth-child(2) > tbody > tr > td > input:nth-child(4)');
    if (deleteButton != undefined) {
        cleanEndListeners();
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

function wasAttack (row) {
    var title = row.children[1].children[2].children[0].children[0].children[0].innerHTML;
    return (title.indexOf('attacks') > -1);
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
