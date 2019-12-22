(function(){
    
    var Twitter = function(){     

        const DEBUG = false;
    
        const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
        const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)", "i");

        //var tw_video_thumb = [];


        // --------------------------------------------------------------------------------
        this.detectMedia = function( data, callback ){

            var url = data.url.toLowerCase();

            if( /^https?:\/\/api\.twitter\.com\/1\.1\/videos\/tweet\/config\/(.*?)\.json/.test(url) )  {
                if (data.method ==  "GET") {
                    detectTwitterVideo( data, callback )
                }
                else {
                    callback(null);
                }    
                return;
            }   
            else if( /https?:\/\/video\.twimg\.com\/(.*)/.test(url) )  {
                callback(null, true);
                return;
            } 

            callback(null);
        }

        // --------------------------------------------------------------------------------
        function detectTwitterVideo( data, callback ){
        
            if (DEBUG) console.log( data );

            var url = data.url,
                hh = hex_md5(url),
                thumb = null,
                videoId = null,
                cont_type = null,
                cont_url = null,
                title = data.tabTitle;

            var parsedMedia = [];
            var mediaFound = false;

            var groupMedia;


			async.series([
				function(next) {

                    getAJAX( url, data.headers, function(info){

                        if (info) {

                            thumb = info.posterImage;
                            videoId = info.track.contentId;
        
                            cont_type = info.track.playbackType; 
                            cont_url = info.track.playbackUrl;

                            next();
                        }
                        else {
                            callback(null);
                        }    
                    });
            
                },    
				function(next) {

                    if ( cont_type == 'video/mp4' ) {

                        var n = cont_url.match(/\/([0-9]+)x([0-9]+)\//i);
                        var quality = n ? { width: parseInt(n[1]), height: parseInt(n[2]) } : null;
            
                        var m = _buildMedia({  url:         cont_url,
                                               title:       title,
                                               thumbnail:   thumb,
                                               videoId:     videoId,
                                               metod:       'download',
                                               ext:         'mp4',
                                               quality:     quality,
                                               group:       fvdDownloader.Storage.nextGroupId()

                                            }, data);

                        parsedMedia.push(m);                    
                        data.foundMedia = "Twitter"; 
                        callback(parsedMedia, true);
                        
                    }
                    else {
                        next();
                    }    

                },    
				function(next) {

                    if ( cont_type == 'application/x-mpegURL' ) {

                        fvdDownloader.Utils.getAJAX( cont_url, null, function(content){
                    
                            var domain = null, k, tt, host = "", prot = "";
                            var x = fvdDownloader.Utils.parse_URL(cont_url);
                            host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
                            domain = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '');
                            search = x.search || "";

                            var lines = content.split('\n');
                            if (DEBUG) console.log(lines);

                            if ( lines.length<2 ) return;
                            if ( lines[0].replace(/\r/, '') != '#EXTM3U' ) return;
            
                            var flag = 0;
                            var file_name = null, ext = null;
                            var groupMedia = fvdDownloader.Storage.nextGroupId(); 
            
                            for (var i=0; i<lines.length; i++) {
            
                                var line = lines[i].trim().replace(/\r/g,'');
                                if (line.indexOf('#') == 0)  continue;
                                if (!line)  continue;

                                if (!flag) {
                                    var k = line.indexOf('.m3u8');
                                    if ( k != -1 )  flag = 1;           // playlist
                                    else            flag = 2;           // fragment
                                }
                                
                                if (flag == 1)  {
            
                                    var w = NAME_PATTERN.exec(line);
                                    if (w)  file_name = w[1];
                                    var l = EXT_PATTERN.exec(line);
                                    if (l) ext = l[1];
            
                                    if (line.indexOf('http') != 0) {
                                        if (line.indexOf('/') == 0)  line = domain + line;
                                        else    line = host + line;
                                    }   
                                    if (line.indexOf('?') == -1 && search) {
                                        line = line + search;
                                    } 

                                    var n = line.match(/\/([0-9]+)x([0-9]+)\//i);
                                    var quality = n ? { width: parseInt(n[1]), height: parseInt(n[2]) } : null;
                                    
                                    var hash = videoId + '_' + (quality ? quality.height : file_name);
                                    var ext = 'mp4';

                                    var playlist = {  video: { url:  line,  ext:  ext, hash: hash   } };

                                    var m = _buildMedia({  url:         cont_url,
                                                           title:       title,
                                                           thumbnail:   thumb,
                                                           videoId:     videoId,
                                                           metod:       'playlist',
                                                           playlist:    playlist,
                                                           ext:         ext,
                                                           hash:        hash,
                                                           quality:     quality,
                                                           file_name:   file_name,
                                                           group:       groupMedia

                                                        }, data);

                                    parsedMedia.push(m);                    
                                    mediaFound = true;  
            
                                    //_add(line, file_name);    
                                }
                                else if (flag == 2)  {
                                    var w = NAME_PATTERN.exec(url);
                                    if (w)  file_name = w[1];
                                    var l = EXT_PATTERN.exec(url);
                                    if (l) ext = l[1];
                                    break;
                                }
            
                            } 

        
                            if (mediaFound) {
                                data.foundMedia = "Twitter"; 
                                callback(parsedMedia, true);
                            }   
                            else {
                                callback(null);
                            }
        
                        
                        });
                    }
                        
            
                }
            ]);        
        }   
        
        // ---------------------
        function _buildMedia( info, data ){

            if (DEBUG) console.log('_buildMedia', info, data);
            
            var ft = [];
            var ff = '[';
            var q = null;
            if (info.quality) {
                if (info.quality.height) {
                    ff += info.quality.width+'x'+info.quality.height;
                    q = info.quality.height;
                }
                else {
                    ff += info.quality;
                    q = info.quality;
                }
                ff += ', ';
            }

            ft.push({tag: 'span', content: ff });
            ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(info.ext) });
            ft.push({tag: 'span', content: '] ' });

            var media = {
                    url:            info.url,
                    tabId:          data.tabId,
                    tabUrl:         data.tabUrl,
                    frameId:        data.frameId,

                    videoId:        info.videoId,
                    hash:           info.hash ? info.hash : info.videoId,
                    
                    thumbnail:      info.thumbnail,
                    
                    ext:            info.ext,
                    title:          info.title,
                    format:         "",
                    
                    downloadName:   info.title,
                    displayName:    info.title,
                    displayLabel:   ft,
                    filename:       info.file_name ? info.file_name : info.videoId,

                    
                    size:           0,
                    type:           "video",
                    metod:          info.metod,
                    source:         "Twitter",
                    quality:        q,
                    
                    group:          info.group,
                    order:          q,
                };    

            if (info.playlist)    media.playlist = info.playlist;

            return media;
        }

        // --------------------------------------------------------------------------------
        function getAJAX( url, headers, callback ){
            
            var ajax = new XMLHttpRequest();
            ajax.open('GET', url, true);
            ajax.setRequestHeader('Cache-Control', 'no-cache');
            ajax.setRequestHeader('X-FVD-Extra', 'yes');
            
            if (headers) {
                for (var key in headers) {
                    ajax.setRequestHeader(key, headers[key]);
                }
            }	
            
            ajax.onload = function(){
                        var content = this.responseText;
                        if (content) {
                            try {
                                var info = JSON.parse(content);
                                if (DEBUG) console.log(info);
                                if (info.errors) {
                                    callback(null);
                                }
                                else {
                                    callback(info);
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
                        
            }
            
            ajax.onerror = function(){
                callback( null );
            }
            
            ajax.send( null );
        
        }
        
        
        // --------------------------------------------------------------------------------
/*        function detectTwitterVideo111( data, callback ){

            if (DEBUG) console.log( data );

            var url = data.url,
                hh = hex_md5(url);

            var parsedMedia = [];
            var mediaFound = false;


            var domain = null, k, tt, host = "", prot = "";
            var x = fvdDownloader.Utils.parse_URL(url);
            
            host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
            domain = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '');
            search = x.search || "";
            var groupMedia;
            
            fvdDownloader.Utils.getAJAX( url, null, function(content){
                
                    _parse(content);

                    if (mediaFound) {
                        data.foundMedia = "Twitter"; 
                        callback(parsedMedia, true);
                    }   
                    else {
                        callback(null);
                    }

                
            });

            // ---------------------
            function _parse( content ){
                
                var lines = content.split('\n');

                if ( lines.length<2 ) return;
                if ( lines[0].replace(/\r/, '') != '#EXTM3U' ) return;

                var flag = 0;
                var file_name = null, ext = null;
                groupMedia = fvdDownloader.Storage.nextGroupId(); 

                for (var i=0; i<lines.length; i++) {

                    var line = lines[i].trim().replace(/\r/g,'');
                    if (line.indexOf('#') == 0)  continue;
                    
                    if (!flag) {
                        var k = line.indexOf('.m3u8');
                        if ( k != -1 )  flag = 1;           // playlist
                        else            flag = 2;           // fragment
                    }
                    
                    if (flag == 1)  {

                        var w = NAME_PATTERN.exec(line);
                        if (w)  file_name = w[1];
                        var l = EXT_PATTERN.exec(line);
                        if (l) ext = l[1];

                        if (line.indexOf('http') != 0) {
                            if (line.indexOf('/') == 0)  line = domain + line;
                            else    line = host + line;
                        }   
                        if (line.indexOf('?') == -1 && search) {
                            line = line + search;
                        }    

                        _add(line, file_name);    
                    }
                    else if (flag == 2)  {
                        var w = NAME_PATTERN.exec(url);
                        if (w)  file_name = w[1];
                        var l = EXT_PATTERN.exec(url);
                        if (l) ext = l[1];
                        break;
                    }

                } 

            }   

            // ---------------------
            function _add( url, file_name ){

                if (DEBUG) console.log('addMedia', url, file_name);
                
                var n = url.match(/\/([0-9]+)\//i);
                var videoId = n ? n[1] : file_name;
                n = url.match(/\/([0-9]+)x([0-9]+)\//i);
                var quality = n ? { width: parseInt(n[1]), height: parseInt(n[2]) } : null;
                var hash = videoId + '_' + (quality ? quality.height : file_name);
                var ext = 'mp4';
                
                if (!quality) return;

                var thumbnail = tw_video_thumb[videoId] ? tw_video_thumb[videoId] : data.thumbnail;

                var ft = [];
                ft.push({tag: 'span', content: '['+(quality ? quality.width+'x'+quality.height : '')+', ' });
                ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(ext) });
                ft.push({tag: 'span', content: '] ' });

                var title = data.tabTitle ? data.tabTitle : file_name;

                var q = quality ? quality.height : null;

                var pp = {  video: { url:  url, 
                                     ext:  ext,
                                     hash: hash   },
                         };

                parsedMedia.push( {
                        url:        url,
                        tabId:      data.tabId,
                        tabUrl:     data.tabUrl,
                        frameId:    data.frameId,
                        
                        hash:           hash,
                        thumbnail:      thumbnail,
                        
                        ext:            ext,
                        title:          title,
                        format:         "",
                        
                        downloadName:   title,
                        displayName:    title,
                        displayLabel:   ft,
                        filename:       file_name,

                        playlist:      {  video: { url:  url,  ext:  ext, hash: hash   },    },
                        
                        size:           0,
                        type:           "video",
                        metod:          "playlist",
                        source:         "Twitter",
                        quality:        q,
                        
                        group:          groupMedia,
                        order:          q,
                    });    

                mediaFound = true;
        
            }   


        }*/


        // ==================================================================== 
        this.getMedia = function( media ){
            
            return media;
        }

    };
    
    this.Twitter = new Twitter();
    
}).apply( fvdDownloader.Media );
