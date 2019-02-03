const assert = require('assert');
const child_process = require('child_process');
const luamin = require('luamin');
const isFactorioCommand = require('_app/isFactorioCommand');
const nock = require('nock');

// sinon does weird prototype manipulation and so doen't need to be saved to anything.
require('mocha-sinon');
const sinon = require('sinon');
const functions = require('./interfacingFunctions');

describe('inventoryImports/interfacingFunctions.js', () => {
  describe('handleInventory(inventory, config)', () => {
    const config = {
      masterIP   : 'localhost',
      masterPort : 8080,
    };
    it('returns false if given invalid input', () => {
      assert(functions.handleInventory('this is a string') === false, 'when given strings it should return false and do nothing');
    });
    it('Sends post requests and outputs factorio commands', (done) => {
      const inventory = {
        players : {
          Danielv123 : {
            inventory : {
              stone         : 12,
              'iron-ore'    : 120,
              'raw-wood'    : 10,
              'iron-plate'  : 8,
              'steel-plate' : 480,
            },
            requestSlots : {
              'iron-plate'  : 100,
              'steel-plate' : 480,
              'raw-wood'    : 20,
              bullshit      : 0,
            },
          },
        },
      };
      const scope = nock('http://localhost:8080')
        .post('/api/remove', (body) => {
          // check that we are requesting the right things, () to convert to boolean
          // 92 because 100 requested and 8 already in inventory
          if (body.name == 'iron-plate') assert(body.count == '92');
          // nock wants us to return true if this is the correct body and we should reply
          // if we return false we won't send a reply.
          return true;
        })
      // nock destroys the endpoints after being hit once, this changes the number of hits required for destruction
        .times(10)
      // respond with JSON object instead of url query parameters
        .reply(200, (uri, req) => {
          return req;
        }, {
          'Content-Type' : 'application/json',
          Accept         : 'application/json',
        });
      // nock logging statement .log((data) => console.log(data));

      functions.handleInventory(inventory, config, callback);
      function callback(x) {
        assert(x.includes(92) && x.includes('iron-plate'), 'it should have included the items it was going to import');
        assert(!x.includes('steel-plate'), "Inventory is already filled with steel so shouldn't be importing that");
        assert(isFactorioCommand(x), 'it should have returned a valid factorio command');
        assert(x.includes('"Danielv123"'), 'it should include the name of the player that will recieve the items');
        done();
      }
    });
    it('posts leftovers to master', (done) => {
      const inventory2 = {
        exports : {
          1 : [
            { name : 'iron-ore', count : 1200 },
            { name : 'steel-plate', count : 1337 },
            { name : 'copper-plate', count : 0 },
          ],
        },
      };
      let timesRan = 0;
      const callback = function () {
        timesRan++;
        assert(timesRan <= 2, 'placed more than 2 items, unexpeceted test result');
        if (timesRan == 2) {
          done();
        }
      };
      const scope = nock('http://localhost:8080')
        .post('/api/place', (body) => {
          // check that we are requesting the right things
          assert(body.name != 'copper-plate', 'copper plate should not be placed because it is 0');
          assert(body.count > 0, 'no need for placing 0 things');
          assert(Number(body.count) != NaN, 'count should be a number');
          callback();
          return true;
        })
      // nock destroys the endpoints after being hit once, this changes the number of hits required for destruction
        .times(10)
        .reply(200, 'affirmative');
      // if it tries using the nonexisting callback (argv 3) it will throw. It shoudln't.
      assert.doesNotThrow(() => {
        functions.handleInventory(inventory2, config);
      }, 'this here threw for some reason, remove assert.doesNotThrow for easier debugging of this issue');
    });
  });
  describe('pollInventories(outputfile)', () => {
    it('Returns a big factorio command as string', () => {
      const x = functions.pollInventories('output.txt');
      assert(typeof x === 'string', 'pollInventories() should always return a string');
      assert(isFactorioCommand(x), 'This is not a command factorio will accept, please prepend /c');
      assert(x.length > 20, "LUA string seems to short, this ain't good");
    });
    it('Returns valid LUA', () => {
      let x = functions.pollInventories('output.txt');

      // remove string added to make factorio interpret as command
      x = x.replace('/silent-command ', '').replace('/c ', '');

      let y = false;
      // luamin throws when it recieves something that is invalid LUA
      assert.doesNotThrow(() => {
        y = luamin.minify(x);
      }, 'Invalid LUA supplied');
      assert(typeof y === 'string', 'luamin does not return string???');
      assert(y.length > 20, 'Minified LUA too short, something is up');
    });
  });
  describe('insertItemsFromObject(object)', () => {
    const testObject = { 'copper-plate' : 100, 'iron-ore' : 1337 };
    const playerName = 'Danielv123';
    it('Returns undefined if any of the parameters are missing', () => {
      const x = functions.insertItemsFromObject();
      assert(x === undefined);

      const y = functions.insertItemsFromObject(testObject);
      assert(y === undefined);

      const z = functions.insertItemsFromObject(undefined, playerName);
      assert(z === undefined);
    });
    it('Throws if player name is not a string', () => {
      assert.throws(() => {
        const x = functions.insertItemsFromObject(testObject, testObject);
      }, "playerName is: 'object' instead of string!");
    });
    it('Returns a big factorio command as string', () => {
      const x = functions.insertItemsFromObject(testObject, playerName);

      assert(typeof x === 'string', 'LUA returned should be a string');
      assert(x.length > 20, 'LUA strings are quite long');
      assert(isFactorioCommand(x), 'This is not a command factorio will accept, please prepend /c');
    });
    it('The returned string is a valid factorio command', () => {
      const x = functions.insertItemsFromObject(testObject, playerName);

      assert(isFactorioCommand(x) == true);
    });
  });
  describe('parseJsString(string) => object', () => {
    it('converts a string with JS object notation to object', () => {
      const x = functions.parseJsString("{hello:'thisAString!', yes:function(){return 'JS string!'}, not:'json'}");
      assert(!!x == true, 'Should under no circumstance return a falsey value, even !!{} is truthy');
      assert(typeof x === 'object', 'parseJsString should return an object in this case');
      assert(typeof x.yes === 'function', 'parseJsString is not JSON, so it should be able to contain functions');
    });
    it('*Tries* to avoid XSS attempts by throwing on certain symbols', () => {
      assert.throws(() => {
        const x = functions.parseJsString("{};throw 'fail'");
      }, (err) => {
        const error = `${err}`;
        /* istanbul ignore else */
        if (error.includes('parseJsString might have gotten something that could be a xss attempt')) {
          return true;
        }
      }, 'should throw when ; are passed because those are the simplest form of xss');
    });
  });
});
