if (window == chrome.extension.getBackgroundPage()) {
	
	(function(){
	
		var Downloader = function()  {		
		
			var self = this;
		
			var error;
			
			var listDownload = {};

			const DOWNLOAD_HEADERS = { "set-cookie": "cookie",
									   "accept": "accept"	
			                         };
			
			// -------------------------------------------------------------------
			this.start = function( params,  callback ){

				var id = params.mediaId,
					url = params.mediaUrl,
					fileName = params.fileName;

				var headers = params.headers ? params.headers : null;

				console.log('Downloader.start', id, url, fileName);
				
				try	{
					var specs = {  url: url,			
								   conflictAction: "uniquify",
								   filename: fileName,
								};

					if (headers) {			
						specs.headers = [ ];
						for (var k in DOWNLOAD_HEADERS)	{

							t = DOWNLOAD_HEADERS[k];
							if ( t in headers && headers[t] ) {
								specs.headers.push({ name: k,  value: headers[t] })
							}
						}		 
					}	

					console.log(specs)								
			
					chrome.downloads.download(specs,
											function (downloadId) {
												console.log('DOWNLOAD: ', downloadId );
												
												listDownload[downloadId] = id;
												
												sendMessage( downloadId, 'start' );
												
												callback( false, downloadId );
											}		
										);
				}
				catch(err)	{
					error = err.name + ' ' + err.message;
					callback(true);
				}
				
				
			}
			
			// -------------------------------------------------------------------
			this.stop = function( downloadId, callback ){
				
				console.log('Downloader.stop', downloadId);
				
				try		{
					chrome.downloads.cancel( downloadId, function(){
						sendMessage( downloadId, 'stop' );
						callback( false )
					});
				}
				catch(err)	{
					error = err.name + ' ' + err.message;
					sendMessage( downloadId, 'stop' );
					callback( true );
				}
				
			}
			
			// -------------------------------------------------------------------
			this.getError = function( ){
			
				if(error !== "")  {
					return error;
				}
				else  {
					return "No Error!";	
				}
			}

			// -------------------------------------------------------------------
			this.state = function( callback ){
				
				try		{
					chrome.downloads.search({}, function(items) {
						
						var list = [];
						
						items.forEach(function(item) {
 	      
							if (item.state == 'in_progress') {
								if (item.totalBytes) {
									list.push( item );
									list[list.length-1].mediaId = listDownload[item.id];
								} 
							} 
						});
						
						callback(list);
					});					
					
				}
				catch(err)	{
					error = err.name + ' ' + err.message;
					callback( true );
				}
				
			}
			
			// -------------------------------------------------------------------
			function sendMessage( downloadId, state, size, progress ){

				if (downloadId in listDownload) {
					var id = listDownload[downloadId];
					var media = fvdDownloader.Storage.getDataForId(id);
				
					if (media) {
						
						var p = {	subject: 	"mediaDownloadState",
									id: 		media.id,
									metod:		media.metod
								};
			
						if (state == 'start') {
							fvdDownloader.Storage.setData_Attribute(media.tabId, media.id, "downloadId", downloadId);
							p.status = state;
							p.byte = size;
						}
						else if (state == 'stop') {
							fvdDownloader.Storage.setData_Attribute(media.tabId, media.id, "status", 'stop');		
							p.status = state;
							p.size = media.size;
						}
						else if (state == 'progress') {
							fvdDownloader.Storage.setData_Attribute(media.tabId, media.id, "progress", {progres: progress, progressByte:size} );		
							p.byte = size;
							p.progress = progress;
						}
						
 						chrome.extension.sendMessage( p );
						
					}	
				}	
			}
			
			// -------------------------------------------------------------------
			function onChanged( downloadDelta ){
				
				var downloadId = downloadDelta.id;
				
				if ( downloadDelta.state ) {
					if ( downloadDelta.state.current == "complete" || 
					     downloadDelta.state.current == "interrupted")  {
							 
							sendMessage( downloadId, 'stop' ); 
						
							delete listDownload[downloadId];						
					}
				}
				
			}
			
			// -------------------------------------------------------------------
			function checkStateDownloads(  ){
				self.state( function( list ){  
					for (var i=0; i<list.length; i++) {
						sendMessage( list[i].id, 'progress', list[i].bytesReceived, Math.round( 100 * list[i].bytesReceived / list[i].totalBytes ) );
					}
				});
			}
			
			// -------------------------------------------------------------------
			chrome.downloads.onChanged.addListener( onChanged );
			
			setInterval(function(){ 
			
				if ( Object.keys( listDownload ).length > 0 )  checkStateDownloads();
				
			}, 1500);
			// -------------------------------------------------------------------
			
		}
		
		this.Downloader = new Downloader();
		
	}).apply(fvdDownloader);
}
else{
	fvdDownloader.Downloader = chrome.extension.getBackgroundPage().fvdDownloader.Downloader;
}

