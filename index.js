var utils = require('ServerUtils.js');

function init(){
    var expressApp = require('express')();
    var httpServer = require('http').Server(expressApp);
    var socketio = require('socket.io')(httpServer);


    // routing for the files on the server
    expressApp.get('/', function(req, res){
        res.sendFile(__dirname + '/indexBrowser.html');
    });
    expressApp.get('/mobile', function(req, res){
        res.sendFile(__dirname + '/indexMobile.html');
    });
    expressApp.get('/*/*', function(req, res){
        res.sendFile(__dirname + req.url);
    });
    expressApp.get('/google41cb69150a57b485.html', function(req, res){
        res.sendFile(__dirname + '/google41cb69150a57b485.html');
    });

    socketio.on('connection', function(localSocket){
        var pairedSocket;
        var pin;


        // browser request a pin from the server, server reply with the generated pin
        localSocket.on('getPin', function(msg){
            pin = utils.GenerateUniquePin();

            utils.SocketsAndPins().set(pin, {socket:localSocket, timestamp: new Date()});
            utils.LogMsg("New BrowserSocketAndPin (" + pin + ")");

            var object = utils.JSONparse(msg);
            var response = {player:object.player, pin: pin};
            localSocket.emit('getPin', utils.JSONstringify(response));
        });

        // check a pin and pair with the socket
        localSocket.on('checkPin', function(msg){
            var resiveObject = utils.JSONparse(msg);

            var socketAndPin = utils.SocketsAndPins().get(resiveObject.pin);

            if(typeof(socketAndPin) !== "undefined"){ // pin found in the SocketsAndPins HashMap

                pairedSocket = socketAndPin.socket;

                if(!resiveObject.status){ // checkPin from mobile device, sends the checkPin proceed to the browser
                    pin = resiveObject.pin;
                    utils.SocketsAndPins().get(resiveObject.pin).socket = localSocket;

                    if( utils.IsSocketValid(pairedSocket)){
                        resiveObject.status = true;
                        pairedSocket.emit('checkPin', utils.JSONstringify(resiveObject));
                    }else{
                        utils.NotConnectedError(localSocket);
                    }
                }else{ // checkPin from the browser, remove the SocketAndPin from the HashMap and proceed to the mobile device (connection is ok)
                    if(utils.IsSocketValid(pairedSocket)){
                        utils.SocketsAndPins().remove(resiveObject.pin);
                        pairedSocket.emit('checkPin', utils.JSONstringify(resiveObject));
                    }else{
                        utils.NotConnectedError(localSocket);
                    }
                }

            }else{  // no pin in the SocketsAndPin HashMap
                resiveObject.status = false;
                localSocket.emit('checkPin', utils.JSONstringify(resiveObject));
            }
        });

        // load the gamelist from the server
        localSocket.on('loadGameList', function(msg){
            var gameList = {games:utils.GameList()};
            localSocket.emit('loadGameList', utils.JSONstringify(gameList));
        });

        localSocket.on('event', function(msg){
            if(utils.IsSocketValid(pairedSocket)){
                pairedSocket.emit('event', msg);
            }else{
                utils.NotConnectedError(localSocket);
            }
        });

        // a socket.io tag, gets called when the connection is closed
        localSocket.on('disconnect', function(){
            if(utils.IsSocketValid(pairedSocket)){
                pairedSocket.disconnect();
            }
            utils.LogMsg('Browser disconnected. Pin: ' + pin);
        });
    });

	utils.LogMsg('start server on ' + (process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080));
	utils.LogMsg('start server on ' + (process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'));
    // start the server on port (3000) or on the OpenShift specific port
    httpServer.listen(
        process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
        process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
        function(){
            utils.LogMsg('Browserapp listening on *:8080');
        }
    );

    // call the function every utils.CheckTimeInterval() and remove old SocketsAndPins
    // from the list with the stored timestamp
    setInterval(function(){
        var deadline = new Date() - utils.CheckTimeInterval();
        utils.SocketsAndPins().forEach(function(value, key){
            if(value.timestamp < deadline){
                utils.SocketsAndPins().remove(key);
                utils.LogMsg('remove ' + key + ' from SocketsAndPins');
            }
        });
    }, utils.CheckTimeInterval());

}

// start the server
init();