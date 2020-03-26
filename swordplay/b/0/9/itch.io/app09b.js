
	var P1, P2;
	isFighting = false;
	MW.install( THREE );
	const debugMode = false;

	Number.prototype.format = function (){
		return this.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	};

	function round(number, precision) {
		var shift = function (number, precision, reverseShift) {
			if (reverseShift) {
				precision = -precision;
			}  
			numArray = ("" + number).split("e");
			return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
		};
		return shift(Math.round(shift(number, precision, false)), precision, true);
	}

	(function(){

		scene = new THREE.Scene();

		(function(){
			var aspect = (window.innerWidth - 370) / window.innerHeight;
			camera = new THREE.PerspectiveCamera( 50, aspect, 1, 100000 );
			camera.position.set(0, 5, 25);
		})();

		(function(){

			cameraLight = new THREE.DirectionalLight( 0xdfebff, 0.75 );
			cameraLight.position.set( 0, 500, 300 );
			cameraLight.castShadow = true;
			cameraLight.shadow.mapSize.width  = Math.pow(2, 10); // 2048;
			cameraLight.shadow.mapSize.height = Math.pow(2, 10); // 2048;

			var d = 30;
			cameraLight.shadow.camera.left = - d;
			cameraLight.shadow.camera.right = d;
			cameraLight.shadow.camera.top = d;
			cameraLight.shadow.camera.bottom = - d;
			cameraLight.shadow.camera.far = 10000;

			shadowHelper = new THREE.CameraHelper(cameraLight.shadow.camera);
			shadowHelper.visible = false;

			scene.add( cameraLight, shadowHelper  );

			(function update(){
				requestAnimationFrame( update );
				cameraLight.position.copy( camera.position );
			})();

		})();

		(function(){

			renderer = new THREE.WebGLRenderer({
				antialias: true,
				preserveDrawingBuffer: true,
			});

			renderer.gammaInput = true;
			renderer.gammaOutput = true;
			renderer.shadowMap.enabled = true;
			renderer.setClearColor( 0x000000 );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( (window.innerWidth - 370), window.innerHeight );
			document.body.appendChild( renderer.domElement );

			window.addEventListener("resize", function onWindowResize() {
				renderer.setSize( (window.innerWidth - 370), window.innerHeight );
			});

			window.addEventListener("resize", function onWindowResize() {
				camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
				camera.updateProjectionMatrix();
			});

			mouse = new THREE.Vector2();

			renderer.domElement.addEventListener("mousemove", function(e) {
				mouse.x = ( e.clientX / this.clientWidth ) * 2 - 1;
				mouse.y = - ( e.clientY / this.clientHeight ) * 2 + 1;
			});

			(function render(){
				requestAnimationFrame( render );
				renderer.render( scene, camera );
			})();

		})();

		setTimeout(function(){
			controls = new THREE.EditorControls(camera, renderer.domElement);
			controls.center.set(0, 10, 0);
			camera.lookAt(controls.center); // important!
		});

	})();

	(function(){

		world = new MW.World();

		var x = 1500, y = 1500, z = 1500;
		var min = new THREE.Vector3( -x, -y, -z );
		var max = new THREE.Vector3(  x,  y,  z );
		var partition = 1;

		octree = new MW.Octree( min, max, partition );
		world.add( octree );

		var clock = new THREE.Clock();

		(function update(){
			requestAnimationFrame( update );
			var delta = clock.getDelta();
			var elapsed = clock.getElapsedTime();
			world.step( Math.min( delta, 0.02 ) );
			scene.updateMatrixWorld();
		})();

	})();

	(function(){

		ground = new THREE.Mesh(
			new THREE.PlaneGeometry( 3000, 3000, 1, 1 ).rotateX(-Math.PI/2),
			new THREE.MeshLambertMaterial({ 
				opacity:1, 
				color:0x829ec4,
			})
		);

		octree.importThreeMesh( ground );

		groundHelper = new THREE.GridHelper( 3000, 300, 0x444444, 0x444444 );
		scene.add( groundHelper );

		setTimeout(function(){
			var raycaster = new THREE.Raycaster();
			var intersecthelper = new THREE.Mesh(
				new THREE.CircleBufferGeometry( 2, 32 ).rotateX(-Math.PI/2),
				new THREE.MeshBasicMaterial({color:0xffff00, wireframe:false})
			);
			renderer.domElement.addEventListener("mousemove", function(e) {
				camera.updateMatrixWorld();
				raycaster.setFromCamera( mouse, camera );
				var intersects = raycaster.intersectObject( ground );
				if ( !intersects.length ) return;
				intersecthelper.position.copy( intersects[0].point );
			});
			intersecthelper.visible = false;
			scene.add( intersecthelper );
		});

	})();


	(function(){

		var sidePanel = createSidePanel();
		var gameTab = TabUI.add( "Game", "game-tab" );
		var debugTab = TabUI.add( "Debug", "debug-tab" );
		var playerTab = TabUI.add( "Players", "player-tab" );
		var animationTab = TabUI.add( "Animations", "animation-tab" );

		document.body.appendChild( sidePanel );
		TabUI.append( "Game", "Animations" );
		TabUI.Game.role.classList.add("active");
		TabUI.Game.tab.classList.add("in","active");

	})();


	(function(){

		var players = {};
		currentPlayer = "player1";

		var tab = TabUI.Game.tab;
		var row = document.createElement("h3");
		row.style.cssText = "padding-right:16px;";
		row.textContent = "Player:";

		var select = document.createElement("select");
		select.id = "players-droplist";
		select.style.cssText = "width:180px;color:#000;float:right;"
			+ "border:1px solid;border-radius:4px;padding:2px 4px 4px 4px;"
			+ "font-size:20px;margin-left:10px;";

		select.addEventListener( "change", function(){
			currentPlayer = this.value;
		});

		select.addPlayer = function( key, object, selected ){
			if ( !( key && object ) ) return;
			players[ key ] = object;
			var option = document.createElement("option");
			option.text = option.value = key;
			if ( selected ) {
				currentPlayer = option.value;
				option.setAttribute("selected", "");
			}
			select.appendChild( option );
		};

		select.getPlayer = function( key ){
			if ( key ) return players[ key ];
			return players[ this.value ];
		};

		select.getAnimationController = function( key ){
			if ( key ) return players[ key ].animationController;
			return players[ this.value ].animationController;
		};

		select.getSkeletonHelper = function( key ){
			if ( key ) return players[ key ].skeletonHelper;
			return players[ this.value ].skeletonHelper;
		};

		select.addMotion = function( name, clip ){
			for ( var key in players ) {
				if ( !( key && players[key] ) ) return;
				var animationController = this.getAnimationController( key );
				var mixer = animationController.mixer;
				var object = animationController.object;
				animationController.motion[ name ] = mixer.clipAction( clip, object );
			}
		};

		row.appendChild( select );
		tab.appendChild( row );

	})();


	(function(){

		currentAnimation = "idling";
		var animations = [];

		var tab = TabUI.Animations.tab;
		var row = document.createElement("h3");
		row.style.cssText = "padding-right:0px;";
		row.textContent = "Animation:";

		var select = document.createElement("select");
		select.animations = {}; // important!
		select.id = "animation-droplist";
		select.style.cssText = "width:180px;color:#000;float:right;"
			+ "border:1px solid;border-radius:4px;padding:2px 4px 4px 4px;"
			+ "font-size:20px;margin-left:10px;";

		(function(){
			var option = document.createElement("option");
			option.text = option.value = currentAnimation;
			select.appendChild( option );
		})();

		select.addEventListener( "change", function(){
			currentAnimation = this.value;
		});

		select.addEventListener( "change", function(){
			var select = document.getElementById("players-droplist");
			var animationController = select.getAnimationController( currentPlayer );
			if ( !( select && animationController ) ) return; 
			if ( !animationController.motion.idling ) return;
			animationController.play( "idling" );
		});

		select.addAnimation = function( name, clip ){
			animations.push( clip );
			var option = document.createElement("option");
			option.text = option.value = name;
			this.appendChild( option );
		};

		select.getAnimationByName = function( name ){
			return animations.find(function( clip ){
				return clip.name == name;
			});
		};

		select.getAnimationByUUID = function( uuid ){
			return animations.find(function( clip ){
				return clip.uuid == uuid;
			});
		};

		select.getAnimations = function(){
			return animations;
		};

		row.appendChild( select );
		tab.appendChild( row );

	})();


	(function(){

		var tab = TabUI.Animations.tab;
		var row = document.createElement("div");
		row.style.cssText = "margin:20px 12px 10px;height:35px;text-align:center;";

		var button1 = IdleButton();
		var button2 = TestButton();
		row.appendChild( button1 );
		row.appendChild( button2 );

		tab.appendChild( row );

		function IdleButton(){

			var button = document.createElement("div");
			button.id = "idle-animation";
			button.textContent = "Reset";
			button.title = "Pause animation action";
			button.style.cssText = "width:33%;float:left;height:40px;font-size:large;";
			button.classList.add( "form-control", "btn", "btn-primary", "btn-white-outline", "gradient-btn" );
			button.addEventListener( "click", function(){
				var select = document.getElementById("players-droplist");
				var animationController = select.getAnimationController( currentPlayer );
				if ( animationController.currentMotionName == "idling" ) return;
				animationController.play( "idling" ); 
			});

			return button;
		}

		function TestButton() {

			var button = document.createElement("div");
			button.id = "play-animation";
			button.textContent = "Test animation";
			button.title = "Test animation action";

			button.style.cssText = "width:65%;float:right;height:40px;font-size:large;";
			button.classList.add( "form-control", "btn", "btn-primary", "btn-white-outline", "gradient-btn" );
			button.addEventListener( "click", function(){
				var select = document.getElementById("players-droplist");
				var animationController = select.getAnimationController( currentPlayer );
				animationController.play( currentAnimation );
				animationController.motion[currentAnimation].reset();
			});

			return button;
		}

	})();


	(function(){

		var tab = TabUI.Game.tab;
		var container = document.createElement("div");
		container.id = "action-buttons";
		container.style.cssText = "width:101%;max-height:300px;text-align:center;"
			+ "margin-top:20px;margin-bottom:20px;overflow-y:auto;";
		tab.appendChild( container );

	})();

	(function(){

		var swordfiles = [
			"great sword slash.fbx",
			"great sword slash (2).fbx",
			"great sword slash (3).fbx",
			"great sword slash (4).fbx",
			"great sword slash (5).fbx",
		];


		swordfiles.forEach( function( filename ){
			var loader = new THREE.FBXLoader();
			loader.load( escape("./animations/"+filename), function( group ){
				if ( !( group.animations && group.animations.length ) ) return;

				var clip = group.animations[0];
				clip.name = filename.replace(".fbx", "");

				document.getElementById("animation-droplist").addAnimation( clip.name, clip );

				AddActionButton( clip, "Hit Reaction From The Front With Bow (2)" );

			});
		});

		var kickfiles = [
			"A Roundhouse Kick To The Side Of An Opponent.fbx",
			"Aerial 360 Degree Front Side Rotation Kick With Rear Foot.fbx",
		];

		kickfiles.forEach(function( filename ){
			var loader = new THREE.FBXLoader();
			loader.load( escape("./animations/"+filename), function( group ){
				if ( !( group.animations && group.animations.length ) ) return;

				var clip = group.animations[0];
				clip.name = filename.replace(".fbx", "");

				document.getElementById("animation-droplist").addAnimation( clip.name, clip );

				AddActionButton( clip, "Hit In The Shoulder And Falls To The Ground" );

			});
		});

		var reactionfiles = [
			"Hit Reaction From The Front With Bow (2).fbx",
			"Hit In The Shoulder And Falls To The Ground.fbx",
		];

		reactionfiles.forEach(function( filename ){
			var loader = new THREE.FBXLoader();
			loader.load( escape("./animations/"+filename), function( group ){
				if ( !( group.animations && group.animations.length ) ) return;

				var clip = group.animations[0];
				clip.name = filename.replace(".fbx", "");

				document.getElementById("animation-droplist").addAnimation( clip.name, clip );
			});
		});

		function AddActionButton( clip, reaction ){

			var interval;
			if ( !reaction ) reaction = "Hit Reaction From The Front With Bow (2)";

			var button = document.createElement("div");
			button.id = button.title = clip.name;
			button.classList.add("btn", "btn-white-outline", "btn-action");
			button.style.cssText = "background-size:contain;background-color:#fff;"
				+ "background-image:url('./thumbs/"+clip.name+".png');";
			document.getElementById("action-buttons").appendChild( button );

			button.addEventListener( "click", function clickHandler(){

				button.removeEventListener( "click", clickHandler );

				var p1, p2;
				if ( currentPlayer == "player1" ) { p1 = P1; p2 = P2; }
				if ( currentPlayer == "player2" ) { p1 = P2; p2 = P1; }

				var requestAnimationFrameID;
				var select = document.getElementById("players-droplist");
				var animationController = select.getAnimationController( currentPlayer );
				animationController.mixer.dispatchEvent({type:"finished"});

				if ( isFighting ){

					var origin = new THREE.Vector3();
					var direction = new THREE.Vector3();
					var intersectObjects = [p2.intersectBody, p2.intersectHead];
					var raycaster = new THREE.Raycaster(); raycaster.far = 9;

					(function update(){

						requestAnimationFrameID = requestAnimationFrame( update );

						origin.copy( p1.RightHandIndex.position );

						direction.subVectors(
							p1.RightHandSword.position,
							p1.RightHandIndex.position
						).normalize();

						raycaster.ray.set( origin, direction );

						var intersects = raycaster.intersectObjects( intersectObjects );

						if ( !intersects.length ) return;

						cancelAnimationFrame( requestAnimationFrameID );

						p2.health -= (raycaster.far - intersects[0].distance);
						p2.animationController.play( reaction );
						p2.animationController.motion[ reaction ].reset();

					})();

				}

				animationController.mixer.addEventListener( "finished", function finishedEventHandler(e){

					cancelAnimationFrame( requestAnimationFrameID );

					setTimeout( function(){ 
						animationController.mixer.removeEventListener( "finished", finishedEventHandler );
					});

					setTimeout( function(){ 
						button.addEventListener( "click", clickHandler ); 
					});

					animationController.play( "idling" );
				});

				animationController.play( clip.name ); animationController.motion[ clip.name ].reset();

			});

		}


	})();


	(function(){

		var intersectHead = new THREE.Mesh(
			new THREE.SphereGeometry( 2, 6, 4 ),
			new THREE.MeshBasicMaterial({color:0xffff00,  wireframe:true})
		); 

		var intersectBody = new THREE.Mesh(
			new THREE.SphereGeometry( 4, 6, 4 ),
			new THREE.MeshBasicMaterial({color:0xffff00,  wireframe:true})
		);

		intersectHead.visible = intersectBody.visible = false;

		P1 = { 
			health:0, 
			intersectHead: intersectHead.clone(), 
			intersectBody: intersectBody.clone(),
		};

		P2 = { 
			health:0, 
			intersectHead: intersectHead.clone(), 
			intersectBody: intersectBody.clone(),
		};

		(function(){

			var keys = ( "Hips,LeftHand,LeftHandIndex,LeftLeg,LeftFoot,LeftToe,"
						+ "RightHand,RightHandIndex,RightHandSword,RightLeg,RightFoot,RightToe"
					   ).split(",");

			keys.forEach(function( key ){ 
				P1[ key ] = new THREE.Object3D();  
				P2[ key ] = new THREE.Object3D(); 
			});

		})();


		(function(){

			var bar = document.createElement("div");
			bar.title = "Player1 Health Bar";
			bar.style.cssText = "width:350px;height:40px;position:fixed;top:10px;"
				+ "border:2px solid #fff;border-radius:8px;background-color:#f00;right:380px;";

			var label = document.createElement("span");
			label.textContent = "Player 1";
			label.style.cssText = "position:absolute;color:#fff;"
				+ "font-weight:bold;font-size:x-large;left:-100px;";
			bar.appendChild( label );

			var health_bar = document.createElement("div");
			health_bar.id = "player1-health-bar";
			health_bar.style.cssText = "width:100%;height:100%;"
				+ "background-color:#ff0;float:left;border-radius:4px;";
			bar.appendChild( health_bar );

			var text_bar = document.createElement("div");
			text_bar.style.cssText = "width:100%;text-align:center;background:none;"
				+ "position:absolute;font-weight:bold;color:#fff;font-size:x-large;";
			text_bar.textContent = P1.health+"%";
			bar.appendChild( text_bar );

			P1.appendBar = function(){
				document.body.appendChild( bar );
			};

			P1.removeBar = function(){
				bar.remove();
			};

			P1.healthWacher = function(prop, action, value){
				health_bar.style.width = round( value, 1 ) + "%";
				text_bar.textContent = health_bar.style.width;
				if ( value > 0 ) label.style.color = "#fff";
				else label.style.color = "#f00";
			};

			P1.blink = blink.bind( P1, label );

			watch( P1, "health", P1.healthWacher );

		})();

		(function(){

			var bar = document.createElement("div");
			bar.title = "Player2 Health Bar";
			bar.style.cssText = "width:350px;height:40px;position:fixed;top:10px;"
				+ "border:2px solid #fff;border-radius:8px;background-color:#f00;left:10px;";

			var label = document.createElement("span");
			label.textContent = "Player 2";
			label.style.cssText = "position:absolute;color:#fff;"
				+ "font-weight:bold;font-size:x-large;right:-100px";
			bar.appendChild( label );

			var health_bar = document.createElement("div");
			health_bar.id = "player2-health-bar";
			health_bar.style.cssText = "width:100%;height:100%;border-radius:4px;"
				+ "background-color:#ff0;float:right;";
			bar.appendChild( health_bar );

			var text_bar = document.createElement("div");
			text_bar.style.cssText = "width:100%;text-align:center;background:none;"
				+ "position:absolute;font-weight:bold;color:#fff;font-size:x-large;";
			text_bar.textContent = P2.health+"%";
			bar.appendChild( text_bar );

			P2.appendBar = function(){
				document.body.appendChild( bar );
			};

			P2.removeBar = function(){
				bar.remove();
			};

			P2.healthWacher = function(prop, action, value){
				health_bar.style.width = round( value, 1 ) + "%";
				text_bar.textContent = health_bar.style.width;
				if ( value > 0 ) label.style.color = "#fff";
				else label.style.color = "#f00";
			};

			P2.blink = blink.bind( P2, label );

			watch( P2, "health", P2.healthWacher );

		})();

		function blink( label ){
			var display;
			setTimeout( function _blink(){

				if ( isFighting ) {
					label.style.display = "";
					return;
				}

				display = !display;

				if ( display ) 
					label.style.display = "";
				else 
					label.style.display = "none";

				setTimeout( _blink, 650 );

			});
		}

		setTimeout(function(){

			var tab = TabUI.Game.tab;
			var row = document.createElement("div");
			row.style.cssText = "margin:20px 12px 10px;height:35px;text-align:center;";

			var button = document.createElement("div");
			button.id = "start-raycasting";
			button.textContent = "Start Battle";
			button.style.cssText = "max-width:100%;width:100%;height:40px;font-size:large;";
			button.classList.add( "form-control", "btn", "btn-primary", "btn-white-outline", "gradient-btn" );
			button.addEventListener( "click", function(){ 
				button.value = !button.value; 
			});

			row.appendChild( button );
			tab.appendChild( row );

			watch( button, "value", function showtime(prop, action, value){

				isFighting = value; debugMode && console.log( "isFighting:", isFighting );

				if ( value ) button.textContent = "Pause Battle";
				else if ( !value ) button.textContent = "Start Battle";

				var player1 = scene.getObjectByName( "player1" );
				var player2 = scene.getObjectByName( "player2" );

				var playersDroplist = document.getElementById("players-droplist");
				var animationDroplist = document.getElementById("animation-droplist");

				P1.name = player1.name; P2.name = player2.name;

				P1.animationController = playersDroplist.getAnimationController("player1");
				P2.animationController = playersDroplist.getAnimationController("player2");
				P1.animationController.play( "idling" ); P2.animationController.play( "idling" ); 

				if ( value ) { P1.appendBar();  P2.appendBar(); }

				if ( !value && (P1.health && P2.health) ) {
					button.textContent = "Continue Battle";
				} else if ( !value && !(P1.health && P2.health) ) {
					button.textContent = "New Battle";
				}

				if ( value && !(P1.health && P2.health) ) {
					P1.health = 100; P2.health = 100;
				}

				if ( !isFighting ) {
					P1.animationController.turn(0); 
					P2.animationController.turn(0);
				} else {
					P1.animationController.turn(-Math.PI/2); 
					P2.animationController.turn(Math.PI/2);
				}

				if ( isFighting ) (function update(){

					if ( P1.health < 0 ) {
						P1.health = 0;  
						isFighting = false;
						button.value = false; 
						P2.health && P2.blink();
						setTimeout( function(){
							winner(P2); looser(P1);
						});
						return;

					} else if ( P2.health < 0 ) {
						P2.health = 0; 
						isFighting = false;
						button.value = false; 
						P1.health && P1.blink();
						setTimeout( function(){
							winner(P1); looser(P2);
						});
						return;
					}

					if ( !isFighting ) { 
						if ( P1.health > 0 ) P1.blink();
						if ( P2.health > 0 ) P2.blink();
						return; 
					}

					setTimeout( update, 1000 );

					function winner(p){
						var name = "Aerial 360 Degree Front Side Rotation Kick With Rear Foot";
						p.animationController.play( name );
						p.animationController.motion[ name ].reset();
					}

					function looser(p){
						var name = "Hit In The Shoulder And Falls To The Ground";
						p.animationController.motion[ name ].clampWhenFinished = true;
						p.animationController.motion[ name ].setLoop(THREE.LoopOnce);
						p.animationController.play( name );
						p.animationController.motion[ name ].reset();
					}

				})();


				if ( isFighting ) {

					scene.add(P1.intersectHead, P1.intersectBody);
					scene.add(P2.intersectHead, P2.intersectBody);

				} else {

					scene.remove(P1.intersectHead, P1.intersectBody);
					scene.remove(P2.intersectHead, P2.intersectBody);

				}

				if ( isFighting ) {

					updatePointObjects( P1 ); updatePointObjects( P2 );

				}

				function updatePointObjects( p ){

					var player = scene.getObjectByName( p.name );

					if ( !player ) return;

					var hipsBone = player.getObjectByName("Hips");
					var headBone = player.getObjectByName("Head");
					var bodyBone = player.getObjectByName("Spine");

					var leftlegBone = player.getObjectByName("LeftLeg");
					var leftfootBone = player.getObjectByName("LeftFoot");
					var lefttoeBone = player.getObjectByName("LeftToeBase");
					var lefthandBone = player.getObjectByName("LeftHand");
					var leftindexBone = player.getObjectByName("LeftHandIndex1");

					var rightlegBone = player.getObjectByName("RightLeg");
					var rightfootBone = player.getObjectByName("RightFoot");
					var righttoeBone = player.getObjectByName("RightToeBase");
					var righthandBone = player.getObjectByName("RightHand");
					var rightindexBone = player.getObjectByName("RightHandIndex1");
					var rightswordBone = player.getObjectByName("RightHandIndex1Sword");

					(function update(){
						var requestAnimationFrameID = requestAnimationFrame( update );
						if ( !isFighting ) cancelAnimationFrame( requestAnimationFrameID );
						p.intersectHead.position.setFromMatrixPosition(headBone.matrixWorld);
						p.intersectBody.position.setFromMatrixPosition(bodyBone.matrixWorld);
						p.Hips.position.setFromMatrixPosition(hipsBone.matrixWorld);
						p.LeftHand.position.setFromMatrixPosition(lefthandBone.matrixWorld);
						p.LeftHandIndex.position.setFromMatrixPosition(leftindexBone.matrixWorld);
						p.LeftLeg.position.setFromMatrixPosition(leftlegBone.matrixWorld);
						p.LeftFoot.position.setFromMatrixPosition(leftfootBone.matrixWorld);
						p.LeftToe.position.setFromMatrixPosition(lefttoeBone.matrixWorld);
						p.RightLeg.position.setFromMatrixPosition(rightlegBone.matrixWorld);
						p.RightFoot.position.setFromMatrixPosition(rightfootBone.matrixWorld);
						p.RightToe.position.setFromMatrixPosition(righttoeBone.matrixWorld);
						p.RightHand.position.setFromMatrixPosition(righthandBone.matrixWorld);
						p.RightHandIndex.position.setFromMatrixPosition(rightindexBone.matrixWorld);
						p.RightHandSword.position.setFromMatrixPosition(rightswordBone.matrixWorld);
					})();

				}


				if ( isFighting ) {

					if ( currentPlayer == "player1" ) showcase( P2, P1 ); 
					if ( currentPlayer == "player2" ) showcase( P1, P2 );

				}

				function showcase( p1, p2 ){

					if ( !isFighting ) return;

					var requestAnimationFrameID;
					var animationController = p1.animationController;

					var ignorekeys = [ 
						"Hit Reaction From The Front With Bow (2)",
						"Hit In The Shoulder And Falls To The Ground"
					];

					var reaction = "Hit Reaction From The Front With Bow (2)";
					var clips = document.getElementById("animation-droplist").getAnimations();
					var names = clips.map(function( clip ){ 
						return clip.name; 
					}).filter( function( name ){
						return !ignorekeys.includes( name );
					});

					var origin = new THREE.Vector3();
					var direction = new THREE.Vector3();
					var intersectObjects = [p2.intersectBody, p2.intersectHead];
					var raycaster = new THREE.Raycaster(); raycaster.far = 9;

					animationController.mixer.addEventListener( "finished", onfinishedEventHandler );
					if ( !isFighting ) animationController.mixer.removeEventListener( "finished", onfinishedEventHandler );

					setTimeout( function(){
						animationController.mixer.dispatchEvent({type:"finished"});
					}, 3000);


					function onfinishedEventHandler( e ){

						cancelAnimationFrame( requestAnimationFrameID );

						if ( !isFighting ) {
							cancelAnimationFrame( requestAnimationFrameID );
							this.removeEventListener( "finished", onfinishedEventHandler );
							return;
						}

						var name = names[ parseInt( Math.random() * names.length ) ];
						while ( ignorekeys.includes( name ) ) {
							name = names[ parseInt( Math.random() * names.length ) ];
						}

						(function update(){

							requestAnimationFrameID = requestAnimationFrame( update );

							origin.copy( p1.RightHandIndex.position );

							direction.subVectors(
								p1.RightHandSword.position,
								p1.RightHandIndex.position
							).normalize();

							raycaster.ray.set( origin, direction );

							var intersects = raycaster.intersectObjects( intersectObjects );

							if ( !intersects.length ) return;

							cancelAnimationFrame( requestAnimationFrameID );

							p2.health -= (raycaster.far - intersects[0].distance);
							p2.animationController.play( reaction );
							p2.animationController.motion[ reaction ].reset();

						})();

						animationController.play( name ); animationController.motion[ name ].reset();

					}

				}

			});

		});

	})();


	(function(name, s, x){

		var loader = new THREE.FBXLoader();
		loader.load( "./characters/MannySwordIdle04.fbx", function( player ){

			player.name = name;
			player.scale.set(s,s,s);
			player.position.x = x;
			scene.add( player );

			var animations = player.animations;

			player.traverse( function( child ){

				if (child.isMesh) {	
					child.castShadow = true;	
					child.receiveShadow = true;	
				}

				if (child.name == "MannyTheSkeleton_v51") {
					(function(mesh){

						mesh.material = new THREE.MeshStandardMaterial({
							name:"player1_Material", skinning:true
						});

						var loader = new THREE.ImageLoader();
						loader.setCrossOrigin("anonymous");
						var src = "https://i.imgur.com/rxUXS8C.png";
						loader.load( src, function( image ){
							var mapping = THREE.SphericalReflectionMapping;
							var texture = new THREE.Texture( image, mapping );
							mesh.material.roughness = 0; 
							mesh.material.metalness = 1; 
							mesh.material.envMap = texture; 
							mesh.material.envMap.needsUpdate = true; 
							mesh.material.needsUpdate = true;
						});

					})( child );
				}

			});

			(function(){
				var bone = new THREE.Bone();
				bone.name = "RightHandIndex1Sword";
				bone.position.set(200, 20, -80); // importrant!
				player.getObjectByName("RightHandIndex1").add(bone);
			})();

			if ( animations && animations.length ) player.animations[0].name = "idling";

			var animationController = new MW.AnimationController( player );

			if ( animationController.motion.idling ) animationController.play("idling");

			(function( select ){
				var mixer = animationController.mixer; 
				var object = animationController.object;
				select.getAnimations().forEach(function( clip ){
					var clipAction = mixer.clipAction( clip, object );
					animationController.motion[ clip.name ] = clipAction;
					animationController.motion[ clip.name ].setLoop(THREE.LoopOnce);
					animationController.motion[ clip.name ].clampWhenFinished = true;
				});
			})( document.getElementById("animation-droplist") );

			var clock = new THREE.Clock();
			(function update(){
				requestAnimationFrame( update );
				var delta = clock.getDelta();
				animationController.update( delta );
			})();

			(function( select ){
				if ( !select ) return;

				var object = {
					name: player.name,
					uuid: player.uuid,
				};

				if ( animationController ) {
					object.animationController = animationController;
				}

				select.addPlayer( player.name, object, true);
			})( document.getElementById("players-droplist") );

		},

					function(e){}, 
					function(err){
			console.error(err);
		});

	})("player1", 0.00033, 10);

	loadPlayer("player2", 0.00033, -10);

	function loadPlayer(name, s, x){

		var loader = new THREE.FBXLoader();
		loader.load( "./characters/MannySwordIdle05.fbx", function( player ){

			player.name = name;
			player.scale.set(s,s,s);
			player.position.x = x;
			scene.add( player );

			var animations = player.animations;

			player.traverse( function( child ){

				if (child.isMesh) {	
					child.castShadow = true;	
					child.receiveShadow = true;	
				}

				if (child.name == "MannyTheSkeleton_v51") {
					(function(mesh){

						mesh.material = new THREE.MeshStandardMaterial({
							name:"player2_Material", skinning:true,
						});

						var loader = new THREE.ImageLoader();
						loader.setCrossOrigin("anonymous"); // important!
						var src = "https://i.imgur.com/Fx9154f.png";
						loader.load( src, function( image ){
							var mapping = THREE.SphericalReflectionMapping;
							var texture = new THREE.Texture( image, mapping );
							mesh.material.roughness = 0; 
							mesh.material.metalness = 1; 
							mesh.material.envMap = texture; 
							mesh.material.envMap.needsUpdate = true; 
							mesh.material.needsUpdate = true;
						});

					})( child );
				}

			});

			(function(){
				var bone = new THREE.Bone();
				bone.name = "RightHandIndex1Sword";
				bone.position.set(200, 20, -80); // importrant!
				player.getObjectByName("RightHandIndex1").add(bone);
			})();

			if ( animations && animations.length ) player.animations[0].name = "idling";

			var animationController = new MW.AnimationController( player );

			if ( animationController.motion.idling ) animationController.play("idling");

			(function( select ){
				var mixer = animationController.mixer; 
				var object = animationController.object;
				select.getAnimations().forEach(function( clip ){
					var clipAction = mixer.clipAction( clip, object );
					animationController.motion[ clip.name ] = clipAction;
					animationController.motion[ clip.name ].setLoop(THREE.LoopOnce);
					animationController.motion[ clip.name ].clampWhenFinished = true;
				});
			})( document.getElementById("animation-droplist") );

			var clock = new THREE.Clock();
			(function update(){
				requestAnimationFrame( update );
				var delta = clock.getDelta();
				animationController.update( delta );
			})();

			(function( select ){
				if ( !select ) return;

				var object = {
					name: player.name,
					uuid: player.uuid,
				};

				if ( animationController ) {
					object.animationController = animationController;
				}

				select.addPlayer( player.name, object );
			})( document.getElementById("players-droplist") );

		},

					function(e){}, 
					function(err){
			console.error(err);
		});

	}
