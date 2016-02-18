"use strict";

window.onload = function () {
    windowLoaded = true;
    var holder = document.querySelector('#inner-border > table > tbody');

    var tr = document.createElement('tr');
    var td = document.createElement('td');
    var timeInput = document.createElement('input');

    timeInput.id = 'timeInput';
    timeInput.type = 'text';

    td.style = 'margin: 10px;';

    tr.appendChild(td);
    td.appendChild(timeInput);
    
    holder.appendChild(tr);
}


