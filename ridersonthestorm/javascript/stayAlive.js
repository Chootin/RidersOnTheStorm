var stayAliveText;

window.addEventListener('load', function () {
	//Can be made invisible with css and still interacted with.
    if (stayAliveText == undefined) {
	    stayAliveText = document.createElement('span');
	    document.getElementsByTagName('body')[0].appendChild(stayAliveText);
	    saloop();
    }
});

function saloop () {
	stayAliveText.innerHTML = Math.random();
	stayAliveText.click();
	window.setTimeout(saloop, 1000);
}
