var WIDTH = 640,//window.innerWidth,
    HEIGHT = 480,//window.innerHeight,
    speed = 0.4, // overall game speed
    gameTime = 30,
    reloadTimeout = 3000,
    fullMag = 8,
    enemyScoreArr = [1, 2, 5],
    enemyXVelsArr = [9, 7, 5],
    enemyScaleArr = [1, 0.7, 0.45];


    
var touchSupported,
    context,
    queue,
    Image,
    stage,
    targets = [],
    container,
    spriteSheet,
    score = 0,
    scoreText,
    shotsLeft = fullMag,
    reloading,
    gameTimer,
    timerText,
    prmQue = {},
    Ease = createjs.Ease;

window.onload = function() {

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
    
    // hide mouse cursor when roll over the stage
    stage.canvas.style.cursor = "none";
    
    // keep tracking the mouse even when it leaves the canvas
    stage.mouseMoveOutside = true;

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


    
    var storage = window.localStorage;
    var key = 'userScores';
    var value = storage.getItem(key); // Pass a key name to get its value.
     // Pass a key name and its value to add or update that key.
    storage.setItem(key, 'test')
console.log( storage.getItem(key) );
    // Pass a key name to remove that key from storage.
    storage.removeItem(key)
console.log( storage.getItem(key) );
}

function queueLoaded(event) {

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
    timerText.x = 500;
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

    // Create  sprites
    targets.push(createTarget());
    targets.push(createTarget());
//console.log(targets);
    
//    toggleCache(1);
    
    // Create crosshair
    crossHair = new createjs.Bitmap(queue.getResult("crossHair"));
    crossHair.x = -100;
    crossHair.regX = 45;
    crossHair.regY = 45;
    if(touchSupported) {
        crossHair.scaleX = 0.5;
        crossHair.scaleY = 0.5;
    }
    stage.addChild(crossHair);

    // Add ticker
    createjs.Ticker.setFPS(16/*Math.round(12 * speed)*/);
    createjs.Ticker.addEventListener('tick', stage);
    createjs.Ticker.addEventListener('tick', tickEvent);

    // Set up events AFTER the game is loaded
    touchSupported = 'ontouchstart' in window;
//console.log(touchSupported);
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

function createTarget() {
//    setTimeout(function() {
    
        // create inner animation
        var anim = new createjs.Sprite(spriteSheet, "flap");
        anim.regX = 99;
        anim.regY = 58;
        anim.gotoAndPlay("flap");

        // create container
        var itm = new createjs.Container();
        itm.addChild(anim);

        // set up direction, z-level and associated speed
        itm.xDir = getRandomInt(0, 1) ? -1 : 1; // -1 = move left, +1 = move right
        itm.zDist = getEvenedRandInt('zDist', 0, 2);//getRandomInt(0, 2);

        //itm.scaleX = (1 / (itm.zDist + 1)).toFixed(1);
        //itm.scaleY = (1 / (itm.zDist + 1)).toFixed(1);
        itm.scaleX = enemyScaleArr[itm.zDist];
        itm.scaleY = enemyScaleArr[itm.zDist];

        itm.width = itm.getTransformedBounds().width;
        itm.height = itm.getTransformedBounds().height;
    
        itm.score = enemyScoreArr[itm.zDist];

        itm.x = itm.xDir != 1
            ? WIDTH + itm.width
            : itm.width * -1;
        itm.y = getEvenedRandInt('y', itm.height, HEIGHT - itm.height, 50);

        var b = Math.round(enemyXVelsArr[itm.zDist] * speed);
        var a = b - (b / 100 * 15);
        var c = b + (b / 100 * 15);
        itm.xVel = getEvenedRandInt('xVel', a, c);
//console.log('itm.xVel ' + itm.xVel);
//console.log('a ' + a + ' b ' + b + ' c ' + c);

        // up/down movement
        createjs.Tween.get(anim, {loop: true}).to({y: anim.y + getRandomInt(itm.height/2, itm.height-itm.height/4)}, getRandomInt(700, 850), Ease.backInOut).call(function() {});

        // mouse down actions
        itm.on("mousedown", function (evt) {
    //console.log(evt.currentTarget.id);
            if(reloading) return;
            Death(evt.currentTarget);
            createjs.Sound.play("deathSound");
            stage.removeChild(evt.currentTarget);
            targets.removeObj('id', evt.currentTarget.id);
            
            targets.push(createTarget());
            targets.push(createTarget());

            score += 100 * evt.currentTarget.score;
            scoreText.text = "1UP: " + score.toString();
            
            speed = speed + 0.05;
            createjs.Ticker.setFPS(16/*Math.round(12 * speed)*/);
    //console.log("FPS: " + createjs.Ticker.getFPS());
        });

        stage.addChildAt(itm, 1);
        stage.setChildIndex(itm, itm.zDist);

        debug: {
            //console.log('itm.id: ' +itm.id );
            // console.log((getEvenedRandInt('xDir', 0, 1) ? -1 : 1) + ' : ' + (getRandomInt(0, 1) ? -1 : 1));
            // console.log('itm.xDir ' + itm.xDir);
            // console.log('findEnemyProp() ' + findEnemyProp('xDir', itm.xDir));
            // console.log('findEnemyProp() ' + findEnemyProp('zDist', getRandomInt(0, 2)));
            // console.log(prmQue);
            // console.log(prmQue[6].zDist);
            // console.log(itm.zDist + ' | ' + getRandomInt(0, 2));
        }
        return itm;
//    }, 1500/*getEvenedRandInt('enTime', 500, 2500, 250)*/);
}

function Death(_target) {
    var anim = new createjs.Sprite(DeathSpriteSheet, "die");
    anim.regX = 99;
    anim.regY = 58;
    anim.x = _target.x;
    anim.y = _target.y;
    anim.scaleX = (1 / (_target.zDist + 1)).toFixed(1);
    anim.scaleY = (1 / (_target.zDist + 1)).toFixed(1);
    anim.gotoAndPlay("die");
    stage.addChild(anim);
}

function tickEvent() {
    // iterate through targets
    for (var i = 0; i < targets.length; i++) {
        var itm = targets[i];

        // check out of bounds
        var outOfBounds = 0;
        if(itm.xDir == 1) {
            // moves right
            if(itm.x >= WIDTH + itm.width) {
                outOfBounds = 1;
            }
        } else {
             // moves left
            if(itm.x <= itm.width * -1) {
                outOfBounds = 1;
            }
        }

        if(outOfBounds) {
//console.log( "outOfBounds itm.id " + itm.id );
            stage.removeChild(itm);
            targets.removeObj('id', itm.id);
            if(gameTime > 0) {
                targets.push(createTarget());
            }
            continue;
        }

        // move
        itm.x += itm.xVel * itm.xDir;

        debug: {
            // console.log(targets);
            // console.log(targets.length);
            // console.log( "itm.id " + itm.id );
            // console.log( "itm.xDir " + itm.xDir );
            // console.log( "itm.zDist " + itm.zDist );
            // console.log( "itm.xVel " + itm.xVel );
            // console.log( "itm.x " + itm.x );
            // console.log( "itm.scaleX " + itm.scaleX );
            // console.log( "itm.scaleY " + itm.scaleY );
            //console.log('-------');
        }
    }
}

function handleMouseMove(event) {
    crossHair.x = event.clientX;
    crossHair.y = event.clientY;
//console.log('crossHair.visible ' + crossHair.visible);
//console.log('crossHair.x ' + crossHair.x);
//console.log('crossHair.y ' + crossHair.y);
}

function handleMouseDown(event) {
//console.log(event);
    if(reloading) return;
    
    
    // touch device
    if(touchSupported) {
//console.log(event.touches[0].clientX);
        crossHair.x = event.touches[0].clientX;
        crossHair.y = event.touches[0].clientY;
        crossHair.alpha = 1;
        createjs.Tween.get(crossHair).to({alpha: 0}, 400, Ease.getPowIn(2.2)).call(function() {});
        
        createjs.Tween.get(crossHair).to({scaleX: 1.3, scaleY: 1.3}, 400, Ease.getPowIn(2.2)).call(function() {
            crossHair.scaleX = 0.5;
            crossHair.scaleY = 0.5;
        });
    }
    
    //Play Gunshot sound
    createjs.Sound.play("shot");
    
    // mag
    shotsLeft -= 1;
    if(shotsLeft < 1) {
        crossHair.visible = false;
        reloading = window.setTimeout(function() {
            clearInterval(reloading);
            reloading = false;
            shotsLeft = fullMag;
            crossHair.visible = true;
        }, reloadTimeout);
    }

    //Obtain Shot position
/*    var shotX = Math.round(event.clientX);
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
//	    setTimeout(createTarget,timeToCreate);
    } else
    {
    	//Miss
    	score -= 10;
//    	scoreText.text = "1UP: " + score.toString() + touchSupported.toString();

    }
*/
}

function updateTime() {
	gameTime -= 1;
	if(gameTime <= 0) {
        clearInterval(gameTimer);

        //End Game and Clean up
		timerText.text = "GAME OVER";

        for (var idx in targets) {
            Death(targets[idx]);
            stage.removeChild(targets[idx]);
        }
        targets = [];
		
        stage.removeChild(crossHair);
        
        createjs.Sound.removeSound("shot");
        createjs.Sound.removeSound("background");
//        var si = createjs.Sound.play("gameOverSound");
		
 	} else {
		timerText.text = "Time: " + gameTime
//        createjs.Sound.play("tick");
	}
}

function getEvenedRandInt(itmAtr, _randMin, _randMax, _raster, _maxQLen) {

    if(_maxQLen === undefined) {
        _maxQLen = 6;
    }
    var maxQLen = Math.round(_maxQLen);
    var randMin = Math.round(_randMin);
    var randMax = Math.round(_randMax);
    var raster = Math.round(_raster);
    var qLen = randMax - randMin <= maxQLen ? randMax - randMin : maxQLen;
    var randAtr = getRandomInt(randMin, randMax);
/*console.log('randMax ' + randMax + typeof _randMax);
console.log('randAtr ' + randAtr + typeof randAtr);
console.log('qLen ' + qLen + typeof qLen);
*/

    if(prmQue[itmAtr] === undefined) {
        prmQue[itmAtr] = [];
    }
 
    if(raster) {
        randAtr = Math.round(randAtr / raster) * raster;
//console.log('randAtr raster ' + randAtr);
    }

    // check duplicates
    var f = prmQue[itmAtr].indexOf(randAtr);
    if(f != -1) {
        if(prmQue[itmAtr].length >= qLen) {
            // pick first, clear queue
            randAtr = prmQue[itmAtr].shift();
            prmQue[itmAtr] = [];
        } else {
//            if() {
                
                var x = 0;
                while(prmQue[itmAtr].indexOf(randAtr) != -1) {
                    x++;

                    randAtr = raster
                        ? Math.round(getRandomInt(randMin, randMax) / raster) * raster
                        : getRandomInt(randMin, randMax);

//console.log('randAtr '+randAtr);
//console.log('indexOf(randAtr) '+f);
//console.log('indexOf(randAtr) '+prmQue[itmAtr].indexOf(randAtr));
//console.log('x '+x);
                    if(x > 100) break;
                }
//            }
        }
    }
//console.log(prmQue[itmAtr]);

    // add to list
    prmQue[itmAtr].push(randAtr);
//console.log(prmQue);
//console.log('pushed ' + itmAtr + ' : ' + Math.round(randAtr));

    return Math.round(randAtr);
}

function getRandomInt(min, max) { 
    return Math.floor(Math.random() * (max - min +1)) + min; 
}

// Remove Element
Array.prototype.removeObj = function(key, val) {
    var i;
    outerloop: for (var idx in this) {
        // skip loop if the property is from prototype
        if (!this.hasOwnProperty(idx)) continue;

        var obj = this[idx];
        for (var prop in obj) {
            if(!obj.hasOwnProperty(prop)) continue;

            if(key == prop && obj[prop] === val) {
                i = idx;
                break outerloop;
            }
        }
    }    
    
    return i>-1 ? this.splice(i, 1) : [];
};

/* unused *
function findEnemyProp(key, val) { 
    for (var idx in targets) {
        // skip loop if the property is from prototype
        if (!targets.hasOwnProperty(idx)) continue;

        var obj = targets[idx];
        for (var prop in obj) {
            if(!obj.hasOwnProperty(prop)) continue;

            if(key == prop && obj[prop] === val) {
                return idx;
            }
        }
    }
    return -1;
}
    
function targetsById(_id) {
    for (var i = 0; i < targets.length; i++) {
        var x = targets[i];
        if( targets[i].id == _id ){
            return targets[i];
        }
    }
}
*/
