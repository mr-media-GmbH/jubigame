var WIDTH = 640,//window.innerWidth,
    HEIGHT = 480,//window.innerHeight,
    FPS = 16,
    startSpeed = 0.5, // overall game speed
    gamePlayTime = 25,
    reloadTimeout = 3000,
    fullMag = 8,
    enemyScoreArr = [1, 2, 5],
    enemyXVelsArr = [9, 7, 5],
    enemyScaleArr = [1, 0.7, 0.45],
	mainFontFam = ' visitor_tt2_brkregular', // first char must be space
	mainFontSize = '40px',
//    sync_url = 'http://192.168.0.100/mymedia/game/submitscore.php';
//    sync_url = 'http://localhost/mr-media.de/httpdocs/game/submitscore.php';
    sync_url = 'https://demo.mr-media.de/game/';


    
var touchSupported,
	storage,
    context,
    queue,
    stage,
    crossHair,
    startScrn,
    gameScrn,
    targetCont,
    targets = [],
    container,
    spriteSheet,
	speed = startSpeed,
    score = 0,
    scoreText,
    shotsLeft = fullMag,
    reloading,
    gameTime = gamePlayTime,
    gameTimer,
    timerText,
    prmQue = {},
    Ease = createjs.Ease;


function init(){
console.log('init()');
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
//console.log(touchSupported);
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
    
    // data storage object
	storage = new Storage();
}

function queueProgress(evt) {
    //$("#mainProgress > .progress").width(queue.progress * $("#mainProgress").width());
//    console.log(Math.round(100 * queue.progress));
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
    
    var btnTxt = new createjs.Text("S T A R T", mainFontSize + mainFontFam, "#FFF");
    //btnTxt.x = 100;
    //btnTxt.y = 100;
    var hit = new createjs.Shape();
    hit.graphics.beginFill("#000").drawRect(0, 0, WIDTH, HEIGHT);
    btnTxt.hitArea = hit;
    btnTxt.addEventListener('mousedown', function() {
        createjs.Sound.play("shot");
        startScrn.visible = 0;
		$('#highscore_box').hide();
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

var x = getEvenedRandInt('x', 100, 20000, 100, 10);
//console.log('new score '+x);        
//storage.clear();
//storage.pushData('games', 'score', x);
    highScores();
}

function showStartScrn() {
    
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
    
    highScores();
}

function countDown(cnt) {
	var num = new createjs.Text(cnt, '16px' + mainFontFam, "#FFF");
	num.x = WIDTH / 2;
	num.y = HEIGHT / 2;
	num.regX = num.getBounds().width / 2;
	num.regY = num.getBounds().height;
	num.scaleX = 25;
	num.scaleY = 25;
	num.alpha = 0;
	gameScrn.addChild(num);
	createjs.Tween.get(num).to({scaleX: 1, scaleY: 1, alpha: 1}, 500, Ease.getPowln).call(function() {
		gameScrn.removeChild(num);
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

    // Add Score
    scoreText = new createjs.Text("1UP: 0", mainFontSize + mainFontFam, "#FFF");
    scoreText.x = 10;
    scoreText.y = 10;
    gameScrn.addChild(scoreText);

    // Add Timer
    timerText = new createjs.Text("Time: " + gameTime.toString(), mainFontSize + mainFontFam, "#FFF");
    timerText.x = 500;
    timerText.y = 10;
    gameScrn.addChild(timerText);
    
    // Add target screen
    targetCont = new createjs.Container();
    targetCont.setBounds(0, 0, gameScrn.getBounds().width, gameScrn.getBounds().height-40);
    targetCont.y = 30;
    gameScrn.addChild(targetCont);
//    var hit = new createjs.Shape();
//    hit.graphics.beginFill("#000").drawRect(0, 0, targetCont.getBounds().width, targetCont.getBounds().height);
//    targetCont.addChild(hit);
    
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
        itm.y = getEvenedRandInt('y', itm.height, targetCont.getTransformedBounds().height - itm.height, 50);

        var b = Math.round(enemyXVelsArr[itm.zDist] * speed);
        var a = b - (b / 100 * 15);
        var c = b + (b / 100 * 15);
        itm.xVel = getEvenedRandInt('xVel', a, c);
//console.log('itm.xVel ' + itm.xVel);
//console.log('a ' + a + ' b ' + b + ' c ' + c);

        // up/down movement (all)
        createjs.Tween.get(anim, {loop: true}).to({y: anim.y + getRandomInt(itm.height/2, itm.height-itm.height/4)}, getRandomInt(700, 850), Ease.backInOut).call(function() {});

        var hit = new createjs.Shape();
        hit.graphics.beginFill("#000").drawRect(itm.width/2*-1, itm.height/2*-1, itm.width, itm.height);
        itm.hitArea = hit;
//        itm.addChild(hit)
        // mouse down actions
        itm.on("mousedown", function (evt) {
    //console.log(evt.currentTarget.id);
            if(reloading) return;
            
            Death(evt.currentTarget);
            createjs.Sound.play("deathSound");
            targetCont.removeChild(evt.currentTarget);
            targets.removeObj('id', evt.currentTarget.id);
            
            // new targets
            targets.push(createTarget());
            targets.push(createTarget());

            score += 100 * evt.currentTarget.score;
            scoreText.text = "1UP: " + score.toString();
            
            speed = speed + 0.05;
        });

        targetCont.addChild(itm);
        targetCont.setChildIndex(itm, itm.zDist + 1);
        debug: {
            //console.log('itm '+targetCont.getChildIndex(itm));
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
//	anim.regX = 99;
//	anim.regY = 58;
	anim.regX = anim.getBounds().width / 2;
	anim.regY = anim.getBounds().height / 2;
console.log(anim.regX);
console.log(anim.regY);

	anim.x = _target.x;
	anim.y = _target.y;
	anim.scaleX = (1 / (_target.zDist + 1)).toFixed(1);
	anim.scaleY = (1 / (_target.zDist + 1)).toFixed(1);
	anim.gotoAndPlay("die");
	targetCont.addChild(anim);

	// points
	if(gameTime) {
		var bubble = new createjs.Text(100 * _target.score, mainFontSize + mainFontFam, "#FFF");
		bubble.x = _target.x;
		bubble.y = _target.y;
		bubble.regX = bubble.getBounds().width / 2;
		bubble.regY = bubble.getBounds().height / 2;
		createjs.Tween.get(bubble).to({y: bubble.y - 100, scaleX: 1.8, scaleY: 1.5, alpha: 0.2}, 400, Ease.getPowOut(2.2)).call(function() {
			targetCont.removeChild(bubble);
		});
		targetCont.addChild(bubble);
	}
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
            targetCont.removeChild(itm);
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
        crossHair.x = evt.touches[0].clientX;
        crossHair.y = evt.touches[0].clientY;
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
        createjs.Tween.get(crossHair, {loop: true}).to({alpha: 0}, 200, Ease.getPowInOut(2.2));
        
        reloading = window.setTimeout(function() {
            clearInterval(reloading);
            reloading = false;
            shotsLeft = fullMag;
            createjs.Tween.removeTweens(crossHair);
            crossHair.alpha = touchSupported ? 0 : 1;
        }, reloadTimeout);
    }
}

function updateTime() {
	gameTime -= 1;
	if(gameTime <= 0) {
        //End Game and Clean up
		timerText.text = "GAME OVER";

        for (var idx in targets) {
            Death(targets[idx]);
            targetCont.removeChild(targets[idx]);
        }
        targets = [];
		
//        stage.removeChild(crossHair);
        
        createjs.Sound.removeSound("shot");
        createjs.Sound.stop("background");
//        var si = createjs.Sound.play("gameOverSound");
		
        createjs.Tween.removeTweens(crossHair);
        crossHair.alpha = touchSupported ? 0 : 1;

        // remove game ticker
        createjs.Ticker.removeEventListener('tick', tickEvent);
        
        // store game state
		if(score) {
            storage.pushData('games', 'score', score);
        }
        
        
        speed = startSpeed;
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

function playerSpecsDialog(data, textStatus, jqXHR) {
    
	// insert div
	if( !$('#form_box').length ) {
		$('<div>').attr('id','form_box').insertBefore( "canvas" );
		var domElm = new createjs.DOMElement('form_box');
	} else {
		$('#form_box').html('');
	}
    ajaxReq({url: sync_url + 'tmpl/userform.html', crossdomain: false}, function(data) {
        $('#form_box').html(data).show();
        $('#player #name').val( storage.data.prefs.name ).focus();
        $('#player #email').val( storage.data.prefs.email );
console.log("$('#player #name').val()");
console.log($('#player #name'));
    });
	

    if(!data && !textStatus) {
		// here the user input stuff
		
	//	ajaxReq({data: {p: btoa('test3' + ":" + 'test2@test.de')}}, playerSpecsDialog, playerSpecsDialog);	
	} else {
		var ret = [];
		try {
			ret = JSON.parse(atob(data));
			
			if(ret.name && ret.email) {
				savePlayerSpecs(ret.name, ret.email);
			}
		} catch(e) { /*console.log(e)*/ }
console.log(ret);
	}
}

function savePlayerSpecs(name, email) {
	storage.data.prefs.name = name;
	storage.data.prefs.email = email;
	storage.write();

	// get global scores from server
	ajaxReq({}, onGetScoresSuccess, onGetScoresFail);
}

function showForm() {

    $('#form_box').show();

}

function showScores(arr) {
	// insert div
	if( !$('#highscore_box').length ) {
		$('<div>').attr('id','highscore_box').insertBefore( "canvas" );
		var domElm = new createjs.DOMElement('highscore_box');
	} else {
		$('#highscore_box').html('').show();
	}
	
	// reorder from high to low
	arr.sort(function (a, b) {
		return parseInt(a.score) - parseInt(b.score);
	});

	// output
	for (var i=0; i<arr.length; i++) {
		var name = typeof arr[i].name != 'undefined'
			? arr[i].name
			: storage.data.prefs.name;
		
		$('#highscore_box').prepend( $('<div>').addClass('highscore_row').html('<span>'+arr[i].score+'</span><span>'+name+'</span>') );
	}
}

function highScores() {
console.log(storage);
    var localScores = storage.data.games;

	// retrieve global scores if connected
	// and if new highscore, push it to server
    // if offline show local scoring
console.log('connected '+connected)
    if(connected) {
		// get global scores from server
		ajaxReq({}, onGetScoresSuccess, onGetScoresFail);
	} else {
		// no server connection, show local scores
		showScores(localScores);
	}
}

function onGetScoresSuccess(data, textStatus, jqXHR) {
    var localScores = storage.data.games,
		prefs = storage.data.prefs;
		newLocalHighScore = false,
		ret = [];

	if(textStatus == 'success') {
		try {
			ret = JSON.parse(atob(data));
		} catch(e) { /*console.log(e)*/ }
		
		if(ret.length) {
console.log('got the online scores');

			// is new local highscore?
			if(localScores.length) {
				localScores.sort(function (a, b) {
					return parseInt(b.score) - parseInt(a.score);
				});

				if(localScores.length > 10) {
					// shorten array
					localScores = localScores.slice(0, 10);
					storage.data.games = localScores;
					storage.write();
				}

				// get date of highest score
				var hi = localScores[0].date;
				localScores.sort(function (a, b) {
					return parseInt(b.date) - parseInt(a.date);
				});

				// compare hi to last date
				newLocalHighScore = localScores[0].date == hi /*&& localScores.length > 1*/
					? parseInt(localScores[0].score)
					: false;

console.log('newLocalHighScore '+newLocalHighScore)


				if(newLocalHighScore) {
console.log(ret);
					// is new online highscore?
					var arr = jQuery.grep(ret, function(obj, i) {
						return parseInt(obj.score) < newLocalHighScore && obj.name != prefs.name;
					});			
console.log(arr);                       
					// push to server if player has valid username and email
					if(arr.length && prefs.name != storage._data.prefs.name && prefs.email) {
						// request a token
						ajaxReq({data: {t: btoa(prefs.name + ":" + prefs.email)}}, onGetTokenSuccess, onGetTokenFail);
					} else {
						// ask for nick and email
						playerSpecsDialog();
					}
				} else {
                    // no server data, show local scoreboard
console.log('no server data, show local scoreboard');
                    onGetScoresFail();
                }
			} else {
                // no score, show online scoreboard
console.log('no score, show online scoreboard');
                showScores(ret);
            }
		} else {
            // no server data, show local scoreboard
console.log('no server data, show local scoreboard');
			onGetScoresFail();
		}
	} else {
        // no server data, show local scoreboard
console.log('no server data, show local scoreboard');
		onGetScoresFail(textStatus);
	}
}

function onGetScoresFail(err) {
	// show local scores
	showScores( storage.data.games );
console.log('Error: ' + err);
}

function onGetTokenSuccess(data, textStatus, jqXHR) {
//console.log('onGetTokenSuccess');
	var jwtoken, datStr;
	if(textStatus == 'success') {
		try {
			jwtoken = JSON.parse( atob(data) );
		} catch(e) { /*console.log(e)*/ }
		storage.data.prefs.jwt = jwtoken;
		storage.write();
console.log('got the token');

        // lets push stuff to server
		datStr = btoa(JSON.stringify( {token: jwtoken.access_token, id: storage.data.prefs.deviceId, name: storage.data.prefs.name, score: storage.data.games[0].score} ));
		ajaxReq({data: {d: datStr}}, onPushScoreSuccess, onPushScoreFail);
	} else {
		onGetTokenFail(textStatus);
	}
}

function onGetTokenFail(err) {
	//console.log('Error: ' + err);
}

function onPushScoreSuccess(data, textStatus, jqXHR) {
	if(textStatus == 'success') {
		var ret = [];
		try {
			ret = JSON.parse(atob(data));
console.log(ret);
		} catch(e) { console.log(e) }
		
		// get updated online scores
		ajaxReq({}, onGetUpdatedScoresSuccess, onGetUpdatedScoresFail);
	} else {
		
	}
}

function onPushScoreFail(err) {

}

function onGetUpdatedScoresSuccess(data, textStatus, jqXHR) {
	if(textStatus == 'success') {
		var ret = [];
		try {
			ret = JSON.parse(atob(data));
		} catch(e) { /*console.log(e)*/ }
		
		if(ret.length) {
console.log('got the updated online scores');
console.log(ret);
			showScores(ret);
		} else {
			onGetUpdatedScoresFail(textStatus);
		}
	} else {
		onGetUpdatedScoresFail(textStatus);
	}
}

function onGetUpdatedScoresFail(err) {
	// show local scores
	showScores( storage.data.games );
	//console.log('Error: ' + err);
}

function ajaxReq(_options, successCallback, failCallback) {
console.log('ajaxReq');
    var options = {
        url: sync_url,
        method: 'POST',
        cache: false,
        username: 'demo',
        password: 'mr-media',
        crossDomain: true
	};
	$.extend(options, _options);
	
    $.ajax(options)
    .done(function(data, textStatus, jqXHR) {
		if(typeof successCallback == 'function') {
			successCallback(data, textStatus, jqXHR);
		}
    })
    .fail(function(err) {
		if(typeof failCallback == 'function') {
			failCallback(err);
		} else {
			console.log('Error: ' + err.status);
		}
    });
    
}

function _ajaxReq(showAll = false) {
console.log('ajaxReq');
    var datStr,
        jwtoken;

console.log('storage.data.prefs.jwt');
console.log(storage.data.prefs.jwt);
    jwtoken = storage.data.prefs.jwt;
    if(jwtoken && !showAll) {
        datStr = btoa(JSON.stringify( {token: jwtoken.access_token, id: storage.data.prefs.deviceId, name: storage.data.prefs.name, score: storage.data.games[0].score} ));
    }
    $.ajax({
        url: sync_url,
        data: datStr ? {d: datStr} : '',
        method: 'POST',
        cache: false,
        username: 'demo',
        password: 'mr-media',
        crossDomain: true
    })
    .done(function(data, textStatus, jqXHR) {
        if(textStatus == 'success') {
//console.log(data);
//console.log(textStatus);
//console.log(jqXHR);
            var ret = [];
            try {
                ret = JSON.parse(atob(data));
console.log(ret);
            } catch(e) { console.log(e) }

            if(datStr) {
                $( document ).trigger( "scoreupdate", [ "Custom", "Event" ] );
            }
            
            if(ret.length && showAll) {
                showScores(ret);
            }

        } else {
            showScores(localScores);
            console.log('Error: ' + textStatus);
        }
    })
    .fail(function(err) {
        showScores(localScores);
        console.log('Error: ' + err.status);
    });
    
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

/* storage class */
var Storage = function(_opts) {
	this.id = 'storage';
	this._data = { prefs: {deviceId: '', name: 'johndoe', email: '', jwt: ''}, games: [] };
	this.data = this._data;
	this.read();
	this.hasId();
}

Storage.prototype.hasId = function() {
    if(this.data.prefs.deviceId) return;
	
	if(typeof device != 'undefined' && device.uuid) {
		this.data.prefs.deviceId = device.uuid;//window.btoa(device.uuid);
	} else {
		this.data.prefs.deviceId = navigator.userAgent;//window.btoa(navigator.userAgent);
	}
}

Storage.prototype.read = function() {
	this.data = JSON.parse(localStorage.getItem(this.id)) || this.data;
}

Storage.prototype.write = function() {
	localStorage.setItem(this.id, JSON.stringify(this.data));
}

Storage.prototype.clear = function() {
	localStorage.removeItem(this.id);
    this.data = this._data;
    this.hasId();
}

Storage.prototype.pushData = function(_key1, _key2, _val) {
	this.data[_key1].push({date: Date.now(), [_key2]: _val.toString()});
	this.write();
}

	
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
