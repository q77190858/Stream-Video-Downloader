(function(){
	
	var ExtM3U = function()
	{		
	
		const DEBUG = false;
	
		const TITLE_MAX_LENGTH  = 96;
		
		const IGNORE_URL_SIGNS = [
			"twitch.tv",
			"periscope.tv",
			"pscp.tv",
			"twitter.com"
		];

		const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
		const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)", "i");

		const EXTM3U_URL_GET_PAGE = [	
				new RegExp("brightlightfineart\\.com", "i"),
			];

		// http://www.metacafe.com/watch/11465107/sexy-contestant-ends-up-topless-on-brazilian-gameshow/
		// http://www.tvn-2.com/videos/entrevistas/Expertas-necesidad-legisle-matrimonio-igualitario_2_4727547220.html

		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			if( /^https?:\/\/[^\?]*\.m3u8/.test(data.url) )  {		
				detectVideo( data, callback );
				return;
			}   
			else if(data.contentType && data.contentType.toLowerCase().indexOf("mpegurl")>=0) {
				detectVideo( data, callback );
				return;
			}       
			else if( /^https?:\/\/(.*)\.ts/.test(data.url) )  {
				callback(null, true);
				return;            
			}    
			else if (data.contentType == 'video/MP2T')  {
				callback(null, true);
				return;
			} 
			else if( /media\.sndcdn\.com\/(.*)\.mp3/.test(data.url) )  {
				callback(null, true);
				return;            
			}    

			callback(null);
		}
		
		// --------------------------------------------------------------------------------
		function detectVideo( data, callback ){

			var ignore = false;
			IGNORE_URL_SIGNS.forEach(function( sign ){
				if( data.url.toLowerCase().indexOf( sign ) != -1 ){
					ignore = true;
					return false;
				}
				if( data.tab.url.toLowerCase().indexOf( sign ) != -1 ){
					ignore = true;
					return false;
				}
			});
			if( ignore ) {
				callback(null);	
				return false;
			}	

			parse_playlist(data, callback);
		}	

		// --------------------------------------------------------------------------------
		function parse_playlist( data, callback ){

			if (DEBUG) console.log( data );

			var url = data.url;
			var hh = hex_md5(url);

			var domain = null, 
				host = "", 
				prot = "",
				k, tt;

			var x = fvdDownloader.Utils.parse_URL(url);
			host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
			domain = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '');
			search = x.search || "";

		    var tabUrl = data.tabUrl,
		        tabTitle = data.tabTitle,
		        videoId = null,
		        thumb = null,
		        headers = null;

			var parsedMedia = [];
			var mediaFound = false;

			data.flag_get_page = false;
			EXTM3U_URL_GET_PAGE.forEach(function( sign ){
				if ( sign.test(data.tabUrl) )		{
					data.flag_get_page = true;
					return false;
				}
			});

			fvdDownloader.Media.GetRequest( { tabId:    data.tabId,
											   page:    data.flag_get_page,
											   url:     url, 
											   headers: data.headers 
										     }, 
									    function(resp){
												if (!resp.error) {
													_parse(resp.content);
												}	
												else {
													callback(null);
												}	
									});			

			// -------------------
			function _parse( content ) {

				var lines = content.split('\n');

				if ( lines.length<2 || lines[0].replace(/\r/, '') != '#EXTM3U' ) {
					callback(null);
					return;	
				} 

				var version_m3u8 = 3;
				var master_m3u8 = true;

				var ll = [];

				for (var i=0; i<lines.length; i++) {

					var line = lines[i].trim().replace(/\r/g,'');
					if (line=="")    continue;
					ll.push(line)

					if (line[0]=="#") {

						if( line.indexOf("#EXT") != 0 )   continue;

						var m = line.match( /^#(EXT[^\s:]+)(?::(.*))/i ); 
						if(!m)    continue;

						if ( m[1]=="EXTINF" )  master_m3u8 = false;

					}
				}  

				if ( master_m3u8 ) {
					_parse_master( ll, _got );
				}
				else {
					_parse_inf( ll, _got );
				}

			}

			// -------------------
			function _got(  ) {

				if (mediaFound) {
					data.foundMedia = "ExtM3U";	
					callback(parsedMedia, true);
				}	
				else {
					callback(null);
				}

			}	

			// ---------------------------
			function _parse_master(lines, cb) {

				var version = 3;
				var streams = [];
				var audio = {};

				for (var i=0; i<lines.length; i++) {

					var line = lines[i];
					if (DEBUG) console.log(line);     

					if (line[0]=="#") {

						if( line.indexOf("#EXT") != 0 )   continue;

						if( line.indexOf("#EXT-X-VERSION") == 0 ) {
							var x = line.split(':');
							if (x)  version = parseInt(x[1]);
						}   

						var m = line.match( /^#(EXT[^\s:]+)(?::(.*))/i ); 
						if(!m)    continue;

						var name = m[1];
						var value = m[2];

						if ( name === 'EXT-X-MEDIA' ) {
							var x = fvdDownloader.Utils.get_X_INF( value );

							if ( x['TYPE'] == 'AUDIO' ) {
								var grp = x['GROUP-ID'];
								var uri = x['URI'];

								audio[grp] = { url: uri };
							}    
						}
						else if ( name === 'EXT-X-STREAM-INF' ) {
							var x = fvdDownloader.Utils.get_X_INF( value );
							var u = lines[i+1];
							i++;

							var pp = { url: u };
							if ( x['RESOLUTION'] )  pp.resolution = x['RESOLUTION'];
							if ( x['BANDWIDTH'] )  pp.bandwidth = x['BANDWIDTH'];
							if ( x['CODECS'] )  pp.codecs = x['CODECS'];
							if ( x['FRAME-RATE'] )  pp.rate = x['FRAME-RATE'];
							if ( !pp.resolution && x['NAME'] )  pp.resolution = x['NAME'];
							if ( !pp.resolution && x['QUALITY'] )  pp.resolution = x['QUALITY'];

							if ( x['AUDIO'] )  pp.audio = x['AUDIO'];

							streams.push( pp );
						}
					}
				} 

				// попытаемся разобраться с resolution
				var qq = [];
				for (var i=0; i<streams.length; i++) {

					if (streams[i].bandwidth) {
						if ( /[0-9]+/i.test(streams[i].bandwidth) )   {
							try { streams[i].bandwidth = parseInt(streams[i].bandwidth);	} catch(ex) {}		
						}	
					}	

					if (!streams[i].resolution) {
						parse_url_resolution(streams[i]);
					}

					if (streams[i].resolution) {
						var x = streams[i].resolution;
						var m = x.match( /([0-9]+)x([0-9]+)/im ); 

						var q = x;			
						if (m) {
							if (m.length>1)  q = m[2];
							else if (m.length>0)  q = m[1];
						}
						streams[i].quality = q;

						for (var j=0; j<qq.length; j++) {
							if ( qq[j].quality == q) {
								if (qq[j].bandwidth < streams[i].bandwidth)  q += 'h';
								else if (qq[j].bandwidth > streams[i].bandwidth)  q += 'l';
							}

						}

						qq.push({quality: q, bandwidth: streams[i].bandwidth});
						streams[i].wquality = q;
					}
				}	


				// дальнейшая обработка
				var groupMedia = fvdDownloader.Storage.nextGroupId(); 

                async.eachSeries(streams, function( stream, apNext) {

					if (DEBUG) console.log(stream);

					var info = { group: groupMedia,
								 data: data};

		            async.series([
		                function(next) {            // video playlist url

							info.url = stream.url;
							if (info.url.indexOf('http') != 0) {
								if (info.url.indexOf('/') == 0)  info.url = domain + info.url;
								else    info.url = host + info.url;
							} 
							
							checkRequest(info.url, function(sz){

								if (sz) {  
									next();
								}	
								else {
									if (info.url.indexOf('?') == -1 && info.url.indexOf('#') == -1 && search) {
										info.url = info.url + search;
									}
									checkRequest(info.url, function(sz){
										if (sz) {  
											next();
										}	
										else {
											apNext();
										}
									});
								}
							});
		                },
		                function(next) {
							info.hash = hex_md5(stream.url);
							info.fileExt = 'mp4'; 
							info.fileName = info.hash;
							var w = NAME_PATTERN.exec(info.url);
							if (w)  info.fileName = w[1];

							//info.quality = stream.resolution ? stream.resolution : (stream.bandwidth ? stream.bandwidth : null);	
							info.quality = stream.quality;	
							info.wquality = stream.wquality;	

							next();
		                },
		                function(next) {					// audio playlist url
							info.audio_stream = null;

							if (stream.audio) {

								var x = stream.audio in audio ? audio[ stream.audio ] : null;
								var uri = x ? x.url : null;
								if (uri) {
									if (uri.indexOf('http') != 0) {
										if (uri.indexOf('/') == 0)  uri = domain + uri;
										else    uri = host + uri;
									}   
									checkRequest(uri, function(sz){
										if (sz) {  
											info.audio_stream = { hash:     stream.audio,
															 	  ext:      'mp4', 
															 	  url:      uri,          };
											next();
										}	
										else {
											if (uri.indexOf('?') == -1 && uri.indexOf('#') == -1 && search) {
												uri = uri + search;
											}
											checkRequest(uri, function(sz){
												if (sz) {  
													info.audio_stream = { hash:     stream.audio,
																	 	  ext:      'mp4', 
																	 	  url:      uri,          };
													next();
												}	
												else {
													apNext();
												}
											});
										}
									});
								}
								else {
									next();	
								}					 
							}
							else {
								next();
							}	
		                },
		                function(next) {
							add_media(info, true);
							apNext();
		                }
		            ]);

                }, function() {
                   	cb(); 
                });

			}    

			// ---------------------------
			function _parse_inf(lines, cb) {

				if ( lines[1] == '#EXT-X-VERSION:4' ) { 
					cb();
					return;
				}	

				var url = data.url;    

				if (DEBUG) console.log('_parse_inf: ', url);
				var hash = hex_md5(url);
				ext = 'mp4'; 
				var fileName = 'media';

				for (var i=0; i<lines.length; i++) {

					var line = lines[i];
					if (DEBUG) console.log(line);     
					if (line=="")    continue;

					if (line.indexOf('#') != 0) { 

						var u = line.replace(/\r/g,'');
						var x = fvdDownloader.Utils.extractPath( u );
						if (x) ext = x.ext;
						if (ext == 'ts') ext = 'mp4';

						if (ext === 'm3u8') {  
							cb();
							return; 
						}	

						break;
					}    
				}         

				var fileName = hash;
				var w = NAME_PATTERN.exec(url);
				if (w)  fileName = w[1];

				add_media({ hash: hash,
							url: url, 
							fileName: fileName, 
							fileExt: ext, 
							quality: null, 
							group: null,
							duration: null,
							data: data	}, false);

				cb();
				return;
			}    

			function add_media(params, ff) {

				if (DEBUG) console.log('add_media', ff, params);

				if (params.quality) {
					if ( /[0-9]+/i.test(params.quality) )   {
						try { params.quality = parseInt(params.quality);	} catch(ex) {}		
					}	
				}	

				
/*				var q = null;
				if (params.quality) {
					//var m = params.quality.match( /([0-9]+)x([0-9]+)/im ); 
					//q = m && m.length>1 ? m[2] : params.quality; 
					//if ( /[0-9]+/i.test(params.quality) )   {
					//	try { q = parseInt(q);	} catch(ex) {}		
					//}	
					q = params.quality;
				}
				else {
					var m = params.url.match( /([0-9]+)x([0-9]+)/im );
					if (m  && m.length>1) {
						q = m[2];
						if ( /[0-9]+/i.test(q) )   {
							try { q = parseInt(q);	} catch(ex) {}		
						}	
					}
					else {
						m = params.url.match( /([0-9]+)p/im );
						if (m) { 
							q = m[1];
							try { q = parseInt(q);	} catch(ex) {}		
						}	
					}
					if (q) params.quality = q;						
				}*/ 

				var q = (params.wquality ? params.wquality : (params.quality ? params.quality : ''));

                var ft = [];
                ft.push({tag: 'span', content: '['+(q ? q+', ' : '') });
                ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(params.fileExt) });
                ft.push({tag: 'span', content: '] ' });

				//先用tab标题将就一下
				var displayName = params.data.tabTitle ? params.data.tabTitle : params.fileName;
				var downloadName = displayName;

				//console.log("params:",params,"ff:",ff);

				var fileName = null;	
				if (params.fileName) {
					fileName = params.fileName;
				}	
				else {
					fileName = params.quality;
					var ff = fvdDownloader.Utils.extractPath( params.url );
					if (ff) {
						fileName = (params.quality ? params.quality+'_' : '')+ff.name;
					}					
					else {
						fileName = (params.quality ? '['+params.quality+'] ' : '')+params.data.tabTitle;	
					}	
				}
				
				var pp = {  video: { url:  params.url, 
									 ext:  params.fileExt,
									 hash: params.hash   },
							audio: params.audio_stream ? params.audio_stream : null
						 };
				var hash = hex_md5(params.url);		 

				var mm = {	url: 		params.url,
							tabId: 		params.data.tabId,
							tabUrl: 	params.data.tabUrl,
							frameId: 	params.data.frameId,
						
							hash: 		hash,
						
							ext: 		params.fileExt,
							title: 		displayName,
							format: 	"",
						
							downloadName: 	downloadName,
							displayName: 	displayName,
							displayLabel: 	ft,
							filename: 		fileName,
						
							playlist:       pp,
						
							size: 		0,
							type: 		"video",
							metod: 		'playlist',
							source: 	"ExtM3U",
							quality:    params.quality,
						
							group: 		params.group,
							order: 		params.quality,

							noRepeat:   ff,
						
						};


				//向tabid的contentscript询问视频名
				//使用async库实现并行执行	
/* 				async.waterfall(
					[
					function(callback)//函数1
					{
						chrome.tabs.sendMessage(params.data.tabId, {command:"tmooc_vidoename",tabId:params.data.tabId}, 
						function(response)
						{
							if(response.name&&response.tabId==params.data.tabId)
							{
								console.log("get name:",response.name);
								callback(null,response.name);
							}
						});
					},
					function(name,callback)//函数2
					{
						console.log("push name:",name);
						mm.displayName=name;
						mm.downloadName=name;
						
					}
					],
					function(err,result)
					{ 
						console.log("waterfall"); 
						if (err) 
						{
							console.log(err); 
						}
						console.log("result : "+result); 
				   }); */
				parsedMedia.push( mm );
				mediaFound = true;
			}        


		}

		function parse_url_resolution( stream ){

			var url = stream.url;

			var m = url.match( /([0-9]+)x([0-9]+)/im );
			if (m) {
				if (m.length>1) {
					stream.resolution = m[1]+'x'+m[2];
					return;
				}
			}	

			m = url.match( /_([0-9]+)\./im );
			if (m) {
				if (m.length>0) {
					stream.resolution = m[1];
					return;
				}	
			}

		}	

		function checkRequest( url, callback ){

			var ajax = new XMLHttpRequest();
			ajax.open('GET', url);
			ajax.setRequestHeader('Cache-Control', 'no-cache');
			ajax.url = url;

			var find = false;
					
			ajax.onreadystatechange = function() {
							if( this.readyState == 3 && !find )
							{
								if (this.status == 200) 
								{
									find = true;
									callback( true );		
									this.abort();
								}				
							}
				
							if (this.readyState == 4 && !find ) 
							{
								if (this.status == 200) 
								{
									callback( true );					
								}
								else
								{
									callback( false );
								}
							}
						}		
			
			ajax.send( null );
		};

		
		// ====================================================================	
		this.getMedia = function( media ){
			
			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "ExtM3U" ) {
											//var iii = find( item ); 
											//if (iii == -1) stream_media.push( item );
											//else stream_media[iii] = item;
											stream_media.push( item );
										}	
										else if ( item.source == "Sniffer" )  sniffer_media.push( item );
										else  other_media.push( item );
									});
			
			if (stream_media.length > 0) {
				other_media.forEach(function( item ){	 stream_media.push( item )  });
				return stream_media;
			}	
			else {
				other_media.forEach(function( item ){	 sniffer_media.push( item )  });
				return sniffer_media;
			}	
			
			function find( e ) {
				if ( !e.quality ) return -1;
				for (var ii=0; ii<stream_media.length; ii++) {
					if (stream_media[ii].quality == e.quality && stream_media[ii].group == e.group)  return ii;	
				}	
				return -1;
			}
		}

	};
	
	this.ExtM3U = new ExtM3U();
	
}).apply( fvdDownloader.Media );
