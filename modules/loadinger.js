if (window == chrome.extension.getBackgroundPage()) {
	
	(function(){

		const DEBUG = false;

		const STATE_LOADINGER_UNLOAD = 0;
		const STATE_LOADINGER_LOAD = 1;
		const STATE_LOADINGER_COMPLETE = 5;
		const STATE_LOADINGER_ABORT = 9;

		
		// ===============================================================
		var LoadingerWorker = function( media, onMessage, onFinish )  {	

			var funcMessage = onMessage;
			var funcFinish = onFinish;

			this.state = STATE_LOADINGER_UNLOAD;

			var hash = media.hash;
			var url = media.url;
			var size = 0,
				total = 0,
				progress = 0;

			var httpRequest = null;	

			var tmpDir = null,	
				audioExt = null,
				fileExt = "mp4",
				downloadName = media.downloadName + '.' + media.ext,
				filename = null;

			var textFile = null;
			var error = null;	

			// -------------------------------------------------------------------
			this.start = function(){

				if (DEBUG) console.log('--start--', hash, media);

				page_loading();
				//run_loading();


			}

			function page_loading() {

				chrome.tabs.executeScript( media.tabId, {
					file: "/js/contentScripts/contentPostRequest.js"
				}, function(){

							var port = chrome.tabs.connect( media.tabId );
							port.postMessage( { action: "page_download", data: media });

							port.onMessage.addListener(function( message ){

							});
				});
				
			}	

			// -----------------------------
			function run_loading() {

				onMessage( { msg: "start", hash: hash, status: 'start', size: 0, count: 0 });

				httpRequest = new XMLHttpRequest(); 
				self.state = STATE_LOADINGER_LOAD;
				
				httpRequest.open("GET", url, true);
				httpRequest.responseType = 'arraybuffer';

				if (media.headers) {
					for (var h in media.headers) {  
						httpRequest.setRequestHeader(h, media.headers[h]);
					}	
				}

				httpRequest.onload = function (e) {				
						if (httpRequest.readyState==4) {
							if (IsRequestSuccessful (httpRequest)) 	{

								self.state = STATE_LOADINGER_COMPLETE;		
								
								var t = httpRequest.getResponseHeader("Content-Type");

    							var blob = new Blob([this.response], {type: t});
								var link_href = saveTSFile(blob);

								console.log(downloadName);

								chrome.downloads.download({
														url: link_href,
														filename: downloadName,
														},
														function (downloadId) {

															if (downloadId) {
																onMessage({'msg': 'finish', 'hash': hash, size: size, error: false });
																onFinish({'msg': 'finish', 'hash': hash, size: size, error: false });
															}											
															else {
																onMessage({'msg': 'finish', 'hash': hash, size: size, error: true });
																onFinish({'msg': 'finish', 'hash': hash, size: size, error: true });
															}

														}		
													);

							}
							else 	{
								console.log('===============ERROR===================== httpRequest ==========');
								onMessage({'msg': 'finish', 'hash': hash, size: 0, error: true });
								onFinish({'msg': 'finish', 'hash': hash, size: 0, error: true });
							}
						}
				};
				httpRequest.onprogress = function(event) {

					size = event.loaded;
					total = event.total;
					if (total>0)  var p = Math.round( 100 * size / total );

					onMessage({'msg': 'progress', 'hash': hash, 'size': size, 'progress': p });

				};
					
				httpRequest.send();
				
			}

			// -------------------------------------------------------------
			function IsRequestSuccessful (httpReq) {
				var success = (httpReq.status == 0 || (httpReq.status >= 200 && httpReq.status < 300) || httpReq.status == 304 || httpReq.status == 1223);
				return success;
			}

			// -------------------------------------------------------------------
			this.stop = function( ){

				httpRequest.abort();

			}	

			// ----------------------------------
			function saveTSFile(data)	{ 	
				if (textFile !== null) 	{
					window.URL.revokeObjectURL(textFile);
				}
				textFile = window.URL.createObjectURL(data);		
				return textFile;
			}


		}	

		// ===============================================================
		var Loadinger = function()  {		
		
			var self = this;
			var workers = {};

			var listDownload = {};
			var listUrl = {};

			// -------------------------------------------------------------------
			this.start = function( media, callbackMessage, callbackFinish ){
				
				if (DEBUG) console.log('Loadinger.start', media);
				
				var hash = media.hash;
				listUrl[media.id] = media.url;

				//workers[hash] = new LoadingerWorker(media, onMessage, onFinish);
				
				//workers[hash].start();

				chrome.tabs.executeScript( media.tabId, {
					file: "/js/contentScripts/contentPostRequest.js"
				}, function(){

							var port = chrome.tabs.connect( media.tabId );
							port.postMessage( { action: "page_download", data: media });

							port.onMessage.addListener(function( message ){

							});
				});

				return hash;

				// ---------------------------
				function onMessage(msg) {
					callbackMessage(msg);
				}
				function onFinish(rez) {
					callbackMessage( { msg: "finish", hash: hash, status: 'stop', size: rez.size });
					callbackFinish(rez);
					if (workers[hash]) delete workers[hash];
				}
				
				
			}
			
			// -------------------------------------------------------------------
			this.stop = function( media ){
				
				if (DEBUG) console.log('Loadinger.stop', media.id);

				for (var downloadId in listDownload) {
					if ( media.id == listDownload[downloadId] )  {
						if ( typeof downloadId == 'string' ) downloadId = parseInt(downloadId);
						try		{
							chrome.downloads.cancel( downloadId );
						}
						catch(err)	{
							var error = err.name + ' ' + err.message;
							console.log(error);
						}
						sendMessage( downloadId, 'stop' );

						return;
					}
				}
				//workers[hash].stop();
				
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
			function onCreated( downloadItem ){

				for (var id in listUrl) {

					if (listUrl[id] == downloadItem.url) {
						downloadId = downloadItem.id;
						console.log('DOWNLOAD: ', downloadId );
						listDownload[downloadId] = id;

						sendMessage( downloadId, 'start' ); 

						break;
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

			chrome.downloads.onCreated.addListener( onCreated );
			
			setInterval(function(){ 
			
				if ( Object.keys( listDownload ).length > 0 )  checkStateDownloads();
				
			}, 1500);
			// -------------------------------------------------------------------
			

		}
		
		this.Loadinger = new Loadinger();
		
	}).apply(fvdDownloader);
}
else{
	fvdDownloader.Loadinger = chrome.extension.getBackgroundPage().fvdDownloader.Loadinger;
}
