module.exports = function (app) {
  app.get('/', (req, res) => {
    res.render('index');
  });
  app.get('/nodes', (req, res) => {
    res.render('nodes');
  });
  app.get('/settings', (req, res) => {
    res.render('settings');
  });
  app.get('/nodeDetails', (req, res) => {
    res.render('nodeDetails');
  });
  app.get('/remoteMap', (req, res) => {
    res.render('remoteMap');
  });
};
