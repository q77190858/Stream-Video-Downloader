(function(){
	
	var Combine = function(){		
	
		const DEBUG = true;
	
		const TITLE_MAX_LENGTH  = 96;
		
		const IGNORE_URL_SIGNS = [	];
		
		const COMBINE_EXTENSIONS = ["asf"];

		const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
		const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)", "i");
		
		var detectUrls = {};
		var expectUrls = {};
		
		var lastCombineId = 0;

		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			if( COMBINE_EXTENSIONS.indexOf(data.ext) != -1 )  {
				detectCombine( data, callback );
				return;            
			}    

			callback(null);
		}
		
		// --------------------------------------------------------------------------------
		function detectCombine( data, callback ){
			
			//if (DEBUG) console.log( data );

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
			
			var tabId = data.tabId;
			var url = data.url;
			var fl = true;
			
			if ( detectUrls[tabId] ) {
				var elems =  parse( url );
				var y = compare( detectUrls[tabId].elems, elems );
				if (y) {
					detectUrls[tabId].urls.push(url);	
				}	

				fl = false;
			}
			else if ( expectUrls[tabId] ) {
				var elems =  parse( url );
				var ff = check_expect_overlap( tabId, elems );

				if (ff != -1) {
					expectUrls[tabId][ff].overlap++;
					expectUrls[tabId][ff].urls.push(url);
					if (expectUrls[tabId][ff].overlap>5) {
						lastCombineId++;
						
						detectUrls[tabId] = {   id: lastCombineId,
												elems: expectUrls[tabId][ff].elems,
												urls: expectUrls[tabId][ff].urls,
											}	
											
						var m = add({	tabId: tabId,
										tabUrl: data.tabUrl,
										frameId: data.frameId,
										title: data.tabTitle,
										ext: "mp4",
										urls: expectUrls[tabId][ff].urls
									});	

						data.foundMedia = "Combine";									
						callback(m);
						return;	
					}	
					fl = false;
				}	
				else {
					if (expectUrls[tabId].length>3)  return;
					fl = true;
				}	
			}
			
			if (fl) {
				var elems =  parse( url );
				expectUrls[tabId] = [{ detect: false, overlap: 0, elems:  elems, urls: [url]  }];
			}	
			
		}	
		
		// --------------------------------------------------------------------------------
		function check_detect_overlap( tabId, elems ){

			var y = compare( detectUrls[tabId].elems, elems );
			if (y) return ;
		
			return -1;
		}	

		// --------------------------------------------------------------------------------
		function check_expect_overlap( tabId, elems ){

			for (var i=0; i<expectUrls[tabId].length; i++) {
				var x = expectUrls[tabId][i];
				var y = compare( x.elems, elems );
				if (y) return i;
			}	
		
			return -1;
		}	

		function compare( elems1, elems2 ){

			var xx = 0;
			var yy = 0;
			var kk = elems1.length;
			//var distance = fvdDownloader.Utils.DamerauLevenshtein();
			
			for (var ii=0; ii<kk; ii++) {
		
				if ( elems1[ii] === elems2[ii] ) {
					xx++;
				}	
				else {
					yy++;
					if (2*yy > kk) return false;
					//var d = distance(elems1[ii], elems2[ii]);
					var d = fvdDownloader.Utils.Levenshtein(elems1[ii], elems2[ii]);
					var k = elems1[ii].length;
					if (2*d > k) return false;
					xx++;
				}	
			}

			if ( xx == kk ) return true;
			
			return false;
		}
		
		// --------------------------------------------------------------------------------
		function parse( url ){

			var url = url.split('//')[1];
			
			var elems = [], path, query;
			
			var k = url.indexOf('?');
			if ( k == -1 ) {
				path = url;
				query = "";	
			}
			else {
				path = url.substring(0, k); 
				query = url.substring(k+1, url.length); 
			}

			if (path) {
				var m = path.split('/');
				for (var i=0; i<m.length-1; i++) {
					elems.push( m[i] );	
				}	
				
				var file  = m[m.length-1];
				
				var k = file.indexOf('.');
				if ( k != -1 ) {
					elems.push( file.substring(0, k) );
					elems.push( file.substring(k+1, file.length) );
				}
				else {
					elems.push( file );
				}
			}	
			
			return elems;	
		}	
		
		function add(params) {
			
			console.log(params);
		
			var ft = [];
			ft.push({tag: 'span', content: '[Combine,' });
			ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst( params.ext ) });
			ft.push({tag: 'span', content: '] ' });

			var displayName = params.title;
			var downloadName = displayName;
			var fileName = params.filename;
				
			var mm = {	url: 		params.urls[0],
						tabId: 		params.tabId,
						tabUrl: 	params.tabUrl,
						frameId: 	params.frameId,
					
						hash: 		"combine_"+lastCombineId.toString(),
					
						ext: 		params.ext,
						title: 		displayName,
						format: 	"",
					
						downloadName: 	downloadName,
						displayName: 	displayName,
						displayLabel: 	ft,
						filename: 		fileName,
					
						type: 		"video",
						metod: 		'accumulate',
						source: 	"Combine",
						
						combine: { urls: params.urls }
					};

			return mm;			
		}

		// ====================================================================	
		this.getMedia = function( media ){
			
			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "Combine" )  stream_media.push( item );
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

		// --------------------------------------------------------------------------------
		this.removeTabData = function( tabId ){
			
			//console.log('-- removeTabData --');

			if ( detectUrls[tabId] )  delete detectUrls[tabId];
			if ( expectUrls[tabId] )  delete expectUrls[tabId];

		}


	};
	
	this.Combine = new Combine();
	
}).apply( fvdDownloader.Media );
