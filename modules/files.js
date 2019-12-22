var FILESYSTEM = function(){

	const DEBUG = false;

	// ===============================================================
	function init(){
	
		//console.log("FileSystem - init ");
		
		// ---------------------------  SendRequest
		chrome.extension.onRequest.addListener ( function(request, sender, sendResponse) {  
			if (request.action == 'files_delete') {
				clearFileSystem();
			}	
			else if (request.action == 'remove_file') {
				removeFile(request.filename);
			}	
			else if (request.action == 'load_file') {
				loadFile(request.url, sendResponse);
			}	
			else if (request.action == 'ffmpeg_run') {
				fvdDownloader.videoFFmpeg.command(request.command,
														function( msg ) {
															console.log(msg);
														},
														function( f ) {
															console.log(f);
															sendResponse( f );
														});
			}	
		});
		
		// очистим файловую систему	
		clearFileSystem();
		
	}
	
	// -------------------------------------------------------------------
	function errorHandler(e){
		
		console.log(e);
		var msg = '';

		switch (e.code) {
			case FileError.QUOTA_EXCEEDED_ERR:
			  msg = 'QUOTA_EXCEEDED_ERR';
			  break;
			case FileError.NOT_FOUND_ERR:
			  msg = 'NOT_FOUND_ERR';
			  break;
			case FileError.SECURITY_ERR:
			  msg = 'SECURITY_ERR';
			  break;
			case FileError.INVALID_MODIFICATION_ERR:
			  msg = 'INVALID_MODIFICATION_ERR';
			  break;
			case FileError.INVALID_STATE_ERR:
			  msg = 'INVALID_STATE_ERR';
			  break;
			default:
			  msg = 'Unknown Error';
			  break;
		};

		console.log('Error: ' + msg);
	}
	
	// -------------------------------------------------------------------
	function clearFileSystem(){

		function onInitFs(fs) {
			if (DEBUG) console.log('Opened file system: ' + fs.name);
			var dirReader = fs.root.createReader();
			var readEntries = function() {
				dirReader.readEntries (function(results) {
					if (results.length>0) {
						results.forEach(function(entry, i) {
							entry.remove(function() {
								if (DEBUG) console.log('File removed.', entry.fullPath);
							}, errorHandler);
						});	
						readEntries();	
					} 
				}, errorHandler);
			  };
			readEntries();
		}	
		
		fsReq(onInitFs);

	}
	
	// -------------------------------------------------------------------
	function removeFile(fileName){

		fsReq(function(fs) {
			fs.root.getFile(fileName, {create: false}, function(file) {
				file.remove(function() {
					if (DEBUG) console.log('File: ',fileName,'- removed.');
				});
			});
		});
		
	}
	function removeListFile(list){
		
		if (list.length == 0) return;

		fsReq(function(fs) {
			list.forEach(function(filename, i) {
				fs.root.getFile(filename, {create: false}, function(file) {
					file.remove(function() {
						if (DEBUG) console.log('File: ',filename,'- removed.');
					});
				});
			});								
		});
		
	}
	
	// ---------------------------
	function fsReq(cb) {
	  webkitRequestFileSystem(PERSISTENT, 5 * 1024 * 1024 * 1024, cb, errorHandler);
	}
	// ---------------------------
	function write_file(fileName, blob, cb) {
		
		var error;
		fsReq(function(fs) {
			fs.root.getFile(fileName, {create: true}, function(file) {
				file.createWriter(function(writer) {
					writer.onwriteend = function() {
						if (DEBUG) console.log("write success", fileName);
						cb(fileName);
					};
					writer.onerror = function(err) {
						error = err;
						console.log('ERROR fileSystem:', err);
					};
			
					writer.seek(writer.length);
					writer.write(blob);
				});
			});
		});
	}

	// ---------------------------
	function create_file(fileName, blob, cb) {
		
		var error;
		fsReq(function(fs) {
			fs.root.getFile(fileName, {create: true, exclusive: false}, function(file) {
				file.createWriter(function(writer) {
					writer.onwriteend = function() {
						if (DEBUG) console.log("write success", fileName);
						cb(fileName);
					};
					writer.onerror = function(err) {
						error = err;
						console.log('ERROR fileSystem:', err);
					};
					writer.write(blob);
				});
			});
		});
	}

	// --------------------------------------------------------	
	function isFile(fileName, callback){

		fsReq(function(fs) {
			fs.root.getFile(fileName, {}, function(fileEntry) {
				if (fileEntry.isFile) {
					callback({error: false});
				}
				else {	
					callback({error: true});						
				}
			}, function(){
				callback({error: true});						
			});
		});
	}	
	
	// --------------------------------------------------------	
	function readFile(fileName, callback){

		fsReq(function(fs) {
			fs.root.getFile(fileName, {}, function(fileEntry) {
				
				fileEntry.file(function(file) {
					
					var reader = new FileReader();
					reader.onloadend = function(e) {
					   var arrayBuffer = new Uint8Array(reader.result);
					   //var arrayBuffer = new Uint8Array(e.target.result);
						callback(arrayBuffer);	
					};

					reader.readAsArrayBuffer(file);
				   
				}, errorHandler);
			
			});
		});
	}	
	
	// --------------------------------------------------------	
	function saveAllFiles(list){
		
		if (typeof list == 'undefined') list = null;
		
		var k = 0;

		function onInitFs(fs) {
			console.log('Opened file system: ' + fs.name);
			
			if (list) {
				list.forEach(function(filename, i) {
					fs.root.getFile(filename, {create: false}, function(file) {
						var url = 'filesystem:chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/persistent'+file.fullPath;
						chrome.downloads.download({
							url: url,
							filename:  file.name,
							saveAs: true 
							},
							function (downloadId) {
								if (DEBUG) console.log(file.name, 'DOWNLOAD sucess' );
							}		
						);
					});
				});								
			}
			else {
				var dirReader = fs.root.createReader();
				var readEntries = function() {
					dirReader.readEntries (function(results) {
						if (results.length>0) {
							results.forEach(function(entry, i) {
								k++;
								if (k>20) return;
								if (DEBUG) console.log('Download: ', entry);
								var url = 'filesystem:chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/persistent'+entry.fullPath;
								chrome.downloads.download({
									url: url,
									filename:  entry.name,
									saveAs: true 
									},
									function (downloadId) {
										console.log(entry.fullPath, 'DOWNLOAD sucess' );
										fs.root.getFile(entry.name, {create: false}, function(file) {
											file.remove(function() {
												if (DEBUG) console.log('File: ',entry.name,'- removed.');
											});
										});
									}		
								);
							});								
						} 
					}, errorHandler);
				  };
				readEntries();
			}	
		}	
		
		fsReq(onInitFs);

	}
	
	// --------------------------------------------------------	
	// fileName		- 
	// dirPath	    - 
	// downloadName - 
	// ext			- 
	// save         - 
	function saveVideo(params, callback){

		console.log(params);
		
		var save_as = params.save ? params.save : false;
		
		var url = 'filesystem:chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/persistent/'+params.fileName;

		var file_name = removeChars(params.downloadName);
		
		var path_name = params.dirPath ? removeChars(params.dirPath)+'/' : '';

		_download({	url: url,
					filename:  path_name + file_name + '.' + params.ext,
					saveAs: save_as  },
								function (downloadId) {
									if (callback) callback(downloadId);
								},		
								function (error) {
									if (error === 'Invalid filename') {

										// сохраним с простым именем
										_download({	url: url,
													filename:  params.fileName,
													saveAs: true  },
														function (downloadId) {	
															if (callback) callback(downloadId);
														},
														function (error) {	
															if (callback) callback(null);
														});
									}
									else {
										if (callback) callback(null);
									}
								}		
							);

	}

	function _download(params, onDownload, onFailed){

		chrome.downloads.download(params,  function (downloadId) {
				if (DEBUG) console.log('DOWNLOAD', downloadId );
				if (downloadId) {
					onDownload(downloadId);
				}
				else {
					console.log(chrome.runtime.lastError);
					onFailed(chrome.runtime.lastError.message);	
				}		
			}		
		);
		
	}	
	
	// --------------------------------------------------------	
	var lastMediaNumber = 0;
	function Unique(){

		lastMediaNumber++;
		var str = '00000' + lastMediaNumber.toString();
		str = 'm'+str.substring(str.length - 3, str.length);
		return str;
		
	}
	
	// --------------------------------------------------------	
	const REMOVE_CHARS = /[\\/\?<>\:\*\|\":\@\.']|[\x00-\x1f\x80-\x9f]/g;

	function removeChars( text, dir ){
		
		if ( !text )  return 'media';
	
		var str = text.replace(REMOVE_CHARS, "");
		
		var arr = fvdDownloader.convert.utf16.toBytes(str);
		
		for (var i=0; i<arr.length; i++) {
			if (arr[i] == 8234) arr[i] = 95;
		}	
		
		str = fvdDownloader.convert.utf16.fromBytes(arr);
		str = str.trim();
		
		return str;	
	}	

	const DOWNLOADNAME_LENGTH_LL  = 60;
	const DOWNLOADNAME_LENGTH_LL_MAX  = 70;
	const DOWNLOADNAME_LENGTH_LL_MIN  = 50;

	function substringName( text ){

		if (text.length < DOWNLOADNAME_LENGTH_LL ) return text;

		var kk = text.length;
		if (kk > DOWNLOADNAME_LENGTH_LL_MAX) kk = DOWNLOADNAME_LENGTH_LL_MAX;
		var ii = DOWNLOADNAME_LENGTH_LL; 
		while ( text.charAt(ii) != " " && ii <= kk ) 	ii++;
		if (text.charAt(ii) == " ") return text.substring(0,ii);
		
		ii = DOWNLOADNAME_LENGTH_LL; 
		while ( text.charAt(ii) != " " && ii >= DOWNLOADNAME_LENGTH_LL_MIN ) 	ii--;
		if (text.charAt(ii) == " ") return text.substring(0,ii);

		return text.substring(0,DOWNLOADNAME_LENGTH_LL);
	}	

	// --------------------------------------------------------	
	function IsRequestSuccessful (httpReq) {
		var success = (httpReq.status == 0 || (httpReq.status >= 200 && httpReq.status < 300) || httpReq.status == 304 || httpReq.status == 1223);
		return success;
	}
	function request( options ){
		
		if (!DEBUG) console.log( 'request: ', options.url );
		try	{
			var httpRequest = new XMLHttpRequest(); 
			
			httpRequest.open ("GET", url, true);
			httpRequest.responseType = "arraybuffer"; 
			httpRequest.onreadystatechange = function() {
					if (httpRequest.readyState==4) {
						if (IsRequestSuccessful (httpRequest)) 	{

							callback({ error: false, 
									   response: httpRequest.response,  
									   type: httpRequest.getResponseHeader("Content-Type") 
									 });	
						}
						else 	{
							callback({ error: true });	
						}
						//delete httpRequest;
						httpRequest = null;
					}
			};
			httpRequest.send();
			
			return httpRequest;
		}
		catch(err)	{
			console.log('ERROR:', err);
			callback({ error: true });
		}
		
	}	
	// ---------------------------------------------------------------
	function loadFile( url, callback ){
	
		filename = (new Date().getTime()).toString();
		if (DEBUG) console.log(filename);
		
		request( url, function( rez ) {
			
			if ( !rez.error ) {
				var blob = new Blob([rez.stream], {type: rez.type});
				write_file(filename, blob, function(){
					callback(filename);
				});
			}
			else {
				console.log('===============ERROR===================== httpRequest ==========');
			}	
			
		});
	
	}	
	// ---------------------------------------------------------------
	function loadText( url, callback ){
	
		var httpRequest = new XMLHttpRequest(); 
		httpRequest.open ("GET", url, true);
		httpRequest.onreadystatechange = function() {
			if (httpRequest.readyState==4) {
				if (IsRequestSuccessful (httpRequest)) 	{
			
					var x = httpRequest.getResponseHeader("Content-Length");
					var t = httpRequest.getResponseHeader("Content-Type");
					callback({error: false, response: httpRequest.response, length: x, type: t});

				}
				else 	{
					callback({error:  true});
					console.log('===============ERROR===================== httpRequest ==========');
				}
			}
		};
		httpRequest.send();
	}	
	// ---------------------------------------------------------------
	function get( url, funcProgress, funcFinish ){
	
		var httpRequest = new XMLHttpRequest(); 
		httpRequest.open ("GET", url, true);
		httpRequest.responseType = "arraybuffer"; 
		
		httpRequest.addEventListener("progress", _progress, false);
		httpRequest.addEventListener("load", _load, false);
		httpRequest.addEventListener("error", _error, false);
		httpRequest.addEventListener("abort", _error, false);				
		httpRequest.send();
		
		return httpRequest;
		// -----------------------
		function _progress(ev) {
			if (ev.lengthComputable) {
				funcProgress(ev.loaded, ev.total);
			}
		}
		// -----------------------
		function _load(ev) {
			if (httpRequest.status == 200) {
				funcFinish({ error: false, 
							 stream: new Uint8Array(httpRequest.response),  
							 type: httpRequest.getResponseHeader("Content-Type") 
						   })
			}
		}
		// -----------------------
		function _error(ev) {
			console.log('ERROR: loadFile', httpRequest.statusText, ev.type, httpRequest.status);
			funcFinish({ error: true });
		}
	}	
	
	//-------------------------------------------------------
	function upload_file(file, callback) {

	    var name = new Date().getTime().toString();
        var start = 0, 
			stop = file.size - 1;
        var ext = String(file.name).toLocaleLowerCase().split('#').shift().split('?').shift().split('.').pop();

        var reader = new FileReader();
        reader.onloadend = function (evt) {
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
				if (DEBUG) console.log(['Read bytes: ', start + 1, ' - ', stop + 1, ' of ', file.size, ' byte file'].join(''));
            }
        };
        var blob = file.slice(start, stop + 1);
        reader.readAsBinaryString(blob);
		
		fsReq(function(fs) {
			fs.root.getFile(name+'.'+ext, {create: true}, function(fileEntry) {
				fileEntry.createWriter(function(writer) {
					var b = new Blob([blob]);
					writer.onwriteend = function() {
						console.log("write success", file.name);
						callback({ filename: file.name,
								   ext: ext,
								   name: name });
					};
					writer.write(blob);
				});
			});
		});
			
	}
	
	//-------------------------------------------------------
	function image_to_base64(filename, callback) {

		readFile( filename, function( data ) {
			var x = fvdDownloader.jspack.bytesToString(data);
			var z = "data:image/jpeg;base64," + window.btoa( x );
			callback(z);
		});	
								
	}

	// --------------------------------------------------------	
	
	return {
		init: init,
		errorHandler: errorHandler,
		clearFileSystem: clearFileSystem,
		removeFile: removeFile,
		removeListFile: removeListFile,
		writeFile: write_file,
		createFile: create_file,
		isFile: isFile,
		readFile: readFile,
		uploadFile: upload_file,
		saveAllFiles: saveAllFiles,
		saveVideo: saveVideo,
		Unique: Unique,
		removeChars:removeChars,
		substringName: substringName,
		request: request,
		loadFile: loadFile,
		loadText: loadText,
		get: get
	}	
  
}  

