(function(){
	
	var Periscope = function(){		
	
		const TITLE_MAX_LENGTH  = 96;
		
		const DEBUG = false;
	
        // --------------------------------------------------------------------------------
        this.detectMedia = function( data, callback ){

            var url = data.url.toLowerCase();

			if( /periscope\.tv(.*)\/playlist.m3u8/.test(url) ) {
				detectPeriscope(data, callback);
				return;
			}        
			else if( /https:\/\/replay\.periscope\.tv\/(.*).m3u8/.test(url) ) {
				detectPeriscope(data, callback);
				return;
			}        
			else if( /\/periscope-replay-direct-live\/playlist_(.+?).m3u8/.test(url) ) {
				detectPeriscope(data, callback);
				return;
			}        
			else if( /\.pscp\.tv\/(.*).m3u8/.test(url) ) {
				detectPeriscope(data, callback);
				return;
			}
			else if( /periscope\.tv(.+?).m3u8/.test(url) ) {
				detectPeriscope(data, callback);
				return;
			}

            callback(null);
        }
        
		// --------------------------------------------------------------------------------
		function detectPeriscope( data, callback ){

			tabInfo = data.tab;
			if (DEBUG) console.log("PERISCOPETEST FOUND MEDIA: ", data );
			
			var url = data.url;
			var videoId = null;

            var parsedMedia = [];
            var mediaFound = false;

			try {		
				var root_url = data.tabUrl;
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
			
			var hash = hex_md5(url);		

			var ext="mp4";
			var title = data.tabTitle;

            var ft = [];
            ft.push({tag: 'span', content: '[' });
            ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(ext) });
            ft.push({tag: 'span', content: '] ' });

			var pp = {  video: { url:  url, 
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
						filename: 		hash,
					
						playlist:       pp,

						thumbnail: 		"/images/thumbnail/periscope.png", 
					
						size: 			0,
						type: 			"video",
						metod: 			"record",
						source: 		"Periscope",
						quality:    	null,
					
						group: 			null,
						order: 			null,
					
					};

			parsedMedia.push( mm );
			mediaFound = true;

	        if (mediaFound) {
	            data.foundMedia = "Periscope"; 
	            callback(parsedMedia, true);
	        }   
	        else {
	            callback(null);
	        }

		
		}
		
		// ====================================================================	
		this.getMedia = function( media ){

			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "Periscope" )   stream_media.push( item );
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
	
	this.Periscope = new Periscope();
	
}).apply( fvdDownloader.Media );
