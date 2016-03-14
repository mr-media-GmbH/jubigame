var WIDTH = window.innerWidth,//640,
    HEIGHT = window.innerHeight,//480,
    FPS = 16,
    speed = 0.7, // overall game speed
    gamePlayTime = 45,
    reloadTimeout = 3000,
    fullMag = 8,
    enemyScoreArr = [1, 2, 5],
    enemyXVelsArr = [9, 7, 5],
    enemyScaleArr = [1, 0.7, 0.45];


    
var touchSupported,
    context,
    queue,
    stage,
    crossHair,
    startScrn,
    gameScrn,
    targets = [],
    container,
    spriteSheet,
    score = 0,
    scoreText,
    shotsLeft = fullMag,
    reloading,
    gameTime = gamePlayTime,
    gameTimer,
    timerText,
    prmQue = {},
    Ease = createjs.Ease;

window.onload = app.initialize();


function init(){
    /* Set up the Canvas with Size and height */
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
    
    // is touchscreen?
    touchSupported = 'ontouchstart' in window;
console.log(touchSupported);
    /* Set up the Asset Queue and load sounds */
    queue = new createjs.LoadQueue(false);
    queue.installPlugin(createjs.Sound);
    queue.on("progress", queueProgress, this);
    queue.on("complete", queueLoaded, this);
    createjs.Sound.alternateExtensions = ["ogg"];

    /* Create a load manifest for all assets */
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
    
    // data storage
/*    var storage = window.localStorage;
    var key = 'userScores';
    var value = storage.getItem(key); // Pass a key name to get its value.
     // Pass a key name and its value to add or update that key.
    storage.setItem(key, 'test')
//console.log( storage.getItem(key) );
    // Pass a key name to remove that key from storage.
    storage.removeItem(key)
//console.log( storage.getItem(key) );
*/
}

function queueProgress(evt) {
    //$("#mainProgress > .progress").width(queue.progress * $("#mainProgress").width());
    console.log(Math.round(100 * queue.progress));
}

function queueLoaded(evt) {
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

    // Add stage ticker
    createjs.Ticker.setFPS(FPS);
    createjs.Ticker.addEventListener('tick', stage);

    // Set up events
    if(!touchSupported) {
        window.onmousemove = handleMove;
    }
    
    // start game loop
    gameScrn();
    startScrn();
    stage.setChildIndex(crossHair, stage.numChildren-1);
//console.log('crossHair '+stage.getChildIndex(crossHair));
//console.log('startScrn '+stage.getChildIndex(startScrn));
//console.log('gameScrn '+stage.getChildIndex(gameScrn));
}

// index: 1
function startScrn() {
    startScrn = new createjs.Container();
    startScrn.setBounds(0, 0, WIDTH, HEIGHT);
    
    // background
    var bg = new createjs.Shape();
    bg.graphics.beginFill("#000").drawRect(0, 0, WIDTH, HEIGHT);

    // start button
    startBtn = new createjs.Container();
    
    var btnTxt = new createjs.Text("S T A R T", "36px Arial", "#FFF");
    //btnTxt.x = 100;
    //btnTxt.y = 100;
    var hit = new createjs.Shape();
    hit.graphics.beginFill("#000").drawRect(0, 0, WIDTH, HEIGHT);
    btnTxt.hitArea = hit;
    btnTxt.addEventListener('mousedown', function() {
        createjs.Sound.play("shot");
        startScrn.visible = 0;
        countDown(3);
    });
/*    btnTxt.ontouchstart = function() {
        createjs.Sound.play("shot");
        startScrn.visible = 0;
        countDown(3);
    }*/
    startBtn.addChild(btnTxt);
    startBtn.x = WIDTH / 2 - startBtn.getBounds().width / 2;
    startBtn.y = HEIGHT / 2 - startBtn.getBounds().height / 2;
    startScrn.addChild(bg);
    startScrn.addChild(startBtn);
    stage.addChild(startScrn);
}

function showStartScrn() {
//    stage.setChildIndex(startScrn, stage.numChildren-1);
//    stage.setChildIndex(crossHair, stage.numChildren-1);
    
    createjs.Sound.registerSound('assets/shot.mp3', 'shot');

    startScrn.alpha = 0;
    startScrn.visible = 1;
    createjs.Tween.get(startScrn).to({alpha: 1}, 250).call(function() {
        timerText.text = "Time: " + gameTime.toString();
        scoreText.text = "1UP: " + score.toString();
    });
    
    // kill events
    if(touchSupported) {
        window.ontouchstart = '';
    } else {
        window.onmousedown = '';
    }
}

function countDown(cnt) {
    var _num = new createjs.Text(cnt, "36px Arial", "#FFF");
    _num.x = WIDTH / 2;
    _num.y = HEIGHT / 2;
    _num.regX = _num.getBounds().width / 2;
    _num.regY = _num.getBounds().height / 2;
    _num.scaleX = 25;
    _num.scaleY = 25;
    _num.alpha = 0;
    gameScrn.addChild(_num);
    createjs.Tween.get(_num).to({scaleX: 0, scaleY: 0, alpha: 1}, 500, Ease.getPowln).call(function() {
        gameScrn.removeChild(_num);
        if(typeof cnt == 'number' && cnt > 0) {
            cnt -= 1;
            if(cnt > 0) {
                countDown(cnt);
            } else {
                countDown('GO!');
            }
        } else {
            playGame();
        }
    });
}

// index: 0
function gameScrn() {
    gameScrn = new createjs.Container();
    gameScrn.setBounds(0, 0, WIDTH, HEIGHT);
    
    // Add background image
    var backgroundImage = new createjs.Bitmap(queue.getResult("backgroundImage"))
    gameScrn.addChild(backgroundImage);

    //Add Score
    scoreText = new createjs.Text("1UP: 0", "36px Arial", "#FFF");
    scoreText.x = 10;
    scoreText.y = 10;
    gameScrn.addChild(scoreText);

    //Ad Timer
    timerText = new createjs.Text("Time: " + gameTime.toString(), "36px Arial", "#FFF");
    timerText.x = 500;
    timerText.y = 10;
    gameScrn.addChild(timerText);
    
    stage.addChild(gameScrn);
}

function playGame() {
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

     // Play background sound
    var snd_background = createjs.Sound.play("background", {loop: -1});
    snd_background.volume = 0.0;

   // Create sprites
    targets.push(createTarget());
    targets.push(createTarget());
//console.log(targets);
    
    // timer that updates once per second
    gameTimer = setInterval(updateTime, 1000);

    // Add game ticker
    createjs.Ticker.addEventListener('tick', tickEvent);

    // Set up events AFTER the game is loaded
    if(touchSupported) {
        window.ontouchstart = handleDown;
    } else {
        window.onmousedown = handleDown;
    }
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
            gameScrn.removeChild(evt.currentTarget);
            targets.removeObj('id', evt.currentTarget.id);
            
            targets.push(createTarget());
            targets.push(createTarget());

            score += 100 * evt.currentTarget.score;
            scoreText.text = "1UP: " + score.toString();
            
            speed = speed + 0.05;
        });

        gameScrn.addChild(itm);
        gameScrn.setChildIndex(itm, itm.zDist + 1);
        debug: {
            //console.log('itm '+gameScrn.getChildIndex(itm));
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
    gameScrn.addChild(anim);
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
            gameScrn.removeChild(itm);
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

function handleMove(evt) {
    crossHair.x = evt.clientX;
    crossHair.y = evt.clientY;
//console.log('crossHair.visible ' + crossHair.visible);
//console.log('crossHair.x ' + crossHair.x);
//console.log('crossHair.y ' + crossHair.y);
}

function handleDown(evt) {
    crossHair.x = touchSupported ? evt.touches[0].clientX : evt.clientX;
    crossHair.y = touchSupported ? evt.touches[0].clientY : evt.clientY;

    if(reloading) return;
    
    // touch device
    if(touchSupported) {
//console.log(evt.touches[0].clientX);
//        crossHair.x = evt.touches[0].clientX;
//        crossHair.y = evt.touches[0].clientY;
        createjs.Tween.removeTweens(crossHair);
        crossHair.alpha = 1;
        createjs.Tween.get(crossHair).to({alpha: 0}, 400, Ease.getPowIn(2.2)).call(function() {});
        
        createjs.Tween.get(crossHair).to({scaleX: 1.3, scaleY: 1.3}, 400, Ease.getPowIn(2.2)).call(function() {
            crossHair.scaleX = 0.5;
            crossHair.scaleY = 0.5;
        });
    }
    
    // play sound
    createjs.Sound.play("shot");

    // mag
    shotsLeft -= 1;
    if(shotsLeft < 1) {
        //crossHair.visible = false;
        createjs.Tween.removeTweens(crossHair);
        crossHair.scaleX = 1;
        crossHair.scaleY = 1;
        createjs.Tween.get(crossHair, {loop: true}).to({alpha: 0}, 300, Ease.getPowInOut(2.2));
        
        reloading = window.setTimeout(function() {
            clearInterval(reloading);
            reloading = false;
            shotsLeft = fullMag;
            createjs.Tween.removeTweens(crossHair);
            crossHair.alpha = 1;
            if(touchSupported) {
                crossHair.alpha = 0;
            }
        }, reloadTimeout);
    }

    //Obtain Shot position
/*    var shotX = Math.round(evt.clientX);
    var shotY = Math.round(evt.clientY);
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
        //End Game and Clean up
		timerText.text = "GAME OVER";

        for (var idx in targets) {
            Death(targets[idx]);
            gameScrn.removeChild(targets[idx]);
        }
        targets = [];
		
//        stage.removeChild(crossHair);
        
        createjs.Sound.removeSound("shot");
        createjs.Sound.stop("background");
//        var si = createjs.Sound.play("gameOverSound");
		
        createjs.Tween.removeTweens(crossHair);
        crossHair.alpha = 1;

        // remove game ticker
        createjs.Ticker.removeEventListener('tick', tickEvent);
        
        score = 0;
        shotsLeft = fullMag;

        gameTime = gamePlayTime;
        clearInterval(gameTimer);
        
        setTimeout(showStartScrn, 1000);
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
