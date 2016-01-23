var safeFarm = [
	"289|400",
	"289|401",
	"290|399",
	"291|399",
	"291|402",
	"292|391",
	"292|395",
	"292|398",
	"292|402",
	"293|396",
	"293|399",
	"293|404",
	"293|405",
	"294|391",
	"294|397",
	"294|403",
	"294|404",
	"295|394",
	"295|396",
	"295|398",
	"295|400",
	"295|403",
	"296|391",
	"296|399",
	"296|400",
	"296|401",
	"296|402",
	"296|403",
	"296|405",
	"297|394",
	"297|395",
	"297|403",
	"297|404",
	"297|405",
	"297|406",
	"298|394",
	"298|395",
	"298|396",
	"298|399",
	"299|401"
];

var attacking = false;
var farming = false;

window.onbeforeunload = function (e) {
	if (farming && !attacking) {
		return 'This is your farm tab, are you sure you want to leave?';
	}
	return undefined;
};

chrome.runtime.onMessage.addListener(function (message, sender, callback) {
	if (message.text == 'start') {
		farming = true;
		loop();
	} else if (message.text == 'stop') {
		farming = false;
	}
});

window.onload = function() {
	chrome.extension.sendMessage({text:"getData"},function(response){
		attacking = response.attacking;
		farming = response.farming;
		if (farming && !attacking) {
			loop();
		} else if (attacking) {
			setBackgroundData(false, true);
			window.setTimeout(sendAttack, 1000);
		}
	});
	chrome.extension.sendMessage({text:"showAction"},function(response){
	});
}

function sendAttack() {
	document.getElementById('troop_confirm_go').click();
}

function loop() {
	if (!attacking && farming) {
		window.setTimeout(loop,1000);
		verifyAndFarm();
	}
}
function verifyAndFarm() {
	var lc_numeral = document.getElementById('units_entry_all_light');
	if (lc_numeral != undefined) {
		var lc_count = lc_numeral.innerHTML;
		lc_count = lc_count.replace('(','').replace(')','');
		if (lc_count >= 5) {
			var lc_input = document.getElementById('unit_input_light');
			lc_input.value = 5;
			var coord_input = document.querySelector('#place_target > input');
			var selectedFarm = selectFarm();
			coord_input.value = selectedFarm;
			console.log("Attacking: " + selectedFarm);

			setBackgroundData(true, true);

			document.getElementById('target_attack').click();
			attacking = true;
		}
	}
}

function selectFarm() {
	var index = parseInt(Math.random() * safeFarm.length);
	var currentAttack;
	var currentAttackString;
	var tempIndex = 2;
	//Check for current attack
	while (true) {
		currentAttack = document.querySelector("#content_value > table:nth-child(10) > tbody > tr:nth-child(" + tempIndex + ") > td:nth-child(1) > span.quickedit-out > span > a > span");
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
}

function setBackgroundData(attackValue, farmingValue) {
	chrome.runtime.sendMessage({text:"setData", value:attackValue, farming:farmingValue}, function(response) {
	});
}

