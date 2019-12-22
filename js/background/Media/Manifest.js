(function(){
	
	var Manifest = function(){		
		
		const DEBUG = false;
	
		const TITLE_MAX_LENGTH  = 96;
		
		const IGNORE_URL_SIGNS = [	];

		const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
		const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)", "i");

		var lastStreamId = 0;	

		const MANIFEST_URL_GET_PAGE = [	
				new RegExp("brightlightfineart\\.com", "i"),
			];


		// http://ici.radio-canada.ca/tele/le-telejournal-ottawa-gatineau/2016-2017/segments/reportage/11749/stationnement-ottawa-application-voiture

		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			var url = data.url.toLowerCase();

			if( /^https?:\/\/[^\?]*\.f4m/.test(url) )  {			
				detectVideo( data, callback );
				return;            
			} 
			else if(data.contentType && data.contentType.toLowerCase().indexOf("video/f4m") != -1) {
				detectVideo( data, callback );
				return;
			}       
			else if( /^https?:\/\/(.*)seg(\d+)-frag(\d+)/.test(url) ) {
				callback( null, true );
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

			data.flag_get_page = false;
			MANIFEST_URL_GET_PAGE.forEach(function( sign ){
				if ( sign.test(data.tabUrl) )		{
					data.flag_get_page = true;
					return false;
				}
			});

			fvdDownloader.Media.GetRequest( { tabId:   data.tabId,
											  page:    data.flag_get_page,
											  url:     data.url, 
											  headers: data.headers 
										    }, 
									    function(resp){
												if (!resp.error) {
													var xml = fvdDownloader.Utils.parseXml( resp.content );
													if (xml) {
														data.xml = xml;
														ParseManifest(data, callback);
													}
													else {
														callback(null);	
													}
												}	
												else {
													callback(null);
												}	
									});			


			/*fvdDownloader.Utils.getAJAX( data.url, null, function(content){

				var xml = fvdDownloader.Utils.parseXml( content );
				if (xml) {
					data.xml = xml;
					ParseManifest(data, callback);
				}
				else {
					callback(null);	
				}

			});*/

		}	

		// --------------------------------------------------------------------------------
		function ParseManifest( data, callback ){

			if (DEBUG) console.log( data );

			var url = data.url;
			var hh = hex_md5(url);
			var videoId = null;
			var videoTitle = data.tabTitle;
			var groupMedia = fvdDownloader.Storage.nextGroupId();
			var xml = data.xml;
			
			var domain = null, k, tt, host = null, prot = "", search = null;
			var x = fvdDownloader.Utils.parse_URL(url);
			host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
			domain = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '');
			search = x.search || "";
			
			if (DEBUG) console.log(xml, domain, host);	

			var duration = "",
				t = '',
				e = '',
				streamType = '',
				baseURL = null,
				bootstrapInfo = {};

			var parsedMedia = [];
			var foundMedia = false;

			try {
				// тип записи
				t = xml.getElementsByTagName('streamType');;
				e = t.item(0); 
				if (e) streamType = e.textContent || e.streamType.textContent;
		
				// базовый адрес
				t = xml.getElementsByTagName('baseURL');  
				e = t.item(0); 
				if (e) baseURL = e.textContent || e.baseURL.textContent;
				else   baseURL = host;

				// продолжительность
				t = xml.getElementsByTagName('duration');  
				e = t.item(0); 
				if (e) duration = e.textContent || e.duration.textContent;

				// bootstrapInfo
				t = xml.getElementsByTagName('bootstrapInfo');
				for (var i=0; i<t.length; i++) {    
					e = t.item(i);
					if (e) {
						var id = e.getAttribute('id');
						var url = e.getAttribute('url');
						var text = e.textContent;
						bootstrapInfo[id] = {id: id, text: text, url: url};
					}    
				}   
			}
			catch(ex) {
				return;
			}	
			
			if (streamType == 'recorded') {
				ParseRecorder();
			}
			else if (streamType == 'live') {			
				ParseLive();
			}

			if (foundMedia) {
				data.foundMedia = "Manifest";	
				callback(parsedMedia, true);
			}
			else {
				callback(null);
			}	


			// -----------------------------------------------------------
			function ParseRecorder()  {

				var mediaXML = [];
				
				t = xml.getElementsByTagName('media');
				for (var i=0; i<t.length; i++) {
					var bootId = t[i].getAttribute('bootstrapInfoId');
					var width = t[i].getAttribute('width');
					var height = t[i].getAttribute('height');
					var streamId = t[i].getAttribute('streamId');
					var bitrate = t[i].getAttribute('bitrate');
					var uri = t[i].getAttribute('url');
					if ( ! /^https?/.test(uri) ) {            
						uri = baseURL + uri;            
					} 

					var tt = t[i].getElementsByTagName('metadata');
					if (tt && tt.item(0)) {
						var text = tt.item(0).textContent.trim();

						var bootstrap = bootstrapInfo[bootId].text;
						if (bootstrap) bootstrap = fvdDownloader.jspack.stringToBytes(window.atob(bootstrap));

						mediaXML.push({		streamId: streamId,
											bootId: bootId,
											width:	width,
											height:	height,
											bitrate: bitrate,
											uri: uri,			
											metadata: window.atob(text),
											bootstrap: bootstrap,
											duration: duration,
											streamType: streamType,
											group: groupMedia
									});
					}				
				}	
				
				console.log(mediaXML);				
				if (mediaXML.length == 0) return;

				for (var i=0; i<mediaXML.length; i++) {
					addMediaRecorder(mediaXML[i]);			
				}	
			}	

			// -----------------------------------------------------------
			function addMediaRecorder(mXML)  {
				
				console.log(mXML.bootId);

				var paramsBootstrap = {};

				// omMetaData
				var onMetaData = fvdDownloader.jspack.stringToBytes(mXML.metadata);  

				var x = fvdDownloader.Bootstrap.decodeAMF(onMetaData);  
			
				if (x && x.length>1) {
					mXML.amf = x[1];
					if (mXML.amf['width'])  mXML.width = mXML.amf['width']; 
					if (mXML.amf['height'])  mXML.height = mXML.amf['height']; 
					if (mXML.amf['filesize'])  mXML.size = mXML.amf['filesize']; 
				}

				var label = "" + (mXML.width ? mXML.width : "") + ((mXML.width && mXML.height) ? 'x' : '') + (mXML.height ? mXML.height : "");
				var height =  mXML.height || mXML.width || "";
				if (!label) label = mXML.bitrate ? mXML.bitrate : ""; 
				if (!label) {
					var m = url.match(/([0-9]*)x([0-9]*)/g);
					if(m)   label = m[m.length-1];   
				}   
				if (!label)     label = streamId;
				
				paramsBootstrap.uri = mXML.uri;
				
				var list = fvdDownloader.Bootstrap.listSegment(mXML.bootstrap, paramsBootstrap);
				
				var initSeg = fvdDownloader.Bootstrap.WriteMetadata(fvdDownloader.jspack.stringToBytes(mXML.metadata));
				
				var ext = 'flv';
				if (mXML.streamId) {
					var k = mXML.streamId.lastIndexOf('.');
					if ( k != -1 )  {
						var ee = mXML.streamId.substring(k+1, mXML.streamId.length);
						if (['mp4','flv','webm'].indexOf(ee) != -1)  ext = ee;
					}
				}
				else {    
					lastStreamId++;
					mXML.streamId = "stream"+lastStreamId;
				}        

                var ft = [];
                ft.push({tag: 'span', content: '['+(label ? label : '')+', ' });
                ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst( ext ) });
                ft.push({tag: 'span', content: '] ' });

                var hash = mXML.streamId+'_'+(label ? label : '');

				var segm = { video: {	initSeg:		 initSeg,
										segments:		 list,
										paramsBootstrap: paramsBootstrap
									},
							 audio: null };
										
/*                var mnfst = {  video: {  list:  list,
                						 ext:   ext,
                						 initSeg: initSeg, 
                						 paramsBootstrap: paramsBootstrap	
                					  },
                			   audio: null  	};*/

				var mm = {	url: 		url,
							tabId: 		data.tabId,
							tabUrl: 	data.tabUrl,
							frameId: 	data.frameId,
							hash: 		hash,
							videoId:    mXML.streamId,
							ext: 		ext,
							title: 		videoTitle,
							format: 	"",
						
							downloadName: 	videoTitle,
							displayName: 	videoTitle,
							displayLabel: 	ft,
							filename: 		hash,
						
							//manifest:       mnfst,
							segments:       segm,
						
							size: 		0,
							type: 		"video",
							metod: 		'segments',
							source: 	"Manifest",
							quality:    height,
						
							group: 		mXML.group,
							order: 		height,
						
						};

				parsedMedia.push( mm );
				foundMedia = true;

			}	


			// -----------------------------------------------------------
			function ParseLive()  {

				var mediaXML = [];

				t = xml.getElementsByTagName('media');
				for (var i=0; i<t.length; i++) {
					var bootId = t[i].getAttribute('bootstrapInfoId');
					var width = t[i].getAttribute('width');
					var height = t[i].getAttribute('height');
					var streamId = t[i].getAttribute('streamId');
					var bitrate = t[i].getAttribute('bitrate');
					var uri = t[i].getAttribute('url');
					if ( ! /^https?/.test(uri) ) {            
						uri = baseURL + uri;            
					} 
					
					var u = bootstrapInfo[bootId].url;
					if (u.indexOf('http') != 0) {
						if (u.indexOf('/') == 0)  u = domain + u;
						else    u = host + u;
					}
					if (u.indexOf('?') == -1 && u.indexOf('#') == -1 && search) {
						u = u + search;
					}    

					var tt = t[i].getElementsByTagName('metadata');
					if (tt && tt.item(0)) {
						var text = tt.item(0).textContent.trim();

						mediaXML.push({		streamId: streamId,
											bootId: bootId,
											width:	width,
											height:	height,
											bitrate: bitrate,
											uri: uri,			
											metadata: window.atob(text),
											bootstrapUrl: u,
											duration: duration,
											streamType: streamType,
											group: groupMedia
									});
					}				
				}	
				
				console.log(mediaXML);				
				if (mediaXML.length == 0) return;

				for (var i=0; i<mediaXML.length; i++) {
					addMediaLive(mediaXML[i]);			
				}	

			}	

			// -----------------------------------------------------------
			function addMediaLive(mXML)  {
				
				// omMetaData
				var onMetaData = fvdDownloader.jspack.stringToBytes(mXML.metadata);  

				var x = fvdDownloader.Bootstrap.decodeAMF(onMetaData);  
			
				if (x && x.length>1) {
					mXML.amf = x[1];
					if (mXML.amf['width'])  mXML.width = mXML.amf['width']; 
					if (mXML.amf['height'])  mXML.height = mXML.amf['height']; 
					if (mXML.amf['filesize'])  mXML.size = mXML.amf['filesize']; 
				}

				var label = "" + (mXML.width ? mXML.width : "") + ((mXML.width && mXML.height) ? 'x' : '') + (mXML.height ? mXML.height : "");
				var height =  mXML.height || mXML.width || "";
				if (!label) label = mXML.bitrate ? mXML.bitrate : ""; 
				if (!label) {
					var m = url.match(/([0-9]*)x([0-9]*)/g);
					if(m)   label = m[m.length-1];   
				}   
				if (!label)     label = streamId;
				
				var initSeg = fvdDownloader.Bootstrap.WriteMetadata(fvdDownloader.jspack.stringToBytes(mXML.metadata));
				
				var ext = 'flv';
				if (mXML.streamId) {
					var k = mXML.streamId.lastIndexOf('.');
					if ( k != -1 )  {
						var ee = mXML.streamId.substring(k+1, mXML.streamId.length);
						if (['mp4','flv','webm'].indexOf(ee) != -1)  ext = ee;
					}
				}
				else {    
					lastStreamId++;
					mXML.streamId = "stream"+lastStreamId;
				}            

				console.log( {	
							hash: mXML.streamId+'_'+(label ? label : ''), 
							baseUrl:  mXML.uri, 
							url: mXML.bootstrapUrl, 
							quality: label, 
							videoTitle: videoTitle, 
							ext: ext, 
							metadata: initSeg,
							group: mXML.group,
							data: data,
						} );


                var ft = [];
                ft.push({tag: 'span', content: '['+(label ? label : '')+', ' });
                ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst( ext ) });
                ft.push({tag: 'span', content: '] ' });

                var hash = mXML.streamId+'_'+(label ? label : '');

				var segm = { video: {	initSeg:		 initSeg,
										segments:		 list,
										paramsBootstrap: paramsBootstrap
									},
							 audio: null };
										
                var mnfst = {  video: {  url:  mXML.bootstrapUrl,
                						 ext:   ext,
                						 metadata: initSeg, 
                						 baseUrl:  mXML.uri,
                					  },
                			   audio: null  	};

				var mm = {	url: 		url,
							tabId: 		data.tabId,
							tabUrl: 	data.tabUrl,
							frameId: 	data.frameId,
							hash: 		hash,
							videoId:    mXML.streamId,
							ext: 		ext,
							title: 		videoTitle,
							format: 	"",
						
							downloadName: 	videoTitle,
							displayName: 	videoTitle,
							displayLabel: 	ft,
							filename: 		hash,
						
							manifest:       mnfst,
						
							size: 		0,
							type: 		"video",
							metod: 		'record',
							source: 	"Manifest",
							quality:    height,
						
							group: 		mXML.group,
							order: 		height,
						
						};

				parsedMedia.push( mm );
				foundMedia = true;


				// -----------------------------			
			
			}	

		}

		// ====================================================================	
		this.getMedia = function( media ){
			
			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "Manifest" ) {
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
	
	this.Manifest = new Manifest();
	
}).apply( fvdDownloader.Media );
