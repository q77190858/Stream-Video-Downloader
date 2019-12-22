(function(){
	
	var Twitch = function(){		
	
		const TITLE_MAX_LENGTH  = 96;
		
		const DEBUG = false;
	
        // --------------------------------------------------------------------------------
        this.detectMedia = function( data, callback ){

            var url = data.url.toLowerCase();

			if( /\/api\/channel\/(.+?)\.m3u8/.test(url) ) {
				detectTwitch(data, callback);
				return;
			}        

            callback(null);
        }
        
		// --------------------------------------------------------------------------------
		function detectTwitch( data, callback ){
		
			tabInfo = data.tab;
			if (DEBUG) console.log("TWITCHTEST FOUND STREAM: ", data );
			
			var url = data.url;
			var videoId = null;

			try {		
				var root_url = data.tab.url;
				var k = root_url.indexOf('?');
				if (k != -1) 	root_url = root_url.substring(0, k);
				videoId =/([^\/]+)$/.exec(root_url)[1];
			}
			catch( ex )	{
				//dump( "Exception videoId: " + ex +'\n' );
			}
			if (!videoId) {
				var k = url.indexOf('.m3u8');
				if (k != -1) {
					var t = url.substring(0, k);
					var videoId=/([^\/]+)$/.exec(t)[1];
				}	
			}
			if (DEBUG) console.log('videoId = ',videoId);
			
			var videoTitle  = data.tab.title;
			
			getStream( videoId, url );
		

			// ---------------------
			function getStream( videoId, url ){
				
				if (DEBUG) console.log(url);

	            var parsedMedia = [];
	            var mediaFound = false;

				fvdDownloader.Utils.getAJAX( url, null, function( content ) {  
				
						var groupMedia = fvdDownloader.Storage.nextGroupId();     

						var lines = content.split('\n');
						var kk = lines.length;
						for (var i=0; i<kk; i++) 	{

							var line = lines[i].trim().replace(/\r/g,'')
							if (line == '') continue;
							
							var m = line.match( /^#(EXT[^\s:]+)(?::(.*))/i ); 
							if (m) {
								var name = m[1];
								var value = m[2];
								var resolution = '';
								if (name == 'EXT-X-STREAM-INF') {
									var x = fvdDownloader.Utils.get_X_INF( value );
									if (x) {
										if ( x['RESOLUTION'] )  resolution = x['RESOLUTION'];
										
										var url_PL = lines[i+1];
										
										if (url_PL) {

											var ext="mp4";
											var hash = videoId+'_'+resolution;
											var title = data.tabTitle;

											var q = null;
											if (resolution) {
												var m = resolution.match( /([0-9]+)x([0-9]+)/im ); 
												q = m ? m[2] : params.quality; 
												try { q = parseInt(q);	} catch(ex) {}		
											}

							                var ft = [];
							                ft.push({tag: 'span', content: '['+(resolution ? resolution : '')+', ' });
							                ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(ext) });
							                ft.push({tag: 'span', content: '] ' });

											var dn = "["+(q ? q+', ' : '')+fvdDownloader.Utils.upperFirst( ext )+"]";

											var pp = {  video: { url:  url_PL, 
																 ext:  ext,
																 hash: hash   },
														audio:  null    };
											
											var mm = {	url: 			data.url,
														tabId: 			data.tabId,
														tabUrl: 		data.tabUrl,
														frameId: 		data.frameId,
													
														hash: 			hash,
														videoId: 		videoId,
													
														ext: 			ext,
														title: 			title,
														format: 		"",
													
														downloadName: 	title,
														displayName: 	title,
														displayLabel: 	ft,
														downloadLabel: 	dn,
														filename: 		hash,
													
														playlist:       pp,
													
														size: 			0,
														type: 			"video",
														metod: 			"record",
														source: 		"Twitch",
														quality:    	q,
													
														group: 			groupMedia,
														order: 			q,
													
													};

											parsedMedia.push( mm );
											mediaFound = true;

										}
									}
								}    
							}
						}

                        if (mediaFound) {
                            data.foundMedia = "Twitch"; 
                            callback(parsedMedia, true);
                        }   
                        else {
                            callback(null);
                        }

				});
			}	
		}
		
		// ====================================================================	
		this.getMedia = function( media ){

			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "Twitch" )   stream_media.push( item );
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
		}

				
	};
	
    this.Twitch = new Twitch();
    
}).apply( fvdDownloader.Media );

