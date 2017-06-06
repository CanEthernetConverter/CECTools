var fs = require('fs');
var os = require("os");
var config = require('./../config.json');

console.logCopy = console.log.bind(console);

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

console.log = function(data)
{
      var d = new Date();
      var currentDate = (d.toLocaleTimeString('pl-PL')) + "." + pad(d.getMilliseconds(),4) +':';
      fs.appendFileSync(config.CANLogDir +  config.CANLogPath, currentDate + data + os.EOL);
/*    fs.appendFile(config.CANLogDir +  config.CANLogPath, currentDate + data + os.EOL, function(err){
      if (err != null)
        console.logCopy("Append err " + err);
    });*/
    console.logCopy(currentDate + data);
};

