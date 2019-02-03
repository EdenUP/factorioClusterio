const fileOps = require('_app/fileOps');
const config = require('./../config');

module.exports = {
  sync() {
    let instances;
    try {
      instances = fileOps.getDirectoriesSync(config.instanceDirectory);
    } catch (e) {
      // there are no instances created yet, probably missing the folder
      instances = [];
    }
    return instances;
  },
};
