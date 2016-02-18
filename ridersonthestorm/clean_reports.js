var pageSize = 12;

var cleanReportsButton;
var purgeReportsButton;
var reportTable;

var page;

window.onload = function () {
    chrome.extension.sendMessage({text: 'getPurgeData'}, purge);
}

function purge (data) {
	var purging = data.purge;
	page = data.newPage;
    if (purging) {
        setupEndListeners();
		purgeEnded();
    } else {
        firstRun();
    }
}

function purgeEnded () {
	try {
		var pageNumber = document.querySelector('#content_value > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > strong');
		if (pageNumber.innerHTML.trim() == '&gt;1&lt;' || pageNumber.innerHTML.trim() == '&gt;New reports&lt;') {
			chrome.extension.sendMessage({text: 'getPurgeStuck'}, checkPurgeStuck);
		} else {
			chrome.extension.sendMessage({text: 'purgeStuck', value: false}, undefined);
			window.setTimeout(function () {processDelete(page)}, 2000);
		}
	} catch (e) {
		chrome.extension.sendMessage({text: 'getPurgeStuck'}, checkPurgeStuck);
	}
}

function checkPurgeStuck (stuck) {
	if (!stuck.purgeStuck) {
		chrome.extension.sendMessage({text: 'purgeStuck', value: true}, undefined);
		window.setTimeout(function () {processDelete(page)}, 2000);
	} else {
		chrome.extension.sendMessage({text: 'purge', value: false, nextPage: 0}, undefined);
		chrome.extension.sendMessage({text: 'purgeStuck', value: false}, undefined);
		cleanEndListeners();
		location.reload();
	}
}

function processDelete (page) {
    var thisPage = getPage();
    if (thisPage == page) {
        var numberSelected = clean();
        if (numberSelected > 0) {
            chrome.extension.sendMessage({text: 'purge', value: true, nextPage: (parseInt(thisPage))}, undefined);
			chrome.extension.sendMessage({text: 'purgeStuck', value: false});
            pressDelete();
        } else {
        	cleanEndListeners();
            chrome.extension.sendMessage({text: 'purge', value: true, nextPage: (parseInt(thisPage) + 1)}, undefined);
        	window.location.href = getURL(parseInt(thisPage) + 1);
        }
    } else {
        cleanEndListeners();
		var newUrl = getURL(parseInt(page));
        window.location.href = newUrl;
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
        chrome.extension.sendMessage({text: 'purge', value: false, page: 0}, undefined);
    }
}

function getURL (page) {
    var url = window.location.href;
	var splitURL = url.split('from=');
	var newPage = parseInt(page) * parseInt(pageSize);
	var from = splitURL.length == 1 ? '&from=' : 'from=';
	var newUrl = splitURL[0] + from + newPage;
    return newUrl;
}

function getPage () {
    var url = window.location.href;
	var index = url.indexOf('from=');
	if (index > -1) {
		index += 5;
		var numeral = '0';
		var c = parseInt(url.charAt(index));
		while (!isNaN(c)) {
			numeral += c;
			index++;
			c = parseInt(url.charAt(index));
		}
		return parseInt(numeral) / pageSize;
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
    purgeReportsButton.onclick = function () {purge({purge: true, newPage: 0});};
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
		try {
        	return (img.src.indexOf('green.png') > -1);
		} catch (e) {
		}
    }
    return false;
}

function spyExists (row) {
	return attackTypeExists(row, 'spy');
}

function attackIcon (row) {
	return attackTypeExists(row, 'attack');
}

function attackTypeExists (row, imageName) {
    var iconContainer = row.children[1].children[0].children;
    if (iconContainer != undefined) {
        for (var a = 0; a < iconContainer.length; a++) {
            if (iconContainer[a].src.indexOf(imageName) > -1) {
                return true;
            }
        }
    }    
    return false;
}

function wasAttack (row) {
    var title = row.children[1].children[2].children[0].children[0].children[0].innerHTML;
    return (title.indexOf('attacks') > -1) && attackIcon(row);
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
