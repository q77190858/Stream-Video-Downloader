(function(){
	
	var BreakCom = function(){		
	
        const DEBUG = false;
    
        const TITLE_MAX_LENGTH  = 96;

//Seg       http://www.break.com/video/chubby-korean-baby-dance-2614601         
//          http://www.break.com/video/high-school-football-player-hurdles-defender-181429  

        // --------------------------------------------------------------------------------
        this.detectMedia = function( data, callback ){

            var url = data.url.toLowerCase();

            if ( /break.com\/video\/([^.]*)/i.test(url) )       {
                detectBreakComVideo( data, callback )
                return;
            }
            else if ( /^https?\:\/\/(.+?)\.break.com\/([^.]*)/i.test(url) )     {
                callback(null, true);
                return;
            }

            callback(null);
        }
        
        // --------------------------------------------------------------------------------
        function detectBreakComVideo( data, callback ){

            if (DEBUG) console.log( data );

            var url = data.url,
                tabUrl = data.tabUrl,
                tabTitle = data.tabTitle,
                videoId = null,
                thumb = null;

            var parsedMedia = [];
            var mediaFound = false;

            var k = url.lastIndexOf('-');
            if ( k != -1) {
                var id = url.substr(k+1);

                var uu = 'http://www.break.com/embed/'+id+'/';

                fvdDownloader.Utils.getAJAX( uu, null, function(content){
            
                    var AuthToken = content.match( /"AuthToken"\s*:\s*"(.+?)"/i );
                    var videoUri = content.match( /"videoUri"\s*:\s*"(.+?)"/i );

                    if (DEBUG) console.log(AuthToken, videoUri);

                    if ( AuthToken && videoUri ) {
                        
                        var uri = videoUri[1] + "?" + AuthToken[1];
                        var contentName = content.match( /"contentName"\s*:\s*"(.+?)"/i );
                        var title = contentName ? contentName[1] : media.title;
                    
                        var thumb = content.match( /"thumbUri"\s*:\s*"(.+?)"/i );
                        var thumbnail = thumb ? thumb[1] : null;
                    
                        var fileName = null, 
                            ext = "mp4";
                        var ff = fvdDownloader.Utils.extractPath( videoUri[1] );
                        if (ff) {
                            ext = ff.ext;
                            fileName = ff.name;
                        }   
                        else {
                            ext = fvdDownloader.Utils.extractExtension( videoUri[1] );
                            fileName = name;
                        }   

                        var ft = [];
                        ft.push({tag: 'span', content: '[' });
                        ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(ext) });
                        ft.push({tag: 'span', content: '] ' });

                        parsedMedia.push( {
                                url:        uri,
                                tabId:      data.tabId,
                                tabUrl:     data.tabUrl,
                                frameId:    data.frameId,
                                
                                thumbnail:  thumbnail,
                                
                                ext:        ext,
                                title:      title,
                                format:     "",
                                
                                downloadName:   title,
                                displayName:    title,
                                displayLabel:   ft,
                                filename:       fileName ? fileName : title,
                                
                                size:           0,
                                type:           "video",
                                metod:          "download",
                                source:         "BreakCom",
                                quality:        0,
                                
                                group:          0,
                                order:          0,
                            });    

                        mediaFound = true;

                    } 

                    if (mediaFound) {
                        data.foundMedia = "BreakCom";  
                        callback(parsedMedia, true);
                    }
                });
            }
        }


        // ==================================================================== 
        this.getMedia = function( media ){
            
            return media;
        }
				
	};
	
	this.BreakCom = new BreakCom();
	
}).apply( fvdDownloader.Media );
