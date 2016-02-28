"use strict";

var oneSecond = 1000;
var oneMinute = oneSecond * 60;
var oneHour = oneMinute * 60;
var tenHours = oneHour * 10;
var dateTimeFormat = 'hh:mm:ss dd/mm/yyyy';

var landingTime;
var timeInput;

window.addEventListener('load', function () {
	if (document.getElementById('troop_confirm_go') != undefined) {
		var holder = document.querySelector('#inner-border > table > tbody');
		landingTime = document.querySelector('#date_arrival > span');


		var text = document.createElement('span');
		var tr = document.createElement('tr');
		var td = document.createElement('td');
		timeInput = document.createElement('input');

		timeInput.id = 'timeInput';
		timeInput.type = 'text';

		text.innerHTML = 'Arrival time (format: '+ dateTimeFormat + '): ';

		text.style.cssText = 'margin-left: 10px;';

		tr.appendChild(td);
		td.appendChild(text);
		td.appendChild(timeInput);
	
		holder.appendChild(tr);

		timer();
	}
});

function timer () {
    var localTime = new Date().getTime();
    var serverTime = getServerDate().getTime();
    var offset = localTime - tenHours - serverTime;

    var selectedDate = getSelectedDate();
    var duration = getDurationMilliseconds();

    if (selectedDate != null && selectedDate.getTime() - duration - offset - serverTime <= 0) {
        document.getElementById('troop_confirm_go').click();
    }

	window.setTimeout(timer, 16.66);
}

function getDurationMilliseconds () {
    var durationText = document.querySelector('#command-data-form > table:nth-child(8) > tbody > tr:nth-child(4) > td:nth-child(2)').innerHTML;
    var durationSplit = durationText.split(':');
    var hours = parseInt(durationSplit[0]) * oneHour;
    var minutes = parseInt(durationSplit[1]) * oneMinute;
    var seconds = parseInt(durationSplit[2]) * oneSecond;

    return hours + minutes + seconds;
}

function getTimeOffset () {
    var currentTime = new Date().now();
    var serverTime = parseInt(document.getElementById('serverTime').innerHTML.split(':')[2]);
    return currentTime - serverTime;
}

function getSelectedDate () {
    var selectedValue = timeInput.value.trim();
    if (selectedValue.length == dateTimeFormat.length) {
        var selectedValueSplit = selectedValue.split(' ');
        timeInput.style.cssText = 'background-color: green;';
        return createDateObject(selectedValueSplit[1], selectedValueSplit[0]);
    }
    timeInput.style.cssText = 'background-color: red;';
    return null;
}

function getServerDate () {
    var dateString = document.getElementById('serverDate').innerHTML;
    var timeString = document.getElementById('serverTime').innerHTML;

    return createDateObject(dateString, timeString);
}

function createDateObject (dateString, timeString) {
    var dateStringSplit = dateString.split('/');
    var timeStringSplit = timeString.split(':');

    var day = parseInt(dateStringSplit[0]);
    var month = parseInt(dateStringSplit[1]) - 1;
    var year = parseInt(dateStringSplit[2]);

    var hour = parseInt(timeStringSplit[0]);
    var minute = parseInt(timeStringSplit[1]);
    var second = parseInt(timeStringSplit[2]);

    return new Date(year, month, day, hour, minute, second);
}

function getDuration () {
    var durationText = document.querySelector('#command-data-form > table:nth-child(8) > tbody > tr:nth-child(4) > td:nth-child(2)').innerHTML;
    return parseInt(removeColons(durationText));
}

function addDuration (timeInt) {
    var durationText = document.querySelector('#command-data-form > table:nth-child(8) > tbody > tr:nth-child(4) > td:nth-child(2)').innerHTML.split(':');
    timeInt += durationText[0] ;
    return parseInt(durationText);
}
