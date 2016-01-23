var safeFarm = [
	"292|395",
	"293|396",
	"295|396",
	"294|397",
	"292|398",
	"295|398",
	"295|394",
	"297|394",
	"297|395",
	"291|399",
	"290|399",
	"297|394",
	"293|399",
	"297|394",
	"296|399",
	"295|400",
	"296|400",
	"296|401",
	"296|402",
	"295|403",
	"296|403",
	"297|403",
	"299|401",
	"294|403",
	"292|402",
	"291|402",
	"298|400",
	"291|399",
	"290|399",
	"298|399"
];

var attacking = false;
var farming = false;

window.addEventListener("beforeunload", function (e) {
	if (farming && !attacking) {
  	var confirmationMessage = 'This is your farm tab, are you sure you want to leave?';

  	(e || window.event).returnValue = confirmationMessage; //Gecko + IE
  	return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
	} else {
		return null;
	}
});

chrome.extension.sendMessage({text:"getData"},function(response){
  attacking = response.attacking;
  farming = response.farming;
  if (!attacking) {
  	window.setTimeout(confirmPopup,4000);
  } else {
		setBackgroundData(false, true);
		window.setTimeout(sendAttack, 4000);
  }
});

function sendAttack() {
	document.getElementById('troop_confirm_go').click();
}

function confirmPopup() {
	if (!farming) {
		var confirm = window.confirm('Farm time!?');
		if (confirm) {
			wait();
		}
	} else {
		wait();
	}
}

function wait() {
	if (!attacking) {
		window.setTimeout(wait,1000);
		verifyAndFarm();
	}
}
function verifyAndFarm() {
	var lc_numeral = document.getElementById('units_entry_all_light');
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

function setBackgroundData(attackValue, farmingValue) {
	chrome.runtime.sendMessage({text:"setData", value:attackValue, farming:farmingValue}, function(response) {
	});
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

