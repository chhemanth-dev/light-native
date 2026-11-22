const m = require('./out/light-subtasks.js');
console.log('parseSubtask =', JSON.stringify(m.parseSubtask("play despacito on youtube", {lastApp:"youtube", timestamp: Date.now()}), null, 1));
console.log('splitMultiStep =', JSON.stringify(m.splitMultiStep("open youtube and then play despacito")));
