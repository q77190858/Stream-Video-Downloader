if (window == chrome.extension.getBackgroundPage()) {
	
	(function(){

		const DEBUG = false;
		
		// ======================================================================
		var Playlister = function(){		
		
			var error;
			
			// -------------------------------------------------------------------
			// параметры:
			//    hash        - видео к скачиванию
			//    callbackFinish   - обработка  завершение
			//    callbackMessage  - отображения хода загрузки
			//
			this.start = function( hash ){
	
				navigateMainUrl( "/app/playlist.html#"+hash );
				
			}
			
			// -------------------------------------------------------------------
			// параметры:
			//  hash        - видео к скачиванию
			//
			this.stop = function( hash ){
				
				chrome.tabs.query( 	{  }, function( tabs ){
								if( tabs.length > 0 )	{
									var uu = "playlist.html#"+hash;
									for (var i=0; i<tabs.length; i++) {
										if ( tabs[i].url.indexOf(uu) != -1 ) {	
											chrome.tabs.sendRequest(tabs[i].id, {	type: "streamer-stop", hash: hash	});
										}
									}
								}
				} );
				
				
			}
			
			// -------------------------------------------------------------------
			this.getError = function( ){
			
				if(error !== "")
				{
					return error;
				}
				else
				{
					return "No Error!";	
				}
			}

			
			// -------------------------------------------------------------------
		};
		
		this.Playlister = new Playlister();
		
	}).apply(fvdDownloader);
}
else{
	fvdDownloader.Playlister = chrome.extension.getBackgroundPage().fvdDownloader.Playlister;
}

