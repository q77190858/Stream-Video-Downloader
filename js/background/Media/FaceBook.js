(function(){

	var FaceBook = function(){		
	
		var self = this;
		
		const DEBUG = false;
		
		const TITLE_MAX_LENGTH  = 96;

		var videoFacebook = [];

		var detectMediaList = [];
		
		var videoGraph = [];
		var graph = {};

		const FACEBOOK_MOOV = false;
		const FACEBOOK_URL_PARSING = [	
				new RegExp("https?:\\/\\/www\\.facebook\\.com\\/$", "i"),
				new RegExp("https?:\\/\\/www\\.facebook\\.com\\/ajax\\/pagelet\\/generic\\.php\\/", "i"),
				new RegExp("https?:\\/\\/www\\.facebook\\.com\\/(.+?)\\/videos\\/", "i"),
				new RegExp("https?:\\/\\/www\\.facebook\\.com\\/(.+?)video\\/", "i"),
				new RegExp("https?:\\/\\/www\\.facebook\\.com\\/pages_reaction_units\\/more\\/", "i"),
				new RegExp("https?:\\/\\/www\\.facebook\\.com\\/groups\\/(.+?)/", "i"),
				new RegExp("https?:\\/\\/www\\.facebook\\.com\\/video\\/(.+?)/", "i"),
			];

		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			var url = data.url.toLowerCase();

			if (FACEBOOK_MOOV) {
				if ( /\.fbcdn\.net\//i.test(url)) {
					var k1 = url.indexOf('&bytestart');
					var k2 = url.indexOf('&bytestart=0');
					if ( k1 == -1 || k2 != -1 ) {  
						detectSnifferVideo(data, callback);
						return;
					}
					else {
						callback(null, true);
						return;	
					}	
				}
			}	


			var fb = false;
			FACEBOOK_URL_PARSING.forEach(function( sign ){
				if ( sign.test(url) )		{
					fb = true;
					return false;
				}
			});
			if( fb ) {
				if (data.method == 'POST') {
					detectPostVideo(data, callback);
				}
				else {
					detectParseVideo(data, callback);
				}	
				return;
			}

			if ( /\.fbcdn\.net\/(.+?)\.mp4\?/i.test(url)) {

				if ( /&bytestart|&byteend/i.test(url)) {

				}
				else {
					snifferVideo( data, callback );
					return;
				}	
			}	

			callback(null);
		}

		// --------------------------------------------------------------------------------
		function detectPostVideo( data, callback ){

			if (DEBUG) console.log(data);

			var parsedMedia = [];
			var mediaFound = false;

			if ( data.requestBody && data.requestBody.formData )  {

				fvdDownloader.Media.PostRequest( { tabId: data.tabId,
												   url: data.url, 
												   form: data.requestBody.formData, 
												   headers: data.headers 
												}, function(resp){

													if (DEBUG) console.log(resp);

													if (!resp.error) {

														try {
						
															var text = resp.content.substring(9, resp.content.length);
															var info = JSON.parse(text);
						
															var tmb = fvdDownloader.Utils.getJSON( info, "payload/video/markup");
															var inf = {title: data.tabTitle};
															if (tmb && tmb['__html']) { 
																tmb = tmb['__html'];
																//var mm = tmb.match( /aria-label="(.+?)"/im );
																//if (mm) 	inf.title = mm[1];

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
																		inf.thumbnail = m[1].replace(/&amp;/g, '&');
																		break;
																	}
																}

																var x = fvdDownloader.Utils.find_json_param( "videoData", info );
																if (DEBUG) console.log(x);
																x = (typeof x == 'object' && x.length>0) ? x[0] : x;

																inf.video_id = x["video_id"];
																inf.hd_src = x["hd_src"] ? x["hd_src"] : null;
																inf.sd_src = x["sd_src"] ? x["sd_src"] : null;
	
																if (inf.hd_src) {
																	_add(inf.video_id, 'hd', inf.hd_src, inf.title, inf.thumbnail);
																}
									
																if (inf.sd_src) {
																	_add(inf.video_id, 'sd', inf.sd_src, inf.title, inf.thumbnail);
																}
	

															}	
														}
														catch(ex) {
															console.log(ex);
														}
						
													}

													if (mediaFound) {
														data.foundMedia = "FaceBook";	
														callback(parsedMedia, true);
													}
													else {
														callback(null, true);
													}	

											});									

			}
			else {
				callback(null, true);	
			}

	
			// ----------------------------------
			function _add(id, label, url, title, thumbnail) {

				if (DEBUG) console.log(id, label, url, title, thumbnail);

				var pp = {	videoId: 	id,
							hash: 		id + '_' + label,
							videoUrl:	url,
							audioUrl:	null,
						
							filename:   id + '_' + label,
							ext:   		'mp4',

							quality:	label,
							title: 		title,
								
							tabId:		data.tabId,
							tabUrl:		data.tabUrl,
							tabTitle:	data.tabTitle,
							thumbnail: 	thumbnail,
						
							label:		label,
							group:		id							
					};
					
				var mm = addVideo( data, pp ); 
				parsedMedia.push(mm);

				mediaFound = true;
			}
			
		}	

		// --------------------------------------------------------------------------------
		function detectParseVideo( data, callback ){
			
			if (DEBUG) console.log(data);

			var url = data.url;
			var ext = data.ext;
			var filename = data.filename;

			var parsedMedia = [];
			var mediaFound = false;

			var list_xml = [];


			fvdDownloader.Utils.getAJAX(data.url, null, function(content){
				
					if (content) {
						if (DEBUG) console.log(content.substr(0, 100)+'..');

						var mm = content.match( /<title[^>]+(.+?)<\/title>/im );
						var title = mm ? mm[1].replace('>','') : data.tabTitle;
						if (DEBUG) console.log(title);

						var hh = 0;
						var myRe = /"?videoData"?:\[\{(.+?)\}\]/gm;
						var myArray;
						while ((myArray = myRe.exec(content)) !== null) {

							if (DEBUG) console.log(myRe.lastIndex, myArray );

		  					var last = myRe.lastIndex;
		  					var msg = myArray[0];

		  					var info = {title: title, thumbnail: null };
							info.video_id = getMatch( msg, "video_id" );
							info.hd_src = getMatch( msg, "hd_src" );
							info.sd_src = getMatch( msg, "sd_src" );

							var str = content.substring(hh, last);
							str = str.replace(/\\u003C/g,'<').replace(/\\"/g,'"').replace(/\\\//g,'/');
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

							if (DEBUG) console.log(info);

							if (info.hd_src) {
								_add(info.video_id, 'hd', info.hd_src, info.title, info.thumbnail);
							}

							if (info.sd_src) {
								_add(info.video_id, 'sd', info.sd_src, info.title, info.thumbnail);
							}

							// dash
							m = msg.match( /dash_manifest:"(.+?)",/im );
							if (m) {
								var dash = m[1].replace(/\\x3C/g,'<').replace(/\\"/g,'"');
								m = dash.match( /\\n(.+?)\\n/im );
								if (m) {
									dash = m[1];
									var xml = fvdDownloader.Utils.parseXml( dash );
									list_xml.push({xml: xml, thumbnail: info.thumbnail, title: info.title });
								}	
							}
						}	

						if (list_xml.length>0) {

							var mm = _dash();

							if (mm.length>0) {
								data.foundMedia = "FaceBook";	
								callback(mm, true);
								return;
							}

						}	
						
						if (mediaFound) {
							data.foundMedia = "FaceBook";	
							callback(parsedMedia, true);
						}
						else {
							callback(null, true);
						}	

						//console.log(parsedMedia);

					}
			});

			// ----------------------------------
			function _dash() {

				var media = [];
				for (var ii=0; ii<list_xml.length; ii++) {

					data.xml = list_xml[ii].xml;
					data.tabTitle = list_xml[ii].title;					
					var mm = fvdDownloader.Media.Dash.ParseMPD(data);

					if (mm) {
						for (var jj=0; jj<mm.length; jj++) {
							mm[jj].thumbnail = list_xml[ii].thumbnail;
							media.push( mm[jj] );
						}
					}	
				}

				return media;										
			}	


			// ----------------------------------
			function _add(id, label, url, title, thumbnail) {

				url = decodeURIComponent(url);
				url = url.replace(/\\/g,'');


				var pp = {	videoId: 	id,
							hash: 		id + '_' + label,
							videoUrl:	url,
							audioUrl:	null,
						
							filename:   id + '_' + label,
							ext:   		'mp4',

							quality:	label,
							title: 		title,
								
							tabId:		data.tabId,
							tabUrl:		data.tabUrl,
							tabTitle:	data.tabTitle,
							thumbnail: 	thumbnail,
						
							label:		label,
							group:		id							
					};
					
				var mm = addVideo( data, pp ); 
				parsedMedia.push(mm);

				mediaFound = true;
			}
			
		}

		// --------------------------------------------------------------------------------
		function snifferVideo( data, callback ){

			var mm = data.url.match( /https?:\/\/www\.facebook\.com\/facebook\/videos\/([0-9]+)/im );

			var id = mm ? mm[1] : null;
			var label = 'sd';

			var parsedMedia = [];

			var pp = {	videoId: 	id,
						hash: 		id + '_' + label,
						videoUrl:	data.url,
						audioUrl:	null,
					
						filename:   id + '_' + label,
						ext:   		'mp4',

						quality:	label,
						title: 		data.tabTitle,
							
						tabId:		data.tabId,
						tabUrl:		data.tabUrl,
						tabTitle:	data.tabTitle,
						thumbnail: 	null,
					
						label:		label,
						group:		id,
				};
				
			var mm = addVideo( data, pp ); 
			parsedMedia.push(mm);

			data.foundMedia = "FaceBook";	
			callback(parsedMedia, true);
		}	

		
		// --------------------------------------------------------------------------------
		function detectSnifferVideo( data, callback ){

			if (DEBUG) console.log(data);

			var url = data.url;
			var ext = data.ext;
			var filename = data.filename;

			if (ext != 'mp4') return false;
			
			getInfo( filename, ext, url, function(info){ 
			
				if (info && info.type) {
					
					if (info.type == 'full') {
						if (DEBUG) console.log('\n ---full----', info);
						detect_convert({  video: info, audio: null    });
					}
					else if (info.type == 'audio') {
						if (DEBUG) console.log('\n ---audio----', info);
						find_video( info );
					}    
					else if (info.type == 'video') {
						if (DEBUG) console.log('\n ---video----', info);
						find_audio( info );
					}  
				}	
				
			});

			function find_video( info ) {
				
				for (var jj=0; jj<videoFacebook.length; jj++) {
					if (info.title) {
						if (videoFacebook[jj].info && videoFacebook[jj].info.title == info.title && videoFacebook[jj].info.type == 'video' ) {
							detect_convert({audio: info, video: videoFacebook[jj].info });
						}
					}
					else if (info.duration) {
						if (videoFacebook[jj].info && compare_duration(videoFacebook[jj].info.duration, info.duration) && videoFacebook[jj].info.type == 'video' ) {
							detect_convert({audio: info, video: videoFacebook[jj].info });
						}    
					}
				}	
				
			}

			function find_audio( info ) {

				for (var jj=0; jj<videoFacebook.length; jj++) {
					if (info.title) {
						if (videoFacebook[jj].info && videoFacebook[jj].info.title == info.title && videoFacebook[jj].info.type == 'audio' ) {
							detect_convert({video: info, audio: videoFacebook[jj].info });
						}
					}    
					else if (info.duration) {
						if (videoFacebook[jj].info && compare_duration(videoFacebook[jj].info.duration, info.duration) && videoFacebook[jj].info.type == 'audio' ) {
							detect_convert({video: info, audio: videoFacebook[jj].info });
						}    
					}
				}        
			}
			
			// ----------------------------------------------
			function compare_duration(x, y) {
				if ( !x || !y )  return false;

				var xx = get_time(x);
				var yy = get_time(y);

				if ( (xx-yy)/xx*100 < 1 )  return true;

				return false;
			}    
			// ----------------------------------------------
			function get_time(str) {
				
				if (typeof str == 'number') return str;
				
				try {
					return parseInt(str);
				}
				catch(ex) {	
					var p = str.split('.');
					var n = p[0].split(':');

					if (n.length==3) {
						return parseInt(n[2])*3600 + parseInt(n[1])*60 + parseInt(n[0])
					}           
					if (n.length==2) {
						return parseInt(n[1])*60 + parseInt(n[0])
					}           
					if (n.length==1) {
						return parseInt(n[0])
					}           
				}	
				return 0;
			} 
			// --------------------------------
			function detect_convert( d ) {

				if (DEBUG) console.log('detect_convert', d, d.video.filename.split('_')[0]);
				
				var label = d.video.quality ? (d.video.quality.width + 'x' + d.video.quality.height) : "";
				var hh = d.video.title ? d.video.title : d.video.filename.split('_')[0];

				var detect_media = {	videoId: 	d.video.title ? d.video.title : null,
				
										videoUrl:	delete_bytestart(d.video.url),
										audioUrl:	d.audio? delete_bytestart(d.audio.url) : null,
										
										filename:   d.video.filename,
										ext:   		'mp4',

										duration:   d.video.duration,
										filename:   d.video.filename,
										
										quality:	d.video.quality,
												
										tabId:		data.tabId,
										tabUrl:		data.tabUrl,
										tabTitle:	data.tabTitle,
										
										label:		label,
										hash: 		hh + '_' + label,	
										group:		d.video.title ? d.video.title : null							
									};

				graph_media( detect_media );
			}	
			
			function delete_bytestart(url) {
			
				var k = url.indexOf('&bytestart=0');
				if ( k != -1 )  url = url.substring(0, k);
				return url;
			}
			
			// --------------------------------
			function graph_media( d ) {
			
				//if (DEBUG) console.log('----graph_media----', d, graph);

				if ( !d.videoId ) {
					if ( !d.audioUrl ) {			// full
						var mm = addVideo( data, d ); 
						data.foundMedia = "FaceBook";	
						callback([mm], true);
					}
					else {
						callback(null, true);
					}	
				}
				else {
					var mm = addVideo( data, d ); 
					data.foundMedia = "FaceBook";	
					callback([mm], true);

					if (graph[d.videoId]) {

						if (graph[d.videoId].thumbnail) {
							fvdDownloader.Thumbnail.set({  group:  d.videoId,
														   title:    graph[d.videoId].title,
														   thumbnail:   graph[d.videoId].thumbnail  } );
						}	

					}
					else {
						graph[d.videoId] = {};
						graphVideo(d.videoId, function(rr){

							if (rr) {
								fvdDownloader.Thumbnail.set({  group:  d.videoId,
															   title:    rr.name || rr.from.name,
															   thumbnail:   rr.picture  } );

								graph[d.videoId].title = rr.name || rr.from.name;
								graph[d.videoId].thumbnail = rr.picture;
							}	
							else {
								fvdDownloader.Thumbnail.get({  group:  d.videoId,
															   url:    d.videoUrl,
															   ext:    d.ext  } );
							}

						});
					}	
				}	
			}
			
		}
		
		// --------------------------------------------------------------------------------
		function getInfo( filename, ext, url, callback ){
			
			if (DEBUG) console.log('getInfo', filename, ext, url);
		
			// такое уже было
			for (var i=0; i<videoFacebook.length; i++) {
				if (videoFacebook[i].filename === filename) {
					if (videoFacebook[i].info ) {
						callback(videoFacebook[i].info);
					}    
					else {
						videoFacebook[i].run.push( callback );	
					}	
					return;
				}    
			}

			// не было добавляем	
			videoFacebook.push({ filename: filename,
								 ext: ext,
								 url: url,
								 info: null,
								 run: [ callback ]
							   });
							   
			fvdDownloader.Moov.getInfoHeaderFile(url, function(info){
				
				if (DEBUG) console.log('Moov.getInfoHeaderFile = ', info);

				for (var i=0; i<videoFacebook.length; i++) {
					if (videoFacebook[i].filename === filename) {
						info.url = videoFacebook[i].url;
						videoFacebook[i].info = info;
						
						for (var j=0; j<videoFacebook[i].run.length; j++) {
							var func = videoFacebook[i].run[j];
							func(info);
						}
						return;
					}    
				}
			
			});
		
		}
		
		// -----------------------------------------------------
		function graphVideo(videoId, callback) {

			if (!videoId) 	return;

			var url = 'https://graph.facebook.com/'+videoId+'?fields=name,picture,source,from,length';
			
			fvdDownloader.Utils.getAJAX(url, null, function(resp){
				
					if (resp) {
						try {
							var x = JSON.parse(resp);
							if (DEBUG) console.log('--graphVideo---', videoId, x)
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
		
		// --------------------------------------------------------------------------------
		function addVideo( data, params ){

			if (DEBUG) console.log('addVideo', data, params);

			var title = params.title ? params.title : data.tabTitle;
			
            var ft = [];
            ft.push({tag: 'span', content: '['+(params.label ? params.label : '')+', ' });
            ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(params.ext) });
            ft.push({tag: 'span', content: '] ' });

            var headers = data.headers ? data.headers : [];
            headers["referrer"] = 'https://www.facebook.com/';

			var mm = {
					url: 		params.videoUrl,
					tabId: 		data.tabId,
					tabUrl: 	data.tabUrl,
					headers: 	headers,
					
					videoId: 	params.videoId,
					hash: 		params.hash,
					
					ext: 		params.ext,
					title: 		title,
					format: 	"",
					thumbnail: 		params.thumbnail ? params.thumbnail : null,
					
					downloadName: 	title,
					displayName: 	title,
					displayLabel: 	ft,
					filename: 		params.filename,
					
					group:			params.group ? params.group : null,
					duration:		params.duration ? params.duration : null,
					order: 			params.order ? params.order : null,
					size: 			0,
					type: 			"video",
					source: 		"FaceBook",
					quality:    	params.label ? params.label : null,
				};

			if (params.audioUrl) {
				mm.metod = 'convert';
				mm.params = {  audio_url: params.audioUrl,
							   audio_ext: params.ext		};
			}	
			else {
				mm.metod = 'download';
			}

			mm.ffmpegThumb = true;

			return mm;	

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

		};

		// ====================================================================	
		this.getMedia = function( media ){

			return media;	
		}

	}
	
	this.FaceBook = new FaceBook();
	
}).apply( fvdDownloader.Media );
