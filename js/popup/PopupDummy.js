(function(){
	
	var PopupDummy = function(){
		
		var self = this;

		const MAX_IMAGES = 4;
		const INTERVAL_PAUSE = 7 * 24 * 3600 * 1000; // 7 days
		const shwoMind = true;

		// ---------------------------------------------- INIT ---------------------------
		this.init = function(){	

			var showDummy = _b(fvdDownloader.Prefs.get( "panel_dummy_message" ));
			var showMind = fvdDownloader.Prefs.get( "panel_mind_message" );

			if (!showDummy) {
				remove();
			}
			else if (showMind >= 0) {

				// check install extension
				chrome.extension.getBackgroundPage().fvdDownloader.isInstallExtension({id: 'accebjobnljiehcaocahignlanfnfkcc'
			
																					  }, function(fl){
					
																						var now = new Date().getTime();
																						var timePause = parseInt(showMind);

																						if (fl) {
																							remove();
																						}
																						else if ( timePause && ( (now - timePause) < INTERVAL_PAUSE ) )  {
																							remove();
																						}	
																						else {
																							// build_mind( );
																							// document.getElementById("dummy_close").addEventListener( "click", pause, false);
																						}	

				});
			}
			else {
				remove();
			}

		}

		// --------------------------------------------------------------------------------
		function pause( event ){

			fvdDownloader.Prefs.set( "pause_dummy_message", new Date().getTime(), "migrate" );
			fvdDownloader.Prefs.set( "panel_mind_message", new Date().getTime(), "migrate" );

			remove();

		}	
		
		// ----------------------------------------------
		this.navigate_url = function( url ){
			chrome.tabs.query( 	{
							url:  url 
						}, function( tabs ){

									if( tabs.length > 0 )
									{
										foundTabId = tabs[0].id;
										chrome.tabs.update( foundTabId, {
																		active: true
																		} );
									}
									else
									{
										chrome.tabs.create( {	active: true,
																url: url
															}, function( tab ){ }
														);
									}
					} );
		}

		// --------------------------------------------------------------------------------
		function remove( ){

			var c1 = document.getElementById("dummy_container");
			var c2 = document.getElementById("dummy_container_girl");
			if (c1 && c2) c1.removeChild( c2 );
		}	

		const optMint = {
			en: { // English
				header: "Nimbus Mind",
				title:  "The only Chrome extension for Calm, Relax, and Nature sounds.",
				link: "https://chrome.google.com/webstore/detail/nimbusmind-meditation-rel/accebjobnljiehcaocahignlanfnfkcc",
				footer: "Also, available for iPhone and Android phones: nimbusmind.com",
				button: "View Addon"
			},
			ru: { // Russian
				header: "Nimbus Mind",
				title:  "Единственный Chrome аддон для Антистресса, Релакса и Звуков природы. ",
				link: "https://chrome.google.com/webstore/detail/nimbusmind-meditation-rel/accebjobnljiehcaocahignlanfnfkcc?hl=ru",
				footer: "Так же доступен для iPhone и Android: nimbusmind.com/ru",
				button: "Перейти к Аддону"
			},
        };
		
		// --------------------------------------------------------------------------------
		function build_mind( ){

			var lang = chrome.i18n.getUILanguage();
			if ( !optMint[lang] )  lang = 'en';

			var container = document.getElementById("awn-z2060351");

			var cn = document.createElement("div");
			cn.setAttribute("class", "mind-content");
			container.appendChild(cn);

			var cm = document.createElement("div");
			cm.setAttribute("class", "mind-wrapped");
			cn.appendChild(cm);

			var ci = document.createElement("div");
			ci.setAttribute("class", "mind-wrapped-image");
			ci.innerHTML='<img class="image" src="/images/popup/nimbus-mind.png">';
			cm.appendChild(ci);
			
			var ct = document.createElement("div");
			ct.setAttribute("class", "mind-wrapped-text");
			cm.appendChild(ct);
			
			var ct1 = document.createElement("div");
			ct1.setAttribute("class", "mind-wrapped-text-header");
			ct1.innerHTML = '<div class="header">'+optMint[lang].header+'</div>';
			ct.appendChild(ct1);
			
			var ct4 = document.createElement("div");
			ct4.setAttribute("class", "mind-wrapped-text-stars");
			ct4.innerHTML = '<img class="stars" src="/images/stars.png">';
			ct.appendChild(ct4);
			
			var ct2 = document.createElement("div");
			ct2.setAttribute("class", "mind-wrapped-text-description");
			ct2.innerHTML = '<div class="desc">'+optMint[lang].title+'</div>';
			ct.appendChild(ct2);
			
			var ct3 = document.createElement("div");
			ct3.setAttribute("class", "mind-wrapped-text-link");
			ct3.innerHTML = '<div class="url">'+optMint[lang].link+'</div>';
			ct.appendChild(ct3);

			ct3.addEventListener( "click", function( event ){
				event.stopPropagation();
				self.navigate_url(optMint[lang].link);
				setTimeout( function() {
					window.close();	
				}, 100);
			}, false );
			
			var cf = document.createElement("div");
			cf.setAttribute("class", "mind-wrapped-text-footer");
			cf.innerHTML = '<div class="text">'+optMint[lang].footer+'</div>';
			cm.appendChild(cf);

			var cb = document.createElement("div");
			cb.setAttribute("class", "mind-wrapped-button");
			cb.innerHTML = '<button class="button">'+optMint[lang].button+'</button>';
			cm.appendChild(cb);
			
			cb.addEventListener( "click", function( event ){
				event.stopPropagation();
				self.navigate_url('https://chrome.google.com/webstore/detail/nimbusmind-meditation-rel/accebjobnljiehcaocahignlanfnfkcc');
				setTimeout( function() {
					window.close();	
				}, 100);
			}, false );

			
		}	

		// --------------------------------------------------------------------------------
		function get( callback ){

			//var currUrl = parseInt(Math.random() * 99) % 2;
			var currUrl = 1;

			if (currUrl == 0)  {
				var url = 'http://discovernative.com/script/native.php?r=2060351&cbrandom=0.25823352952787726&cbWidth=407&cbHeight=203&cbtitle=&cbref=&cbdescription=&cbkeywords=&cbiframe=1&&callback=jsonp113325';
				get_response( url, function(content){

					try {
						content = content.substring( 12, content.length-1 );
						var x = JSON.parse(content);

						var l = [];
						for (var i=0; i<x.data.length; i++) {
							if (x.data[i].images[0].file && x.data[i].images[0].file.startsWith('http') && x.data[i].click_url.startsWith('http')) {
								l.push({  url:   x.data[i].click_url,
										  image: x.data[i].images[0].file,
										  title: x.data[i].title,
										  label: x.data[i].description,
									   });
							}
						}

						callback( get_random(l) );
					}
					catch(ex) {
						callback( null );
					}	
	
				});


			}
			else {
				currUrl = 0;
			}	
			
		}

		// --------------------------------------------------------------------------------
		function cut_text( t ){

			if (t.length<48) return t;

			var k = t.indexOf(' ', 36);
			if (k<48)  return t.substring(0, k)+'..';

			k = t.lastIndexOf(' ', 36);
			if (k>30)  return t.substring(0, k)+'..';

			return t.substring(0, 36)+'..';	
		}	

		// --------------------------------------------------------------------------------
		function get_random( x ){

			var j = parseInt(Math.random() * x.length);

			var ll = [];			
			for (var i=0; i<MAX_IMAGES; i++)  {
				ll.push(x[j]);
				j++;
				if (j == x.length) j=0;
			}

			return ll;
		}	

		// --------------------------------------------------------------------------------
		function get_response( url, callback ){
			
			var ajax = new XMLHttpRequest();
			ajax.open('GET', url, true);
			ajax.setRequestHeader('Cache-Control', 'no-cache');
			ajax.setRequestHeader('X-FVD-Extra', 'yes');
			
			ajax.onload = function(){
						var content = this.responseText;
						callback( content );
			}
			
			ajax.onerror = function(){
				callback( null );
			}
			
			ajax.send( null );
		}

	
	}
	
	this.PopupDummy = new PopupDummy();
	
}).apply( fvdDownloader );

