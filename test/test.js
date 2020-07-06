let expect = require('chai').expect;
let med = require('fast-levenshtein');
let chars = require('../chardata.json');
let defs = require('../definitions.json');
let CharUtils = require('../cutils');

if (typeof Path2D == 'undefined') Path2D = (class Path2DMock { });
let util = new CharUtils(chars, defs, med, true);
let HistQ = util.HistQ;

describe('Word', function () {
  it('should wrap a sequence of characters', function () {

    let word = util.getWord('拒簽');

    expect(word.literal).to.equal('拒簽');
    expect(word.literal[0]).to.equal('拒');
    expect(word.literal[1]).to.equal('簽');

    // -1(none), 0(left), 1(right), max(both)
    for (var i = 0; i < word.characters.length; i++) {
      expect(word.characters[i].parts.length).to.equal(2);
      expect(word.characters[i].parts[0]).to.equal(Number.MAX_SAFE_INTEGER);
      expect(word.characters[i].parts[1]).to.equal(Number.MAX_SAFE_INTEGER);
    }

    expect(word.characters[0].matches.length).to.equal
      (word.characters[0].cstrokes[0].length + word.characters[0].cstrokes[1].length);
    expect(word.characters[0].cstrokes.length).to.equal(2);
    expect(word.characters[0].parts.length).to.equal(2);

    // char 0 -> '拒'
    expect(word.characters[0].matches.length).to.equal(7);
    expect(word.characters[0].cstrokes[0].length).to.equal(3);
    expect(word.characters[0].cstrokes[1].length).to.equal(4);

    let strokeCount = 0;
    let cstrokes = word.characters[0].cstrokes;
    for (var i = 0; i < cstrokes.length; i++) {
      strokeCount += cstrokes[i].length;
    }
    expect(word.characters[0].matches.length).to.equal(strokeCount);

    expect(word.characters[1].matches.length).to.equal
      (word.characters[1].cstrokes[0].length + word.characters[1].cstrokes[1].length);
    expect(word.characters[1].cstrokes.length).to.equal(2);
    expect(word.characters[1].parts.length).to.equal(2);

    // char 1 -> '簽'
    expect(word.characters[1].cstrokes[0].length).to.equal(6);
    expect(word.characters[1].cstrokes[1].length).to.equal(13);
    expect(word.characters[1].matches.length).to.equal(19);

    strokeCount = 0;
    cstrokes = word.characters[1].cstrokes;
    for (let i = 0; i < cstrokes.length; i++) {
      strokeCount += cstrokes[i].length;
    }
    expect(word.characters[1].matches.length).to.equal(strokeCount);
  });
});

describe('HistQ', function () {
  it('should act like a history queue (stack)', function () {
    let hq = new HistQ(5);
    expect(hq.size()).to.equal(0);
    expect(hq.isEmpty()).to.equal(true);
    for (var i = 0; i < 5; i++) hq.add(i);
    expect(hq.size()).to.equal(5);
    hq.add(5);
    expect(hq.size()).to.equal(5);
    expect(hq.peek()).to.equal(5);
    expect(hq.pop()).to.equal(5);
    expect(hq.size()).to.equal(4);
    expect(hq.isEmpty()).to.equal(false);
  });

  it('should handle property checks', () => {
    let hq = new HistQ(5);
    for (var i = 0; i < 5; i++) {
      hq.add({ name: 'foo' + i, id: i });
    }
    expect(hq.size()).to.equal(5);
    expect(hq.query('name', 3)).eq(false);
    expect(hq.query('name', 'foo3')).eq(true);
    expect(hq.query('id', 3)).eq(true);
  })
  it('should handle function tests', () => {
    let hq = new HistQ(5);
    for (var i = 0; i < 5; i++) {
      hq.add({ name: 'foo' + i, id: i });
    }
    expect(hq.test(cand => cand.id === 3)).eq(true);
  });

});

describe('Utils', function () {

  it('should compute standard edit distance ', function () {

    let s1 = 'The dog',
      s2 = 'The cat';
    expect(util.editDist.get(s1, s2)).to.equal(3);

    s1 = 'The dog';
    s2 = '';
    expect(util.editDist.get(s1, s2)).to.equal(7);

    s1 = "fefnction";
    s2 = "faunctional";
    expect(util.editDist.get(s1, s2)).to.equal(4);

    s1 = "intention";
    s2 = "execution";
    expect(util.editDist.get(s1, s2)).to.equal(5);
  });

  it('should pad the string with ？', function () {
    expect(util.pad('aaa', 3)).to.equal('aaa');
    expect(util.pad('a', 3)).to.equal('a？？');
    expect(util.pad('', 3)).to.equal('？？？');
    expect(util.pad('AA', 3)).to.equal('AA？');
    expect(util.pad('aaa', 2)).to.equal('aaa');
    expect(util.pad('a', 0)).to.equal('a');
    expect(util.pad('', 1)).to.equal('？');
  });

  it('should compute the custom edit dist for single chinese chars', function () {
    expect(util.minEditDistance('拒', '拒')).to.equal(0); // exact
    expect(util.minEditDistance('拒', '捕')).to.equal(1); // match decomp + 1 part
    expect(util.minEditDistance('拒', '價')).to.equal(2); // match decomp only
    expect(util.minEditDistance('拒', '三')).to.equal(3); // nothing
  });


  it('should compute the custom edit dist for 2-char chinese words', function () {

    //first char same, 2nd different
    // expect(util.minEditDistance('拒拒', '拒拒')).to.equal(0); // exact
    // expect(util.minEditDistance('拒拒', '拒捕')).to.equal(1); // match decomp + half
    // expect(util.minEditDistance('拒拒', '拒價')).to.equal(2); // match decomp only
    // expect(util.minEditDistance('拒拒', '拒三')).to.equal(3); // nothing
    //
    // expect(util.minEditDistance('拒拒', '拒三')).to.equal(3); // one different (non-matching decomp) -> 3

    // added cost param to raise them each by one
    // expect(util.minEditDistance('拒拒', '三三')).to.equal(7); // both different(0 matched decomps) -> 6
    // expect(util.minEditDistance('拒拒', '捕三')).to.equal(5); // both different(1 matched decomp)  -> 5
    // expect(util.minEditDistance('拒拒', '捕價')).to.equal(4); // both different(2 matched decomp)  -> 4
  });

  it('should return set of 2-char words with same MED', function () {
    let test = util.randWord(2).literal;
    let bets = util.bestEditDistance(test);
    let dist = util.minEditDistance(test, bets[0]);
    for (var i = 1; i < bets.length; i++) {
      /* console.log(i+".0",test[0], 'vs', bets[i][0], util.minEditDistance(test[0], bets[i][0]));
      console.log(i + ".1", test[1], 'vs', bets[i][1], util.minEditDistance(test[1], bets[i][1])); */
      expect(util.minEditDistance(test, bets[i])).to.equal(dist);
    }
  });

  it('should return set of 1-char words with minimum MEDs', function () {

    let bet, word = util.getWord('拒');

    bet = util.bestEditDistance(word.literal, { words: ['拒', '捕', '價', '三', '簽'] });
    expect(bet.length).to.equal(1);
    expect(bet[0]).to.equal('捕'); // ignore duplicate
    expect(util.minEditDistance(word.literal, bet[0])).to.equal(1);

    bet = util.bestEditDistance(word.literal, { words: ['捕', '價', '三', '簽'] });
    expect(bet.length).to.equal(1);
    expect(bet[0]).to.equal('捕');
    expect(util.minEditDistance(word.literal, bet[0])).to.equal(1);

    bet = util.bestEditDistance(word.literal, { words: ['價', '三', '簽'] });
    expect(bet.length).to.equal(1);
    expect(bet[0]).to.equal('價');
    expect(util.minEditDistance(word.literal, bet[0])).to.equal(2);

    bet = util.bestEditDistance(word.literal, { words: ['三', '簽'] });
    expect(bet.length).to.equal(2);
    expect(util.minEditDistance(word.literal, bet[0])).to.equal(3);

    // with minMed parameter
    bet = util.bestEditDistance(word.literal, { words: ['拒', '捕', '價', '三', '簽'], minMed: 2 });
    expect(bet.length).to.equal(1);
    expect(bet).to.include('價');
    expect(bet).not.to.include('拒'); // ignore duplicate
    expect(util.minEditDistance(word.literal, bet[0])).gt(1);

    bet = util.bestEditDistance(word.literal, { words: ['捕', '價', '三', '簽'], minMed: 2 });
    expect(bet.length).to.equal(1);
    expect(bet[0]).to.equal('價');
    expect(util.minEditDistance(word.literal, bet[0])).gt(1);

    bet = util.bestEditDistance(word.literal, { words: ['價', '三', '簽'], minMed: 2 });
    expect(bet.length).to.equal(1);
    expect(bet[0]).to.equal('價');
    expect(util.minEditDistance(word.literal, bet[0])).to.equal(2);

    bet = util.bestEditDistance(word.literal, { words: ['三'], minMed: 4 });
    //console.log('got', util.minEditDistance(word.literal, '三'));
    expect(bet).to.eql([]);
  });

  it('should return word object for literal', function () {
    let word = util.getWord('拒');
    let wstr = JSON.stringify(word);
    //console.log(wstr);

    let word2 = util.getWord('拒');
    let wstr2 = JSON.stringify(word2);

    expect(wstr).to.equal(wstr2);
    expect(word.literal).to.equal(word2.literal);
    expect(word.length).to.equal(word2.length);
    expect(word.characters.length).to.equal(word2.characters.length);
    expect(word.characters[0].cstrokes.length).to.equal(word2.characters[0].cstrokes.length);
    for (var i = 0; i < word.characters[0].cstrokes.length; i++) {
      var stroke1 = word.characters[0].cstrokes[i];
      var stroke2 = word2.characters[0].cstrokes[i];
      //console.log(stroke1, stroke2);
      expect(stroke1).to.equal(stroke1);
    }

    word = util.getWord("三價");
    expect(word.literal).to.equal("三價");
  });

});