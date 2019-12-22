(function(){
	
	var Vimeo = function(){		
	
		const DEBUG = false;
		const TITLE_MAX_LENGTH  = 96;
	
		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			var url = data.url.toLowerCase();

	        if ( /player\.vimeo\.com\/video\/(.*)\/config/i.test(data.url) )   {
				detectVimeoVideo( data, callback )
				return;
			}  

			callback(null);
		}
		
		// --------------------------------------------------------------------------------
		function detectVimeoVideo( data, callback ){

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

                    videoId = fvdDownloader.Utils.getJSON( info, 'video/id' );
                    title = fvdDownloader.Utils.getJSON( info, 'video/title' );
                    thumb = fvdDownloader.Utils.getJSON( info, 'video/thumbs/640' );

                    data.videoId = videoId;

                    parsed( fvdDownloader.Utils.getJSON( info, 'request/files/progressive' ) );

                }    
			});	

			// -------------------
			function parsed( info ) {

				var parsedMedia = [];
				var mediaFound = false;

		        if ( typeof info == 'object' && info.length ) {

	            	groupMedia = fvdDownloader.Storage.nextGroupId();

	                for (var i=0; i<info.length; i++) {

	                    var u = info[i]['url'];

	                    if (u) {
	                    	var height = info[i]['height'];
	                    	var width = info[i]['width'];
	                        var hash = videoId+'_'+height;
	                        var fileName = data.fileName;
	                        var extension = "mp4";
							var ff = fvdDownloader.Utils.extractPath( u );
							if (ff) {
								extension = ff.ext;
								fileName = ff.name;
							}	

	                        var ft = [];
	                        ft.push({tag: 'span', content: '['+width+'x'+height+', ' });
	                        ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(extension) });
	                        ft.push({tag: 'span', content: '] ' });

							var displayName = data.tabTitle;
							var downloadName = displayName;

							parsedMedia.push( {
									url: 		u,
									tabId: 		data.tabId,
									tabUrl: 	data.tabUrl,
									frameId: 	data.frameId,
									
									hash: 		hash,
									thumbnail: 	thumb ? thumb : data.thumbnail,
									
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
									source: 		"Vimeo",
									quality:    	height,
									
									group: 			groupMedia,
									order: 			height,
								});    

	                        mediaFound = true;
	                    }
	                }
		            
		        }

		        if (mediaFound) {
		        	data.foundMedia = "Vimeo";	
		        	detectConfig(data, parsedMedia, true, callback);
		        }
			}
		}

		// ====================================================================	
		function detectConfig( data, media, flag, callback ){

		    var configUrl = 'https://player.vimeo.com/video/'+data.videoId+'/config?byline=0&collections=1&context=Vimeo%5CController%5CClipController.main&default_to_hd=1';
			if (DEBUG) console.log(configUrl);

			fvdDownloader.Utils.getAJAX( configUrl, null, function(content){

				if (content) {

                    try {
                        var info = JSON.parse(content);
                        if (DEBUG) console.log(info);
                    }                     
                    catch(ex) {
                        console.log(ex);
                        return;
                    }

					var inf1 = fvdDownloader.Utils.getJSON( info, 'request/files/dash/cdns' );
					var x = inf1['fastly_skyfire'] || inf1['fastly_skyfire_h2'];
					var urlMaster = x ? x['url'] : null;
					
					var inf2 = fvdDownloader.Utils.getJSON( info, 'request/files/hls/cdns' );
					x = inf2['fastly_skyfire'] || inf2['fastly_skyfire_h2'];
					var urlPlaylist = x ? x['url'] : null;

					if (DEBUG) {
						console.log(urlMaster);
						console.log(urlPlaylist);
					}	
					else {
						//urlPlaylist = null;
						//urlMaster = null;
					}	

					async.series([
						function(next) {
							if (urlPlaylist) {
								var data_new = {};
								for (var k in data)  data_new[k] = data[k];
								data_new['url']	= urlPlaylist;
								fvdDownloader.Media.ExtM3U.detectMedia( data_new, function(mm, ff){

									if (mm) {
										for (var ii=0; ii<mm.length; ii++) {
											mm[ii].url = data.url;
											media.push( mm[ii] );
										}
									}	
									next();
								});
							}
							else {
								next();
							}	
						},	
						function(next) {
							if (urlMaster) {
								var data_new = {};
								for (var k in data)  data_new[k] = data[k];
								data_new['url']	= urlMaster;
								fvdDownloader.Media.Master.detectMedia( data_new, function(mm, ff){

									if (mm) {
										for (var ii=0; ii<mm.length; ii++) {
											mm[ii].url = data.url;
											media.push( mm[ii] );
										}
									}	
									next();
								});
							}
							else {
								next();
							}	
						},	
						function(next) {
							callback(media, flag);
						}
					]);



                }    
			});	


			

		}	
		
		// ====================================================================	
		this.getMedia = function( media ){
			
			return media;
			//if (DEBUG)	return media;
			
			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			var vimeo_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "Vimeo" ) {
											var iii = find( item ); 
											if (iii == -1) vimeo_media.push( item );
										}	
										else if ( item.source == "ExtM3U" || item.source == "Master" )  stream_media.push( item );
										else if ( item.source == "Sniffer" )  sniffer_media.push( item );
										else  other_media.push( item );
									});

			if (vimeo_media.length > 0) {
				stream_media.length == 0;	
			}	
			else {
				vimeo_media = stream_media;
			}
			
			if (vimeo_media.length > 0) {
				other_media.forEach(function( item ){	 vimeo_media.push( item )  });
				return vimeo_media;
			}	
			else {
				other_media.forEach(function( item ){	 sniffer_media.push( item )  });
				return sniffer_media;
			}	
			
			function find( e ) {
				for (var ii=0; ii<vimeo_media.length; ii++) {
					if (vimeo_media[ii].quality == e.quality && vimeo_media[ii].group == e.group)  return ii;	
				}	
				return -1;
			}

		}

	};
	
	this.Vimeo = new Vimeo();
	
}).apply( fvdDownloader.Media );

