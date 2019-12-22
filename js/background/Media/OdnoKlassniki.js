(function(){
	
	var OdnoKlassniki = function(){		
	
        const DEBUG = false;
    
        const TITLE_MAX_LENGTH  = 96;

        // https://ok.ru/video/299695473983
        // https://ok.ru/videoembed/1244776172209
        // live:  https://ok.ru/live/73438

        // --------------------------------------------------------------------------------
        this.detectMedia = function( data, callback ){

            var url = data.url.toLowerCase();

            if(/\/stream.manifest\/sig\/(.+?)\/video\?/i.test(url)) {      // OK Live
                detectOKLive( data, callback );                                                        
                return 1;
            }        
            else if( /^https:\/\/ok\.ru\/video\/(.*)/.test(url) )  {
                detectOKVideo( data, callback );                                                        
                return 2;
            }
            else if( /^https:\/\/ok\.ru\/dk\?cmd=autoplaylayermovierblock/.test(url) || /^https:\/\/ok\.ru\/dk\?cmd=poplayervideo/.test(url) )  {
                detectOKVideo( data, callback );                                                        
                return 2;
            }
            else if( /^https:\/\/ok\.ru\/videoembed\/(.*)/.test(url) )  {
                detectOKVideo( data, callback );                                                        
                return 2;
            }
            else if(/\/stream.manifest\/sig\/(.+?)\/frag/i.test(url)) {        
                callback(null);
                return;
            }
            else if(/^https:\/\/(.+?)\.mycdn.me\/\?(.+?)\&bytes=([0-9]+)-([0-9]+)/i.test(url)) {        
                callback(null);
                return;
            }

            callback(null);
        }
        
        // --------------------------------------------------------------------------------
        function detectOKVideo( data, callback ){

            if (DEBUG) console.log( data );

            var url = data.url,
                tabUrl = data.tabUrl,
                tabTitle = data.tabTitle,
                videoId = null,
                thumb = null;

            var parsedMedia = [];
            var mediaFound = false;

            var opt = [];

            async.series([
                function(next) {            // info
                    fvdDownloader.Utils.getAJAX( url, null, function(content){
                        if (content) {
                            var m = content.match( /data-options="(.+?)"/gm ); 
                            if (m) {
                                for ( var ii=0; ii<m.length; ii++) {
                                    var mm = m[ii].match( /data-options="(.+?)"/i ); 

                                    if (mm) {
                                        var str = mm[1].replace(/&quot;/g,'"');
                                        try {
                                            var options = JSON.parse(str);
                                        }
                                        catch(ex) {
                                            console.error('parse_odnoklassniki (options)',ex);
                                            continue;
                                        }  
                                        if (DEBUG) console.log(options);
                                        opt.push(options);
                                    }    
                                }   
                            }       
                        }
                        next();
                    });
                },
                function(next) {
                    async.eachSeries(opt, function( options, apNext) {

                        var playerId = options["playerId"];
                        var flashvars = options["flashvars"];
                        var metadata = flashvars["metadata"];

                        if (metadata) { 
                        
                            try {
                                metadata = JSON.parse(metadata);
                                if (!metadata) {
                                    apNext();
                                    return;
                                }    
                            }
                            catch(ex) {
                                console.error('parse_odnoklassniki (metadata)',ex);
                                apNext();
                                return;
                            }   
                        
                            var movie = metadata['movie'];
                            var videoId = movie["id"];
                            var title = movie['title'] || data.tabTitle;
                            var thumbnail = movie['poster'];
                            var duration = movie['duration'];

                            var urlPlaylist = metadata['hlsManifestUrl'];

                            var data_new = {};
                            for (var k in data)  data_new[k] = data[k];
                            data_new['url'] = urlPlaylist;
                       
                            fvdDownloader.Media.ExtM3U.detectMedia( data_new, function(mm, ff){

                                if (mm) {
                                    for (var ii=0; ii<mm.length; ii++) {
                                        mm[ii].url = data.url;

                                        mm[ii].source = "OdnoKlassniki";
                                        mm[ii].thumbnail = thumbnail;

                                        parsedMedia.push( mm[ii] );
                                        mediaFound = true;
                                    }
                                }   
                                apNext();
                            });

                        }

                    }, function() {
                        next();                        
                    });

                },
                function(next) {
                    if (mediaFound) {
                        data.foundMedia = "OdnoKlassniki"; 
                        callback(parsedMedia, true);
                    }   
                    else {
                        callback(null);
                    }
                }
            ]);











/*            fvdDownloader.Utils.getAJAX( url, null, function(content){

                if (content) {
                    
                    var m = content.match( /data-options="(.+?)"/gm ); 
                    if (m) {
                        for ( var ii=0; ii<m.length; ii++) {

                            var mm = m[ii].match( /data-options="(.+?)"/i ); 
                            if ( !mm ) continue;

                            
                                if (hls) {
                                    var data_new = {};
                                    for (var k in data)  data_new[k] = data[k];
                                    data_new['url'] = urlMaster;
                                    fvdDownloader.Media.Master.detectMedia( data_new, function(mm, ff){

                                        console.log(mm, ff);

                                        if (mm) {
                                            for (var ii=0; ii<mm.length; ii++) {
                                                mm[ii].url = data.url;
                                                media.push( mm[ii] );
                                            }
                                        }   
                                        next();
                                    });



                                }

                                /*var videos = metadata['videos'];
                                
                                var ext = "mp4";
                                var groupMedia = fvdDownloader.Storage.nextGroupId();
                                
                                for (var i=0; i<videos.length; i++) {
                                    var url = decodeURIComponent(videos[i].url);
                                    var label = videos[i].name;

                                    var hash = label+'_'+videoId;
                                    
                                    add_media( {  hash: hash,
                                                  url: url,
                                                  label: label,
                                                  ext: ext,
                                                  thumbnail: thumbnail,
                                                  title: title,
                                                  group: groupMedia,    
                                               })

                                }*/
/*                            }
                        }

                    }
                }   
            });*/


            // --------------------------
            function add_media(pp) {

                var ft = [];
                ft.push({tag: 'span', content: '['+pp.label+', ' });
                ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(pp.ext) });
                ft.push({tag: 'span', content: '] ' });

                var q = pp.label;
                if (pp.label == 'mobile')       q = 144;  // 256x144
                else if (pp.label == 'lowest')  q = 240;  // 426x240
                else if (pp.label == 'low')     q = 360;  // 640x360
                else if (pp.label == 'sd')      q = 480;  // 852x480
                else if (pp.label == 'hd')      q = 720;  // 1280x720
                else if (pp.label == 'full')    q = 1080; // 1920x1080

                parsedMedia.push( {
                        url:        pp.url,
                        tabId:      data.tabId,
                        tabUrl:     data.tabUrl,
                        frameId:    data.frameId,
                        
                        hash:       pp.hash,
                        thumbnail:  pp.thumbnail ? pp.thumbnail : null,
                        
                        ext:        pp.ext,
                        title:      pp.title,
                        format:     "",
                        
                        downloadName:   pp.title,
                        displayName:    pp.title,
                        displayLabel:   ft,
                        filename:       pp.hash,
                        
                        size:           0,
                        type:           "video",
                        metod:          "download",
                        source:         "OdnoKlassniki",
                        quality:        q,
                        
                        group:          pp.group,
                        order:          q,
                    });    

                mediaFound = true;
            }


        }

        // --------------------------------------------------------------------------------
        function detectOKLive( data, callback ){

            if (DEBUG) console.log( data );

            var url = data.url,
                videoId = null,
                streamId, 
                groupMedia;

            var parsedMedia = [];
            var mediaFound = false;

            var mm = url.match( /\/dash\/(.+?)\/stream.manifest\//im ); 
            if (mm) {
                streamId = mm[1];
                fvdDownloader.Utils.getAJAX( url, null, function(content){

                    if (content) {

                        groupMedia = fvdDownloader.Storage.nextGroupId();     

                        try {
                            var info = JSON.parse(content);

                            async.eachSeries(info, function( ii, apNext) {

                                add_live_video( ii, apNext );    

                                
                            }, function() {
                                
                                if (mediaFound) {
                                    data.foundMedia = "OdnoKlassniki"; 
                                    callback(parsedMedia, true);
                                }   
                                else {
                                    callback(null);
                                }
                                
                            });

                        }
                        catch(ex){
                            console.error(ex);
                        }
                    }
                }); 
            }

            function add_live_video( v, callback ) {

                if (DEBUG)  console.log(v);

                var hash = streamId + '_' + v.name;

                var x = fvdDownloader.Utils.parse_URL(url);
                var host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
                var search = x.search || "";

                var headerUrl = host + v.headerUrl;

				var indexUrl = host + v.idxUrl + search;

				var quality = { width: v.video.width, height: v.video.height };
				var title = data.tabTitle;
				var ext = 'mp4';

				var ft = [];
				ft.push({tag: 'span', content: '['+quality.width+'x'+quality.height+', ' });
				ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(ext) });
				ft.push({tag: 'span', content: '] ' });

				var tt = {  video: { url: indexUrl,
									 headerUrl: headerUrl,
									 frag: v.fragUrlTemplate,   
									 base_url: host   
								   },
							audio: null   };

				parsedMedia.push( {
						url:        url,
						tabId:      data.tabId,
						tabUrl:     data.tabUrl,
						frameId:    data.frameId,
						
						hash:       hash,
						
						ext:        ext,
						title:      title,
						format:     "",

						videoId:        streamId,
						
						downloadName:   title,
						displayName:    title,
						displayLabel:   ft,
						filename:       hash,
						
						size:           0,
						type:           "video",
						metod:          "record",
						source:         "OdnoKlassniki",
						quality:        quality.height,
						
						group:          groupMedia,
						order:          quality.height,

						template:       tt,
					});    

				mediaFound = true;

				callback();


            }    


        }

        // ==================================================================== 
        this.getMedia = function( media ){
            
            return media;
        }

	};
	
	this.OdnoKlassniki = new OdnoKlassniki();
	
}).apply( fvdDownloader.Media );

