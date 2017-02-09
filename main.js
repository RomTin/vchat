var WebSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');
var login = require('facebook-chat-api');
var async = require('async');
var qs = require('querystring');
var config = require('config');

var zo = '1742983145941866';
var email = config.email;
var pass = config.pass;
var room = '';
var fbapi;
var connection;

// login to facebook
login({email: email, password: pass},
    function callback (err, api) {
      if(err) return console.error(err);
      fbapi = api;

      api.setOptions({listenEvents: true});
      api.listen(
          function(err, event){
            if(event.type == "message" ){
              console.log(event.body);
              connection.send(event.body);
            }
          });
      fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
    });

/* --login using appstate file--
   login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))},
   function callback (err, api) {
   if(err) return console.error(err);
   });
   */
var server = http.createServer(function(req,res){
  if(req.url == '/' && req.method == 'GET'){
    fs.readFile('./index.html',function (err, data){
      res.writeHead(200,
          {'Content-Type': 'text/html',
            'Content-Length': data.length});
      res.write(data);
      res.end();
    });
  }else{
    res.statusCode = 404;
    res.end("Not Found");
  }
});

server.listen(8080, function() {
  console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  //currently allow all origins
  return true;
}

wsServer.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      fbapi.sendMessage(message.utf8Data, zo);
    }
  });
  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});
