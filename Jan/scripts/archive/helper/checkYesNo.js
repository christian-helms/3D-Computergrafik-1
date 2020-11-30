'use strict';

function checkYesNo(answer) {
    switch (answer) {
        case 'y':
        case 'Y':
        case 'z':
        case 'Z':
        case 'j':
        case 'J':
            return true;
        case 'n':
        case 'N':
        default:
            return false;
    }
}

module.exports = checkYesNo;
