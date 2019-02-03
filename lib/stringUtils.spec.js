const assert = require('assert');
const stringUtils = require('./stringUtils');

describe('stringUtils.js', () => {
  describe('hashCode', () => {
    it('Produces a 32bit signed int hash from a string', () => {
      const x = stringUtils.hashCode('whatever');
      const y = stringUtils.hashCode(' a much longer string to prove this works for long strings as well and also special characters &!¤(#)¤');

      assert(typeof x === 'number', 'hashCode should be returning a 32 bit signed int');
      assert(x.toString() == '1934383586');
      assert(y.toString() == '1648886132');
    });
    const permutations = 1000;
    it(`Rarely produces same hash for different strings (${permutations} hashes with collision check)`, () => {
      const keyHashPairs = [];
      for (let i = 0; i < permutations; i++) {
        const string = Math.random().toString();
        keyHashPairs.push({
          key  : string,
          hash : stringUtils.hashCode(string),
        });
      }

      for (let i = 0; i < permutations; i++) {
        for (let o = 0; o < permutations; o++) {
          assert(i == o || keyHashPairs[o].key != keyHashPairs[i].key, 'Woha, Math.random() generated 2 equal numbers???');
          assert(i == o || keyHashPairs[o].hash != keyHashPairs[i].hash, "Hash collision, as long at it doesn't happen again its fine.");
        }
      }
    });
    it('Returns 0 for 0 length strings', () => {
      const x = stringUtils.hashCode('');
      assert.deepEqual(x, 0);
    });
    it('Throws when supplied with anything other than a string', () => {
      assert.throws(() => {
        stringUtils.hashCode([]);
      }, 'ERROR: Not a string');
      assert.throws(() => {
        stringUtils.hashCode({});
      }, 'ERROR: Not a string');
      assert.throws(() => {
        stringUtils.hashCode(0);
      }, 'ERROR: Not a string');
    });
  });
});
