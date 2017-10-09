var sockets = [];
var gameSelected = false;
var selectedGame;

document.addEventListener("onGameOver", function(e){
    var object = {type:'gameOver', content: {points: e.detail.points, ranking: e.detail.ranking}};
    sockets[e.detail.player].socket.emit('event', JSONstringify(object));
});

// adds a new player
// prepare HTML (add div for the pin and QR-Code and fade out the slogan and the getPin-button)
// open new socket and add it to the sockets-array
// call function createSocket with the created socket and the playerCount to listen for the server
// send getPin to the server to request a pin
function addPlayer(){
    var playerCount = sockets.length;

    $("#getPin")[0].style.display = "none";
    $('#slogan')[0].style.display = "none";

    var pinDisplay = '<div class="pinDisplay"><div class="qrcode" id="qrcode' + playerCount + '"></div><div class="pin" id="pin' + playerCount + '"></div></div>';
    $('#pinContainer').append(pinDisplay);
    $('#pin' + playerCount)[0].style.display = "block";
    $('#pin' + playerCount).text('generate pin ...');


    sockets[playerCount] = {socket:io.connect({forceNew: true}), status:false, secure:true};
    createSocket(sockets[playerCount].socket, playerCount);

    var object = {player:playerCount, pin:''};
    sockets[playerCount].socket.emit('getPin', JSONstringify(object));
}

function createSocket(socket, player){

    // display pin and QR-Code
    socket.on('getPin', function (response) {
        var responseObject = JSONparse(response);
        $('#pin' + responseObject.player).text('Player ' + (Number(responseObject.player)+1) + ' Pin: ' + responseObject.pin);


        $('#qrcode' + responseObject.player).qrcode({
            text	: responseObject.pin,
            height  : 100,
            width   : 100
        });
    });

    // check pin and check if all players are connected
    // if all players are connected, the function gameReady is called
    socket.on('checkPin', function (msg) {
        var serverObject = JSONparse(msg);

        serverObject.player = player;
        if(serverObject.status === true){
            $('#pin' + player).text("Player " + Number(player+1) + " connected");
            $('#qrcode' + player).text("");
            $('#qrcode' + player)[0].style.backgroundColor = "transparent";
            $('#qrcode' + player).append('<img class="ok_image" src="/img/sketch/ok_white.png" />');


            socket.emit('checkPin', JSONstringify(serverObject));

            sockets[player].status = true;

            if(gameSelected){
                var allConnected = true;
                sockets.forEach(function(entry){
                    allConnected = allConnected && entry.status;
                });
                if(allConnected){
                    gameReady();
                }
            }
        }
    });

    socket.on('event', function (msg) {
        var object = JSONparse(msg);

        // mobile-device sends a gameSelection,
        // browser add new Player and the required pins and QR-Codes
        if(object.type === 'selectGame'){
            selectedGame = object.content;

            gameSelected = true;

            $('#game-title').text(selectedGame.name);

            if(selectedGame.player === 1){
                gameReady();
            }else{
                for(var i = 1; i < Number(selectedGame.player); i++){
                    addPlayer();
                }
            }
        }
        if(object.type === 'startGame'){
            document.dispatchEvent(new CustomEvent("onStartGame"));
        }
        if(object.type === 'positionUpdate'){
            var content = object.content;
            positionUpdateTrigger(player, content.x, content.y,content.z)
        }
        if(object.type === 'key'){
            document.dispatchEvent(new CustomEvent("onDisplayButtonPressed", { "detail": {player:player, button:object.content} }));
        }
        if(object.type === 'speedTest'){
            socket.emit('event', msg);
        }
        if(object.type === 'refreshPage'){
            location.reload();
        }
    });

    socket.on('disconnect', function(){
        location.reload();
    });
}

// function gets called when the socket recived a positionUpdate from a mobile-device
// prepare the recived data and trigger a onPositionUpdate-Event, which the games can register for
function positionUpdateTrigger(player, alphaLocal, betaLocal, gammaLocal){

    gammaLocal *= 1.5;
    betaLocal *= 1.5;

    if (betaLocal > 90) {
        betaLocal = 90
    }else if (betaLocal < -90) {
        betaLocal = -90
    }
    if (gammaLocal > 90) {
        gammaLocal = 90
    }else if (gammaLocal < -90) {
        gammaLocal = -90
    }

    betaLocal += 90;  //wert zwischen 0 und 180
    gammaLocal += 90; //wert zwischen 0 und 180

    document.dispatchEvent(new CustomEvent("onPositionUpdate", { "detail": {player:player, alpha: alphaLocal, beta:betaLocal, gamma:gammaLocal } }));
}

// is called when all players are connected
// sends a gameReady event to all mobile-devices
// and starts the selectedGame
function gameReady(){
    var object = {type:'gameReady', content:selectedGame};
    sockets.forEach(function(entry){
        entry.socket.emit('event', JSONstringify(object));
        $('#pinContainer')[0].style.display = "none";
    });

    $('#game-container')[0].style.display = "block";


    switch (selectedGame.id){
        case 0:
            StartPingPong();
            break;
        case 1:
            // start Tetris
            break;
        case 2:
            StartSpaceInvaders();
            break;
    }
}

// set some attributes when the browserwindos gets rezised
function setWindowHeigth(){
    $('#headline')[0].style.height = window.innerHeight-80 + 'px';
    $('#slogan')[0].style.top = window.innerHeight-450 + 'px';

    $('#game-canvas')[0].style.height = window.innerHeight-310 + 'px';
    $('#game-canvas')[0].style.width = $('.container').width() - 20 + 'px';
}

// initiate the imageSlider in the info-section
$("#slider4").responsiveSlides({
    auto: false,
    nav: true,
    speed: 500
});