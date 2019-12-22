(function(){

	var PageButton = function(){

		var self = this;
		
		// ===============================================================
		this.MediaButtonHide = function(tabId){

			//console.log('MediaButtonHide');

			if( tabId < 0 ) return;

		    chrome.tabs.sendMessage(tabId, {command: "hide_button"});
		}	

		// ===============================================================
		this.MediaForTabUpdate = function(tabId){
			
			//console.log('MediaForTabUpdate', tabId );
			
			setTimeout( function() {
			
				chrome.tabs.query( 	{  }, function( tabs ){
					if( tabs.length > 0 )	{
						for (var i=0; i<tabs.length; i++) {
							if (tabs[i].id == tabId ) {
								
								var tabUrl = tabs[i].url;
							
								if ( /:\/\/(?:www\.)?youtube\.com/i.test(tabUrl)) {
										YouTubeButtonInsert(tabId, tabUrl);
								}	
								else if ( /:\/\/(?:www\.)?facebook\.com/i.test(tabUrl)) {
										FaceBookButtonInsert(tabId, tabUrl);
								}	
								//else if ( /:\/\/(?:www\.)?vk\.com/i.test(tabUrl)) {
								//		VKontakteButtonInsert(tabId, tabUrl);
								//}	
								
								
								return;
							}	
						}
					}
				});
			}, 1000);	
			
		}
		
		// ----------------------------------------------------------------------------  
		function YouTubeButtonInsert(tabId, tabUrl){

			if( tabId < 0 ) return;			

			var media = fvdDownloader.Media.getMedia( tabId );

			if (!media || media.length == 0) return;

			chrome.tabs.executeScript( tabId, {
								file: "/js/contentScripts/contentYouTube.js"
								}, function(){

											var port = chrome.tabs.connect( tabId );
											port.postMessage( { action: "insert_button", media: media });

											port.onMessage.addListener(function( message ){

															switch( message.action )
															{
																case "startDownload":	
																			fvdDownloader.Load.clickDownload( message.mediaId );
																			break;
															}
														});
										});
										
			chrome.tabs.insertCSS( tabId, {	 file: "/js/contentScripts/contentYouTube.css" } );
		
		}

		// ----------------------------------------------------------------------------  
		function VimeoButtonInsert(tabId, tabUrl){

			if( tabId < 0 ) return;			

			var media = fvdDownloader.Media.getMedia( tabId );
			var nat = fvdDownloader.native.enabled();

			if (media.length == 0) return;

			chrome.tabs.executeScript( tabId, {
								file: "/js/contentScripts/contentVimeo.js"
								}, function(){

											var port = chrome.tabs.connect( tabId );
											port.postMessage( { action: "insert_button", media: media, nat: nat });

											port.onMessage.addListener(function( message ){

															console.log(message);

															switch( message.action )
															{
																case "startDownload":	
																			fvdDownloader.Load.clickDownload( message.mediaId );
																			break;
															}
														});
										});
										
										
			chrome.tabs.insertCSS( tabId, {	 file: "/js/contentScripts/contentVimeo.css" } );

		
		}


		// ----------------------------------------------------------------------------  
		function FaceBookButtonInsert(tabId, tabUrl){

			if( tabId < 0  || !_b(fvdDownloader.Prefs.get( "display_facebook_button" )) ) return;			

			var media = fvdDownloader.Media.getMedia( tabId );

			if (!media || media.length == 0) return;

			var buttonMedia = [];
			for (var ii=0; ii<media.length; ii++) {

				var z = _find( media[ii].videoId );

				if (!z) {
					buttonMedia.push({  id: media[ii].id,
										url: media[ii].url,
										quality: media[ii].quality,
										videoId: media[ii].videoId
									})
				}
				else if (z && z.quality == 'sd') {
					z.quality = media[ii].quality;
					z.id = media[ii].id;
					z.url = media[ii].url;
				}

			}
			if (buttonMedia.length == 0) return;

			chrome.tabs.executeScript( tabId, {
									file: "/js/contentScripts/contentFaceBook.js"
								}, function(){

											var port = chrome.tabs.connect( tabId );
											port.postMessage( { action: "insert_button", tabId: tabId, media: buttonMedia });

											port.onMessage.addListener(function( message ){

															switch( message.action )
															{
																case "startDownload":	
																			fvdDownloader.Load.clickDownload( message.mediaId );
																			break;
															}
														});
										});
										
										
			chrome.tabs.insertCSS( tabId, {	 file: "/js/contentScripts/contentFaceBook.css" } );


			// -----------------------------		
			function _find( videoId ) {

				for (var jj=0; jj<buttonMedia.length; jj++) {
					if (buttonMedia[jj].videoId == videoId) {
						return buttonMedia[jj];
					}
				}
				return null;	
			}



		}

		// ----------------------------------------------------------------------------  
		function VKontakteButtonInsert(tabId, tabUrl){

			if( tabId < 0  || !_b(fvdDownloader.Prefs.get( "display_vk_button" )) ) return;			

			var media = fvdDownloader.Media.getMedia( tabId );

			if (!media || media.length == 0) return;

			chrome.tabs.executeScript( tabId, {
								file: "/js/contentScripts/contentVKontakte.js"
								}, function(){

											var port = chrome.tabs.connect( tabId );
											port.postMessage( { action: "insert_button", tabId: tabId, media: media });

											port.onMessage.addListener(function( message ){

															switch( message.action )
															{
																case "startDownload":	
																			fvdDownloader.Load.clickDownload( message.mediaId );
																			break;
															}
														});
										});
										
										
			chrome.tabs.insertCSS( tabId, {	 file: "/js/contentScripts/contentVKontakte.css" } );



		}



		// ----------------------------------------------------------------------------  


		
	}
	
	this.PageButton = new PageButton();
	
}).apply(fvdDownloader);
