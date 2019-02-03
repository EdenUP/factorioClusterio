const assert = require('assert');

const remoteMap = require('./index.js');

describe('remoteMap/index.js', () => {
  it('exports a single class (or at least a function)', () => {
    assert.equal(typeof remoteMap, 'function');
  });
});
