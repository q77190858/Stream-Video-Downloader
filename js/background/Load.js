if (window == chrome.extension.getBackgroundPage()) {

	(function(){
	
		var Load = function(){

			var self = this;

			var maxDownloadNum=2;//最大同时下载数
			var downloadNum=0;//下载数
			var downloadQueue=new Array();//等待下载队列
			
			// ===============================================================
			this.init = function(){
			
				//console.log("Load - init ");
				
				// ---------------------------  SendRequest
				chrome.extension.onRequest.addListener ( function(request, sender, sendResponse) {        
					if(request.command=="clickDownload")	{
						self.clickDownload( request.mediaId );	
					}
					else if(request.command=="messageStreamVideo")	{
						messageLoadVideo( request.mediaId, request.data );	
					}
					else if(request.command=="finishStreamVideo")	
					{
						var rez = request.data;
						console.log('FINISH', rez);
						
						if ( !rez.error) 
						{//如果是下载完毕正常关闭
							for (var j=0; j<rez.filename.length; j++) 
							{
								(function( fn, ext ) {
									fvdDownloader.FileSystem.saveVideo({	fileName: fn.filename, 
																				dirPath: fn.dirPath, 
																				downloadName: fn.downloadName, 
																				ext: ext}, function(){
										fvdDownloader.FileSystem.removeFile(fn.filename);
									});
								})(rez.filename[j], rez.ext)
								//继续下载队列中的文件
								if(downloadQueue.length>0)
								{
									var media = downloadQueue.shift();
									console.log("queue:shift:",media);
									console.log("download:",media);
									startPlaylistMedia( media );
									
								}
								else
								{
									downloadNum--;
									console.log("downloadNum--:",downloadNum);
								}	
							}	
						}
						else 
						{//如果是带有错误的话
							fvdDownloader.Storage.setStream( request.hash, { status: 'stop' } );
							chrome.extension.sendMessage( {	subject: 	"mediaDownloadState", 
															id: 		request.mediaId, 
															metod:		rez.metod,
															streamHash: request.hash, 
															status:     'stop'
														} );
						}	
					}
				});
			}
			
			// ===============================================================
			this.clickDownload = function( id, filename = "" ){

				var m = fvdDownloader.Storage.getDataForId( id );
				if (!m) return;
				if(filename!="")
				{
					m.displayName=filename;
					m.downloadName=filename;
				}
				console.log('clickDownload', m);
				if (m.status == 'error') {
					if (m.metod == 'stream') navigateMessageDisabled(16);
					return;
				}
				
				if (m.metod == 'download') 
				{
						if (m.status == 'stop') 
						{
							startDownloadMedia( m );
						}
						else if (m.status == 'start')  {
							stopDownloadMedia( m );
						}   
				}
				else if (m.metod == 'convert') {
						if (m.status == 'stop') {
							startConvertMedia(m);
						}
						else if (m.status == 'start') {
							stopConvertMedia(m);
						}   
				}
				else if (m.metod == 'playlist') {
						if (m.status == 'stop') {
							if(downloadNum<2)//如果未超过最大下载数
							{
								console.log("download:",m);
								startPlaylistMedia( m );
								downloadNum++;
								console.log("downloadNum++:",downloadNum);
							}
							else
							{
								//如果下载的数量达到最大值，就加入队列等着
								downloadQueue.push(m);
								console.log("queue:push ",m);
							}
						}
						else if (m.status == 'start') {
							stopPlaylistMedia( m );
						}   
				}
				else if (m.metod == 'segments') {
						if (m.status == 'stop') {
							startSegmentsMedia( m );
						}
						else if (m.status == 'start') {
							stopSegmentsMedia( m );
						}   
				}
				else if (m.metod == 'record') {
						if (m.status == 'stop') {
							startRecordMedia( m );
						}
						else if (m.status == 'start') {
							stopRecordMedia( m );
						}   
				}
				else if (m.metod == 'accumulate') {
						if (m.status == 'stop') {
							startAccumulateMedia( m );
						}
						else if (m.status == 'start') {
							stopAccumulateMedia( m );
						}   
				}
				else if (m.metod == 'loaded') {
						if (m.status == 'stop') {
							startLoadedMedia( m );
						}
						else if (m.status == 'start') {
							stopLoadedMedia( m );
						}   
				}
			}	
			
			// =====================================================================================
			function startDownloadMedia(media) {

				console.log('startDownloadMedia', media);
				
				// metod download
				var flag_download = chrome.downloads ? 1 : 5;
				var met = _b(fvdDownloader.Prefs.get( "original_filename" ));
				var file_name;
				if (met) {	//  original file name
					file_name = media.filename;	
				}
				else {
					file_name = media.downloadName;	
				}
				file_name = fvdDownloader.FileSystem.removeChars( file_name );
				file_name = file_name + '.' + media.ext; 

				async.series( [
				
					function( chainCallback ){		// 
					
									if( fvdDownloader.noYoutube == false )	{
										fvdDownloader.FvdMobile.downloadMedia( media, function( result ){
															if( !result )	{
																chainCallback();
															}
														} );						
									}
									else	{
										chainCallback();	
									}
								},
								
					function( chainCallback ){			// 
					
									if( flag_download == 3 )	{
										console.log('DOWNLOAD - open');
										chrome.tabs.create({
														url: media.url,
														active: false
													});		 
										return;
									}	
									else {
										chainCallback();
									}
									
								}, 
								
					function( chainCallback ){			//  API
										
									if( flag_download == 1 ) 	{
										console.log('DOWNLOAD - api', file_name);	
										
										fvdDownloader.Downloader.start( {  mediaId:  media.id, 
																		   mediaUrl: media.url, 
																		   fileName: file_name,
																		   headers:  media.headers, 
																		},
												function(error, downloadId)	{ 
												
													if(error) {
														console.log(fvdDownloader.Downloader.getError());
													}
													else  {
														
													}
												}
										);
										return;					
									}
									else	{
										chainCallback();
									}						
								},
			
					function( chainCallback ){			// 
										
										fvdDownloader.Utils.getActiveTab(function( tab ){
													fvdDownloader.ContentScriptController.processMessage( tab.id, {
																action: "startDownload",
																media: media
															} );
												});
										return;		
								}
				] );
			}
			// --------------------------------------------------
			function stopDownloadMedia(media) {

				console.log('stopDownloadMedia', media);
				
				if ( !media ) return;
				
				if (media.downloadId) {
					fvdDownloader.Downloader.stop( media.downloadId, function(error)	{ 
																				if(error) {
																					console.log(fvdDownloader.Downloader.getError());
																				}
																				else  {
																				}
					});
				}
				else {
					fvdDownloader.Storage.setData_Attribute(media.tabId, media.id, "status", 'stop');		
				}	
			}	
			
			// ===============================================================
			function messageLoadVideo(mediaId, data) {
				
				if ( data.msg === 'start' ) {
					fvdDownloader.Storage.setData({ hash: data.hash },  { status: 'start' });
					chrome.extension.sendMessage( {	subject: 		"mediaDownloadState", 
													id: 			mediaId, 	
													metod:			data.metod,
													streamHash: 	data.hash, 
													status:			'start'
												} );
				}	
				else if ( data.msg === 'finish' ) {
					var st = data.error ? 'error' : 'stop';
					fvdDownloader.Storage.setData({ hash: data.hash },  { status: st });
					chrome.extension.sendMessage( {	subject: 	"mediaDownloadState", 
													id: 		mediaId, 
													metod:		data.metod,
													streamHash: data.hash, 
													status:     st
												} );
				}
				else if ( data.msg === 'playlist' ) {
					chrome.extension.sendMessage( {	subject: 	"mediaDownloadState", 
													id: 		mediaId, 
													count: 		data.count, 
													streamHash: data.hash, 
													status:		'playlist',
												  } );
				}	
				else if ( data.msg === 'progress' ) {
					fvdDownloader.Storage.setData({ hash: data.hash },  { progressByte: data.size, progress: data.progress });
					chrome.extension.sendMessage( {	subject: 	"mediaDownloadState", 
													id: 		mediaId, 
													count: 		data.count, 
													streamHash: data.hash, 
													byte: 		data.size, 
													progress: 	data.progress	
												} );
				}	
				else if ( data.msg === 'saving' ) {
					chrome.extension.sendMessage( {	subject: 	"mediaDownloadState", 
													id: 		mediaId, 
													streamHash: data.hash, 
													status:		'saving',
												 } );
				}
			}	
			
			// ===============================================================
			function startConvertMedia(media) {

				console.log('startConvertMedia', media);
			
				fvdDownloader.Converter.start( media.hash );
			
			}
			
			// --------------------------------------------------
			function stopConvertMedia(media) {

				console.log('stopConvertMedia', media);

				fvdDownloader.Converter.stop( media.hash );
				
				fvdDownloader.Storage.setStream( rez.hash, { status: 'stop' } );
				chrome.extension.sendMessage( {	subject: 	"mediaDownloadState", 
												id: 		media.id, 
												metod:		media.metod,
												streamHash: rez.hash, 
												status:		'stop'
											  } );
			}	
			
			// ===============================================================
			function startPlaylistMedia(media) {
				
				chrome.extension.sendMessage( {	subject: "mediaStreamerState", state: true, id: media.id   } );

				fvdDownloader.Playlister.start( media.hash,
							function(rez)	{ 
								messageMedia(rez, media);
							},									
							function(rez)	{ 
									console.log('FINISH', rez);
									if ( !rez.error) {
										fvdDownloader.FileSystem.saveVideo({	fileName: rez.filename, 
																					downloadName: media.downloadName, 
																					ext: media.ext}, function(){
											fvdDownloader.FileSystem.removeFile(rez.filename);
										});
									}
									chrome.extension.sendMessage( {	subject: "mediaStreamerState", state: false, id: media.id   } );
							}
				);									   
			}	
			
			// --------------------------------------------------
			function stopPlaylistMedia(media) {

				fvdDownloader.Playlister.stop( media.hash );
			}

			// ===============================================================
			function startSegmentsMedia(media) {
				
				chrome.extension.sendMessage( {	subject: "mediaStreamerState", state: true, id: media.id   } );

				fvdDownloader.Segmenter.start( media.hash,
							function(rez)	{ 
								messageMedia(rez, media);
							},									
							function(rez)	{ 
									console.log('FINISH', rez);
									if ( !rez.error) {
										fvdDownloader.FileSystem.saveVideo({	fileName: rez.filename, 
																					downloadName: media.downloadName, 
																					ext: media.ext}, function(){
											fvdDownloader.FileSystem.removeFile(rez.filename);
										});
									}
									chrome.extension.sendMessage( {	subject: "mediaStreamerState", state: false, id: media.id   } );
							}
				);									   
			}	
			
			// --------------------------------------------------
			function stopSegmentsMedia(media) {

				fvdDownloader.Segmenter.stop( media.hash );
			}

			// ===============================================================
			function startRecordMedia(media) {

				console.log('startRecordMedia', media);
				
				fvdDownloader.Storage.setTwitch( media.hash, 'start', null );
				chrome.extension.sendMessage( {	subject: 		"mediaDownloadState", 
												id: 			media.id, 	
												metod:			media.metod,
												streamHash: 	media.hash, 
												status:			'start'
											} );
				
				
				fvdDownloader.Recorder.start( media.hash ); 
				
			}	
			// --------------------------------------------------
			function stopRecordMedia(media) {
				
				fvdDownloader.Storage.setTwitch( media.hash, 'stop', null );
				chrome.extension.sendMessage( {	subject: 	"mediaDownloadState", 
												id: 		media.id, 
												metod:		media.metod,
												streamHash: media.hash, 
												status:     'stop'
											} );

				fvdDownloader.Recorder.stop( media.hash );
			
			}	
			
			// ===============================================================
			function startAccumulateMedia(media) {

				console.log('startAccumulateMedia', media);
				
				fvdDownloader.Storage.setTwitch( media.hash, 'start', null );
				chrome.extension.sendMessage( {	subject: 		"mediaDownloadState", 
												id: 			media.id, 	
												metod:			media.metod,
												streamHash: 	media.hash, 
												status:			'start'
											} );
				
				
				fvdDownloader.Accumulates.start( media.hash ); 
				
			}	
			// --------------------------------------------------
			function stopAccumulateMedia(media) {
				
				fvdDownloader.Storage.setTwitch( media.hash, 'stop', null );
				chrome.extension.sendMessage( {	subject: 	"mediaDownloadState", 
												id: 		media.id, 
												metod:		media.metod,
												streamHash: media.hash, 
												status:     'stop'
											} );

				fvdDownloader.Accumulates.stop( media.hash );
			
			}	
			
			// ===============================================================
			function startLoadedMedia(media) {

				console.log('startLoadedMedia', media);
				
				//chrome.extension.sendMessage( {	subject: "mediaStreamerState", state: true, id: media.id   } );

				fvdDownloader.Loadinger.start( media,
							function(rez)	{ 
								messageLoadVideo(media.id, rez)
							},									
							function(rez)	{ 
								console.log('FINISH', rez);
							}
				);									   
				
			}	
			// --------------------------------------------------
			function stopLoadedMedia(media) {
				
				chrome.extension.sendMessage( {	subject: 	"mediaDownloadState", 
												id: 		media.id, 
												metod:		media.metod,
												streamHash: media.hash, 
												status:     'stop'
											} );

				fvdDownloader.Loadinger.stop( media );
			
			}	
			

			// ===============================================================
			function saveTSFile(data)	{ 	
				// If we are replacing a previously generated file we need to
				// manually revoke the object URL to avoid memory leaks.
				if (textFile !== null) 	{
					window.URL.revokeObjectURL(textFile);
				}
			
				textFile = window.URL.createObjectURL(data);		
				return textFile;
			}
			
			// ===============================================================
			this.isStream = function(  ){

				if ( fvdDownloader.Storage.getActiveConvertStream() ) return false;				
				
				return true;
			}	
		}
		
		this.Load = new Load();
		
	}).apply(fvdDownloader);
	
}
else
{
	fvdDownloader.Load = chrome.extension.getBackgroundPage().fvdDownloader.Load;
}
