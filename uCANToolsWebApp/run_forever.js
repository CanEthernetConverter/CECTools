var forever = require('forever-monitor');

  var child = new (forever.Monitor)('serwer.js', {
    silent: true,
    args: []
  });

  child.on('exit', function () {
    console.log('serwer.js has exited');
  });

  child.on('restart', function() {
      console.error('Forever restarting script for ' + child.times + ' time');
  });


  child.start();
