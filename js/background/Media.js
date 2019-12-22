if (window == chrome.extension.getBackgroundPage()) {

	(function(){

		var Media = function(){

			var self = this;
			
			var textFile = null;

			
			var _onMediaForTabUpdateListeners = [];
			
			const DETECT_MODULES = ["Vimeo", "FaceBook", "Wistia", "MailRu", "DailyMotion", "Viki",
									"ExtM3U", "Master", "Manifest", "Dash",
									"Twitch", "Periscope",
									"BreakCom", "OdnoKlassniki", "Twitter", "VKontakte", 
									"Sniffer", "Combine" ]

			const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)","i");
			const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)","i");
			const IMAGE_TYPE_PATTERN = new RegExp("^image/(?:x-)?([^; ]+)");

			const VIDEO_EXTENSIONS = ["flv", "ram", "mpg", "mpeg", "avi", "rm", "wmv", "mov", "asf", "rbs", "movie", "divx", "mp4", "ogg", "mpeg4", "m4v", "webm"];
			const AUDIO_EXTENSIONS = ["mp3", "m4a" ];
			const GAME_EXTENSION  =  ["swf"];

			const VIDEO2EXT = {		
				'mpeg' : 'mp4',
				'm4v': 'mp4',
				'mp4': 'mp4',
				'3gpp' : '3gp',
				'flv' : 'flv',
				'x-flv' : 'flv',
				'quicktime' : 'mov',
				'msvideo' : 'avi',
				'ms-wmv' : 'wmv',
				'ms-asf' : 'asf',
				'web' : 'webm',
				'webm' : 'webm'
			};
			
			const AUDIO2EXT = {		
				'realaudio' : 'ra',
				'pn-realaudio' : 'rm',
				'midi' : 'mid',
				'mpeg' : 'mp3',
				'mpeg3' : 'mp3',
				'wav' : 'wav',
				'aiff' : 'aif',
				'webm' : 'webm'
			};

			//const IGNORE_EXTENSIONS = ["js", "css", "woff", "woff2"];
			const IGNORE_EXTENSIONS = ["jpg", "jpeg", "gif", "png", "bmp", "tiff", "js", "css", "woff", "woff2"];

			const IGNORE_TAB_URL_SIGNS = [
				// Prime-Video
				new RegExp(/amazon\.[a-z]+\/prime\-video/, "i"),
				new RegExp(/primevideo\.com/, "i"),
	
				// автор запретил на vimeo
				new RegExp(/vimeo.com\/206722715/, "i"),
				new RegExp(/vimeo.com\/177429326/, "i"),
				new RegExp(/vimeo.com\/141841698/, "i"),
				new RegExp(/vimeo.com\/141839283/, "i"),
				new RegExp(/vimeo.com\/141838924/, "i"),
				new RegExp(/vimeo.com\/141838509/, "i"),
				new RegExp(/vimeo.com\/141837686/, "i"),
				new RegExp(/vimeo.com\/141836439/, "i"),
				new RegExp(/vimeo.com\/95595927/, "i"),
				new RegExp(/vimeo.com\/95526242/, "i"),
	
				// звуковые сайты - игнорируем
				new RegExp(/vevo\.com/, "i"),
				new RegExp(/pandora\.com/, "i"),
				new RegExp(/music\.yahoo\.com/, "i"),
				new RegExp(/www\.yahoo\.com\/music/, "i"),
				new RegExp(/tunein\.com/, "i"),
				new RegExp(/last\.fm/, "i"),
				new RegExp(/iheart\.com/, "i"),
				new RegExp(/allmusic\.com/, "i"),
				new RegExp(/radio\.com/, "i"),
	
				// игнорируем по отдельным тридам
				new RegExp(/adobe\.com/, "i"),
				new RegExp(/cartoonnetwork\./, "i"),
			];
				
			const IGNORE_URL_SIGNS = [
				// git
				new RegExp(/\/issues\/[0-9]+\/realtime_changes$/, "i"),
			];	
	
			var requestHeaders = {};
					
			const RESPONSE_HEADERS = [ "content-type",
									   "content-encoding",
									 ];						

		    var Head = ["Accept-Charset", "Accept-Encoding", "Access-Control-Request-Headers", "Access-Control-Request-Method", "Connection", 
						"Content-Length", "Cookie", "Cookie2", "Date", "DNT", "Expect", "Host", "Keep-Alive", "Origin", "Referer", "User-Agent",
						"TE", "Trailer", "Transfer-Encoding", "Upgrade", "Via", "x-chrome-uma-enabled", "x-client-data"].map(function(e) { return e.toLowerCase() });
												  
									
			// ===============================================================
			this.init = function(){
			
				//console.log("Media - init ");
				if (TEST_SHARK) return;

				// ---------------------------  webRequest
				chrome.webRequest.onResponseStarted.addListener(function(data){
					
					if( !data || data.tabId < 0 || data.method != 'GET' )		return false;
					
					chrome.tabs.get( data.tabId, function( tab ){
						
						if (chrome.runtime.lastError) {
							//console.log(chrome.runtime.lastError.message);
						} 
						else if ( !tab ) {
							console.log( data );
						}	
						else {
							data.tab = tab;
							ListenResponse(data);
						}	
					});
					
				}, {
					urls: ["<all_urls>"],
				}, ["responseHeaders"]);
				
				chrome.webRequest.onBeforeRequest.addListener( function(data) {

					if( !data || data.tabId < 0 )		return false;
					
					chrome.tabs.get( data.tabId, function( tab ){
				
						if (chrome.runtime.lastError) {
							//console.log(chrome.runtime.lastError.message);
						} 
						else if ( !tab ) {
							console.log( data );
						}	
						else {
							data.tab = tab;
							data.responseHeaders = null;
							ListenResponse(data);
						}
					});	
				},
				  {urls: ["<all_urls>"]},
				  ["requestBody"]
				); 

				chrome.webRequest.onBeforeSendHeaders.addListener( function(details) {
					var requestId = details.requestId;
					requestHeaders[requestId] = details.requestHeaders;
		        },
		        {urls: ["<all_urls>"]},
		        ["blocking", "requestHeaders"]);
				
				// ---------------------------  SendRequest
				//新开的tab发来请求媒体信息
				chrome.extension.onRequest.addListener ( function(request, sender, sendResponse) {      
					if(request.command=="getVideoData")	{
						fvdDownloader.Utils.getActiveTab( function( tab ) {
									if( tab )	{
										var media = self.getMedia( tab.id );
										media = fvdDownloader.MainButton.filter_Media( media );
										media = fvdDownloader.MainButton.parsed_Media( media );
										sendResponse(media);
									}
								});	
					}
					//下载tab通过hash来得到视频信息
					else if(request.command=="getVideoHash")	
					{
						var media = fvdDownloader.Storage.getDataForHash( request.hash );
						sendResponse({media: media, fileName: fvdDownloader.FileSystem.Unique( )});
					}
					else if(request.command=="gotThumbnail")	{
						fvdDownloader.Storage.gotThumbnail( request, sender.tab );
					}	
					else if(request.command=="gotPostRequest")	{
						console.log( request, sender.tab );
					}	

				});
			}
			
			// ===============================================================
			//监听浏览器的httpq请求的函数
			function ListenResponse(data) {

				if( getHeaderValue("x-fvd-extra", data) )      			return false;
				if( data.tab.url.indexOf("chrome-extension:") != -1 )   return false;
				if( data.tab.url.indexOf("moz-extension:") != -1 )      return false;
				if( data.url.indexOf("&_vdh_") != -1 )      			return false;
				if( data.url.indexOf("__fvd__") != -1 )      			return false;
				if( data.url.indexOf("data:image") == 0 )               return false;

				//   忽略尺寸
				data.size = parseInt(getHeaderValue("content-length", data));
				if (data.size == 0)  return false;
				
				//忽略测试
				var ignore = false;
				IGNORE_TAB_URL_SIGNS.forEach(function( sign ){
					if ( sign.test(data.tab.url.toLowerCase()) )		{
						ignore = true;
						return false;
					}
				});	
				if( ignore ) return false;
				
				IGNORE_URL_SIGNS.forEach(function( sign ){
					if ( sign.test(data.url.toLowerCase()) )		{
						ignore = true;
						return false;
					}
				});	
				if( ignore ) return false;

				data.contentType = getHeaderValue("content-type", data);

				//   忽略类型（图片和脚本）
				var contentTypeImage = IMAGE_TYPE_PATTERN.exec(data.contentType);
				if (contentTypeImage) return false;

				var fileName = null;
				var ext = null;
				var ff = fvdDownloader.Utils.extractPath( data.url );
				if (ff) {
					ext = ff.ext;
					fileName = ff.name;
				}	
				if (!ext) 	ext = getExtByContentType( data.contentType );

				if (ext && IGNORE_EXTENSIONS.indexOf(ext) != -1)       return false;

				data.tabUrl = data.tab.url;
				data.tabTitle = data.tab.title;
				data.filename = fileName;
				data.ext = ext;
				
				data.type = ( data.contentType && data.contentType.indexOf('audio') != -1) ? 'audio' : 'video';
				
				data.contentRange = getHeaderValue("content-range", data);
				data.contentDisp = getHeaderValue("content-disposition", data);

				var requestId = data.requestId;	
				data.headers = {};
				if (requestHeaders[requestId]) {
					requestHeaders[requestId].forEach(function(responseHeader){
						var kk = responseHeader.name.toLowerCase();
						if (Head.indexOf(kk) == -1){
							data.headers[kk] = responseHeader.value;
						}	
	        		});
					delete requestHeaders[requestId];
				}	

				//console.log("listen response:",data);
				setTimeout( function() {
					detectMedia(data);
				}, 0)

			}

			// -------------------------------------------------------------------
			this.PostRequest = function( data, callback) {

				chrome.tabs.executeScript( data.tabId, {
									file: "/js/contentScripts/contentPostRequest.js"
								}, function(){

											var port = chrome.tabs.connect( data.tabId );
											port.postMessage( { action: "post_request", data: data });

											port.onMessage.addListener(function( message ){
															message['tabId'] = data.tabId;
															message['url'] = data.url;
															callback(message);
														});
										});

			}	

			// -------------------------------------------------------------------
			this.GetRequest = function( data, callback) {

				if ( data.page ) {
					chrome.tabs.executeScript( data.tabId, {
										file: "/js/contentScripts/contentPostRequest.js"
									}, function(){

												var port = chrome.tabs.connect( data.tabId );
												port.postMessage( { action: "get_request", data: data });

												port.onMessage.addListener(function( message ){
																message['tabId'] = data.tabId;
																message['url'] = data.url;
																callback(message);
															});
											});
				}
				else {
					fvdDownloader.Utils.getAJAX( data.url, data.headers, function(content){
						var message = { tabId: data.tabId,
										url: data.url,
										error: content ? false : true,
										content: content
									  }
						callback(message);
					});
				}

			}	

			// -------------------------------------------------------------------
			this.getHeaderValue = function( name, data ){
				getHeaderValue(name, data);
			}	
			function getHeaderValue(name, data){
				if (!data.responseHeaders) return null;
				name = name.toLowerCase();
				for (var i = 0; i != data.responseHeaders.length; i++) {
					if (data.responseHeaders[i].name.toLowerCase() == name) {
						return data.responseHeaders[i].value;
					}
				}
				return null;
			}

			// -------------------------------------------------------------------
			this.isAllowedExt = function( extension ){

				if (VIDEO_EXTENSIONS.indexOf(extension) != -1)       return 1;
				if (AUDIO_EXTENSIONS.indexOf(extension) != -1)       return 2;
				if (GAME_EXTENSION.indexOf(extension) != -1)         return 3;
				
				return 0;
			}
			
			// -------------------------------------------------------------------
			this.getExtByContentType = function( contentType ){
				getExtByContentType( contentType );
			}
			function getExtByContentType( contentType ){
				if( !contentType )	return null;
				var mm = contentType.split(";");
				for (var i=0; i<mm.length; i++) {
					var tmp = mm[i].split("/");
					if( tmp.length == 2 ){
						switch( tmp[0] ){
							case "audio":
								if( AUDIO2EXT[tmp[1]] ){
									return AUDIO2EXT[tmp[1]];
								}
							break;
							case "video":
								if( VIDEO2EXT[tmp[1]] ){
									return VIDEO2EXT[tmp[1]];
								}						
							break;					
						}
					}			
				}
			
				return null;
			}

			// -------------------------------------------------------------------
			this.getFileName = function( data ){
				
				var url = data.url;
				var tmp = url.split( "?" );
				url = tmp[0];
				tmp = url.split( "/" );
				tmp = tmp[ tmp.length - 1 ];
				
				if( tmp.indexOf( "." ) != -1 ){
					var replaceExt = getExtByContentType( getHeaderValue( "content-type", data ) );
					if( replaceExt ){
						tmp = tmp.split( "." );
						tmp.pop();
						tmp.push( replaceExt );
						tmp = tmp.join(".");
					}
					
					try{
						return decodeURIComponent(tmp);					
					}
					catch( ex ){
						if( window.unescape ){
							return unescape(tmp);										
						}
						else{
							return tmp;
						}
					}

				}
				
				return  null;		
			}; 


			// ---------------------------------------------------------------
			function detectMedia(data) {
				
				data.foundMedia = null;
				var countAdd = 0;

				async.eachSeries( DETECT_MODULES, 
									function( module, apCallback ){

										if( self[module] )		{
											self[module].detectMedia(data, function(media, isBreak) {

												if (media) {     
													//发现媒体了，将媒体加入storage中
													//console.log("media found:",media);
													var x = fvdDownloader.Storage.add(media);
													countAdd += x.length;
												}	

												if (!isBreak)  apCallback();
												else _finish();

											});	
										}
										else {	
											apCallback();
										}
									}, function(){
										_finish();
									});

				// --------------------------------
				function _finish() {
					if ( data.foundMedia )	{

						if (countAdd) self.mediaForTabUpdate( data.tabId );
						
						fvdDownloader.MainButton.MediaForTabUpdate( data.tabId );							
										
						fvdDownloader.PageButton.MediaForTabUpdate( data.tabId );							
						
					}
				}

			}
			

			// ===============================================================
			this.mediaForTabUpdate = function( tabId ){

				chrome.extension.sendMessage( {
											subject: "mediaForTabUpdate",
											data: tabId
										} );
										
			}	

			// ===============================================================
			this.getMedia = function( tabId ){
				
				var media = fvdDownloader.Storage.getMedia( tabId );

				if ( !media || media.length == 0 )  return null;

				media = self.checkMediaFilters( media );

				if ( media.length == 0 )  return null;


				DETECT_MODULES.forEach( function( module ){
					if( self[module] )		{
						media = self[module].getMedia(media);	
					}
				} );
				
				media.sort( function( item1, item2 )  {   
					if (item1.group > item2.group)  return 1;
					if (item1.group < item2.group)  return -1;
					if (item1.group == item2.group) {
						if (item1.order < item2.order)  return 1;
						if (item1.order > item2.order)  return -1;
					}	

					return (item1.id < item2.id ? 1 : -1);  
				});

				return media;
			}
			// ----------------------------------------------------------------------------------------------------
			this.checkMediaFilters = function( media ){

				var list = [];
	        	for( var i=0; i<media.length; i++ )  {
	                if ( check_shows_format( media[i]['ext'] ) )  {
	                    list.push(media[i]);     
	                }
	        	}

				return list;			
			}

			// ----------------------------------------------------------------------
			function check_shows_format(type)   {

			    if(VIDEO2EXT[type])  type = VIDEO2EXT[type];
			    
			    var name = "enable_type_"+type;

			    try     {
			        var x = fvdDownloader.Prefs.get(name);
			        if (typeof x == 'undefined' || typeof x == 'object' || x == null)  return true;
			        return _b(x);
			    }
			    catch (e) {   }
			    
			    return true;
			}


			// ----------------------------------------------------------------------------------------------------
			this.removeItem = function( id ){
				
				fvdDownloader.Storage.removeItem( id );
				
			}

			// ----------------------------------------------------------------------------------------------------
			this.removeTabData = function( tabId ){
				
				DETECT_MODULES.forEach( function( module ){
					if( self[module] && typeof self[module].removeTabData == "function"  )		{
						self[module].removeTabData(tabId);	
					}
				} );
				
			}

			// ----------------------------------------------------------------------------------------------------
			this.filterNotAllowedMedia = function( media ){

				if (!media) return [];

				var rezult = [];

				media.forEach(function( item ){

											if ( item.metod == 'not' )	{
												rezult.push( item );
											}
										});
										
				return rezult;						
			}
			
			this.isStream = function(  ){

				if ( fvdDownloader.Storage.getActiveConvertStream() ) return false;				
				
				return true;
			}	
		}
		
		this.Media = new Media();
		
	}).apply(fvdDownloader);
	
}
else
{
	fvdDownloader.Media = chrome.extension.getBackgroundPage().fvdDownloader.Media;
}
