var socket = io();
var sendPositionReady = false;


socket.on('checkPin',function(msg){
    var serverObject = JSONparse(msg);

    if(serverObject.status === true){
        $('#connectionStatus').text("Verbunden");

        if(serverObject.player === 0){
            var object = {filter:null};
            socket.emit("loadGameList", JSONstringify(object));
        }
    }else {
        $('#connectionStatus').text("Problem mit der Verbindung!");
    }
});

socket.on('loadGameList',function(msg){
    var pairContainer = $('#pairContainer')[0];
    pairContainer.style.display = "none";

    var gameListContainer = $('#gameListContainer')[0];
    var serverObject = JSONparse(msg);


    gameListContainer.text = "";
    gameListContainer.style.display = "inline";
    serverObject.games.forEach(function(game) {
        var button= $('<div class="gameListElement" onclick="selectGame(' + game.id + ', \'' + game.name + '\',' + game.player + ')">' + game.name + ' (' + game.player + ')</div>');
        $('#gameListContainer').append(button);
    });
});

socket.on('event', function(msg){
    var object = JSONparse(msg);

    if(object.type === 'gameReady'){
        gameReady();
    }if(object.type === 'gameOver'){
        alert('game over' + object.content.ranking);
    }
    if(object.type === 'speedTest'){
        ('#dialog-content').append(object.content.count + ": " + Number(new Date() - new Date(object.content.date)) + "ms <br>");
    }
    if(object.type === 'notConnected'){
        alert('Not Connected!');
    }
});
socket.on('disconnect', function(){
    location.reload();
});

function selectGame(id, name, player){
    var object = {type:'selectGame', content:{id:id, name:name, player:player}};
    socket.emit('event', JSONstringify(object));
    $('#gameListContainer')[0].style.display = "none";
}

function onBtnClickCheckPin(){
    var obj = {pin:$('#checkPin').val(), status:false, player:-1};
    socket.emit('checkPin', JSONstringify(obj));
    $('#checkPin').val('');
    return false;
}
function gameReady(){
    $('#pairContainer')[0].style.display = "none";
    $('#gamepad')[0].style.display = "block";
    $('#connectionStatus').text('Zum Spielen bereit');

    sendPositionReady = true;
    startPositionUpdater();
}

function startGame(){
    var object = {type:'startGame', content:null};
    socket.emit('event', JSONstringify(object));
}
function refreshPage(){
    var object = {type:'refreshPage', content:null};
    socket.emit('event', JSONstringify(object));
}
function keyPressed(keyCode){
    var object = {type:'key', content:keyCode};
    socket.emit('event', JSONstringify(object));
}
function testConnectionSpeed(){
    $('#dialog-content').text('');

    for(var i = 1; i < 5; i++){
        var object = {type:'speedTest', content:{count: i, date: new Date()}};
        socket.emit('event', JSONstringify(object));
    }
    $('#favDialog')[0].showModal();
}

function startPositionUpdater() {
    //Check for support for DeviceOrientation event
    if(window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function(event) {

            sensorInterval = 0;
            var alpha = event.alpha;
            var beta = event.beta;
            var gamma = event.gamma;

            if(alpha!=null || beta!=null || gamma!=null) {
                if(sendPositionReady === true){
                    var object = {type:'positionUpdate', content:{x:alpha, y:beta, z:gamma}};
                    socket.emit('event', JSONstringify(object));
                    return false;
                }
            }
        }, false);
    }
}