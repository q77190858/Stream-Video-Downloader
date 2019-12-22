(function(){
	
	var Viki = function(){		
	
		const DEBUG = false;

		const PRIVATE_KEY = 'MM_d*yP@`&1@]@!AVrXf_o-HVEnoTnm$O-ti4[G~$JDI/Dc-&piU&z&5.;:}95=Iad';
		const API_URL = 'http://api.viki.io';
		const PATH_PROPER = '/v4/videos/<%id%>.json?app=100005a&t=<%time%>&site=www.viki.com';
		const PATH_STREAM = '/v4/videos/<%id%>/streams.json?app=100005a&t=<%time%>&site=www.viki.com';

		//https://www.viki.com/videos/1121160v-my-golden-life-episode-44
	
		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			var url = data.url.toLowerCase();

	        if ( /www\.viki\.com\/videos\/(.*)/i.test(data.url) )   {
				detectVikiVideo( data, callback )
				return;
			}  

			callback(null);
		}
		
		// --------------------------------------------------------------------------------
		function detectVikiVideo( data, callback ){

			if (DEBUG) console.log( data );

		    var url = data.url,
		        tabUrl = data.tabUrl,
		        tabTitle = data.tabTitle,
				videoId = null,
				url1, 
				url2,
				duration = 0,
				thumb = null;

			var parsedMedia = [],
				mediaFound = false,
				groupMedia = fvdDownloader.Storage.nextGroupId();
				
			var m = url.match(/www\.viki\.com\/videos\/(.*?)-/i);	
			if (!m) {
				callback(null);	
				return false;
			}	
			videoId = m[1];	

			var t = parseInt((new Date()).getTime()/1000);

			async.series([
				function(next) {

					url1 = PATH_PROPER.replace('<%id%>', videoId).replace('<%time%>', t);
					var hashed = CryptoJS.HmacSHA1(url1, PRIVATE_KEY);
					var sig = hashed.toString(CryptoJS.Base64);
					url1 = API_URL+url1+'&sig='+sig;

					url2 = PATH_STREAM.replace('<%id%>', videoId).replace('<%time%>', t);
					hashed = CryptoJS.HmacSHA1(url2, PRIVATE_KEY);
					sig = hashed.toString(CryptoJS.Base64);
					url2 = API_URL+url2+'&sig='+sig;

					next();
				},	
				function(next) {
					
					fvdDownloader.Utils.getAJAX( url1, null, function(content){

						if (content) {
		
							try {
								var info = JSON.parse(content);
							}                     
							catch(ex) {
								console.log(ex);
								return;
							}
							if (DEBUG) console.log(info);
		
							thumb = fvdDownloader.Utils.getJSON( info, 'images/poster/url' );
							tabTitle = fvdDownloader.Utils.getJSON( info, 'container/titles/en' ) || tabTitle;
							duration = fvdDownloader.Utils.getJSON( info, 'duration' );

							next();
						}    
					});	
			
				},
				function(next) {

					fvdDownloader.Utils.getAJAX( url2, null, function(content){
					
						try {
							var info = JSON.parse(content);
						}                     
						catch(ex) {
							console.log(ex);
							return;
						}
						if (DEBUG) console.log(info);

						for (var k in info) {
						
							if ( /[0-9]+p/i.test(k) )   {
				
								var x = info[k].https;
								var quality = k;
								var u = x.url;

								var height = quality.replace('p','');
								var hash = videoId+'_'+height;
								var fileName = tabTitle;
								var extension = "mp4";
								var ff = fvdDownloader.Utils.extractPath( u );
								if (ff) {
									extension = ff.ext;
									fileName = ff.name;
								}	
	
								var ft = [];
								ft.push({tag: 'span', content: '['+quality+', ' });
								ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(extension) });
								ft.push({tag: 'span', content: '] ' });
	
								var displayName = tabTitle;
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
										source: 		"Viki",
										quality:    	quality,
										
										group: 			groupMedia,
										order: 			height,
									});    
	
								mediaFound = true;
							}	
						}
						
						if (DEBUG) console.log(parsedMedia);						
						if (mediaFound) {
							data.foundMedia = "Viki";	
							callback(parsedMedia, true);
						}

					});	
						
				}
			]);	


		}
		
		// ====================================================================	
		this.getMedia = function( media ){
			
			return media;

		}

	};
	
	this.Viki = new Viki();
	
}).apply( fvdDownloader.Media );

