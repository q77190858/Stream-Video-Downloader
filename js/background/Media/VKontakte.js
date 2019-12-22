(function(){
	
	var VKontakte = function(){		
	
		const TITLE_MAX_LENGTH  = 96;
	
		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			var url = data.url.toLowerCase();

			if(/^https?:\/\/vk\.com\/al_video\.php/i.test(data.url) && data.method == "POST") {
				detect_video_VKontakte(data, callback);
				return 1;
			}        
			//else if(/^https?:\/\/vk\.com\/al_audio\.php/i.test(data.url) && data.method == "POST" && data.requestBody && data.requestBody.formData ) {
				//detect_audio_VKontakte(data, callback);
				//return 1;
			//}        
			
			callback(null);

		}

		// --------------------------------------------------------------------------------
		function detect_video_VKontakte( data, callback ){

			var groupMedia = null;
			var parsedMediaList = [];
			var	mediaFound = false;


			var formData = data.requestBody.formData;
			if ( 'video' in formData ) {	
			
				postAJAX( data.url, formData, function(content){
					
					groupMedia = fvdDownloader.Storage.nextGroupId();     
					
					var m = content.match( /<!json>{(.+?)}<!>/i ); 
					if (m) {
						var x = JSON.parse( '{' + m[1] + '}' ); 
					
						var info = x['mvData'];

						var videoId = info["videoRaw"];
						var title = info["title"].replace(/&(.+?);/gm,'').trim();

						var player = x['player'];
						info = player.params[0];
						var thumb = info['thumb'] || info['jpg'];
						
						if (info["url240"])  _create(info["url240"],  videoId, '[240] '+title,  '240',  thumb);
						if (info["url360"])  _create(info["url360"],  videoId, '[360] '+title,  '360',  thumb);
						if (info["url480"])  _create(info["url480"],  videoId, '[480] '+title,  '480',  thumb);
						if (info["url720"])  _create(info["url720"],  videoId, '[720] '+title,  '720',  thumb);
						if (info["url1080"]) _create(info["url1080"], videoId, '[1080] '+title, '1080', thumb);
						
					}


					if (mediaFound) {
						data.foundMedia = "VKontakte";	
						callback(parsedMediaList, true)					
					}
					else {
						callback(null, true)					
					}	


				});				
			}	
			
			// -----------------
			function _create(url, videoId, ft, q, thumb) {
				
				var ff = fvdDownloader.Utils.extractPath( url );
				if (ff) {

		            var fl = [];
		            fl.push({tag: 'span', content: '['+q+', ' });
		            fl.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(ff.ext) });
		            fl.push({tag: 'span', content: '] ' });

					
					var m = {
							url: 		url,
							tabId: 		data.tabId,
							tabUrl: 	data.tabUrl,
							frameId: 	data.frameId,
							
							thumbnail: 	thumb ? thumb : null,
							
							ext: 		ff.ext,
							title: 		ft,
							format: 	"",
							quality: 	q,
							
							downloadName: 	ft,
							displayName: 	ft,
							displayLabel: 	fl,
							filename: 		ff.name,
							
							size: 		null,
							type: 		"video",
							metod: 		"download",
							source: 	"VKontakte",
							group: 		groupMedia,
							order:      q
						};			

					parsedMediaList.push( m );	
					mediaFound = true;
	
				}    
			}
		
		}

		// --------------------------------------------------------------------------------
		function detect_audio_VKontakte( data, callback ){

			var parsedMediaList = [];
			var	mediaFound = false;

			var formData = data.requestBody.formData;
			
			fvdDownloader.Utils.postAJAX( data.url, formData, function(content){

 				var m = content.match( /<!json>(.+?)<!>/i ); 
				if (m) {
					var x = JSON.parse( m[1] );	

					console.log(x);

					for (var i=0; i<x.length; i++) {
						_create(x[i])
					}	
					
				}


				if (mediaFound) {
					data.foundMedia = "VKontakte";	
					callback(parsedMediaList, true)					
				}
				else {
					callback(null, true)					
				}	


			});				
			
			// -----------------
			function _create(x) {

				var url = x[2];
				
				var ff = fvdDownloader.Utils.extractPath( url );
				if (ff) {

		            var fl = [];
		            fl.push({tag: 'span', content: '[' });
		            fl.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(ff.ext) });
		            fl.push({tag: 'span', content: '] ' });

		            var videoId = x[1] + '_' + x[0];
					var	title =	x[4]+' '+x[3];
					
					var m = {
							url: 		url,
							tabId: 		data.tabId,
							tabUrl: 	data.tabUrl,
							frameId: 	data.frameId,
							videoId:    videoId,
							
							thumbnail: 	'/images/thumbnail/audio.png',
							
							ext: 		ff.ext,
							title: 		title,
							format: 	"",
							quality: 	"",
							
							downloadName: 	title,
							displayName: 	title,
							displayLabel: 	fl,
							filename: 		ff.name,
							
							size: 		null,
							type: 		"video",
							metod: 		"download",
							source: 	"VKontakte",
							group: 		null,
							order:      null
						};	

					parsedMediaList.push( m );	
					mediaFound = true;
	
				} 
			}
		
		}
		
		// --------------------------------------------------------------------------------
		function postAJAX( url, data, callback ){
			
			var ajax = new XMLHttpRequest();
			ajax.open('POST', url, true);
			ajax.setRequestHeader('Cache-Control', 'no-cache');
			ajax.setRequestHeader('X-FVD-Extra', 'yes');
			ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			
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

		// ====================================================================	
		this.getMedia = function( media ){

			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "VKontakte" )   stream_media.push( item );
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
	
	this.VKontakte = new VKontakte();
	
}).apply( fvdDownloader.Media );

