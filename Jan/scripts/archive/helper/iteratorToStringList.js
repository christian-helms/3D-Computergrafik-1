'use strict';

function iteratorToStringList(it) {
    return [...it].map(s => ` - ${s}`).join('\n');
}

module.exports = iteratorToStringList;
