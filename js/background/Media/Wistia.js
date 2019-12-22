(function(){
	
	var Wistia = function(){		
	
		const DEBUG = false;
	
		const TITLE_MAX_LENGTH  = 96;
		
		const IGNORE_URL_SIGNS = [	];

		const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
		const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)", "i");

		const WISTIA_URL_GET_PAGE = [	
				new RegExp("brightlightfineart\\.com", "i"),
			];


		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			if( /\/.+?\.jsonp/.test(data.url.toLowerCase()) )  {
				detectWistia( data, callback );
				return;            
			}    

			callback(null);
		}
		
		// --------------------------------------------------------------------------------
		function detectWistia( data, callback ){
			
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
			
			parse_wistia(data, callback);
		}	

		// --------------------------------------------------------------------------------
		function parse_wistia( data, callback ){

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
				duration = 0,
		        thumb = null;

			var parsedMedia = [];
			var mediaFound = false;

			var fileName, fileExt, ext, hash, label, base_url, sample_rate, initSeg;
			var info = null, 
				video = [], 
				playlist = []; 

			var audioStream = [], videoStream = [];

			data.flag_get_page = false;
			WISTIA_URL_GET_PAGE.forEach(function( sign ){
				if ( sign.test(data.tabUrl) )		{
					data.flag_get_page = true;
					return false;
				}
			});


			async.series([
				function(next) {
					fvdDownloader.Media.GetRequest( { tabId: data.tabId,
													   page: data.flag_get_page,
													   url: url, 
													   headers: data.headers 
												     }, 
											    function(resp){
														if (!resp.error) {
															try {
																var matches = resp.content.match( /window\['.+?'\]\s=\s\{(.+?)\};/i );
																if( matches )   {
																	info = JSON.parse("{"+matches[1]+"}");	
																	if (DEBUG) console.log(info);
																	if (info && !info.error) {
																		next();
																		return;
																	}
																}	
																callback(null);	
															}	
															catch(ex) {
																console.log(ex);
																callback(null);
															}
														}	
					});	
				},
				function(next) {
					var title = fvdDownloader.Utils.getJSON( info, 'media/seoDescription' );
					if (title) 	tabTitle = title;
					
					duration = fvdDownloader.Utils.getJSON( info, 'media/duration' );

					info = info.media.assets;

					next();
				},
				function(next) {		
				
					for (var i=0; i<info.length; i++) {
						
						if (info[i].type == 'hls_video') {
							
						}
						else if (info[i].type == 'storyboard') {
							
						}
						else if (info[i].type == 'still_image') {
							thumb = info[i].url;
						}
						else {
							video.push( { url:  	info[i].url,
										  label: 	info[i].slug,		
										  name:		info[i].display_name,
										  ext:		info[i].ext || info[i].container,
										  height:	info[i].height,
										  width:	info[i].width,
										  size:		info[i].size,    });
						}	
					}
				
					next();
				},
				function(next) {

					if ( video.length ) {

						var groupId = fvdDownloader.Storage.nextGroupId();

						for (var i=0; i<video.length; i++) {
							
			                var ft = [];
			                ft.push({tag: 'span', content: '['+video[i].width+'x'+video[i].height+', ' });
			                ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst( video[i].ext ) });
			                ft.push({tag: 'span', content: '] ' });

							var displayName = data.tabTitle;
							var downloadName = displayName;
							var fileName = video[i].label;
							
							var mm = {	url: 		video[i].url,
										tabId: 		data.tabId,
										tabUrl: 	data.tabUrl,
										frameId: 	data.frameId,
									
										hash: 		video[i].label,
									
										ext: 		video[i].ext,
										title: 		displayName,
										format: 	"",
									
										downloadName: 	downloadName,
										displayName: 	displayName,
										displayLabel: 	ft,
										filename: 		fileName,
									
										size: 		video[i].size,
										duration: 	video[i].duration,
										type: 		"video",
										metod: 		'download',
										source: 	"Wistia",
										quality:    video[i].height,
									
										group: 		groupId,
										order: 		video[i].height,
										thumbnail:  thumb,
									};

							parsedMedia.push( mm );
							foundMedia = true;
						}

					}
					next();
				},
				function(next) {
					if (foundMedia) {
						data.foundMedia = "Wistia";	
						callback(parsedMedia);
					}
					else {
						callback(null);
					}	
				}
			]);

		}

		// --------------------------
		function get_base_url( url, data ){
			
			if (data == '/')  return url;
		
			var k = url.indexOf('?');
			if ( k != -1 ) url = url.substring(0,k);
			var u = url.split('/');
		
			var p = data.split('/');

			var h = url;
			for (var i=0; i<p.length; i++) {
				if ( p[i] == '' ) { 
					u.length--;
				}
				else if ( p[i] == '..' ) { 
					u.length--;
				}
				else {
					u.push(p[i]);	
				}	
			}	

			return u.join('/');
		}
		

		
		// ====================================================================	
		this.getMedia = function( media ){
			
			return media;
			
			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "Wistia" ) {
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
				if ( !e.quality ) return -1;
				for (var ii=0; ii<stream_media.length; ii++) {
					if (stream_media[ii].quality == e.quality && stream_media[ii].group == e.group)  return ii;	
				}	
				return -1;
			}
		}

	};
	
	this.Wistia = new Wistia();
	
}).apply( fvdDownloader.Media );
