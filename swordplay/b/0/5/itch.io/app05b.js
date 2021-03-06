
			MW.install( THREE );
			const debugMode = false;

			isFighting = false;

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
					camera.lookAt(controls.center);
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
					new THREE.MeshLambertMaterial({ opacity:1, color:0x829ec4 })
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

				var animations = [];
				currentAnimation = "idling";
				var tab = TabUI.Animations.tab;
				var row = document.createElement("h3");
				row.style.cssText = "padding-right:0px;";
				row.textContent = "Animation:";
				var select = document.createElement("select");
				select.animations = {};
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
					button.textContent = "Pause";
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
						if ( animationController.currentMotionName == currentAnimation ) return;
						animationController.motion[currentAnimation].reset();
						animationController.play( currentAnimation );
					});
					return button;
				}

			})();

			(function(){

				var idleInterval;
				var tab = TabUI.Animations.tab;
				var row = document.createElement("div");
				row.style.cssText = "margin:20px 12px 10px;height:35px;text-align:center;";
				var addButton = AddActionButton();
				var rmvButton = RemoveActionButton();
				row.appendChild( rmvButton );
				row.appendChild( addButton );
				tab.appendChild( row );

				function AddActionButton(){
					var button = document.createElement("div");
					button.id = "add-action";
					button.textContent = "Add Action";
					button.title = "Add action button";
					button.style.cssText = "width:49%;height:40px;float:right;font-size:large;";
					button.classList.add( "form-control", "btn", "btn-primary", "btn-white-outline", "gradient-btn" );
					button.addEventListener( "click", function(){
						if ( currentAnimation == "idling" ) return;
						if ( document.getElementById(currentAnimation) ) return;
						var animationDroplist = document.getElementById("animation-droplist");
						if ( !animationDroplist.getAnimationByName( currentAnimation ) ) return;
						var clip = animationDroplist.getAnimationByName( currentAnimation );
						document.getElementById("players-droplist").addMotion( currentAnimation, clip );
						var actionButton = document.createElement("div");
						actionButton.id = currentAnimation;
						actionButton.title = currentAnimation;
						actionButton.classList.add("btn", "btn-white-outline", "btn-action");
						actionButton.style.cssText = "background-size:contain;"
						+ "background-image:url('./thumbs/"+currentAnimation+".png');";
						document.getElementById("action-buttons").appendChild( actionButton );
						actionButton.addEventListener( "click", function actionClickHandler(){
							var select = document.getElementById("players-droplist");
							var animationController = select.getAnimationController( currentPlayer );
							if ( !animationController ) return;
							var timeout = parseInt( animationController.motion[ actionButton.id ]._clip.duration * 1000 );
							clearTimeout( idleInterval );
							idleInterval = setTimeout(function(){ animationController.play( "idling" ); }, timeout);
							actionButton.removeEventListener( "click", actionClickHandler );
							setTimeout(function(){ actionButton.addEventListener( "click", actionClickHandler ); }, timeout);
							animationController.motion[ actionButton.id ].reset();
							animationController.play( actionButton.id );
						});
					});
					return button;
				}

				function RemoveActionButton(){
					var button = document.createElement("div");
					button.id = "remove-action";
					button.textContent = "Remove";
					button.title = "Remove action button";
					button.style.cssText = "width:49%;height:40px;float:left;font-size:large;";
					button.classList.add( "form-control", "btn", "btn-primary", "btn-white-outline", "gradient-btn" );
					button.addEventListener( "click", function(){
						if ( !document.getElementById(currentAnimation) ) return;
						document.getElementById(currentAnimation).remove();
					});
					return button;
				}

			})();

			setTimeout(function(){
				var tab = TabUI.Animations.tab;
				var row = document.createElement("div");
				row.style.cssText = "margin:20px 12px 10px;height:35px;text-align:center;";
				var button = document.createElement("div");
				button.id = "import-animation";
				button.textContent = "Import animations";
				button.style.cssText = "width:100%;height:40px;font-size:large;";
				button.classList.add( "form-control", "btn", "btn-primary", "btn-white-outline", "gradient-btn" );
				var input = document.createElement("input");
				input.type = "file";
				input.style.display = "none";
				input.setAttribute("multiple", "");
				input.addEventListener( "change", function(){
					var select = document.getElementById("animation-droplist");
					if ( !select ) { input.value = ""; return; }
					for ( var i = 0; i < input.files.length; i++ ) {
						setTimeout(function( file ){
							var filename = file.name.replace(".fbx", "");
							var extension = file.name.split( "." ).pop().toLowerCase();
							var reader = new FileReader();
							reader.addEventListener( "progress", function ( e ) {
								var size = "(" + Math.floor( e.total / 1000 ).format() + " KB)";
								var progress = Math.floor( ( e.loaded / e.total ) * 100 ) + "%";
							});
							reader.addEventListener( "load", function ( e ) {
								var data = reader.result;
								var loader = new THREE.FBXLoader();
								var group = loader.parse( data );
								if ( !( group.animations && group.animations.length ) ) return;
								group.animations.forEach( function( clip ){
									clip.name = filename;
									document.getElementById("animation-droplist").addAnimation( filename, clip );
								});
							}, false );
							reader.readAsArrayBuffer( file );
						}, 0, input.files[i] );
					}
				});

				button.addEventListener( "click", function(){
					input.value = "";
					input.click();
				});

				button.appendChild( input );
				row.appendChild( button );
				tab.appendChild( row );

			});

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
						AddActionButton( clip );

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
					});
				});

				function AddActionButton( clip ){
					var button = document.createElement("div");
					button.id = button.title = clip.name;
					button.classList.add("btn", "btn-white-outline", "btn-action");
					button.style.cssText = "background-size:contain;background-image:url('./thumbs/"+clip.name+".png');";
					document.getElementById("action-buttons").appendChild( button );
					button.addEventListener( "click", function actionHandler(){
						var select = document.getElementById("players-droplist");
						var animationController = select.getAnimationController( currentPlayer );

						if ( !( select && animationController && animationController.motion[clip.name] ) ) return;

						if ( !animationController.queue ) {
							animationController.play( clip.name );
							animationController.motion[ clip.name ].reset();
							return;
						}

						if ( animationController.queue ) {
							if ( !animationController.queue.length ) {
								animationController.queue.push(function(){
									animationController.mixer.dispatchEvent({type:"play next"});
								});

								if ( isFighting ) action();

							} else {

								animationController.queue.push( action );

							}
						}

						function action(){
							var requestAnimationFrameID;
							animationController.play( clip.name );
							animationController.motion[ clip.name ].reset();
							var clock = new THREE.Clock();
							(function update(){
								requestAnimationFrameID = requestAnimationFrame( update );
								if ( clock.getElapsedTime() < clip.duration ) return;
								cancelAnimationFrame( requestAnimationFrameID );
								animationController.mixer.dispatchEvent({type:"play next"});
							})();
						}

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

				intersectHead.visible = debugMode;
				intersectBody.visible = debugMode;

				P1 = {health:0}; P2 = {health:0};

				P1.intersectHead = intersectHead.clone();
				P1.intersectBody = intersectBody.clone();
				P1.Hips = new THREE.Object3D();
				P1.LeftHand = new THREE.Object3D();
				P1.LeftFoot = new THREE.Object3D();
				P1.RightHand = new THREE.Object3D();
				P1.RightLeg = new THREE.Object3D();
				P1.RightFoot = new THREE.Object3D();
				P1.RightToeBase = new THREE.Object3D();
				P1.RightHandSword = new THREE.Object3D();

				P2.intersectHead = intersectHead.clone();
				P2.intersectBody = intersectBody.clone();
				P2.Hips = new THREE.Object3D();
				P2.LeftHand = new THREE.Object3D();
				P2.LeftFoot = new THREE.Object3D();
				P2.RightHand = new THREE.Object3D();
				P2.RightLeg = new THREE.Object3D();
				P2.RightFoot = new THREE.Object3D();
				P2.RightToeBase = new THREE.Object3D();
				P2.RightHandSword = new THREE.Object3D();

				function blink( label ){
					var display;
					setTimeout( function _blink(){
						if ( isFighting ) { label.style.display = ""; return; }
						display = !display;
						if ( display ) label.style.display = "";
						else label.style.display = "none";
						setTimeout( _blink, 650 );
					});
				}

				(function(){

					var bar = document.createElement("div");
					bar.id = "player1-bar";
					bar.title = "Player1 Health Bar";
					bar.style.cssText = "width:350px;height:40px;position:fixed;top:10px;"
					+ "border:2px solid #fff;border-radius:8px;background-color:#f00;right:380px;";
					var label = document.createElement("span");
					label.textContent = "Player 1";
					label.style.cssText = "position:absolute;color:#fff;"
					+ "font-weight:bold;font-size:x-large;left:-100px;";
					bar.appendChild( label );
					P1.blink = blink.bind( P1, label );
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

					P1.removeBar = function(){ bar.remove(); };
					P1.appendBar = function(){ document.body.appendChild( bar ); };
					P1.healthWacher = function(prop, action, value){
						health_bar.style.width = round( value, 1 ) + "%";
						text_bar.textContent = health_bar.style.width;
						if ( value > 0 ) label.style.color = "#fff";
						else label.style.color = "#f00";
					};

					watch( P1, "health", P1.healthWacher );

				})();

				(function(){

					var bar = document.createElement("div");
					bar.id = "player2-bar";
					bar.title = "Player2 Health Bar";
					bar.style.cssText = "width:350px;height:40px;position:fixed;top:10px;"
					+ "border:2px solid #fff;border-radius:8px;background-color:#f00;left:10px;";
					var label = document.createElement("span");
					label.textContent = "Player 2";
					label.style.cssText = "position:absolute;color:#fff;"
					+ "font-weight:bold;font-size:x-large;right:-100px";
					bar.appendChild( label );
					P2.blink = blink.bind( P2, label );
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

					P2.removeBar = function(){ bar.remove(); };
					P2.appendBar = function(){ document.body.appendChild( bar ); };
					P2.healthWacher = function(prop, action, value){
						health_bar.style.width = round( value, 1 ) + "%";
						text_bar.textContent = health_bar.style.width;
						if ( value > 0 ) label.style.color = "#fff";
						else label.style.color = "#f00";
					};

					watch( P2, "health", P2.healthWacher );

				})();

			//	Start button.

				setTimeout(function(){

					var tab = TabUI.Game.tab;
					var row = document.createElement("div");
					row.style.cssText = "margin:20px 12px 10px;height:35px;text-align:center;";
					var button = document.createElement("div");
					button.id = "start-raycasting";
					button.textContent = "Start Battle";
					button.style.cssText = "max-width:100%;width:100%;height:40px;font-size:large;";
					button.classList.add( "form-control", "btn", "btn-primary", "btn-white-outline", "gradient-btn" );
					button.addEventListener( "click", function(){ button.value = !button.value; });
					row.appendChild( button );
					tab.appendChild( row );

					watch( button, "value", function(prop, action, value){
						isFighting = value;
						if ( !value ) button.textContent = "Start Battle";
						else button.textContent = "Pause Battle";
						var player1 = scene.getObjectByName( "player1" );
						var player2 = scene.getObjectByName( "player2" );
						var playersDroplist = document.getElementById("players-droplist");
						var skeletonHelper1 = playersDroplist.getSkeletonHelper("player1");
						var skeletonHelper2 = playersDroplist.getSkeletonHelper("player2");
						var animationController1 = playersDroplist.getAnimationController("player1");
						var animationController2 = playersDroplist.getAnimationController("player2");
						animationController1.play("idling" );  animationController2.play( "idling" ); 

						if ( value ) { P1.appendBar();  P2.appendBar(); }
						if ( !value && (P1.health && P2.health) ) button.textContent = "Continue Battle";
						else if ( !value && !(P1.health && P2.health) ) button.textContent = "New Battle";
						if ( value && !(P1.health && P2.health) ) { P1.health = 100; P2.health = 100; }
						if ( !isFighting ) { animationController1.turn(0); animationController2.turn(0); }
						else { animationController1.turn(-Math.PI/2); animationController2.turn(Math.PI/2); }

						if ( isFighting ) {
							scene.add(P1.intersectHead, P1.intersectBody);
							scene.add(P2.intersectHead, P2.intersectBody);
							updatePointObjects( "player1", P1 ); updatePointObjects( "player2", P2 );
							swordRaycaster(P1, P2); swordRaycaster(P2, P1);
							rightKickRaycaster(P1, P2); rightKickRaycaster(P2, P1);
						} else {
							scene.remove(P1.intersectHead, P1.intersectBody);
							scene.remove(P2.intersectHead, P2.intersectBody);
						}
						
						if ( isFighting ) (function(){
							var requestAnimationFrameID;

							(function update(){
								requestAnimationFrameID = requestAnimationFrame( update );

								if ( P1.health < 0 ) {
									cancelAnimationFrame( requestAnimationFrameID ); 
									P1.health = 0; 
									isFighting = false;
									button.value = false; 
									P2.health && P2.blink();
									return; 
								}

								if ( P2.health < 0 ) {
									cancelAnimationFrame( requestAnimationFrameID ); 
									P2.health = 0; 
									isFighting = false;
									button.value = false; 
									P1.health && P1.blink();
									return; 
								}

								if ( !isFighting ) { 
									cancelAnimationFrame( requestAnimationFrameID ); 
									if ( P1.health > 0 ) P1.blink();
									if ( P2.health > 0 ) P2.blink();
									return; 
								}

							})();

						})();

						if ( isFighting ) {
							if ( animationController1.queue && animationController1.queue.length ) animationController1.queue.shift().call();
							if ( animationController2.queue && animationController2.queue.length ) animationController2.queue.shift().call();
						}

						if ( debugMode ) { player1.visible = player2.visible = !isFighting; skeletonHelper1.visible = skeletonHelper2.visible = isFighting; }

						function updatePointObjects( name, p ){
							var requestAnimationFrameID;
							var player = scene.getObjectByName( name );
							if ( !player ) return;
							var headBone = player.getObjectByName("Head");
							var bodyBone = player.getObjectByName("Spine1");
							var hipsBone = player.getObjectByName("Hips");
							var leftfootBone = player.getObjectByName("LeftToeBase");
							var lefthandBone = player.getObjectByName("LeftHandIndex1");
							var rightlegBone = player.getObjectByName("RightLeg");
							var rightfootBone = player.getObjectByName("RightFoot");
							var righttoebaseBone = player.getObjectByName("RightToeBase");
							var righthandBone = player.getObjectByName("RightHandIndex1");
							var rightswordBone = player.getObjectByName("RightHandIndex1Sword");

							(function update(){
								requestAnimationFrameID = requestAnimationFrame( update );
								if ( !isFighting ) { cancelAnimationFrame( requestAnimationFrameID ); return; }
								p.intersectHead.position.setFromMatrixPosition(headBone.matrixWorld);
								p.intersectBody.position.setFromMatrixPosition(bodyBone.matrixWorld);
								p.Hips.position.setFromMatrixPosition(hipsBone.matrixWorld);
								p.LeftHand.position.setFromMatrixPosition(lefthandBone.matrixWorld);
								p.LeftFoot.position.setFromMatrixPosition(leftfootBone.matrixWorld);
								p.RightHand.position.setFromMatrixPosition(righthandBone.matrixWorld);
								p.RightLeg.position.setFromMatrixPosition(rightlegBone.matrixWorld);
								p.RightFoot.position.setFromMatrixPosition(rightfootBone.matrixWorld);
								p.RightToeBase.position.setFromMatrixPosition(righttoebaseBone.matrixWorld);
								p.RightHandSword.position.setFromMatrixPosition(rightswordBone.matrixWorld);
							})();

						}

						function swordRaycaster(P1, P2){
							var far = 9;
							var intersectsInterval;
							var requestAnimationFrameID;
							var origin = new THREE.Vector3();
							var direction = new THREE.Vector3();
							var intersectObject = P2.intersectBody; 
							origin.copy( P1.RightHand.position );
							direction.subVectors(P1.RightHandSword.position, P1.RightHand.position ).normalize();
							var raycaster = new THREE.Raycaster();
							raycaster.far = far; raycaster.ray.set( origin, direction );

							if (debugMode) {var arrow = new THREE.ArrowHelper( raycaster.ray.direction, raycaster.ray.origin, raycaster.far );scene.add( arrow );}

							(function update(){
								requestAnimationFrameID = requestAnimationFrame( update );
								if ( !isFighting ) { 
									cancelAnimationFrame( requestAnimationFrameID ); 
									if ( debugMode ) {scene.remove( arrow ); 
										arrow.line.geometry.dispose(); arrow.line.material.dispose();
										arrow.cone.geometry.dispose(); arrow.cone.material.dispose();
									}
									return; 
								}

								origin.copy( P1.RightHand.position );
								direction.subVectors(P1.RightHandSword.position, P1.RightHand.position).normalize();
								raycaster.ray.set( origin, direction );

								if ( debugMode ) {
									arrow.position.copy( raycaster.ray.origin );
									arrow.setDirection( raycaster.ray.direction  );
								}

								var intersects = raycaster.intersectObject( intersectObject );
								if ( !intersects.length ) return;
								P2.health -= (raycaster.far - intersects[0].distance) / 20;

							})();

						}

						function rightKickRaycaster(P1, P2){
							var intersectsInterval;
							var requestAnimationFrameID;
							var origin = new THREE.Vector3();
							var direction = new THREE.Vector3();
							var intersectObject = P2.intersectHead; 
							origin.copy( P1.RightFoot.position );
							direction.subVectors(P1.RightToeBase.position,P1.RightFoot.position).normalize();
							var raycaster = new THREE.Raycaster();
							raycaster.far = 3; raycaster.ray.set( origin, direction );

							if (debugMode) { var arrow = new THREE.ArrowHelper( raycaster.ray.direction, raycaster.ray.origin, raycaster.far ); scene.add( arrow ); }

							(function update(){
								requestAnimationFrameID = requestAnimationFrame( update );
								if ( !isFighting ) { 
									cancelAnimationFrame( requestAnimationFrameID ); 
									if ( debugMode ) {scene.remove( arrow ); 
										arrow.line.geometry.dispose(); arrow.line.material.dispose();
										arrow.cone.geometry.dispose(); arrow.cone.material.dispose();
									}
									return; 
								}

								origin.copy( P1.RightFoot.position );
								direction.subVectors(P1.RightToeBase.position, P1.RightFoot.position ).normalize();
								raycaster.ray.set( origin, direction );

								if ( debugMode ) { arrow.position.copy( raycaster.ray.origin );arrow.setDirection( raycaster.ray.direction  ); }

								var intersects = raycaster.intersectObject( intersectObject );
								if ( !intersects.length ) return;
								P2.health -= (raycaster.far - intersects[0].distance);

							})();

						}
						
						if ( isFighting ) (function( animationController ){
							var keys = Object.keys( animationController.motion );
							setTimeout(function randomMotion(){
								if ( !isFighting ) return;
								var index = parseInt( Math.random() * keys.length );
								while ( keys[ index ] == "idling" ){
									index = parseInt( Math.random() * keys.length );
								}
								var name = keys[ index ];
								var clip = animationController.motion[ name ]._clip;
								var timeout = parseInt( clip.duration * 1000 );
								debugMode && console.log( index, name, timeout );
								animationController.play( clip.name );
								animationController.motion[ clip.name ].reset();
								setTimeout( randomMotion, timeout);

							});

						})( animationController2 );

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

					debugMode && console.log( player ); 

					var bones = {};
					var meshes = {};
					var wepons = {};
					var skinned = {};
					var helpers = {};
					var armature;
					var animations = player.animations;

					player.traverse( function( child ){

						if (child.name == "Armature") { armature = child; }

						if (child.isMesh) {	
							child.castShadow = true;	
							child.receiveShadow = true;	
							meshes[ child.name ] = child;
						}

						if ( child.isBone ) { bones[ child.name ] = child; }
						if ( child.isSkinnedMesh ) { skinned[ child.uuid ] = child; }
						if (child.name == "sword") { wepons[ child.name ] = child; }

						if (child.name == "MannyTheSkeleton_v51") {
							(function(mesh){
								mesh.material = new THREE.MeshStandardMaterial({name:"player1_Material", skinning:true});
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
						bone.position.set(200, 20, -80);
						player.getObjectByName("RightHandIndex1").add(bone);
					})();

					(function(){
						var skeletonHelper = new THREE.SkeletonHelper( player );
						skeletonHelper.visible = debugMode;
						scene.add( skeletonHelper );
						helpers.skeletonHelper = skeletonHelper;
					})();

					if ( animations && animations.length ) player.animations[0].name = "idling";
					var animationController = new MW.AnimationController( player ); animationController.queue = [];

					(function(){
						var mixer = animationController.mixer;
						mixer.addEventListener("play next", function(){
							if ( !isFighting ) return;
							var queue = animationController.queue;
							if ( queue.length ) queue.shift().call();
							else animationController.play("idling");
						});
					})();

					(function( select ){
						var mixer = animationController.mixer; 
						var object = animationController.object;
						select.getAnimations().forEach(function( clip ){
							animationController.motion[ clip.name ] = mixer.clipAction( clip, object );
						});
					})( document.getElementById("animation-droplist") );

					var clock = new THREE.Clock();
					(function update(){
						requestAnimationFrame( update );
						var delta = clock.getDelta();
						animationController.update( delta );
					})();

					if ( animationController.motion.idling ) animationController.play("idling");

					(function( select ){
						if ( !select ) return;
						var object = {name: player.name, uuid: player.uuid};
						if ( animationController ) {object.animationController = animationController;}
						if ( helpers.skeletonHelper ) {object.skeletonHelper = helpers.skeletonHelper;}
						select.addPlayer( player.name, object, true);
					})( document.getElementById("players-droplist") );

				},

				function(e){}, 
				function(err){
					console.error(err);
				});

			})("player1", 0.00033, 10);


			loadPlayer("player2", 0.00033, -10);

			function loadPlayer( name, s, x ){
				var loader = new THREE.FBXLoader();
				loader.load( "./characters/MannySwordIdle05.fbx", function( player ){
					player.name = name;
					player.scale.set(s,s,s);
					player.position.x = x;
					scene.add( player );

					var bones = {};
					var meshes = {};
					var wepons = {};
					var skinned = {};
					var helpers = {};
					var armature;
					var animations = player.animations;

					player.traverse( function( child ){

						if (child.name == "Armature") armature = child; 

						if (child.isMesh) {	
							child.castShadow = true;	
							child.receiveShadow = true;	
							meshes[ child.name ] = child;
						}

						if ( child.isBone ) bones[ child.name ] = child;
						if ( child.isSkinnedMesh ) skinned[ child.uuid ] = child;
						if (child.name == "sword") wepons[ child.name ] = child;

						if (child.name == "MannyTheSkeleton_v51") {
							(function(mesh){
								mesh.material = new THREE.MeshStandardMaterial({name:name+"_Material", skinning:true});
								var loader = new THREE.ImageLoader();
								loader.setCrossOrigin("anonymous");
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
						bone.position.set(200, 20, -80);
						player.getObjectByName("RightHandIndex1").add(bone);
					})();

					(function(){
						var skeletonHelper = new THREE.SkeletonHelper( player );
						skeletonHelper.visible = debugMode;
						scene.add( skeletonHelper );
						helpers.skeletonHelper = skeletonHelper;
					})();

					if ( animations && animations.length ) player.animations[0].name = "idling";
					var animationController = new MW.AnimationController( player ); animationController.queue = [];

					(function(){
						var mixer = animationController.mixer;
						mixer.addEventListener("play next", function(){
							if ( !isFighting ) return;
							var queue = animationController.queue;
							if ( queue.length ) queue.shift().call();
							else animationController.play("idling");
						});
					})();

					(function( select ){
						var mixer = animationController.mixer; 
						var object = animationController.object;
						select.getAnimations().forEach(function( clip ){
							animationController.motion[ clip.name ] = mixer.clipAction( clip, object );
						});
					})( document.getElementById("animation-droplist") );

					var clock = new THREE.Clock();
					(function update(){
						requestAnimationFrame( update );
						var delta = clock.getDelta();
						animationController.update( delta );
					})();

					if ( animationController.motion.idling ) animationController.play("idling");

					(function( select ){
						if ( !select ) return;
						var object = {name: player.name, uuid: player.uuid};
						if ( animationController ) object.animationController = animationController;
						if ( helpers.skeletonHelper ) object.skeletonHelper = helpers.skeletonHelper;
						select.addPlayer( player.name, object );
					})( document.getElementById("players-droplist") );

				},

				function(e){}, 
				function(err){
					console.error(err);
				});

			}

