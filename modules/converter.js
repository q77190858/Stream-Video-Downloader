if (window == chrome.extension.getBackgroundPage()) {
	
	(function(){
	
		var Converter = function()  {		
		
			var self = this;
			
			// -------------------------------------------------------------------
			this.start = function( hash ){
				
				navigateMainUrl( "/app/convert.html#"+hash );
				
			}
			
			// -------------------------------------------------------------------
			this.stop = function( hash ){
				
				console.log('Downloader.stop', hash);
				
				chrome.tabs.query( 	{  }, function( tabs ){
								if( tabs.length > 0 )	{
									var uu = "convert.html#"+hash;
									for (var i=0; i<tabs.length; i++) {
										if ( tabs[i].url.indexOf(uu) != -1 ) {	
											chrome.tabs.sendRequest(tabs[i].id, {	type: "converter-stop", hash: hash	});
										}
									}
								}
				} );
				
			}
			
		}
		
		this.Converter = new Converter();
		
	}).apply(fvdDownloader);
}
else{
	fvdDownloader.Converter = chrome.extension.getBackgroundPage().fvdDownloader.Converter;
}

