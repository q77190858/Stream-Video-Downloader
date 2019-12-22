(function(){
	
	var Master = function(){		
	
		const DEBUG = false;
	
		const TITLE_MAX_LENGTH  = 96;
		
		const IGNORE_URL_SIGNS = [	];

		const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
		const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)", "i");

		const MASTER_URL_GET_PAGE = [	
				new RegExp("brightlightfineart\\.com", "i"),
			];

		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			if( /\/video\/(.*)\/master\.json\?/.test(data.url.toLowerCase()) )  {
				detectVideo( data, callback );
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

			parse_master(data, callback);
		}	

		// --------------------------------------------------------------------------------
		function parse_master( data, callback ){

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
		        thumb = null;

			var parsedMedia = [];
			var mediaFound = false;

			var fileName, fileExt, ext, hash, label, base_url, sample_rate, initSeg;
			var info = null, video = null, audio = null, audio_id = null, video_id = null; 

			var audioStream = [], videoStream = [];

			data.flag_get_page = false;
			MASTER_URL_GET_PAGE.forEach(function( sign ){
				if ( sign.test(data.tabUrl) )		{
					data.flag_get_page = true;
					return false;
				}
			});

			async.series([
				function(next) {

					fvdDownloader.Media.GetRequest( { tabId:   data.tabId,
													  page:    data.flag_get_page,
													  url:     url, 
													  headers: data.headers 
												    }, 
											    function(resp){
														if (!resp.error) {
															try {
																info = JSON.parse(resp.content);	
																if (DEBUG) console.log(info);
																if (info) {
																	next();
																}
																else {
																	callback(null);	
																}	
															}	
															catch(ex) {
																console.log(ex);
																callback(null);
															}
														}	
														else {
															callback(null);
														}	
											});			

				},
				function(next) {

					videoId = fvdDownloader.Utils.getJSON( info, 'clip_id' );
					baseUrl = fvdDownloader.Utils.getJSON( info, 'base_url' );
					baseUrl = get_base_url( url, baseUrl );

					video = fvdDownloader.Utils.getJSON( info, 'video' );
					audio = fvdDownloader.Utils.getJSON( info, 'audio' );

					next();
				},
				function(next) {		// audio
				
					for (var j=0; j<audio.length; j++) {
							
						var xx = fvdDownloader.Utils.getJSON( audio[j], 'init_segment' );
						initSeg =  window.atob(xx);

						base_url = fvdDownloader.Utils.getJSON( audio[j], 'base_url' )
						sample_rate = fvdDownloader.Utils.getJSON( audio[j], 'sample_rate' );
						audio_id = fvdDownloader.Utils.getJSON( audio[j], 'id' );
						ext = "mp4";
						hash = videoId+'_'+sample_rate;
						
						var segments = fvdDownloader.Utils.getJSON( audio[j], 'segments' );
						var list = [];
						for (var jj=0; jj<segments.length; jj++) {
							var uu = segments[jj].url;
							if (uu.indexOf('http') != 0) {
								uu = baseUrl + '/' + base_url + uu;
							}   
							if (uu.indexOf('?') == -1 && uu.indexOf('#') == -1 && search) {
								uu = uu + search;
							}    
							list.push( uu );    
						}  

						audioStream.push({  audio_id: 	 audio_id,
											hash: 		 hash,
											url: 		 baseUrl+'/'+base_url, 
											fileExt: 	 ext, 
											sample_rate: sample_rate,
											playlist: 	 list,
											initSeg: 	 initSeg });
					}
				
					next();
				},
				function(next) {

					for (var j=0; j<video.length; j++) {
							
						var xx = fvdDownloader.Utils.getJSON( video[j], 'init_segment' );
						initSeg =  window.atob(xx);

						base_url = fvdDownloader.Utils.getJSON( video[j], 'base_url' )
						label = fvdDownloader.Utils.getJSON( video[j], 'width' )+'x'+fvdDownloader.Utils.getJSON( video[j], 'height' );
						video_id = fvdDownloader.Utils.getJSON( video[j], 'id' );
						ext = "mp4";
						hash = videoId+'_'+label;
						
						var segments = fvdDownloader.Utils.getJSON( video[j], 'segments' );
						var list = [];
						for (var jj=0; jj<segments.length; jj++) {
							var uu = segments[jj].url;
							if (uu.indexOf('http') != 0) {
								uu = baseUrl + '/' + base_url + uu;
							}   
							if (uu.indexOf('?') == -1 && uu.indexOf('#') == -1 && search) {
								uu = uu + search;
							}    
							list.push( uu );    
						}  
						
						videoStream.push({  video_id: 	video_id,
											hash: 		hash,
											url: 		baseUrl+'/'+base_url, 
											fileExt: 	ext,
											quality: 	label,	
											playlist: 	list,
											initSeg: 	initSeg });
					}
					
					next();
				},
				function(next) {

					if ( videoStream.length ) {

						var groupId = fvdDownloader.Storage.nextGroupId();

						for (var i=0; i<videoStream.length; i++) {
							
							var aa = find_audio( videoStream[i].video_id );

							var quality = videoStream[i].quality;
							var height = null;
							if (quality) {
								var m = quality.match( /([0-9]+)x([0-9]+)/im ); 
								height = m ? m[2] : quality; 
								try { height = parseInt(height);	} catch(ex) {}		
							}

			                var ft = [];
			                ft.push({tag: 'span', content: '['+(quality ? quality : '')+', ' });
			                ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst( videoStream[i].fileExt ) });
			                ft.push({tag: 'span', content: '] ' });

							var displayName = data.tabTitle;
							var downloadName = displayName;
							var fileName = videoStream[i].video_id;
							
							var segm = { video: null,
										 audio: null };
										
							segm.video = {	initSeg:	videoStream[i].initSeg,
											segments:	videoStream[i].playlist  };			

							if (aa) {					
								segm.audio = { 	initSeg:	aa.initSeg,
												segments: 	aa.playlist,
												ext:   		aa.fileExt,  };
							}	

							var mm = {	url: 		data.url,
										tabId: 		data.tabId,
										tabUrl: 	data.tabUrl,
										frameId: 	data.frameId,
									
										hash: 		videoStream[i].hash,
										videoId:    videoStream[i].video_id,
									
										ext: 		videoStream[i].fileExt,
										title: 		displayName,
										format: 	"",
									
										downloadName: 	downloadName,
										displayName: 	displayName,
										displayLabel: 	ft,
										filename: 		fileName,
									
										segments:       segm,
									
										size: 		0,
										type: 		"video",
										metod: 		'segments',
										source: 	"Master",
										quality:    height,
									
										group: 		groupId,
										order: 		height,
									
									};


							parsedMedia.push( mm );
							foundMedia = true;

						}

					}
					next();
				},
				function(next) {
					if (foundMedia) {
						data.foundMedia = "Master";	
						callback(parsedMedia);
					}
					else {
						callback(null);
					}	
				}
			]);

			// -----------------------------
			function find_audio( id ) {

				if ( audioStream.length > 0 ) {
					if ( id ) {
						for (var j=0; j<audioStream.length; j++) {
							if (audioStream[j].audio_id == id) {
								return audioStream[j];
							}
						}	
					}
					return audioStream[0];		
				}
				else {
					return null;
				}	
			}

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
										if ( item.source == "Master" ) {
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
	
	this.Master = new Master();
	
}).apply( fvdDownloader.Media );
