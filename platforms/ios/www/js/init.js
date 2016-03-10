var touchSupported,
    context,
    queue,
    WIDTH = 640,//window.innerWidth,
    HEIGHT = 480,//window.innerHeight,
    Image,
    stage,
    animation,
    container,
    deathAnimation,
    spriteSheet,
    enemyXPos = 0,
    enemyYPos = 100,
    speed = 1.2, // overall game speed
    score = 0,
    scoreText,
    gameTimer,
    gameTime = 0,
    timerText,
    Ease = createjs.Ease;

window.onload = function()
{
    app.initialize();

    /*
     *      Set up the Canvas with Size and height
     *
     */
    var canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');
    context.canvas.width = WIDTH;
    context.canvas.height = HEIGHT;
    stage = new createjs.Stage("myCanvas");
    
    // enable touch interactions if supported on the current device:
	createjs.Touch.enable(stage);

    /*
     *      Set up the Asset Queue and load sounds
     *
     */
    queue = new createjs.LoadQueue(false);
    queue.installPlugin(createjs.Sound);
    queue.on("complete", queueLoaded, this);
    createjs.Sound.alternateExtensions = ["ogg"];

    /*
     *      Create a load manifest for all assets
     *
     */
    queue.loadManifest([
        {id: 'backgroundImage', src: 'assets/background.png'},
        {id: 'crossHair', src: 'assets/crosshair.png'},
        {id: 'shot', src: 'assets/shot.mp3'},
        {id: 'background', src: 'assets/countryside.mp3'},
        {id: 'gameOverSound', src: 'assets/gameOver.mp3'},
        {id: 'tick', src: 'assets/tick.mp3'},
        {id: 'deathSound', src: 'assets/die.mp3'},
        {id: 'Spritesheet', src: 'assets/Spritesheet.png'},
        {id: 'Death', src: 'assets/Death.png'},
    ]);
    queue.load();

    /*
     *      Create a timer that updates once per second
     *
     */
    gameTimer = setInterval(updateTime, 1000);

}

function queueLoaded(event)
{

    // Add background image
//    var backgroundImage = new createjs.Bitmap(queue.getResult("backgroundImage"))
//    stage.addChild(backgroundImage);

    //Add Score
    scoreText = new createjs.Text("1UP: " + score.toString(), "36px Arial", "#FFF");
    scoreText.x = 10;
    scoreText.y = 10;
    stage.addChild(scoreText);

    //Ad Timer
    timerText = new createjs.Text("Time: " + gameTime.toString(), "36px Arial", "#FFF");
    timerText.x = 800;
    timerText.y = 10;
    stage.addChild(timerText);

    // Play background sound
    var snd_background = createjs.Sound.play("background", {loop: -1});
    snd_background.volume = 0.0;

    // Create  spritesheet
    spriteSheet = new createjs.SpriteSheet({
        "images": [queue.getResult('Spritesheet')],
        "frames": {"width": 198, "height": 117},
        "animations": { "flap": [0,4] }
    });

    // Create  death spritesheet
    DeathSpriteSheet = new createjs.SpriteSheet({
    	"images": [queue.getResult('Death')],
    	"frames": {"width": 198, "height" : 148},
    	"animations": {"die": [0,7, false,1 ] }
    });

    // Create  sprite
    enemies = [];
    enemies.push(createEnemy());
    enemies.push(createEnemy());
    enemies.push(createEnemy());
    enemies.push(createEnemy());
//console.log(enemies);
    
    // Create crosshair
    crossHair = new createjs.Bitmap(queue.getResult("crossHair"));
    crossHair.x = -100;
    stage.addChild(crossHair);

    // Add ticker
    createjs.Ticker.setFPS(Math.round(12 * speed));
    createjs.Ticker.addEventListener('tick', stage);
    createjs.Ticker.addEventListener('tick', tickEvent);

    // Set up events AFTER the game is loaded
    touchSupported = 'ontouchstart' in window;
console.log(touchSupported);
    //var startEvent = touchSupported ? 'touchstart' : 'mousedown';
    //var moveEvent = touchSupported ? 'touchmove' : 'mousemove';
    //var endEvent = touchSupported ? 'touchend' : 'mouseup';
    
    if(touchSupported) {
        window.ontouchstart = handleMouseDown;
    } else {
        window.onmousemove = handleMouseMove;
    }
    window.onmousedown = handleMouseDown;
}

function createEnemy()
{
	// create inner animation
    animation = new createjs.Sprite(spriteSheet, "flap");
    animation.regX = 99;
    animation.regY = 58;
    animation.gotoAndPlay("flap");
    
    // create animation container
    enemy = new createjs.Container();
    enemy.addChild(animation);

    // fade in
//    enemy.alpha = 0;
//    createjs.Tween.get(enemy, {loop: false}).to({alpha: 1}, 750, Ease.getPowIn(2.2)).call(handleComplete);
    function handleComplete() {
        //Tween complete
    }

    // set up direction, z-level and associated speed
    enemy.xDir = getRandomInt(0, 1) ? -1 : 1; // -1 = move left, +1 = move right
    //enemy.xDir = uniqEnemyProp('xDir');
//console.log('uniqEnemyProp(xDir) ' + uniqEnemyProp('xDir'));
    
    enemy.zDist = getRandomInt(0, 2);
    
    enemy.scaleX = (1 / (enemy.zDist + 1)).toFixed(1);
    enemy.scaleY = (1 / (enemy.zDist + 1)).toFixed(1);
    
    enemy.width = enemy.getTransformedBounds().width;
    enemy.height = enemy.getTransformedBounds().height;
    
    enemy.x = enemy.xDir != 1
        ? WIDTH + enemy.width
        : enemy.width * -1;
    enemy.y = getRandomInt(enemy.height, HEIGHT - enemy.height);

    enemyXVelsArr = [10, 7, 5];
    enemy.xVel = Math.round(enemyXVelsArr[enemy.zDist]);
    
    // up/down movement
    createjs.Tween.get(animation, {loop: true}).to({y: animation.y + getRandomInt(enemy.height/2, enemy.height)}, 750, Ease.backInOut).call(handleComplete);

    // mouse down actions
    enemy.on("mousedown", function (evt) {
        console.log(evt.currentTarget.id);
        Death(evt.currentTarget);
        stage.removeChild(evt.currentTarget);
    	
        enemies.remove(evt.currentTarget.id);
        enemies.push(createEnemy());
    	
        score += 100;
    	scoreText.text = "1UP: " + score.toString();

        speed = speed + 0.1;
        createjs.Ticker.setFPS(Math.round(12 * speed));
console.log("FPS: " + createjs.Ticker.getFPS());
    });
    stage.addChildAt(enemy, 1);
    stage.setChildIndex(enemy, enemy.zDist);

    return {'id': enemy.id, 'xDir': enemy.xDir, 'zDist': enemy.zDist};
}

function Death(_target)
{
    deathAnimation = new createjs.Sprite(DeathSpriteSheet, "die");
    deathAnimation.regX = 99;
    deathAnimation.regY = 58;
    deathAnimation.x = _target.x;
    deathAnimation.y = _target.y;
    deathAnimation.scaleX = (1 / (_target.zDist + 1)).toFixed(1);
    deathAnimation.scaleY = (1 / (_target.zDist + 1)).toFixed(1);
    deathAnimation.gotoAndPlay("die");
    stage.addChild(deathAnimation);
	createjs.Sound.play("deathSound");
}

function tickEvent()
{
    // iterate through the enemies and move them according to their velocity and zLevel
    var l = stage.getNumChildren() - 1;
    for (var i = 0; i < l; i++) {
        var shape = stage.getChildAt(i);
        
        if( typeof shape != 'undefined' && enemiesById(shape.id) ) {
/*
console.log( "shape.id " + shape.id );
console.log( "shape.xDir " + shape.xDir );
console.log( "shape.zDist " + shape.zDist );
console.log( "shape.xVel " + shape.xVel );
console.log( "shape.x " + shape.x );
console.log( "shape.scaleX " + shape.scaleX );
console.log( "shape.scaleY " + shape.scaleY );
*/

            // check out of bounds
            var outOfBounds = 0;
            if(shape.xDir == 1) {
                // moves right
                if(shape.x >= WIDTH + shape.width) {
                    outOfBounds = 1;
                }
            } else {
                 // moves left
                if(shape.x <= shape.width * -1) {
                    outOfBounds = 1;
                }
            }
            if(outOfBounds) {
console.log( "outOfBounds shape.id " + shape.id );
                stage.removeChild(shape);
                enemies.remove(shape.id);
                enemies.push(createEnemy());
                continue;
            }
//console.log(enemies);
//console.log(enemies.length);


            // move
            shape.x += shape.xVel * shape.xDir;
//console.log(shape.xVel * shape.xDir);
//console.log(shape.scaleX*enemy.zDist/10);            
            //shape.scaleX += *enemy.zDist/10;
//console.log('-------');

        }
    }
}

function handleMouseMove(event)
{
    //Offset the position by 45 pixels so mouse is in center of crosshair
    crossHair.x = event.clientX-45;
    crossHair.y = event.clientY-45;
}

function handleMouseDown(event)
{
//console.log(event);
    
    // touch device
    if(touchSupported) {
console.log(event.touches[0].clientX-45);
        crossHair.x = event.touches[0].clientX-45;
        crossHair.y = event.touches[0].clientY-45;
        crossHair.alpha = 1;
        createjs.Tween.get(crossHair).to({alpha: 0}, 400, Ease.getPowIn()).call(function() {
            //crossHair.alpha = 0;
        });
        //createjs.Tween.get(crossHair).to({scaleX: 1.5, scaleY: 1.5}, 200, Ease.getPowIn()).call();
    
    }
    
    //Play Gunshot sound
    createjs.Sound.play("shot");

    //Obtain Shot position
    var shotX = Math.round(event.clientX);
    var shotY = Math.round(event.clientY);
    var spriteX = Math.round(enemy.x);
    var spriteY = Math.round(enemy.y);

    // Compute the X and Y distance using absolte value
    var distX = Math.abs(shotX - spriteX);
    var distY = Math.abs(shotY - spriteY);

    // Anywhere in the body or head is a hit - but not the wings
    if(distX < 30 && distY < 59 )
    {
    	//Hit
//    	stage.removeChild(enemy);
//    	Death();
//    	score += 100;
//    	scoreText.text = "1UP: " + score.toString();

    	//Create new enemy
//    	var timeToCreate = Math.floor((Math.random()*3500)+1);
//	    setTimeout(createEnemy,timeToCreate);
    } else
    {
    	//Miss
    	score -= 10;
//    	scoreText.text = "1UP: " + score.toString() + touchSupported.toString();

    }
}

function updateTime()
{
	gameTime += 1;
	if(gameTime > 60)
	{
		//End Game and Clean up
		timerText.text = "GAME OVER";
		stage.removeChild(enemy);
		stage.removeChild(crossHair);
        createjs.Sound.removeSound("background");
//        var si = createjs.Sound.play("gameOverSound");
		clearInterval(gameTimer);
	}
	else
	{
		timerText.text = "Time: " + gameTime
//        createjs.Sound.play("tick");
	}
}

function uniqEnemyProp(_name) { 
    for (var i = 0; i < enemies.length; i++) {
        var x = enemiesById(enemies[i].id);
console.log(enemies[i]);
console.log(enemies[i].id);
        var y = eval('x.'+_name);
//console.log(x.xDir);
//console.log('y '+y);
    }
}
    
function enemiesById(_id) {
    for (var i = 0; i < enemies.length; i++) {
        var x = enemies[i];
        if( enemies[i].id == _id ){
            return enemies[i];
        }
    }
}

function getRandomInt(min, max) { 
    return Math.floor(Math.random() * (max - min +1)) + min; 
}

// Removing One Array Element
if (!Array.prototype.remove) {
  Array.prototype.remove = function(val) {
    var i = this.indexOf(val);
         return i>-1 ? this.splice(i, 1) : [];
  };
}
