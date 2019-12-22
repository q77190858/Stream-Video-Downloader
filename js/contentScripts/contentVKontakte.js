(function(){
	
	if(window.__fvdDownloaderContentScriptInserted)	return;
	window.__fvdDownloaderContentScriptInserted = true;

	const BUTTON_ID = "fvdDownloader_page_button_";

	const BUTTON_TITLE = "Download";
	const BUTTON_TOOLTIP = "Download";
	const ADDON_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACg0lEQVQ4jY2RW0iTYRzGn2/v+73fYYdv7jxtbnNmiXO5TheKQZCSIEJEXUrQZQXSlUJFRHgRXQUVRPeBBGInyouMgihBQUsNa6Lo5mEz3dS5fW77uvCiPNLv+nng+f3/HHbjZEeFUeKrVhJ5HWEExKXnsJocVz8lxoAnG/9G6S51ndPEt7uCjtZMMpknJj0ExnSzg5meudBaG4YxsyW8o17SUUQpV1mYihKppJgJTM+0yQSVbEoIcPi3x3cusKh2csDt1HJpcOPTgI5A85ZCUJkJkZgTAAdA23MBFfQeSV23aQ478kVWFNzF0BkU6NMZxSQZPUAT21eBMepnKjWwLAC3C5zFBjFbgMh4kfJ8Kco84r4KPBMqjALlCkRETlRACA8hnQIvcRBk2QeqMwBI7q1gtwaIzw9Z1UHijZA1EbLGgGA1qMvlQWxF2b6Ag69Nkf3OQDqV9ZDVVChbcgKCTYM5lgATGXLhINLZPLREyqcPVzWvsXtWzKV/YmQkTgAA7sb6spbTL8qb687lp5Zd+ehvrqiuBlazBL3XiQLhoH7oh/2wTy6/1FgncNKFhYnIR8QeRzYVUpODE6++vEOWKtVXznMOiwHC5wGYy1wwGXmIA8MoDXoRvlgL9Vdc/vH2ay+W0kMAtM0FK0Prhaj5zfx0XPQGA7VHm46Ai8VBZ2ZBFxZh8TsROBvCUN8oXj/sfpTvT1zD0v1lACB/zzGaK8y+742OOzOBmtL6Y2eqqTqdgOJQcKihEv293za6HjzvzA1+bweeZrcffwtiuPPy9ZeRVNd8Qete1LSrz8bWhZo7bbt9bU/k8o6W230z8Rs9E0skfLP1v4tbOHj3FD1+q2G/yB+MJNSfSgtbTQAAAABJRU5ErkJggg==";

	
	
	// ======================  VKontakte  ==============================================================
	function buttonVKontakte( port, tabId, media ) {

		console.log("iconVKontakte", media);

		for (var i=0; i<media.length; i++) {

			insertButton(media[i].id, media[i].videoId);

		}

		// --------------------------------
		function insertButton(mediaId, videoId) {

			var bttn_id = BUTTON_ID + videoId;
			var bttn = document.getElementById( bttn_id );
			if ( !bttn ) {		// add button

				var ee = document.querySelector('div[data-full-id="'+videoId+'"]');	
				if (ee) {
					var block = ee.querySelector('div.audio_row__inner');	
					if (block) {
						block.setAttribute("style", "padding-left: 75px; position: relative;");

						var d1 = document.createElement("div");
						d1.setAttribute("class", "fvdDownloader_page_button");
						block.appendChild( d1 );	

						var img = document.createElement("img");
						img.setAttribute("class", "fvdDownloader_page_button_logo");
						img.setAttribute("src", ADDON_IMAGE);
						d1.appendChild( img );	

						d1.addEventListener("click", function(e){

										port.postMessage( {
													action:  "startDownload",
													mediaId: mediaId
												} );

										e.stopPropagation();
									}, true);

					}
				}
			}
		}





	}

	
	// ====================================================================================
	console.log('--insert--script--');
	
	chrome.runtime.onConnect.addListener(function( port ){				
		
		port.onMessage.addListener( function( message ){

			switch( message.action ){
								
				// ====================================================================================
				case "insert_button":
				
					buttonVKontakte( port, message.tabId, message.media );
				
				break;

				// ====================================================================================

			}
			
		} );

		
	});
	
})();

