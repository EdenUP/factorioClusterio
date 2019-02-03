const needle = require('needle');


class UPSdisplay {
  constructor(slaveConfig, msgInterface, extras) {
    this.config = slaveConfig;
    this.messageInterface = msgInterface;
    this.socket = extras.socket;

    this.historicalTicks = [];
    setInterval(() => {
      this.messageInterface('/silent-command rcon.print(game.tick)', (data) => {
        this.tick = Number(data);
        this.historicalTicks[this.historicalTicks.length] = { tick : Number(data), timestamp : Date.now() };
        if (this.historicalTicks.length > 30) {
          this.historicalTicks.shift(); // delete last element in array (position 0);
        }
      });
    }, 1000);
    setInterval(() => {
      if (this.historicalTicks && this.historicalTicks[0]) {
        const timePeriod = this.historicalTicks[this.historicalTicks.length - 1].timestamp - this.historicalTicks[0].timestamp;
        const ticksInPeriod = this.historicalTicks[this.historicalTicks.length - 1].tick - this.historicalTicks[0].tick;
        const UPS = Math.round(ticksInPeriod / (timePeriod / 1000));
        // console.log("UPS: " + UPS);
        try {
          needle.post(`${this.config.masterIP}:${this.config.masterPort}/api/editSlaveMeta`, { instanceID : this.config.unique, password : this.config.clientPassword, meta : { UPS, tick : this.tick } }, { headers : { 'x-access-token' : this.config.masterAuthToken } }, (err, resp) => {
            // success?
          });
        } catch (err) {
          console.log(err);
        }
      }
    }, 5000);
    this.messageInterface("/silent-command game.print('UPSdisplay enabled')");
  }
}
module.exports = UPSdisplay;
