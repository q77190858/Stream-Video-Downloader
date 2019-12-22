(function(){
	
	var Youtube = function(){		
	
		const TITLE_MAX_LENGTH  = 96;
		const DEBUG = false;
	
		var parse_videoId = {};
		
	    var storage_code = {};
		
		var insertScript = {};

		// ================================================================================================================   
		const ytf = {            
					5: 	 { title: "Low, 320x240", 	    frm: "flv", 	size: "240",   type: "download"	 },
					6: 	 { title: "Low, 360x270", 	    frm: "flv", 	size: "270",   type: "download"	 },
					13:  { title: "Mobile, 192x144",    frm: "3gp", 	size: "144",   type: "download"	 },
					17:  { title: "Mobile, 192x144",    frm: "3gp", 	size: "144",   type: "download"	 },
					18:  { title: "Low, 480x360", 	    frm: "mp4", 	size: "360",   type: "download"	 },
					22:  { title: "HD, 1280x720", 	    frm: "mp4", 	size: "720",   type: "download"	 },
					34:  { title: "Low, 480x360", 	    frm: "flv", 	size: "360",   type: "download"	 },
					35:  { title: "SD, 854x480", 	    frm: "flv", 	size: "480",   type: "download"	 },
					36:  { title: "Mobile, 320x240",    frm: "3gp", 	size: "240",   type: "download"	 },
					37:  { title: "Full HD, 1920x1080", frm: "mp4", 	size: "1080",  type: "download"	 },
					38:  { title: "4K, 4096x3072", 	    frm: "mp4", 	size: "3072",  type: "download"	 },
					43:  { title: "Low, 480x360", 	    frm: "webm", 	size: "360",   type: "download"	 },
					44:  { title: "SD, 854x480", 	    frm: "webm", 	size: "480",   type: "download"	 },
					45:  { title: "HD, 1280x720", 	    frm: "webm", 	size: "720",   type: "download"	 },
					46:  { title: "Full HD, 1920x1080", frm: "webm", 	size: "1080",  type: "download"	 },
					82:  { title: "3D Low, 640x360",    frm: "mp4", 	size: "360",   type: "download"	 },
					83:  { title: "3D Low, 320x240",    frm: "mp4", 	size: "240",   type: "download"	 },
					84:  { title: "3D HD, 1280x720",    frm: "mp4", 	size: "720",   type: "download"	 },
					85:  { title: "3D SD, 960x540",     frm: "mp4", 	size: "540",   type: "download"	 },
					100: { title: "3D Low, 640x360",    frm: 'webm',	size: "360",   type: "download"  },
					101: { title: "3D Low, 640x360",    frm: 'webm',	size: "360",   type: "download"  },
					102: { title: "3D HD, 1280x720",    frm: 'webm',	size: "720",   type: "download"  },
					
					// Apple HTTP Live Streaming
					91:  { title: "Mobile, 192x144, Stream",    frm: 'mp4',     size: "144",   type: "record" },
					92:  { title: "Low, 320x240, Stream",       frm: 'mp4',     size: "240",   type: "record" },
					93:  { title: "Low, 640x360, Stream",       frm: 'mp4',     size: "360",   type: "record" },
					94:  { title: "SD, 854x480, Stream",        frm: 'mp4',     size: "480",   type: "record" },
					95:  { title: "HD, 1280x720, Stream",       frm: 'mp4',     size: "720",   type: "record" },
					96:  { title: "Full HD, 1920x1080, Stream", frm: 'mp4',     size: "1080",  type: "record" },
					132: { title: "Low, 320x240, Stream",       frm: 'mp4',     size: "240",   type: "record" },
					151: { title: "Low, 96x72, Stream",         frm: 'mp4',     size: "72",    type: "record" },
					
					134: { title: "Low, 640x360",       frm: 'mp4',     size: "360",   type: 'convert',  note: 'video', adp: [139,140,141], },
					133: { title: "3D Low, 320x240",    frm: 'mp4',     size: "240",   type: 'convert',  note: 'video', adp: [139,140,141], },
					135: { title: "SD, 854x480",        frm: 'mp4',     size: "480",   type: 'convert',  note: 'video', adp: [139,140,141], },
					136: { title: "HD, 1280x720",       frm: 'mp4',     size: "720",   type: 'convert',  note: 'video', adp: [139,140,141], },
					160: { title: "Mobile, 192x144",    frm: 'mp4',     size: "144",   type: 'convert',  note: 'video', adp: [139,140,141], },
					298: { title: "HD, 1280x720",       frm: 'mp4',     size: "720",   type: 'convert',  note: 'video', adp: [139,140,141], },
					137: { title: "Full HD,1920x1080",  frm: 'mp4',     size: "1080",  type: 'convert',  note: 'video', adp: [139,140,141], },

					264: { title: "Full HD,2560x1440",  frm: 'mp4',     size: "1440",  type: 'convert',  note: 'video', adp: [139,140,141], },
					299: { title: "Full HD,1920x1080",  frm: 'mp4',     size: "1080",  type: 'convert',  note: 'video', adp: [139,140,141], },
					266: { title: "4K, 3840x2160",      frm: 'mp4',     size: "2160",  type: 'convert',  note: 'video', adp: [139,140,141], },
					
					167: { title: "Low, 640x360",       frm: 'webm',    size: "360",   type: 'convert',  note: 'video', adp: [171,172], },
					168: { title: "SD, 854x480",        frm: 'webm',    size: "480",   type: 'convert',  note: 'video', adp: [171,172], },
					169: { title: "HD, 1280x720",       frm: 'webm',    size: "720",   type: 'convert',  note: 'video', adp: [171,172], },
					170: { title: "HD, 1920x1080",      frm: 'webm',    size: "1080",  type: 'convert',  note: 'video', adp: [171,172], },
					218: { title: "SD, 854x480",        frm: 'webm',    size: "480",   type: 'convert',  note: 'video', adp: [171,172], },
					219: { title: "SD, 854x480",        frm: 'webm',    size: "480",   type: 'convert',  note: 'video', adp: [171,172], },
					278: { title: "Mobile, 256x144",    frm: 'webm',    size: "144",   type: 'convert',  note: 'video', adp: [171,172], },
					242: { title: "3D Low, 320x240",    frm: 'webm',    size: "240",   type: 'convert',  note: 'video', adp: [171,172], },
					243: { title: "Low, 320x240",       frm: 'webm',    size: "240",   type: 'convert',  note: 'video', adp: [171,172], },
					244: { title: "SD, 854x480",        frm: 'webm',    size: "480",   type: 'convert',  note: 'video', adp: [171,172], },
					245: { title: "SD, 854x480",        frm: 'webm',    size: "480",   type: 'convert',  note: 'video', adp: [171,172], },
					246: { title: "SD, 854x480",        frm: 'webm',    size: "480",   type: 'convert',  note: 'video', adp: [171,172], },
					247: { title: "HD, 1280x720",       frm: 'webm',    size: "720",   type: 'convert',  note: 'video', adp: [171,172], },
					271: { title: "WQHD, 2560x1440",    frm: 'webm',    size: "1440",  type: 'convert',  note: 'video', adp: [171,172], },
					302: { title: "HD, 1280x720",       frm: 'webm',    size: "720",   type: 'convert',  note: 'video', adp: [171,172], },
					303: { title: "HD, 1920x1080",      frm: 'webm',    size: "1080",  type: 'convert',  note: 'video', adp: [171,172], },
					248: { title: "Full HD,1920x1080",  frm: 'webm',    size: "1080",  type: 'convert',  note: 'video', adp: [171,172], },
					308: { title: "Full HD,2560x1440",  frm: 'webm',    size: "1440",  type: 'convert',  note: 'video', adp: [171,172], },
					272: { title: "4K, 3840x2160",      frm: 'webm',    size: "2160",  type: 'convert',  note: 'video', adp: [171,172], },
					313: { title: "4K, 3840x2160",      frm: 'webm',    size: "2160",  type: 'convert',  note: 'video', adp: [171,172], },
					315: { title: "4K, 3840x2160",      frm: 'webm',    size: "2160",  type: 'convert',  note: 'video', adp: [171,172], },
					
					139: { title: "[139]",         frm: 'mp3',      size: "n/a",    type: 'audio',   acodec: 'aac',      },
					140: { title: "[140]",         frm: 'mp3',      size: "n/a",    type: 'audio',   acodec: 'aac',      },
					141: { title: "[141]",         frm: 'mp3',      size: "n/a",    type: 'audio',   acodec: 'aac',      },
					171: { title: "[171]",         frm: 'webm',     size: "n/a",    type: 'audio',   acodec: 'vorbis',   },
					172: { title: "[172]",         frm: 'webm',     size: "n/a",    type: 'audio',   acodec: 'vorbis',   }, 
					249: { title: "[249]",         frm: 'webm',     size: "n/a",    type: 'audio',   acodec: 'opus',     }, 
					250: { title: "[250]",         frm: 'webm',     size: "n/a",    type: 'audio',   acodec: 'opus',     }, 
					251: { title: "[251]",         frm: 'webm',     size: "n/a",    type: 'audio',   acodec: 'opus',     }, 
					256: { title: "[256]",         frm: 'mp3',      size: "n/a",    type: 'audio',   acodec: 'aac',      }, 
					258: { title: "[258]",         frm: 'mp3',      size: "n/a",    type: 'audio',   acodec: 'aac',      }, 
					
				}

		
		
		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			var url = data.url.toLowerCase();

			// -- watch
			if ( /https?:\/\/(?:www\.)?youtube\.com\/watch.*[\?|&]v=([^\?&]+)/i.test(url)) {
				setTimeout( function() {
					detectYoutubeWatch(data, callback);
				}, 300);	
				return;
			}	
			
			// -- user		
      		if (url.toLowerCase().indexOf("youtube.com/user") != -1)    {
			    var matches = url.match(/https?:\/\/(?:www\.)?youtube\.com\/user\/.+?[\?&]v=([^&]+)/i);
		      	if( matches )   {
		        	data.videoId = matches[1];
					setTimeout( function() {
						detectYoutubeUser(data, callback);
					}, 300);	
		        	return;
		      	}
      			// try to get video id from channel contents
				matches = url.match(/https?:\/\/(?:www\.)?youtube\.com\/user\/([^\/\?&]+)/i);
      			if( matches )   {
        			data.videoId = matches[1];
					setTimeout( function() {
						detectYoutubeChannel(data, callback);
					}, 300);	
				    return;
      			} 
				callback(null, true);
				return;
      		}    
				
			// -- embeds
			if ( /:\/\/(?:www\.)?(?:youtube|youtube-nocookie)(?:\.googleapis)?\.com\/v\/([^\?&]+)/i.test(url)) {
				detectYoutubeEmbeds(data, callback);
				return;
			}	
			if ( /:\/\/(?:www\.)?(?:youtube|youtube-nocookie)\.com\/embed\/([^\?&]+)/i.test(url)) {
				detectYoutubeEmbeds(data, callback);
				return;
			}	

			// -- gaming
			if ( /https?:\/\/gaming\.youtube\.com\/watch.*[\?|&]v=([^\?&]+)/i.test(url)) {
				detectYoutubeGaming(data, callback);
				return;
			}	
			if(/^https?:\/\/(?:www\.)?youtube\.com\/get_video_info/i.test(url)) {
				callback(null, true);
				return;
			}	
			
			callback(null);

		}

		// --------------------------------------------------------------------------------
		function detectYoutubeWatch( data, callback ){
			if (DEBUG) console.log( data );

			var url = data.url;
			
			var m = url.match(/https?:\/\/(?:www\.)?youtube\.com\/watch.*[\?|&]v=([^\?&]+)/i);
			if( !m ) {
				callback(null);
				return;
			}	

			var videoID = m[1];
 			if ( parse_videoId[videoID] ) {
				callback(null, true);
 				return;	
 			} 
 			
			parse_videoId[ videoID ] = url;

			getContentFromYoutubePage( data, videoID, function(media) { 
			
				delete parse_videoId[ videoID ];
				if (media) {
					var groupMedia = fvdDownloader.Storage.nextGroupId();     
					var list = [];
					for (var i=0; i<media.length; i++) {
						media[i].group = groupMedia;
						var mm = addVideo( media[i], data );
						list.push(mm);
					}

					data.foundMedia = "Youtube";	
					callback(list, true)					
				}
				else {
					callback(null);
				}
			});   			

		}	

		// --------------------------------------------------------------------------------
		function detectYoutubeUser( data, callback ){

			if (DEBUG) console.log( data );

			var videoId = data.videoId

			parse_videoId[ videoId ] = url;

			getContentFromYoutubePage( data, data.videoId, function(media) { 

				delete parse_videoId[ videoId ];
				if (media) {
					var groupMedia = fvdDownloader.Storage.nextGroupId();     
					var list = [];
					for (var i=0; i<media.length; i++) {
						media[i].group = groupMedia;
						var mm = addVideo( media[i], data );
						list.push(mm);
					}

					data.foundMedia = "Youtube";	
					callback(list, true)					
				}
				else {
					callback(null);
				}
			});   			


		}	
				
		// --------------------------------------------------------------------------------
		function detectYoutubeChannel( data, callback ){

			if (DEBUG) console.log( data );
			
          	var loadUrl = "https://www.youtube.com/user/" + data.videoId;

			fvdDownloader.Utils.getAJAX( loadUrl, null, function(content){

                    if (content) {

						parseYoutubeEmbed(data.videoId, content, data, function(media){

							if (media) {
								var groupMedia = fvdDownloader.Storage.nextGroupId();     
								var list = [];
								for (var i=0; i<media.length; i++) {
									media[i].group = groupMedia;
									var mm = addVideo( media[i], data );
									list.push(mm);
								}

								data.foundMedia = "Youtube";	
								callback(list, true)					
							}
							else {
								callback(null);
							}

						});

/*                        content = content.replace( "\\/", "/" );  
                          
                        matches = content.match( /data-swf-config\s*=\s*"(.+?)"/i );
                        if( matches ){
                            var conf = matches[1];

                            matches = conf.match( /\\\/vi\\\/(.+?)\\\//i );
                            if( matches ){

                            	var videoId = matches[1];

								parse_videoId[ videoId ] = loadUrl;

                            	getContentFromYoutubePage( data, videoId, function(media) { 

                            		delete parse_videoId[ videoId ];
									if (media) {
										var groupMedia = fvdDownloader.Storage.nextGroupId();     
										var list = [];
										for (var i=0; i<media.length; i++) {
											media[i].group = groupMedia;
											var mm = addVideo( media[i], data );
											list.push(mm);
										}

										data.foundMedia = "Youtube";	
										callback(list, true)					
									}
									else {
										callback(null);
									}
                            	});	
                            }
                            else {
	                        	callback(null, true);	
                            }
                        }	
                        else {
                        	callback(null, true);	
                        }*/
                    }
                    else {
                    	callback(null, true);
                    }	
			});	

		}	
				
		// --------------------------------------------------------------------------------
		function detectYoutubeEmbeds( data, callback ){

			var url = data.url;
			var videoId;
	      	var matches = url.match(/:\/\/(?:www\.)?(?:youtube|youtube-nocookie)\.com\/v\/([^\?&]+)/i);

	      	if( !matches ){
	          	matches = url.match(/:\/\/(?:www\.)?(?:youtube|youtube-nocookie)\.com\/embed\/([^\?&]+)/i);
	      	}

	      	if( matches ) {
	        	videoId = matches[1];

				parse_videoId[ videoId ] = url;

				getContentFromYoutubePage( data, videoId, function(media) { 

					delete parse_videoId[ videoId ];
					if (media) {
						var groupMedia = fvdDownloader.Storage.nextGroupId();     
						var list = [];
						for (var i=0; i<media.length; i++) {
							media[i].group = groupMedia;
							var mm = addVideo( media[i], data );
							list.push(mm);
						}

						data.foundMedia = "Youtube";	
						callback(list, true)					
					}
					else {
						callback(null);
					}
				});   			
	      	}
	      	else {
				callback(null, true);
			}	
		}	
				
		// --------------------------------------------------------------------------------
		function detectYoutubeGaming( data, callback ){

			var url = data.url;
			var videoId;
			var title = data.tabTitle;
			var thumbnail = null;
			var formats= {}, foundFormats = false;
	      	var matches = url.match(/\/gaming\.youtube\.com\/watch\?v=([^\?&]+)/i);

	      	if( matches ) {
	        	videoId = matches[1];
				
			  	var getVideoInfoUrl = "https://www.youtube.com/get_video_info?video_id=" + videoId + "&ps=gaming&el=detailpage";
				
				fvdDownloader.Utils.getAJAX( getVideoInfoUrl, null, function(content){

						try {
							var parsed = fvdDownloader.Utils.parseStr(content);
							parsed_hlsvp = parsed.hlsvp;
							title = parsed.title;
							thumbnail = parsed.thumbnail_url;
						}
						catch(ex) {
							console.log(ex);
							callback(null);
							return;
						}
				
						fvdDownloader.Utils.getAJAX( parsed_hlsvp, null, function(text){
							
							try {
								var formatsUrls = text.split("\n").filter(function(str) {
									return /^https?:/.test(str);
								});
								
								for(var url of formatsUrls) {
									var m = url.match(/\/itag\/([0-9]+)\//);
									if(m) {
										formats[m[1]] = url;
										foundFormats = true;
									}
								}
								
								console.log(formats, foundFormats);
								
								if (foundFormats)		{
									parseYoutubeFormats( formats, title, thumbnail, videoId, function(media) { 
									
										if (media) {
											var groupMedia = fvdDownloader.Storage.nextGroupId();     
											var list = [];
											for (var i=0; i<media.length; i++) {
												media[i].group = groupMedia;
												var mm = addVideo( media[i], data );
												list.push(mm);
											}

											data.foundMedia = "Youtube";	
											callback(list, true)					
										}
										else {
											callback(null);
										}
									});   			
									
								}
								else {
									callback(null);
								}
								
							}
							catch(ex) {
								console.log(ex);
								callback(null);
							}
						});
				
				
				});
	      	}
	      	else {
				callback(null, true);
			}	
		}	
				
		// -------------------------------------------------------------------
		function getContentFromYoutubePage( data, videoId, callback ){

			if (DEBUG) console.log('getContentFromYoutubePage:', data.url, videoId);
			
			var scheme = "http";
			var yt_url = data.url;
			if( yt_url.toLowerCase().indexOf("https") == 0 )	scheme = "https";
			
			// send request to youtube
			var url = scheme + "://www.youtube.com/watch?v="+videoId;

			request( url, 
					 { 'X-FVD-Extra': 'yes'}, 
					 {	youtube_id: videoId,
						root_url: yt_url,
						request_url: url
					 }, function(content){
							console.log(content.substring(0, 200))
							parseYoutubeEmbed(videoId, content, data, callback );
						});

		}

		// -------------------------------------------------------------------
		function parseYoutubeEmbed(videoId, content, data, callback ){			

            var formats = {};
            var foundFormats = false;
			var title = null;
			var tabId = data.tabId;
			var thumbnail = null;
			var tmp = null;
			
			var sigDecrypt = new SignatureDecryptor(tabId, videoId);

			var m = content.match(/"author":"(.+?)",/im);
			if(m) {
				var author = m[1].toLowerCase();
				if ( /vevo/i.test(author)) {
					console.log("ISVEVO \n");
					callback(null, true);
					return;
				}	
			}	
			
			//var flagGaming = data.tab.url.indexOf('gaming.youtube.com') == -1 ? false : true;

			if (DEBUG) { console.log('parseYoutubeEmbed', videoId); }

			async.series([
				function(next) {			// info
					try {
						tmp = content.match( /ytplayer.config\s?=\s?\{(.+?)\};/i );
						if (DEBUG) console.log('ytplayer.config:', !!tmp);						
						if (tmp) {
							var inf = tmp[1].replace(/\\\"/g, '"')
												.replace(/\\\//g, '/')
												.replace(/\\\\u0026/g, '&');
							tmp = inf.match( /"thumbnails":\[\{(.+?)\]\}/i );
							if (tmp) {
								tmp = '[{' + tmp[1] + ']';
								inf = JSON.parse( tmp );								
								for (var i=0; i<inf.length; i++) {
									thumbnail = inf[i].url;
									if ( inf[i].width == 196 ) break;
								}	
							}	
						}	
						
						tmp = content.match(/"title":"(.+?)",/i);
						if (tmp) 	title = tmp[1];
						if (title && title.length > TITLE_MAX_LENGTH)   title = title.substr(0, TITLE_MAX_LENGTH) + '...';

						if (DEBUG) { console.log('title:', title, '\nthumbnail:', thumbnail); }
					}
					catch(ex) { 
						console.error(ex);					
					}
					next();
				},
				function(next) {
					tmp = content.match( /"adaptive_fmts"\s*:\s*"(.+?)"/i );
					if (DEBUG) console.log('adaptive_fmts:', !!tmp);
					if( tmp )  {
						tmp[1] = tmp[1].replace(/\\u0026/g, "&");
						var map = tmp[1].split(",");
				
						_parsed(map, function(){
							next();
						});	
					}
					else {
						next();
					}	
				},
				function(next) {
					tmp = content.match( /"url_encoded_fmt_stream_map"\s*:\s*"(.+?)"/i );
					if (DEBUG) console.log('url_encoded_fmt_stream_map:', !!tmp);
					if( tmp )  {
						tmp[1] = tmp[1].replace(/\\u0026/g, "&");
						var map = tmp[1].split(",");
				
						_parsed(map, function(){
							next();
						});	
					}
					else {
						next();
					}	
				},
				/*function(next) {
					if(!flagGaming) {
						return next();
					}
					
					var eUrl = encodeURIComponent("https://youtube.googleapis.com/v/" + videoId);
					var getVideoInfoUrl = "https://www.youtube.com/get_video_info?video_id=" + videoId + "&eurl=" + eUrl + "&el=info";

					var ajax = new XMLHttpRequest();
					ajax.open('GET', getVideoInfoUrl, true);
					ajax.youtube_id = videoId;
					ajax.setRequestHeader('X-FVD-Extra', 'yes');
					
					ajax.onload = function(){
					
								var content = this.responseText;

								var parsed_hlsvp = null;
								try {
									var parsed = fvdDownloader.Utils.parseStr(content);
									parsed_hlsvp = parsed.hlsvp;
									title = parsed.title;
								}
								catch(ex) {
									console.log(ex);
									next();
								}
								
								console.log(parsed_hlsvp);
								getContentFromGaming(parsed_hlsvp, videoId, function(text) {
									
                                    try {
                                        var formatsUrls = text.split("\n").filter(function(str) {
                                            return /^https?:/.test(str);
                                        });
										
                                        formats = {};
                                        foundFormats = false;
                                        for(var url of formatsUrls) {
                                            var m = url.match(/\/itag\/([0-9]+)\//);
                                            if(m) {
                                                formats[m[1]] = url;
                                                foundFormats = true;
                                            }
                                        }
                                        next();
                                    }
                                    catch(ex) {
                                        next();
                                    }
								});
							}
					
					ajax.onerror = function(){
								callback( null );
							}
					
					ajax.send( null );
				},*/
				function() {
					if (DEBUG) console.log(formats);
					if (foundFormats)		{
						parseYoutubeFormats( formats, title, thumbnail, videoId, callback );	
					}
					else {
						callback(null);
					}
				}
			]);

			function _parsed(map, cb) {

				if (DEBUG) console.log('_parsed:', map.length);				

				async.eachSeries(map, function(mapEl, apNext) {
					
						var m = mapEl.match(/itag=([0-9]+)/i);
						if (!m) {
							//console.log("##fail parse itag\n");
							return apNext();
						}
						var tag = m[1];
						
						m = mapEl.match(/url=([^&]+)/i);
						if (!m) {
							//console.log("##fail parse url\n");
							return apNext();
						}
						var url = m[1];
						url = decodeURIComponent(url);

						if (DEBUG) console.log("##found ", tag);

						async.series([
							function(next) {
								m = mapEl.match(/sig=([^&]+)/);
								if (m) {
									url += "&signature="+m[1];
									if (DEBUG) console.log("Found simple sig ", m);
									next();
								}
								else {
									m = mapEl.match(/(?:^|&)s=([^&]+)/);
									if(m) {
										// we detect encrypted signature
										if (DEBUG) console.log("###FOUND encrypted signature!!! "+m[1]);

										sigDecrypt.decrypt(content, m[1], function(err, sig) {
											if(err) {
												console.log("Fail decrypt signature: " + err);
												return apNext();
											}
											//console.log("#signature decrypted success: " + sig);
											url += "&signature="+sig;
								
											next();	
										});
								  
									}
									else {
										// maybe signature already in url
										next();
									}
								}
							},
							function() {
								formats[tag] = url;
								foundFormats = true;
								apNext();
							}
						]);
				}, function() {
					
					cb();
					
				});

			}	

		}

		// ================================================================================================================   
		function parseYoutubeFormats( formats, title, thumbnail, videoId, callback ){		

			var parsedMediaList = [];

			for (var i in ytf) 	{
				if (!(i in formats))       continue;
                if(ytf[i].type === "audio")  continue;
				var u = formats[i];
				
				var hash = videoId+'_'+i;
				
				var ft = title;
				var ext = ((i in ytf) ? ytf[i].frm : 'flv');
				
				var media = {
						url: 			u,
						ext: 			ext,
						title: 			ft,
						thumbnail: 		thumbnail, 
						quality: 		parseInt(ytf[i].size),
						format: 		i,
						label: 			ytf[i].title,
						metod: 			ytf[i].type,
						videoId:		videoId,
						hash:			videoId+'_'+i
				};

                if(ytf[i].type === "convert") {
                	var xx = get_ext_audio_url(i);
                	if ( !xx ) continue;
                    media.audio_tag = xx; 
                    media.audio_url = formats[xx];   
                    media.audio_ext = ytf[xx].frm; 
                }  
                else if(ytf[i].type === "record") {
                	media.playlist = {  video: { url:  u, 
												 ext:  ext,
												 hash: hash   },
										audio:  null    };
                }	
                else if(ytf[i].type === "download") {

                }
				
				parsedMediaList.push(media);
				
				mediaFound = true;
			}
			
			if (DEBUG) console.log(parsedMediaList);

			callback( parsedMediaList );


		    // ------------------------
		    function get_ext_audio_url(itag) {
		        var x = ytf[itag].adp;
		        for (var i=0; i<x.length; i++) {    
		            if (formats[x[i]])  return x[i];
		        }
		        return null;
		    }   


		}

		// ================================================================================================================   
		function addVideo( params, data ){
			
			//console.log('addVideo', params, data);

            var ft = [];
            ft.push({tag: 'span', content: '['+params.label+', ' });
            ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(params.ext) });
            ft.push({tag: 'span', content: '] ' });

			var par = { format:  params.format };
			if (params.audio_url) {
				 par.audio_url = params.audio_url;
				 par.audio_ext = params.audio_ext;
			}		

			var media = {
					url: 		params.url,
					tabId: 		data.tabId,
					tabUrl: 	data.tabUrl,
					frameId: 	data.frameId,

					videoId: 	params.videoId,
					hash: 		params.hash,
					thumbnail: 	params.thumbnail ? params.thumbnail : null,
					
					ext: 		params.ext,
					format: 	params.format,
					
					title: 			params.title,
					downloadName: 	params.title,
					displayName: 	params.title,
					displayLabel: 	ft,
					filename: 		params.hash,
					
					size: 		0,
					type: 		"video",
					metod: 		params.metod,
					source: 	"Youtube",
					quality:    params.quality,
					
					group: 		params.group,
					order: 		params.quality,
					
					params:		par
					
				};
				
			if (params.playlist) media.playlist = params.playlist;	

			return media;	
		}		
		
		// ================================================================================================================   
		var SignatureDecryptor = function(tabId, ytVideoId) {

			if (DEBUG) console.log('---SignatureDecryptor----',  tabId, ytVideoId)

			var scheme = "http";
		
			var playerContents = "";
			var playerUrl = "";
		  
			var funcName = "";
			var player_type, player_id;
			
			
			this.decrypt = function(page, s, cb) {

				if (DEBUG) console.log('SignatureDecryptor.decrypt',  s, page.substring(0, 100))
			  
				var req_url = 'https://www.youtube.com/watch?v='+ytVideoId+'&gl=US&hl=en&has_verified=1&bpctr=9999999999'
				
				async.series([
					function(next) {
						var timer = setTimeout( function(){
							next();
						}, 500);	
						
						var port = chrome.tabs.connect( tabId );
						port.postMessage({action: 'get', sig: s})	
						port.onMessage.addListener(function( message ){
								clearTimeout(timer); timer = null;
								cb(null, message.dsig);
						});
					},	
					function(next) {
					
						var m = page.match(/"assets":.+?"js":\s*("[^"]+")/);
						if (!m) {
							return cb(new Error("Fail get assets"));	
						}
						var u = m[1].replace(/\"/g,'').replace(/\\/g, "");
						if(u.indexOf('youtube.com') == -1)   u = scheme + '://www.youtube.com' + u;
						if(u[0] == "/")   u = 'https:' + u;

						if (playerUrl == u && playerContents != '') {
						  return next();
						}	

						if (DEBUG) console.log('playerUrl:', playerUrl);

						request( u, {'X-FVD-Extra': 'yes'}, { filename: './playerContents' }, function(content){

								if (content) {
									console.log(content.substring(0, 200))

									playerUrl = u;
									playerContents = content;
									
									playerContents = playerContents.trim();
									playerContents = playerContents.replace(/^var\s*_yt_player=\{\s*\};\s*\(function\s*\([a-z]\)\{/, "var _yt_player={}; var g = _yt_player;");
									playerContents = playerContents.replace('})(_yt_player);', "");
									
									console.log(playerContents.substr(0, 100)+"\n");
									console.log("..."+playerContents.substr(playerContents.length-100, 100)+"\n");
									
									next();
								}
								else {
									cb( null );
								}	
							  
							});
					},
					function(next) {

						const REG_FUNC_SIGNATURE = [
							new RegExp(/\.sig\|\|([a-zA-Z0-9$]+)\(/),
							new RegExp(/signature\"\s*,\s*([a-zA-Z0-9$]+)\(/),
							new RegExp(/\bc\s*&&\s*d\.set\([^,]+\s*,\s*([a-zA-Z0-9$]+)\(/),
							new RegExp(/yt\.akamaized\.net\/\)\s*\|\|\s*.*?\s*c\s*&&\s*d\.set\([^,]+\s*,\s*([a-zA-Z0-9$]+)\(/, "i"),
						];
			

						var m = playerUrl.match(/.*?-([a-zA-Z0-9_-]+)\/(watch_as3|html5player(-new)?|base)?\.([a-z]+)$/);
						if ( m ) {
							player_type = m[4];
							player_id = m[1];
						}
						else  {
							m = playerUrl.match(/.*?-([a-zA-Z0-9_-]+)\/(.+?)\/(watch_as3|html5player(-new)?|base)?\.([a-z]+)$/);
							if ( m == null ) return;
							player_type = m[5];
							player_id = m[1];
						}

						if (DEBUG) console.log(player_type, player_id);
						
						if ( player_type == 'js' ) {

							for (var ii=0; ii<REG_FUNC_SIGNATURE.length; ii++) {
								funcName = findMatch(playerContents, REG_FUNC_SIGNATURE[ii]);	
								if (funcName) break;
							}	
							if (!funcName) return cb(new Error("Fail find function (get signature) "));   

							var regCode = new RegExp('('+funcName.replace('$','\\$')+'\\s*=\\s*function)\\s*\\(([^)]*)\\)\\s*\\{([^}]+)\\}');
							var m = playerContents.match(regCode);
							if (!m) {
								return cb(new Error("Fail get function: "+funcName));	
							}
							next();
						}	
					},
					function(next) {
						var key = funcName + '___' + player_id + '___' + s;
						if ( key in storage_code ) {
							cb(null, storage_code[key]);
							return;
						} 
						next();
					},
					function(next) {
					    var codeMain = 'chrome.runtime.onConnect.addListener(function( port ){ function getSignature(s){ port.postMessage({action:"signature",sig:s,dsig:'+funcName+'(s) } ); } port.onMessage.addListener( function( message ){ if (message.action=="get"){ getSignature(message.sig) }}) })';
					    playerContents += codeMain;												 
						
						chrome.tabs.executeScript( 	tabId, {
													code: playerContents,
												}, function(){
														insertScript[ytVideoId] = true;
														next();
												});
												
					},
					function(next) {
console.log(tabId, s);						
						var port = chrome.tabs.connect( tabId, {} );
						port.postMessage({action: 'get', sig: s})	
						port.onMessage.addListener(function( message ){
console.log(message);							
								cb(null, message.dsig);
						});
					}
				]);
			};
			function findMatch(text, regexp) {
				var matches=text.match(regexp);
				return (matches)?matches[1]:null;
			}
			function isString(s) {
				return (typeof s==='string' || s instanceof String);
			}
			function isInteger(n) {
				return (typeof n==='number' && n%1==0);
			}
			function swap(a,b) {
				var c = a[0];
				a[0] = a[b%a.length];
				a[b] = c;
				return a
			};
			function decode(sig, arr) { // encoded decryption
			}
		};

		// ====================================================================	
		this.getMedia = function( media ){

			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "Youtube" ) {
											var iii = find( item ); 
											if (iii == -1) stream_media.push( item );
											else stream_media[iii] = item;
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
				for (var ii=0; ii<stream_media.length; ii++) {
					if (   stream_media[ii].quality == e.quality 
						  && stream_media[ii].ext == e.ext 	
						  && stream_media[ii].group == e.group)  return ii;	
				}	
				return -1;
			}
		}

		function request(url, headers, options, callback) {
			if (typeof window === 'object' ) {
				var ajax = new XMLHttpRequest();
				ajax.open('GET', url, true);
				for (var k in headers)  ajax.setRequestHeader(k, headers[k]);
				for (var k in options)  ajax[k] = options[k];

				ajax.onload = function(){
							callback(this.responseText);
						}
				ajax.onerror = function(){
							console.log('ERROR (request): ', url);
							callback( null );
						}
				ajax.send( null );
			}
			else if (typeof exports === 'object') {
				fvdDownloader.Media.request(url, headers, options, callback);
			}
		}


	};
	
	this.Youtube = new Youtube();
	
}).apply( fvdDownloader.Media );

