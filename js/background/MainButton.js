if (window == chrome.extension.getBackgroundPage()) {

	(function(){
	
		var MainButton = function(){
		
			var self = this;

			const TRIGGER_VIDEO_SIZE = 1048576;
			const MIN_FILESIZE_TO_CHECK = 100 * 1024;
			
			const YOUTUBE_URL_SIGNS = [
				"//youtube.com",
				"//www.youtube.com",
				"//gaming.youtube.com",
				"//soloset.net",
				"//www.soloset.net",
				"//solosing.com",
				"//www.solosing.com"
			];
			
			const DAILYMOTION_URL_SIGNS = [
				"//dailymotion.com",
				"//www.dailymotion.com",
				"//dmcdn.net"
			];

			const TWITCH_URL_SIGNS = [
				"//www.twitch.tv",
				"//www.periscope.tv",
			];
			
			const STREAM_URL_SIGNS = [
				"//www.ustream.tv",
			];
			
			var isButtonStatus = 0;		// 0 - disabled  1 - enabled  2 - downloader  3 - recorder
			
			this.isVideoConverter = false;
			
			var type_Page = 0;
			var type_Popup = 0;
			
			
			// ----------------------------------------------
			function getActiveTab(callback){
				fvdDownloader.Utils.getActiveTab(callback);
			}
			
			// -------------------------------------------------------------------------------
			this.MediaForTabUpdate = function( tabId )  {
				getActiveTab(function(tab){
					if (!tab) 	return;
					if (tabId == tab.id) {
						refreshMainButtonStatus(tabId);
					}
				});
			};
			
			// -------------------------------------------- состояние кнопки в панели
			function setMainButtonStatus(tabId){

				var img = null;
				
				switch ( type_Page ) {
					case 0: 		// undefined
							img = chrome.extension.getURL('images/icons/stream-off-18x18.png'); 
							isButtonStatus = 0;	
							type_Popup = 0;
							break;
					case 1: 		// options
					case 2: 		// youtube
					case 3: 		// ignore
					case 4: 
							img = chrome.extension.getURL('images/icons/stream-off-18x18.png'); 
							isButtonStatus = 0;
							type_Popup = type_Page;							
							break;
					case 5: 
					case 6: 
					case 7: img = chrome.extension.getURL('images/icons/stream-on-18x18.png');  
							isButtonStatus = 1;	
							type_Popup = 0;
							break;
					case 8: img = chrome.extension.getURL('images/icons/stream-action-18x18.png');  
							isButtonStatus = 2;	
							type_Popup = 0;
							break;
					case 9: img = chrome.extension.getURL('images/icons/stream-record-18x18.png');  
							isButtonStatus = 4;	
							type_Popup = 0;
							break;
				}	
				
				try {
					if (typeof tabId == 'string') tabId = parseInt(tabId);
					chrome.browserAction.setIcon({
											path: img,
											tabId: tabId
										});
				}
				catch(ex) {
					console.log(tabId, typeof tabId);
					console.error(ex);
				}	

				self.setPopup(tabId);
			}
			
			// -----------------------------------------  window.addEventListener( "load"
			function MainButtonStatus(tabId, tabUrl){
				
				type_Page = 0;
			
				if (!tabId)  {
					setMainButtonStatus(tabId);
					return;
				}

				// сужебная страница	
				if ( tabUrl.indexOf( 'chrome://' ) == 0 )  type_Page = 1;	// options
				
				// youtube
				if (fvdDownloader.noYoutube && tabUrl)	{
					if (self.isYoutubeUrl(tabUrl)) {
						type_Page = 2;					// youtube
					}
				}
	
				// содержимое
				if (fvdDownloader.Storage.hasDataForTab(tabId) && type_Page==0) {

					var items = fvdDownloader.Media.getMedia( tabId );
					items = self.filter_Media( items );
					var notItems = fvdDownloader.Media.filterNotAllowedMedia( items );

					if (items.length > 0) {
						if (items.length == notItems.length) 	type_Page = 3;	   // все игнорируемые
						else 									type_Page = 5;	   // есть рабочие	
					} 
					
					// проверим на стримы
					//type_Page = 6;	   // стримы
					//type_Page = 16;	   // ошибочные стримы
					
					for (var i=0; i<items.length; i++) {
						if (items[i].status == 'start') {	
							type_Page = 8;											// качаются
							if (items[i].metod == 'record')  type_Page = 9;			// пишется
						}
					}

					setMainButtonStatus(tabId);
				}
				else {
					setMainButtonStatus(tabId);
				}
			
			}
			
			// -----------------------------------------  
			function refreshMainButtonStatus(tabId){
				
				//console.log('refreshMainButtonStatus', tabId);
				
				if ( tabId ) {
					chrome.tabs.query( 	{  }, function( tabs ){
						if( tabs.length > 0 )	{
							for (var i=0; i<tabs.length; i++) {
								if (tabs[i].id == tabId ) {
									MainButtonStatus(tabs[i].id, tabs[i].url);
									return;
								}	
							}
						}
					});
				}
				else {	
					getActiveTab(function(tab){
					
						if (tab) 	{
							MainButtonStatus(tab.id, tab.url);
						}
					});
				}	
			}
			this.refreshMainButtonStatus = function(tabId){
				refreshMainButtonStatus(tabId);
			};
			
			// -------------------------------------------------------------------------------
			this.setPopup = function( tabId )  {
				if (type_Popup == 0) {
					chrome.browserAction.setPopup({ popup: 'popup.html' });	
				}
				else {	
					chrome.browserAction.setPopup({ popup: 'noload.html#'+type_Page });
				}

			}	

			// -------------------------------------------------------------------------------
			this.filter_Media = function( media )  {
				
				if (!media) return [];

				var rezult = [];

				var x = fvdDownloader.Prefs.get( "fvd.trigger_video_more" );
				var min_filesize = MIN_FILESIZE_TO_CHECK;
				if ( x == 'video_100kb')  min_filesize = 102400;
				else if (x == 'video_1mb') min_filesize = 1048576;
				
				media.forEach(function( item ){

											if (self.checkExtByContentType( item.ext ))
											{
												var size = item.size;
												//if (size && size < min_filesize )  return;
            
												rezult.push( item );
												
											}
										});
										
				return rezult;						
			};	
			
			// -------------------------------------------------------------------------------
			this.parsed_Media = function( media )  {

				var rezult = [];

				media.forEach(function( item ){
											if ( item.priority > 0 )  {
												rezult.push( item );
											}
										});
										
				return rezult;						
			};	
			
			// -------------------------------------------------------------------------------
			this.checkExtByContentType = function( contentType )
			{
				var name = "enable_type_" + contentType;
				var x = fvdDownloader.Prefs.get( name );
				if( x == 'false' )  return false;
				return true;
			};
			
			// -------------------------------------------------------------------------------
			this.getMessage = function() {
			
				var info = {'stream': false};
				
				return info;
			}
			
			// -------------------------------------------------------------------------------
			this.isYoutubeUrl = function(url) {
			
				var url = url.toLowerCase();
				
				for( var i = 0; i != YOUTUBE_URL_SIGNS.length; i++ )
				{
					if( url.indexOf( YOUTUBE_URL_SIGNS[i] ) != -1 )		return true;
				}
				
				return false;
			}
			
			// -------------------------------------------------------------------------------
			this.isTwitchUrl = function(url) {

				var url = url.toLowerCase();
				
				for( var i = 0; i != TWITCH_URL_SIGNS.length; i++ )
				{
					if( url.indexOf( TWITCH_URL_SIGNS[i] ) != -1 )		return true;
				}
				
				return false;
			}
			
			// -------------------------------------------------------------------------------
			this.isStreamUrl = function(url) {

				var url = url.toLowerCase();
				
				for( var i = 0; i != STREAM_URL_SIGNS.length; i++ )
				{
					if( url.indexOf( STREAM_URL_SIGNS[i] ) != -1 )		return true;
				}
				
				return false;
			}
			
			// ----------------------------------------
			function read_news_url( url, callback ){

				var ajax = new XMLHttpRequest();
				
				ajax.open('GET', url);
				ajax.setRequestHeader('Cache-Control', 'no-cache');
				
				ajax.onreadystatechange = function()  {
							try
							{
								if  ( (this.readyState == 4) && (this.status == 200))
								{
									var text = ajax.responseText;
									if (text)
									{
										callback(text);
										return text;
									}	
									else
									{
										callback( null );
										return null;
									}	
								}
							}
							catch (e) {}
						};
				ajax.onerror = function(){
							callback( null );
							return null;
						};
				
				ajax.send(null);
			}
			
			// ---------------------------------------------- Состояние кнопки ---------------------------
			this.getButtonStatus = function(  ){		
			
				return isButtonStatus;			
			}
			
			// -------------------------------------------------------------------------------
			
		};
		
		this.MainButton = new MainButton();
		
	}).apply(fvdDownloader);
}
else{
	fvdDownloader.MainButton = chrome.extension.getBackgroundPage().fvdDownloader.MainButton;
}
