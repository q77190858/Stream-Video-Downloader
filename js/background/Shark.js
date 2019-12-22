if (window == chrome.extension.getBackgroundPage()) {

	(function(){
	
		var Shark = function(){

			const TEST = true;

			var self = this;

			var FileSystem = new FILESYSTEM();

			var requestHeaders = {};

			
			// ===============================================================
			this.init = function(){

				if (!TEST_SHARK) return;
			
				console.log("Shark - init ");

				// ---------------------------  webRequest
				chrome.webRequest.onResponseStarted.addListener(function(data){

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


				
			}
			

			const IGNORE_EXTENSIONS = ["js", "css", "jpg", "gif", "png", "woff", "woff2"];

		    var Head = ["Accept-Charset", "Accept-Encoding", "Access-Control-Request-Headers", "Access-Control-Request-Method", "Connection", 
		    			"Content-Length", "Cookie", "Cookie2", "Date", "DNT", "Expect", "Host", "Keep-Alive", "Origin", "Referer", "User-Agent",
		    			"TE", "Trailer", "Transfer-Encoding", "Upgrade", "Via", "x-chrome-uma-enabled", "x-client-data"].map(function(e) { return e.toLowerCase() });


			// ===============================================================
			function ListenResponse(data) {

				if( fvdDownloader.Media.getHeaderValue("x-fvd-extra", data) )      return false;

				if( data.tab.url.indexOf("chrome-extension:") != -1 )      return false;
				if( data.url.indexOf("&_vdh_") != -1 )      return false;
				if( data.url.indexOf("&__fvd__") != -1 )      return false;
				
				data.contentType = fvdDownloader.Media.getHeaderValue("content-type", data);

				data.size = parseInt(fvdDownloader.Media.getHeaderValue("content-length", data));

				if (data.size == 0)  return false;
				
				var fileName = null;
				var ext = null;
				var ff = fvdDownloader.Utils.extractPath( data.url );
				if (ff) {
					ext = ff.ext;
					fileName = ff.name;
				}	
				if (!ext) 	ext = fvdDownloader.Media.getExtByContentType( data.contentType );

				if (ext && IGNORE_EXTENSIONS.indexOf(ext) != -1)       return false;

				data.tabUrl = data.tab.url;
				data.tabTitle = data.tab.title;
				data.filename = fileName;
				data.ext = ext ? ext : null;
				
				data.type = ( data.contentType && data.contentType.indexOf('audio') != -1) ? 'audio' : 'video';
				
				data.contentRange = fvdDownloader.Media.getHeaderValue("content-range", data);
				data.contentDisp = fvdDownloader.Media.getHeaderValue("content-disposition", data);

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

				Analiz(data);				

			}


			const IGNORE_EXT = ['mp4', 'mp3'];

			// ===============================================================
			function Analiz(data) {

				if ('ext' in data && IGNORE_EXT.indexOf(data.ext) != -1) return;

				//Analiz_VKontakte(data)
				Analiz_FaceBook(data);
				//Analiz_OdnoKlassniki(data);
			}	

			// =============================================================== VKontakte ======================================
			function Analiz_VKontakte(data) {

				//console.log(data);

				var text = '185327034';

				if (data.method == 'GET') {

					fvdDownloader.Utils.getAJAX(data.url, null, function(resp){
						
							if (resp) {

								if ( resp.indexOf(text) != -1) {  
console.log(data);									
									data.response = resp;
								//	odnoklassniki_detect_video( data )
								}	
							}
					});
				}	
				else if (data.method == 'POST' && data.requestBody) {

					var formData = data.requestBody.formData;

					fvdDownloader.Utils.postAJAX(data.url, formData, function(resp){
						
							if (resp) {

								if ( resp.indexOf(text) != -1) {  
console.log(data);									

									data.response = resp;
//									vkontakte_detect_audio( data )
								}	
							}
					});
				}	


			}	
			// -----------------------------------
			function vkontakte_detect_audio( data ) {

				var content = data.response;
				var url = data.url;
				console.log('---------  vkontakte_detect_video  -----------\n', url, data, write_content( data.url, content ));


				var media = parseVKontakteAudio( content, data );

				console.log(media);
			}

			// ----------------------------------------------------------
			function parseVKontakteAudio( content, data ){

				var parsedMediaList = [];
				
 				var m = content.match( /<!json>(.+?)<!>/i ); 
				if (m) {
					var x = JSON.parse( m[1] );	
console.log(x);					

					for (var i=0; i<x.length; i++) {
						var url = x[i][2];
						var ff = fvdDownloader.Utils.extractPath( url );
						if (ff) {

							var media = {	
								videoId: 	x[i][1] + '_' + x[i][0],
								url: 		url,
								tabId: 		data.tabId,
								frameId:    data.frameId,
								ext: 		ff.ext,
								
								title: 		x[i][4]+' '+x[i][3],
								
								filename: 	ff.filename,
							};

				
							parsedMediaList.push(media);
						}					  
					}	
					
				}

				return parsedMediaList; 	

			}	


			// ===============================================================  ODNOKLASSNIKI ======================================
			function Analiz_OdnoKlassniki(data) {

				if (data.method == 'GET') {

					fvdDownloader.Utils.getAJAX(data.url, null, function(resp){
						
							if (resp) {

								if ( resp.indexOf('mp4') != -1) {  
									data.response = resp;
									odnoklassniki_detect_video( data )
								}	
							}
					});
				}	


			}	

			// -----------------------------------
			function odnoklassniki_detect_video( data ) {

				var ODNOKLASSNIKI_URL_SIGNS = [	
						new RegExp("^https:\\/\\/ok\\.ru\\/video\\/", "i"),
					];

				var content = data.response;
				var url = data.url;
				console.log('---------  odnoklassniki_detect_video  -----------\n', url, data, write_content( data.url, content ));

				var fb = false;
				ODNOKLASSNIKI_URL_SIGNS.forEach(function( sign ){
					if ( sign.test(url.toLowerCase()) )		{
						fb = true;
						return false;
					}
				});
				if( fb ) console.log('==============================');

				var opt = [];
				var info = [];

				async.series([
					function(next) {			// info
		                var m = content.match( /data-options="(.+?)"/gm ); 
        		        if (m) {
                    		for ( var ii=0; ii<m.length; ii++) {
		                        var mm = m[ii].match( /data-options="(.+?)"/i ); 
        		               if ( mm ) opt.push(mm[1]);
                    		}	
                    	}		
                    	console.log(opt);
						next();
					},
					function(next) {

						var pp = {title: data.tabTitle, thumbnail: null };

						for ( var ii=0; ii<opt.length; ii++) {
	                        var str = opt[ii].replace(/&quot;/g,'"');
	                        try {
	                            var options = JSON.parse(str);
	                        }
	                        catch(ex) {
	                            console.error('parse_odnoklassniki (options)',ex);
	                            continue;
	                        }  
	                        console.log(options);

	                        pp.playerId = options["playerId"];
	                        pp.flashvars = options["flashvars"];
	                        pp.metadata = pp.flashvars["metadata"];

	                        if (pp.metadata) { 
	                            try {
	                                pp.metadata = JSON.parse(pp.metadata);
			                        console.log(pp.metadata)

	                                if (pp.metadata) { 
			                            pp.movie = pp.metadata['movie'];
			                            pp.videoId = pp.movie["id"];
			                            pp.title = pp.movie['title'] || data.tabTitle;
			                            pp.thumbnail = pp.movie['poster'];
			                            pp.duration = pp.movie['duration'];

			                            pp.videos = pp.metadata['videos'];
			                            pp.hls = pp.metadata['hlsManifestUrl'];
			                        }    
	                            }
	                            catch(ex) {
	                                console.error('parse_odnoklassniki (metadata)',ex);
	                            }   

							}
                            info.push(pp);
	                    }    
	                    next();
					},
					function(next) {
						for ( var ii=0; ii<info.length; ii++) {
                            for (var i=0; i<info[ii].videos.length; i++) {
                                var url = decodeURIComponent(info[ii].videos[i].url);
                                var label = info[ii].videos[i].name;
                                var hash = label+'_'+info[ii].videoId;

                                info[ii].videos[i].main = {  hash:  hash,
                                              		    	 url:   url,
                                              		    	 label: label,
                                              		    	 ext:   "mp4" };
                            }
						}	
						next();
					},
					function(next) {
                        async.eachSeries(info, function( ii, apNext) {

                        	console.log(ii);

							fvdDownloader.Utils.getAJAX(ii.hls, null, function(resp){
									if (resp) {
										ii.playlist = resp;
									}
									apNext();
							});
                        }, function() {
    						next();                        
                        });

					},
					function(next) {
							console.log(info);
					}
				]);


			}	

			// ===============================================================  FACEBOOK ======================================
			function Analiz_FaceBook(data) {

				if(data.url.indexOf('originalmediaid') == -1) return;

				console.log(data);


				if (data.method == 'GET') {

					fvdDownloader.Utils.getAJAX(data.url, null, function(resp){
						
							if (resp) {

								if ( resp.indexOf('.mp4') != -1) {  
									data.response = resp;
									//facebook_detect_video(data);
								}	
								else {
									data.response = resp;
									facebook_detect_video_id(data);
								}

								/*if ( resp.indexOf('.jpg') != -1) {  
									data.response = resp;
									facebook_detect_image(data);
								}*/	

							}
					});
				}	
				if (data.method == 'POST') {

					if ( !data.requestBody || !data.requestBody.formData )  return;

					var formData = data.requestBody.formData;
					fvdDownloader.Media.PostRequest( { tabId: data.tabId,
													   url: data.url, 
													   form: formData, 
													   headers: data.headers }, function(resp){


							if (!resp.error) {

								try {

									var text = resp.response.substring(9, resp.response.length);
									var info = JSON.parse(text);

									console.log(info);

									var x = fvdDownloader.Utils.find_json_param( "videoData", info );

									//console.log('======',x);
									//var rez = find( ".jpg", info );
									//console.log(rez);
									
									var tmb = fvdDownloader.Utils.getJSON( info, "payload/video/markup");
									if (tmb) tmb = tmb['__html'];
									var mm = tmb.match( /<img\s([\w]+)[^>]*>/gm );
									tmb = null;
									var m;
									if (mm) {
										for (var i=0; i<mm.length; i++) {
											m = mm[i].match( /background-image:\s?url\((.*?)\)/im );
											if (m) {
												var u = m[1];
												continue;
											}
											var m = mm[i].match( /src="(.*?)"/im );
											tmb = m[1].replace(/&amp;/g, '&');
											break;
										}
									}	

									console.log(tmb);


																		



/*									var info = info['jsmods']['instances'][27];

									

								console.log(info);

									for (var k in info) {

										console.log(k);

										console.log(info[k]);

										console.log(JSON.stringify(info[k]));

									}

									console.log(1);*/

								}
								catch(ex) {
									console.log(ex);
								}

								//	facebook_detect_video_id(data);

								/*if ( resp.indexOf('.jpg') != -1) {  
									data.response = resp;
									facebook_detect_image(data);
								}*/	

							}
					});
				}	


			}	

			// --------------------------------------------------------------------------------
			function find( param, data ){

				var rez = [];

				_fnd( data, '' );

				// ----
				function _fnd( d, tt ) {

					for (var k in d) {
						if (typeof d[k] == 'string') {

							if ( d[k].indexOf(param) != -1 ) {
								rez.push({ param: tt,  value: d[k] });
							}
						}	
						else if (typeof d[k] == 'object' ) {
							_fnd( d[k], tt + ' - ' + k )
						}
					}

				}

				return rez;
			}	


			// --------------------------------------------------------------------------------
			function postAJAX( url, data, headers, callback ){
				
				var ajax = new XMLHttpRequest();
				ajax.open('POST', url, true);
				ajax.setRequestHeader('Cache-Control', 'no-cache');
				ajax.setRequestHeader('X-FVD-Extra', 'yes');
				ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

				if (headers) {
					for (var key in headers) {
						if (Head.indexOf(key.toLowerCase()) == -1){
							ajax.setRequestHeader(key, headers[key]);
						}
					}
				}	

				ajax.onload = function(){
							var content = this.responseText;
							callback( content );
				}
				
				ajax.onerror = function(){
					callback( null );
				}
				
				var l = [];
				for (var k in data) l.push(k + '=' + data[k]);
				
				ajax.send( l.join('&') );
			}


			// -----------------------------------
			function facebook_detect_video( data ) {

				var FACEBOOK_URL_SIGNS = [	
						new RegExp("https?:\\/\\/www\\.facebook\\.com\\/$", "i"),
						new RegExp("https?:\\/\\/www\\.facebook\\.com\\/ajax\\/pagelet\\/generic\\.php\\/", "i"),
						new RegExp("https?:\\/\\/www\\.facebook\\.com\\/(.+?)\\/videos\\/", "i"),
						new RegExp("https?:\\/\\/www\\.facebook\\.com\\/(.+?)video\\/", "i"),
						new RegExp("https?:\\/\\/www\\.facebook\\.com\\/pages_reaction_units\\/more\\/", "i"),
						new RegExp("https?:\\/\\/www\\.facebook\\.com\\/groups\\/(.+?)/", "i"),

					];

				var content = data.response;
				var url = data.url;
				console.log('---------  facebook_detect_video  -----------\n', url, data, write_content( data.url, content ));

				var fb = false;
				FACEBOOK_URL_SIGNS.forEach(function( sign ){
					if ( sign.test(url.toLowerCase()) )		{
						fb = true;
						return false;
					}
				});
				if( fb ) console.log('==============================');

				var mm = content.match( /<title[^>]+(.+?)<\/title>/im );
				var title = mm ? mm[1].replace('>','') : data.tabTitle;

				var hh = 0;
				var myRe = /"?videoData"?:\[\{(.+?)\}\]/gm;
				var myArray;
				while ((myArray = myRe.exec(content)) !== null) {
  					var last = myRe.lastIndex;
  					var msg = myArray[0];
  					//console.log(hh, last);

  					var info = {title: title, thumbnail: null };
					info.video_id = getMatch( msg, "video_id" );
					info.hd_src = getMatch( msg, "hd_src" );
					info.sd_src = getMatch( msg, "sd_src" );

					var str = content.substring(hh, last);
					str = str.replace(/\\u003C/g,'<').replace(/\\"/g,'"').replace(/\\\//g,'/');
					//write_content( "", str, "content" )
					hh = last;

					var m = str.match( /<img\sclass=[^>]+/gm );

					if (m) {
						for (var i=m.length-1; i>=0; i--) {
							var mm = m[i].match( /aria-label="(.+?)"/im );
							if (mm) {
								info.title = mm[1];
								break;
							}
						}

						for (var i=m.length-1; i>=0; i--) {
							var mm = m[i].match( /background-image:\surl\((.+?)\);"/im );
							if (mm) {
								info.thumbnail = mm[1].replace(/&#039;/g,'')
													  .replace(/\\\\3a.{0,1}/g,':').replace(/\\\\3d.{0,1}/g,'=').replace(/\\\\26.{0,1}/g,'&')
													  .replace(/\\3a.{0,1}/g,':').replace(/\\3d.{0,1}/g,'=').replace(/\\26.{0,1}/g,'&');
								break;
							}
						}
					}
					console.log(info);

				}				

			}

			// -----------------------------------
			function facebook_detect_image( data ) {

				var content = data.response;
				var url = data.url;
				console.log('---------  facebook_detect_image  -----------\n', url, data);

				//var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
     			//var url = new RegExp(urlRegex, 'g');
				//var m = content.match(url);				
				var m = content.match( /https?:(.+?)[^"'\s>]+/g ); 
				var list = [];
				if (m) {
					for (var i=0; i<m.length; i++) {

						if (m[i].indexOf(".jpg") != -1) {
							var u = m[i].replace(/\\/g,'').replace(/&amp;/g,'&');
							console.log(u);
							list.push(u);
						}  

					}

					console.log(list);
				}	

			}

			// -----------------------------------
			function facebook_detect_video_id( data ) {

				var FACEBOOK_URL_SIGNS = [	
						new RegExp("https?:\\/\\/www\\.facebook\\.com\\/facebook\\/videos\\/[0-9]+", "i"),
					];

//https://www.facebook.com/facebook/videos/23155051776/

				var url = data.url;

				var fb = false;
				FACEBOOK_URL_SIGNS.forEach(function( sign ){
					if ( sign.test(url.toLowerCase()) )		{
						fb = true;
						return false;
					}
				});
				if( fb ) console.log('==============================');
				else return;

				var content = data.response;
				var mm = content.match( /<title[^>]+(.+?)<\/title>/im );
				var title = mm ? mm[1].replace('>','') : data.tabTitle;

				console.log('---------  facebook_detect_video_id  -----------\n', url, data, write_content( data.url, content ));

				console.log(title);

				var mm = url.match( /https?:\/\/www\.facebook\.com\/facebook\/videos\/([0-9]+)/im );

				var id = null;
				if (mm) id = mm[1];
				else return;

				console.log(id);

				graphFaceBookVideo(id, function(x){



				});

			}	

			// -----------------------------------------------------
			function graphFaceBookVideo(videoId, callback) {

				if (!videoId) 	return;

				var url = 'https://graph.facebook.com/'+videoId+'?fields=name,picture,source,from,length';
				
				fvdDownloader.Utils.getAJAX(url, null, function(resp){
					
						if (resp) {
							try {
								var x = JSON.parse(resp);
								console.log('--graphVideo---', videoId, x)
								if (x.error) {
									callback(null);
								}  
								else {
									callback(x);
								}
							}
							catch(ex){
								console.error(ex);
								callback(null);
							}
						}
						else {
							callback(null);
						}    
				});
			}


			var	lastFileNumber = 0;
			// ------------------------------------
			function write_content( title, text, pref ){

				if ( typeof pref == 'undefined' ) pref = "shark";

				lastFileNumber++;
				var str = '00000' + lastFileNumber.toString();
				var fn = pref + '_' + str.substring(str.length - 5, str.length);

				if (title)  text = title + "\n-------------------------------------------------------------------------------------------\n" + text;				

				var blob = new Blob([text], {type:'text/plain'});
				
				FileSystem.createFile(fn, blob, function(){ 	});

				return fn;
			}	

			// ------------------------------------
			function getMatch( text, type ){

				var x = '"?' + type + '"?\s*:([^\,]+)';
				var rxe = new RegExp( x, 'i');
				var m  = rxe.exec(text);
				if (m)  {
					if ( m[1] == "null" ) return null;
					return m[1].substring(1, m[1].length-1);
				}   
				return null;			


				/*var str = ',?'+type+':"(.+?)",?'
				var fnd = new RegExp(str,"i");

				var m = text.match(fnd); 

				if (m) return m[1];

				return null;*/
			};

			
		}
		
		this.Shark = new Shark();
		
	}).apply(fvdDownloader);
	
}
else
{
	fvdDownloader.Shark = chrome.extension.getBackgroundPage().fvdDownloader.Shark;
}
