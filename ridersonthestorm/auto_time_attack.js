"use strict";

var landingTime;
var timeInput;

var stayAliveText;

window.addEventListener('load', function {
	windowLoaded = true;
	if (document.getElementById('troop-confirm-go') != undefined) {
		var holder = document.querySelector('#inner-border > table > tbody');
		landingTime = document.querySelector('#date_arrival > span');


		var text = document.createElement('span');
		var tr = document.createElement('tr');
		var td = document.createElement('td');
		timeInput = document.createElement('input');

		timeInput.id = 'timeInput';
		timeInput.type = 'text';

		text.innerHTML = 'Arrival time: ';

		text.style.cssText = 'margin-left: 10px;';

		tr.appendChild(td);
		td.appendChild(text);
		td.appendChild(timeInput);
	
		holder.appendChild(tr);


		stayAliveText = document.createElement('span');
		document.getElementsByTagName('body')[0].appendChild(stayAliveText);

		timer();
	}
});

function getTimeRemaining () {
	return landingTime.innerHTML.split(' ')[2];
}

function timer () {
	var remaining = getTimeRemaining();
	var selectedTimeRemaining = timeInput.value.trim();

	stayAliveText.innerHTML = Math.random();
	stayAliveText.click();

	console.log(remaining, selectedTimeRemaining);

	if (selectedTimeRemaining.length == 8 && selectedTimeRemaining.trim() != '' && remaining >= selectedTimeRemaining) {
		document.getElementById('troop_confirm_go').click();
	} else {
		window.setTimeout(timer, 300);
	}
}




