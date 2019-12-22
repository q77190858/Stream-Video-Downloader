(function(){

    var MediaSniffer = function(){
		
		const TITLE_MAX_LENGTH  = 96;

        const CONTENT_TYPE_RE = /^(video)/i;

		const IGNORE_SIGNS = [
			"soloset.net",
			"solosing.com",
			"static.doubleclick.net",
			"googlevideo",
		];

		const IGNORE_ROOT_URL = [
			'ustream.tv',
			'twitch.tv',
			'periscope.tv',
			'break.com',
			'dailymotion.co',
			'www.facebook.com',
			'metacafe.com',
			"hulu.com",
			"cnn.com",
			"cbsnews.com",
			"ok.ru",
			"youtube.com",    
			"vimeo.com",  
			'viki.com',
			
			// звуковые сайты - игнорируем
			"www.vevo.com",
			"www.pandora.com",
			"www.music.yahoo.com",
			"www.spotify.com",
			"www.tunein.com",
			"www.last.fm",
			"www.iheart.com",
			"www.allmusic.com",
			"www.radio.com",
			"soundcloud.com"
		];

		const EXTENDED_ROOT_URL = [
			'bilibili.com',
		];


		const TRANSLATE_EXT = {
			"m4v" : "mp4"
		};

		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			if (!data.foundMedia)  {

				if ( isMedia(data) ) {

					addMedia( data, function( m ){
						data.foundMedia = "Sniffer";
						callback( m );
					});
					return;
				};
			};
			
			callback(null);

		}

		// -------------------------------------------------------------------
		function isMedia( data ){

		    var ignore = false;
		    if (data.tabUrl) {
		        IGNORE_ROOT_URL.forEach(function( sign ){
		            if( data.tabUrl.indexOf( sign ) != -1 ){
		                ignore = true;
		                return false;
		            }
		        });
		    }    
		    if( ignore )            return false;

            if (data.contentType) {
                var tmp = data.contentType.split("/");
                if (CONTENT_TYPE_RE.test(data.contentType)) {
                    return true;
                }
            }

            if( fvdDownloader.Media.isAllowedExt( data.ext ) )	return true;

			return false;	
		}

		// -------------------------------------------------------------------
		function addMedia( data, callback ){

			// игнорируемый список - сейчас будет  тип NOT
			var metod = 'download';
			
			var ext = data.ext;
			var displayName = data.tabTitle;
			var downloadName = displayName;
			var displayLabel = [ {tag: 'span', content: '[' },
								 {tag: 'b',    content: fvdDownloader.Utils.upperFirst(ext) },
								 {tag: 'span', content: '] ' }	 
							   ];
			var fileName = data.filename;

			if(TRANSLATE_EXT[ext])	{
				ext = TRANSLATE_EXT[ext];
			}
			
			var size = data.size;
			

			displayName = displayName.replace(/&quot;/g,''); 
			
			var ffmpegThumb = true;
			var thumbnail = null;
			if (fvdDownloader.Media.isAllowedExt( ext ) == 2 || data.type == 'audio') {
				thumbnail = '/images/thumbnail/audio.png';	
				ffmpegThumb = false;			 
			}

	        EXTENDED_ROOT_URL.forEach(function( sign ){
	            if( data.tabUrl.indexOf( sign ) != -1 ){
	                metod = "loaded";
	                return false;
	            }
	        });

			var media = {
					url: 		data.url,
					tabId: 		data.tabId,
					tabUrl: 	data.tabUrl,
					frameId: 	data.frameId,

					thumbnail: 	thumbnail,
					ffmpegThumb: 	ffmpegThumb,
					
					ext: 		ext,
					
					title: 			data.tabTitle,
					downloadName: 	downloadName,
					displayName: 	displayName,
					displayLabel: 	displayLabel,
					filename: 		fileName,
					
					size: 		size,
					type: 		"video",
					metod: 		metod,
					source: 	"Sniffer",

					headers:    data.headers
					
				};

			callback(media);	
		}		


		// ====================================================================	
		this.getMedia = function( media ){

			return media;
			
		}

		// ====================================================================	
    };
    
    this.Sniffer = new MediaSniffer();

    
}).apply(fvdDownloader.Media);
