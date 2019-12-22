(function(){
	
	var MailRu = function(){		
	
		const DEBUG = false;
	
		const TITLE_MAX_LENGTH  = 96;
		
		const IGNORE_URL_SIGNS = [	];

		const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
		const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)", "i");

		//	https://my.mail.ru/+/video/meta/-15844383463028152?xemail=&ajax_call=1&func_name=&mna=&mnb=&ext=0&_=1508674518854 				

		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			if( /https?:\/\/my\.mail\.ru\/\+\/video\/meta\/.+?\?/.test(data.url.toLowerCase()) )  {
				detectMailRu( data, callback );
				return;            
			}    

			callback(null);
		}
		
		// --------------------------------------------------------------------------------
		function detectMailRu( data, callback ){
			
			if (DEBUG) console.log( data );

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
			
			parse_MailRu(data, callback);
		}	

		// --------------------------------------------------------------------------------
		function parse_MailRu( data, callback ){

			if (DEBUG) console.log( data );

		    var url = data.url,
		        tabUrl = data.tabUrl,
		        tabTitle = data.tabTitle,
		        videoId = null,
		        thumb = null;

			fvdDownloader.Utils.getAJAX( url, null, function(content){

				if (content) {
                    try {
                        var info = JSON.parse(content);
                    }                     
                    catch(ex) {
                        console.log(ex);
                        return;
                    }

					var par = {};
                    par.videoId = fvdDownloader.Utils.getJSON( info, 'meta/id' ).replace(/-/g,"");
                    par.title = fvdDownloader.Utils.getJSON( info, 'meta/title' );
                    par.thumb = "https:" + fvdDownloader.Utils.getJSON( info, 'meta/poster' );
	            	par.group = fvdDownloader.Storage.nextGroupId();

                    var videos = fvdDownloader.Utils.getJSON( info, 'videos' );

                    var parsedMedia = [];
                    var foundMedia = false;

                    for (var i=0; i<videos.length; i++) {

                    	par.url = 'http:'+videos[i].url;
                    	par.label = videos[i].key;
                    	par.height = par.label.replace('p','');

						var m = addVideo( par, data );   
						parsedMedia.push(m);
						foundMedia = true;
                    }

                    if (DEBUG) console.log(parsedMedia);

					if (foundMedia) {
						data.foundMedia = "MailRu";	
						callback(parsedMedia, true);
					}
                }    
			});	
		}

		// --------------------------
		function addVideo( params, data ){
			

			if (DEBUG) console.log(params, data);

			var fileName = params.videoId;
            var extension = "mp4";
			var ff = fvdDownloader.Utils.extractPath( params.url );
			if (ff) {
				extension = ff.ext;
				fileName = ff.name;
			}	

            var ft = [];
            ft.push({tag: 'span', content: '['+params.label+', ' });
            ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(extension) });
            ft.push({tag: 'span', content: '] ' });

			var displayName = params.title;
			var downloadName = displayName;

			var mm = {
					url: 		params.url,
					tabId: 		data.tabId,
					tabUrl: 	data.tabUrl,
					frameId: 	data.frameId,
					
					hash: 		hex_md5(params.url),
					thumbnail: 	params.thumb,
					
					ext: 		extension,
					title: 		displayName,
					format: 	"",
					
					downloadName: 	downloadName,
					displayName: 	displayName,
					displayLabel: 	ft,
					filename: 		fileName,
					
					size: 			0,
					type: 			"video",
					metod: 			"download",
					source: 		"MailRu",

					quality:    	params.height,
					group: 			params.group,
					order: 			params.height,
				};    

			return mm;	
		}
		

		
		// ====================================================================	
		this.getMedia = function( media ){
			
			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			var mail_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "MailRu" ) 			mail_media.push( item );
										else if ( item.source == "ExtM3U" || item.source == "Master" || item.source == "Dash" )  stream_media.push( item );
										else if ( item.source == "Sniffer" )  sniffer_media.push( item );
										else  other_media.push( item );

									});
			if (mail_media.length > 0) {
				stream_media.length == 0;	
			}	
			else {
				mail_media = stream_media;
			}

			
			if (mail_media.length > 0) {
				other_media.forEach(function( item ){	 mail_media.push( item )  });
				return mail_media;
			}	
			else {
				other_media.forEach(function( item ){	 sniffer_media.push( item )  });
				return sniffer_media;
			}	
		}

	};
	
	this.MailRu = new MailRu();
	
}).apply( fvdDownloader.Media );
