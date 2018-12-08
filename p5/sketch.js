// http://localhost/git/Automachar/p5/index.html

var util, tid, memory, charData, wordData, actions = [];
var med = 0,
  word = 0,
  dbeng = 0,
  steps = 0,
  stepms = 1000,
  autostep = 0;

function preload() {
  charData = loadJSON('../chardata.json');
  wordData = loadJSON('../words-trad.json');
}

function setup() {
  util = new CharUtils(charData, wordData);
  memory = new util.HistQ(10);
  createCanvas(1024, 512);
  textAlign(CENTER);
  textSize(20);
  step();
}

function draw() {
  //console.log('draw');
  background(240);
  if (word.characters) {
    renderWord(word);
  } else {
    textSize(120);
    text(word, width / 2, height / 2);
    textSize(20);
  }
  text(util.def(word.literal), width / 2, height - 10);
  text("med: " + med, width - 40, 20);
  if (memory.size() > 1) text("last: " + memory.at(memory.size() - 2), 55, 20);
  noLoop();
}

function nextWord() {

  if (dbeng) {
    if (!word) word = dbeng + "";
    return ++dbeng + "";
  }

  if (!word) word = util.randWord();
  let bests = util.bestEditDist(word.literal, 0, memory);

  if (!bests || !bests.length) {
    throw Error('Died on ' + word.literal, word);
  }
  return util.getWord(bests[random(bests.length) << 0]);
}

function step(dir) {

  if (dir !== -1) {

    let next = nextWord();
    //console.log((++steps) + ")", dbeng ? next : next.literal, memory);
    med = (dbeng ? -1 : util.minEditDist(word.literal, next.literal));
    word = next;

  } else {

    // step backward
    var tmp = memory.pop();
    word = dbeng ? memory.pop() : util.getWord(memory.pop());
    if (memory.isEmpty()) {
      memory.add(dbeng ? word : word.literal);
      console.log("end-of-history");
    }
  }

  memory.add(dbeng ? word : word.literal);

  loop();

  word && console.log((++steps) + ")", dbeng ? word : word.literal, memory.q);

  autostep && stepAfterDelay()
}

function stepAfterDelay() {
  clearTimeout(tid);
  tid = setTimeout(step, stepms);
}

function keyReleased() {
  clearTimeout(tid);
  if (keyCode === RIGHT_ARROW) {
    autostep = false;
    step(1);
  }
  if (keyCode === LEFT_ARROW) {
    autostep = false;
    step(-1);
  }
  if (key == ' ') {
    autostep = !autostep;
    if (autostep) {
      step();
    } else console.log(memory);
  }
}

function renderWord(word) {
  for (var i = 0; i < word.characters.length; i++) {
    renderPath(word.characters[i], i);
  }
}

function renderPath(char, charPos, options) {

  //console.log('renderPath', char);
  var pg = options && options.renderer || this._renderer;
  if (typeof pg === 'undefined') throw Error('No renderer');
  if (typeof char.matches === 'undefined') throw Error('No matches: ' + char.character);

  var pidx = -1,
    pos = 0;

  if (options && typeof options.part != 'undefined') pidx = options.part;
  if (typeof charPos != 'undefined' && charPos > 0) pos = charPos;

  //console.log(char.character, pidx);

  var paths = [];
  if (pidx > -1) {
    for (var i = 0; i < char.matches.length; i++) {
      if (char.matches[i] == pidx) {
        paths.push(new Path2D(char.strokes[i]));
      }
    }
  } else {
    for (var i = 0; i < char.strokes.length; i++) {
      paths.push(new Path2D(char.strokes[i]));
    }
  }

  var ctx = pg.drawingContext,
    adjust = true;

  for (var i = 0; i < paths.length; i++) {
    if (adjust) {
      ctx.translate(0, 512 - 70); // shift for mirror
      if (pos > 0) ctx.translate(512, 0); // shift for mirror
      ctx.scale(.5, -.5); // mirror-vertically
    }

    ctx.fillStyle = "#000";
    if (ctx.isPointInPath(paths[i], mouseX, mouseY)) {
      ctx.fillStyle = "#d00";
    }

    ctx.fill(paths[i]);

    /*
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 6;
    ctx.stroke(paths[i]);
    */

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
  }
}
