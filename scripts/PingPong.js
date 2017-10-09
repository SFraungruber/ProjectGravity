/**
 * Created by SFraungruber on 20.05.2015.
 */
var SIZE_PADDLE = [50, 2];
var OnGameStarted = false;
var pingPong;

function PingPong() {
    var canvas = document.getElementById("game-canvas");
    this.width = canvas.width;
    this.height = canvas.height;
    this.context = canvas.getContext("2d");
    this.context.fillStyle = "black";
    this.position = new EventListener();
    this.running = false;

    this.p1 = new Paddle(this.width/2 - SIZE_PADDLE[0]/2, 5 + SIZE_PADDLE[1]);
    this.display1 = new Display(10, this.height/4);
    this.p2 = new Paddle(this.width/2 - SIZE_PADDLE[0]/2, this.height  - SIZE_PADDLE[1]);
    this.display2 = new Display(10, this.height*3/4);

    this.ball = new Ball();
    this.ball.x = this.width/2;
    this.ball.y = this.height/2;
    this.ball.vy = 5;
    this.ball.vx = Math.floor(Math.random()*5);
}
PingPong.prototype.draw = function()
{
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.fillRect(0, this.height/2, this.width, 2);
    this.context.fillRect(0, 5 + SIZE_PADDLE[1], 2, this.height);
    this.context.fillRect(this.width - 2, 5 + SIZE_PADDLE[1], 2, this.height);

    this.p1.draw(this.context);
    this.p2.draw(this.context);

    this.ball.draw(this.context);

    this.display1.draw(this.context);
    this.display2.draw(this.context);
};

PingPong.prototype.update = function()
{
    if (this.paused)
        return;

    this.ball.update();
    this.display1.value = this.p1.score;
    this.display2.value = this.p2.score;

    this.p1.x = (this.position.P1Position() * (this.width/180)) - SIZE_PADDLE[0]/2;
    this.p2.x = this.position.P2Position() * (this.width/180) - SIZE_PADDLE[0]/2;

    // collision with paddle
    if (this.ball.vy > 0) { // ball geht nach unten
        if (this.p2.y <= this.ball.y + this.ball.height &&
            this.p2.y > this.ball.y - this.ball.vy + this.ball.height) {

            if((this.ball.x + this.ball.width) >= this.p2.x && this.ball.x <= (this.p2.x+this.p2.width)){
                this.ball.vy = -this.ball.vy;

                if(this.ball.x <= (this.p2.x + SIZE_PADDLE[0]/5)){
                    this.ball.vx -= 3;
                }else{
                    if(this.ball.x >= (this.p2.x + SIZE_PADDLE[0] - SIZE_PADDLE[0]/5)){
                        this.ball.vx += 3;
                    }
                }
            }
        }
    } else {
        if (this.p1.y + this.p1.height >= this.ball.y) {

            if((this.ball.x + this.ball.width) >= this.p1.x && this.ball.x <= (this.p1.x+this.p1.width)){
                this.ball.vy = -this.ball.vy;

                if(this.ball.x <= (this.p2.x + SIZE_PADDLE[0]/5)){
                    this.ball.vx -= 3;
                }else{
                    if(this.ball.x >= (this.p2.x + SIZE_PADDLE[0] - SIZE_PADDLE[0]/5)){
                        this.ball.vx += 3;
                    }
                }
            }
        }
    }
    if (this.ball.y >= this.height)
        this.score(this.p1);
    else if (this.ball.y + this.ball.height <= 0)
        this.score(this.p2);

    // Top and bottom collision
    if ((this.ball.vx < 0 && this.ball.x < 0) ||
        (this.ball.vx > 0 && this.ball.x + this.ball.width > this.width)) {
        this.ball.vx = -this.ball.vx;
    }
};
PingPong.prototype.score = function(p)
{
    // player scores
    p.score++;

    if(p.score >= 10){  // game over
        if(this.p1.score < this.p2.score){
            document.dispatchEvent(new CustomEvent("onGameOver", { "detail": {player:0, points: this.p1.score, ranking:2} }));
            document.dispatchEvent(new CustomEvent("onGameOver", { "detail": {player:1, points: this.p2.score, ranking:1} }));
        }else{
            document.dispatchEvent(new CustomEvent("onGameOver", { "detail": {player:0, points: this.p1.score, ranking:1} }));
            document.dispatchEvent(new CustomEvent("onGameOver", { "detail": {player:1, points: this.p2.score, ranking:2} }));
        }

        this.running = false;

        this.p1 = new Paddle(this.width/2 - SIZE_PADDLE[0]/2, 5 + SIZE_PADDLE[1]);
        this.p2 = new Paddle(this.width/2 - SIZE_PADDLE[0]/2, this.height  - SIZE_PADDLE[1]);

        this.ball = new Ball();
        this.ball.x = this.width/2;
        this.ball.y = this.height/2;
        this.ball.vy = 5;
        this.ball.vx = Math.floor(Math.random()*5);
    }

    // set ball position
    this.ball.x = this.width/2;
    this.ball.y = this.height/2;

    // set ball velocity
    this.ball.vx = Math.floor(Math.random()*9 + 0.5) - 5;
};

function Paddle(x,y) {
    this.x = x;
    this.y = y;
    this.width = SIZE_PADDLE[0];
    this.height = SIZE_PADDLE[1];
    this.score = 0;
}
Paddle.prototype.draw = function(p)
{
    p.fillRect(this.x, this.y, this.width, this.height);
};

function Ball() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.width = 6;
    this.height = 6;
}

Ball.prototype.update = function()
{
    this.x += this.vx;
    this.y += this.vy;
};

Ball.prototype.draw = function(p)
{
    p.fillRect(this.x, this.y, this.width, this.height);
};

function Display(x, y) {
    this.x = x;
    this.y = y;
    this.value = 0;
}

Display.prototype.draw = function(p)
{
    p.fillText(this.value, this.x, this.y);
};

function EventListener() {
    this.p1Position = 0;
    this.p2Position = 0;

    this.updatePosition = function(e) {
        if(e.detail.player == 0){
            this.p1Position = e.detail.beta;
            console.log('update position ' + this.p1Position);
        }else{
            this.p2Position = e.detail.beta;
        }
    };
    document.addEventListener("onPositionUpdate", this.updatePosition.bind(this));


    this.startGame = function(e) {
        pingPong.running = true;
    };
    document.addEventListener("onStartGame", this.startGame.bind(this));
}
EventListener.prototype.P1Position = function()
{
    return this.p1Position;
};
EventListener.prototype.P2Position = function()
{
    return this.p2Position;
};

function StartPingPong(){
    if(!OnGameStarted){
        OnGameStarted = true;
        pingPong = new PingPong();

        function MainLoop() {
            if(pingPong.running){
                pingPong.update();
                pingPong.draw();
            }
            // Call the main loop again at a frame rate of 30fps
            setTimeout(MainLoop, 33.3333);
        }
        MainLoop();
    }
}
