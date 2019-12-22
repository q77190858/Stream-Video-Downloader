if (window == chrome.extension.getBackgroundPage()) {
	
	(function(){
	
		// ======================================================================
		var Recorder = function(){		
		
			var error = 0;
			
			// -------------------------------------------------------------------
			//  hash
			//
			this.start = function( hash ){

				navigateMainUrl( "/app/record.html#"+hash );
				
			}
			
			// -------------------------------------------------------------------
			this.stop = function( hash ){
				
				console.log('Recorder.stop', hash);
				
				chrome.tabs.query( 	{  }, function( tabs ){
								if( tabs.length > 0 )	{
									var uu = "record.html#"+hash;
									for (var i=0; i<tabs.length; i++) {
										if ( tabs[i].url.indexOf(uu) != -1 ) {	
											chrome.tabs.sendRequest(tabs[i].id, {	type: "recorder-stop", hash: hash	});
										}
									}
								}
				} );
				
			}

			// -------------------------------------------------------------------
			this.getError = function( ){
			
				if(error !== "")  {
					return error;
				}
				else  {
					return "No Error!";	
				}
			}
			
		}
		
		this.Recorder = new Recorder();
		
	}).apply(fvdDownloader);
}
else{
	fvdDownloader.Recorder = chrome.extension.getBackgroundPage().fvdDownloader.Recorder;
}

