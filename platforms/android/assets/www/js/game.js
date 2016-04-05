var WIDTH = 640,//window.innerWidth,
    HEIGHT = 480,//window.innerHeight,
    FPS = 16,
    startSpeed = 0.5, // overall game speed
    gamePlayTime = 15,
    reloadTimeout = 3000,
    fullMag = 8,
    enemyScoreArr = [1, 2, 5],
    enemyXVelsArr = [9, 7, 5],
    enemyScaleArr = [1, 0.7, 0.45],
	mainFontFam = ' visitor_tt2_brkregular', // first char must be space
	mainFontSize = '40px',
    onlineBoardLength = 10;
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
    sndSwitch,
    targetCont,
    targets = [],
    container,
    spriteSheet,
	speed = startSpeed,
    score = 0,
    scoreText,
    newLocalHighScore,
    shotsLeft = fullMag,
    reloading,
    gameTime = gamePlayTime,
    gameTimer,
    timerText,
    creditsTimer,
    prmQue = {},
    Ease = createjs.Ease;


function init(){
    /* Set up the Canvas with Size and height */
    var canvas = document.getElementById('mainCanvas');
    context = canvas.getContext('2d');
    context.canvas.width = WIDTH;
    context.canvas.height = HEIGHT;
    stage = new createjs.Stage("mainCanvas");
    //stage = new createjs.SpriteStage("mainCanvas", false, false);
    
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
    createjs.Sound.alternateExtensions = ["ogg", "wav"];

    /* Create a load manifest for all assets */
    queue.loadManifest([
        {id: 'backgroundImage', src: 'assets/background.png'},
        {id: 'crossHair', src: 'assets/crosshair.png'},
        {id: 'shot', src: 'assets/shot.mp3'},
        {id: 'reload', src: 'assets/reload.mp3'},
        {id: 'logobumper', src: 'assets/logobumper_oneshot.mp3'},
        {id: 'menu_loop', src: 'assets/menue_score_loop.mp3'},
        {id: 'game_loop', src: 'assets/ingame_loop.mp3'},
        //{id: 'gameOverSound', src: 'assets/gameOver.mp3'},
        //{id: 'tick', src: 'assets/tick.mp3'},
        {id: 'deathSound', src: 'assets/blast.mp3'},
        {id: 'Spritesheet', src: 'assets/DroneSpritesheet.png'},
        {id: 'Death', src: 'assets/droneDeath.png'},
        {id: 'SoundOff', src: 'assets/volume-off.png'},
        {id: 'SoundOn', src: 'assets/volume-up.png'}
    ]);
    queue.load();
    
    // data storage object
	storage = new Storage();
}

function queueProgress(evt) {
    var perc = Math.round(100 * queue.progress);
    if(perc <= 100) {
        $("#mainProgress > .progress").width(Math.round(100 * queue.progress)+'%');
    }
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

    // remove loading screen
    $('#loading_box').delay(1000).fadeOut("slow", function() {
        this.remove();
    });
    
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

    
    // Sound switch
    sndSwitch = new createjs.Container();
    var SoundOff = new createjs.Bitmap(queue.getResult("SoundOff"))
    sndSwitch.addChild(SoundOff);
    var SoundOn = new createjs.Bitmap(queue.getResult("SoundOn"))
    sndSwitch.addChild(SoundOn);
    
    var hit = new createjs.Shape();
    hit.graphics.beginFill("#ff0000").drawRect(0, 0, sndSwitch.getBounds().width, sndSwitch.getBounds().height);
    sndSwitch.hitArea = hit;
//    sndSwitch.addChild(hit)

    SoundOff.x = -12;
    createjs.Sound.muted = storage.data.prefs.muted;
    SoundOff.visible = createjs.Sound.muted;
    SoundOn.visible = !createjs.Sound.muted;
    sndSwitch.addEventListener("click", function(event) {
        createjs.Sound.muted = !createjs.Sound.muted;
        SoundOff.visible = createjs.Sound.muted;
        SoundOn.visible = !createjs.Sound.muted;
        storage.data.prefs.muted = createjs.Sound.muted;
        storage.write();
    });
    sndSwitch.x = 10;
    sndSwitch.y = HEIGHT - 10 - sndSwitch.getBounds().height / 2;
    sndSwitch.scaleX = 0.6;
    sndSwitch.scaleY = 0.6;
    console.log(sndSwitch.getBounds());
    
    // start button
    startBtn = new createjs.Container();
    
    var btnTxt = new createjs.Text("S T A R T", mainFontSize + mainFontFam, "#FFF");
    //btnTxt.x = 100;
    //btnTxt.y = 100;
    var hit = new createjs.Shape();
    hit.graphics.beginFill("#000").drawRect(0, 0, WIDTH, HEIGHT);
    btnTxt.hitArea = hit;
    btnTxt.addEventListener('mousedown', function() {
        createjs.Sound.stop("menu_loop");
        createjs.Sound.play("shot");
        
        startScrn.visible = 0;
        		
        $('#highscore_box').hide();

        timerText.text = "Time: " + gameTime.toString();
        scoreText.text = "1UP: 0";
        score = 0;
    
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
    startScrn.addChild(sndSwitch);
    startScrn.addChild(startBtn);
    stage.addChild(startScrn);

var x = getEvenedRandInt('x', 5000, 20000, 100, 10);
//console.log('new score '+x);        
//storage.clear();
//storage.pushData('games', 'score', 500);
    showStartScrn();
}

function showStartScrn() {
    
     // Play background sound
    var snd_background = createjs.Sound.play("menu_loop", {loop: -1});
    snd_background.volume = 0.5;

//    createjs.Sound.registerSound('assets/reload.mp3', 'reload');
//    createjs.Sound.registerSound('assets/shot.mp3', 'shot');

    startScrn.alpha = 0;
    startScrn.visible = 1;
    createjs.Tween.get(startScrn).to({alpha: 1}, 250);
    
    // kill events
    if(touchSupported) {
        window.ontouchstart = '';
    } else {
        window.onmousedown = '';
    }
    
    // creditsTimer
    creditsTimer = setTimeout(function(){ }, 5000);
    
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
    
    // game music
    var snd_background = createjs.Sound.play("game_loop", {loop: -1});
    snd_background.volume = 0.4;
    
    // Create  spritesheet
    spriteSheet = new createjs.SpriteSheet({
        "images": [queue.getResult('Spritesheet')],
        "frames": {"width": 198, "height": 117},
        "animations": { "fly": [0, 4, 'fly', 2] }
    });

    // Create  death spritesheet
    DeathSpriteSheet = new createjs.SpriteSheet({
    	"images": [queue.getResult('Death')],
    	"frames": {"width": 198, "height" : 148},
    	"animations": {"die": [0, 6, false, 0.5] }
    });

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
        var anim = new createjs.Sprite(spriteSheet, "fly");
        anim.regX = 99;
        anim.regY = 58;
        anim.gotoAndPlay("fly");

        // create container
        var itm = new createjs.Container();

        // create up/down anim container
        var animCont = new createjs.Container();
        animCont.addChild(anim);
        itm.addChild(animCont);

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
        createjs.Tween.get(animCont, {loop: true}).to({y: anim.y + getRandomInt(itm.height/2, itm.height-itm.height/4)}, getRandomInt(700, 850), Ease.backInOut).call(function() {});

        var hit = new createjs.Shape();
        hit.graphics.beginFill("#ff0000").drawRect(itm.width/2*-1, itm.height/2*-1, itm.width, itm.height);
        animCont.hitArea = hit;
//        animCont.addChild(hit)
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
            scoreText.text = "SCORE: " + score.toString();
            
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
//console.log(anim.regX);
//console.log(anim.regY);

	anim.x = _target.x;
	anim.y = _target.y;
	anim.scaleX = (1 / (_target.zDist + 1)).toFixed(1);
	anim.scaleY = (1 / (_target.zDist + 1)).toFixed(1);
	anim.gotoAndPlay("die");
	targetCont.addChild(anim);

	createjs.Tween.get(anim).to({y: anim.y + 200 * anim.scaleX, x: anim.x + 50 * anim.scaleX * _target.xDir}, 1000, Ease.sineIn()).call(function() {
        targetCont.removeChild(anim);
	});

    // points
	if(gameTime) {
		var bubble = new createjs.Text('+' + 100 * _target.score, mainFontSize + mainFontFam, "#FFF");
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
        
        createjs.Sound.play("reload", {delay: reloadTimeout - 1000});

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
        
        createjs.Sound.stop();
//        createjs.Sound.removeSound("shot");
//        createjs.Sound.stop("game_loop");
//        var si = createjs.Sound.play("gameOverSound");
		
        createjs.Tween.removeTweens(crossHair);
        crossHair.alpha = touchSupported ? 0 : 1;

        // remove game ticker
        createjs.Ticker.removeEventListener('tick', tickEvent);
        
        // store game state
		if(score) {
            storage.pushData('games', 'score', score);
        }
        
//        createjs.Sound.removeSound("reload");
        clearInterval(reloading);
        reloading = false;
        
        speed = startSpeed;
//		score = 0;
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
    
    if(!data && !textStatus) {
		// here the user input stuff
        ajaxReq({url: sync_url + 'tmpl/userform.html', crossdomain: false}, function(data) {
            var insert = false;
            $.each($('#highscore_box div'), function( k, v ) {
                var scr = $('span:nth-child(3)', v).text();
                if(!insert && (newLocalHighScore > scr || k+1 == $('#highscore_box div').length)) {
console.log(k+1);            
console.log($('#highscore_box div').length);            
                    var place = k+1;
                    if(k+1 == $('#highscore_box div').length) {
                        $('<div>').addClass('highscore_row').attr('id','form_box').insertAfter( this );
                        place++;
                    } else {
                        insert = true;
                        $('<div>').addClass('highscore_row').attr('id','form_box').insertBefore( this );
                    }
                    $('#form_box').html(data).show();
                    $('#form_box > span:nth-child(1)').text(place);
                    $('#form_box > span:nth-child(3)').text(newLocalHighScore);

                    $('#form_box #name').addClass('blink').attr('placeholder', storage._data.prefs.name).focus();
                    $('#form_box #email').addClass('blink').attr('placeholder', 'EMailadresse');//.hide();

                }
                if(insert) {
                    $('span:nth-child(1)', v).text(k+2);
                    if(k+1 >= onlineBoardLength) {
                        this.remove();
                    }
                }
            });
        }); 
//        $('canvas').hide();

	} else {
		var ret = [];
		try {
			ret = JSON.parse(atob(data));
			
console.log('562');
console.log(ret);
console.log(ret.status);
console.log(ret.status==201);
console.log(u_name);
console.log(u_email);
			if(ret.status == 201 && u_name && u_email) {
                $('#form_box').html('').hide();
				savePlayerSpecs(u_name, u_email);
			}
		} catch(e) { /*console.log(e)*/ }
	}
}

function savePlayerSpecs(name, email) {
	storage.data.prefs.name = name;
	storage.data.prefs.email = email;
	storage.write();

	// get global scores from server
	ajaxReq({}, onGetUpdatedScoresSuccess, onGetUpdatedScoresFail);
}

function showForm() {

    $('#form_box').show();

}

function showScores(arr, _score) {
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
		
		$('#highscore_box').prepend( $('<div>').addClass('highscore_row').html('<span>'+(arr.length-i)+'</span><span>'+name+'</span><span>'+arr[i].score+'</span>') );
	}
    if(_score) {
		$('#highscore_box')
        .append( $('<div>').addClass('highscore_row').html('<span>&nbsp;</span>') )
        .append( $('<div>').addClass('highscore_row').html('<span>?</span><span>'+storage.data.prefs.name+'</span><span>'+_score+'</span>') );
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

			ret = ret.slice(0, onlineBoardLength);
            
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

//newLocalHighScore = 5000;
console.log('newLocalHighScore '+newLocalHighScore)


				if(newLocalHighScore) {
console.log(ret);
console.log(ret.length);
console.log(ret[ret.length-1].score);
                    // is new online highscore?
                    var low = ret[ret.length-1].score;
					var arr = [];
                    if(low && newLocalHighScore > low) {
                    
                        var arr = jQuery.grep(ret, function(obj, i) {
                            return parseInt(obj.score) > newLocalHighScore && obj.name != prefs.name;
                        });			
                    }
console.log(arr);                       
                    var newOnlineHighScore = arr.length || ret.length < onlineBoardLength;
console.log('newOnlineHighScore '+newOnlineHighScore);                       
                    
                    // push to server if player has valid username and email
					if(newOnlineHighScore && prefs.name != storage._data.prefs.name && prefs.email) {
						// request a token
						ajaxReq({data: {t: btoa(prefs.name + ":" + prefs.email)}}, onGetTokenSuccess, onGetTokenFail);
					} else {
						if(newOnlineHighScore) {
                            // ask for nick and email
                            showScores(ret);
                            playerSpecsDialog();
                        } else {
                            // no online highscore, show online scoreboard
console.log('no online highscore, show online scoreboard');
                            showScores(ret, score);
                        }
					}
				} else {
                    // not a local highscore
console.log('not a local highscore');
                    showScores(ret, score);
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
console.log('Error: ' + err);
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
console.log('Error: ' + err);
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
	this._data = { prefs: {deviceId: '', name: 'Spieler', email: '', muted: false, jwt: ''}, games: [] };
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
