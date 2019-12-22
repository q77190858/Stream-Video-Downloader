var host = '';
var hash = '';
var baseUrl = '';
var mediaContainer = null;
var messageContainer = null;

var order = 0;

var currentFileName = null;
var currentElem = null;

var textNameFile, buttonLoadFile, buttonRenameFile, buttonDeleteFile, buttonPlayFile, videoPlayer;

window.addEventListener( "load", function(){
	
	host = document.location.host;
	hash = document.location.hash;
	hash = hash.substring(1, hash.length);
	var mm = hash.split('/');
	baseUrl = 'filesystem:chrome-extension://'+host+'/persistent/';

	videoPlayer = document.getElementById("videoContainer");
	
	mediaContainer = document.getElementById("test_container_file");
	messageContainer = document.getElementById("test_ffmpeg_message");

	blockTest = document.getElementById("test_ffmpeg");
	document.getElementById("test_ffmpeg_run").addEventListener("click", function(e){
		chrome.extension.sendRequest( { action:"ffmpeg_run", command: document.getElementById("test_ffmpeg_cmd").value }, post_run );
	});
	
	var buttonClear = document.getElementById("test_load_clear");
	buttonClear.addEventListener("click", function(e){
		chrome.extension.sendRequest( { action:"files_delete" } );
		while( mediaContainer.firstChild )	mediaContainer.removeChild( mediaContainer.firstChild );
	});

	
	var buttonLoad = document.getElementById("test_load_start");
	buttonLoad.addEventListener("click", function(e){
		chrome.extension.sendRequest( { action:"load_file", url: document.getElementById("test_load_url").value }, add_file );
	});

	var buttonUpLoad = document.getElementById("test_upload_start");
	buttonUpLoad.addEventListener("click", function(e){

	    var formData_file = document.getElementById("test_upload_file").files[0];

        var file = formData_file;
        var start = 0, stop = file.size - 1;
        var ext = String(file.name).toLocaleLowerCase().split('#').shift().split('?').shift().split('.').pop();

        var reader = new FileReader();
        reader.onloadend = function (evt) {
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                //console.log(['Read bytes: ', start + 1, ' - ', stop + 1, ' of ', file.size, ' byte file'].join(''));
            }
        };
        var blob = file.slice(start, stop + 1);
        reader.readAsBinaryString(blob);
		
		fsReq(function(fs) {
			fs.root.getFile(file.name, {create: true}, function(fileEntry) {
				fileEntry.createWriter(function(writer) {
					var b = new Blob([blob]);
					writer.onwriteend = function() {
						console.log("write success", file.name);
						add_file(file.name);
					};
					writer.write(blob);
				});
			});
		});
	});

	// -------------
	textNameFile = document.getElementById("test_file_name");

	buttonLoadFile = document.getElementById("test_file_load");
	buttonLoadFile.addEventListener("click", function(e){
			fsReq(function(fs) {
				fs.root.getFile(currentFileName, {create: false}, function(file) {
					var url = 'filesystem:chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/persistent'+file.fullPath;
					chrome.downloads.download({
						url: url,
						filename:  file.name,
						saveAs: true 
						},
						function (downloadId) {
							console.log(file.name, 'DOWNLOAD sucess' );
						}		
					);
				});
			});	
	});


	buttonRenameFile = document.getElementById("test_file_rename");
	buttonRenameFile.addEventListener("click", function(e){
			var retVal = prompt("Enter name : ", currentFileName);
            console.log("You have entered : " + retVal);			
			if (retVal) {
				fsReq(function(fs) {
					fs.root.getFile(currentFileName, {create: false}, function(file) {
						file.moveTo( fs.root, retVal, function( new_node ){
							currentElem.setAttribute("file_name", retVal);
							currentElem.innerHTML = '<span>'+retVal+'</span>';
							console.log( new_node )
							textNameFile.textContent = retVal;
							currentFileName = retVal;
							console.log( "Succes creating the new node" ) //We were able to rename the node

						}, function( error ){
							console.error( error )
							console.error( "Something wrong when finding the parent" )
						})			
					});
				}); 
			}	
	});
	buttonDeleteFile = document.getElementById("test_file_delete");
	buttonDeleteFile.addEventListener("click", function(e){
			fsReq(function(fs) {
				fs.root.getFile(currentFileName, {create: false}, function(file) {
					file.remove(function() {
						console.log('File: ',currentFileName,'- removed.');
						
						textNameFile.textContent = '';
						currentFileName = null;

						buttonLoadFile.setAttribute('disabled', true); 
						buttonRenameFile.setAttribute('disabled', true); 
						buttonDeleteFile.setAttribute('disabled', true); 
						buttonPlayFile.setAttribute('disabled', true); 

						mediaContainer.removeChild( currentElem )
						currentElem = null;
					});
				}); 
			});	
	});

	buttonPlayFile = document.getElementById("test_file_play");
	buttonPlayFile.addEventListener("click", function(e){
			var url = 'filesystem:chrome-extension://'+host+'/persistent/'+currentFileName;
			videoPlayer.setAttribute('src', url);	
			setTimeout( function() {
				//videoPlayer.play();	
			}, 100); 
			
	});

	
	load_file()
	
	// --------------------------------------------------------------------------------
	chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
		
			if (request.akse == 'Message_FFMPEG') {
				add_message(request.message);
			}
	});		
			
	
}, false );

function E(event) {
	event.stopPropagation();												
}

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

function save(event) {
	
	var removeChars = /[\\\/:*?"<>|"']/g;
	var file_name = title.replace(removeChars, "");
						
	chrome.downloads.download({
							url: url,
							filename:  file_name+'.webm',
							saveAs: true 
							},
							function (downloadId) {
								console.log('DOWNLOAD', downloadId );
							}		
						); 
						
	event.stopPropagation();												
}

function saveAll(event) {
	
	window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;				
	window.requestFileSystem(window.PERSISTENT, 1024*1024, onInitFs, errorHandler);
	
	function onInitFs(fs) {
		
		console.log(fs);

		var dirReader = fs.root.createReader();
		var entries = [];

		// Call the reader.readEntries() until no more results are returned.
		var readEntries = function() {
			dirReader.readEntries (function(results) {
				if (!results.length) {
					listResults(entries.sort());
				} 
				else {
					entries = entries.concat(toArray(results));
					readEntries();
				}
			}, errorHandler);
		};

		readEntries(); // Start reading dirs.

	}	
	
	function toArray(list) {
	  return Array.prototype.slice.call(list || [], 0);
	}

	function listResults(entries) {
		entries.forEach(function(entry, i) {
			console.log(entry);
			downloadResults(entry.name);
		});
	}		

	function downloadResults(name) {
		var removeChars = /[\\\/:*?"<>|"']/g;
		var file_name = name.replace(removeChars, "");
		
		var url = 'filesystem:chrome-extension://'+host+'/persistent/'+name;
		console.log(url);
		
		chrome.downloads.download({
								url: url,
								filename:  file_name,
								saveAs: true 
								},
								function (downloadId) {
									console.log('DOWNLOAD', downloadId );
								}		
							); 
	}
	
	event.stopPropagation();												
}

function post_run( rez ) {

	console.log(rez);

	load_file();


}	

function load_file() {
	
	// очистим
	while( mediaContainer.firstChild )	mediaContainer.removeChild( mediaContainer.firstChild );
	
	fsReq(function(fs) {
		var dirReader = fs.root.createReader();
		
		var list = [];

		var readEntries = function(callback) {
			dirReader.readEntries(function(results) {
				if (results.length>0) {
					//console.log('FS: ', results.length);
					for (var i in results) list.push(results[i]);
					readEntries(callback);	
				} 
				else {
					callback();	
				}	
			}, self.errorHandler);
		  };
		  
		readEntries(function(){
			list.sort( function( item1, item2 )  {	return item1.fullPath > item2.fullPath ? 1 : -1;  	});
			list.forEach(function(entry, i) {
				var a = build(entry.name)
				mediaContainer.appendChild( a );
			}); 	
		});
	});		
	
}

// ---------------------------
function build(name) {

	var id = "file_"+(order++).toString()

	var a = document.createElement("a");
	a.setAttribute("class", "file_item");
	a.setAttribute("file_name", name);
	a.setAttribute("id", id);
	a.innerHTML = '<span>'+name+'</span>';
	
	a.addEventListener("click", function(e){
		
		currentElem = e.currentTarget;
		currentFileName = currentElem.getAttribute('file_name');

		var elems = document.querySelectorAll('.file_item');
		for (var i=0; i<elems.length; i++)	elems[i].classList.remove('current');	

		currentElem.classList.add('current');	

		textNameFile.textContent = currentFileName;

		buttonLoadFile.removeAttribute('disabled'); 
		buttonRenameFile.removeAttribute('disabled'); 
		buttonDeleteFile.removeAttribute('disabled'); 
		buttonPlayFile.removeAttribute('disabled'); 

		
	});

	return a;
  
}


// ---------------------------
function fsReq(cb) {
  webkitRequestFileSystem(PERSISTENT, 1 * 1024 * 1024 * 1024, cb);
}
// ---------------------------
function writeFile(fileName, blob, cb) {
	
	var error;
	fsReq(function(fs) {
		fs.root.getFile(fileName, {create: true}, function(file) {
			file.createWriter(function(writer) {
				writer.onwriteend = function() {
					if (DEBUG) console.log("write success", fileName);
					cb(error);
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

function add_file(name) {

	var a = build(name)
	mediaContainer.appendChild( a );
	
}

function add_message(msg) {
	
	console.log(msg);
	
	/*if (typeof msg == 'string') {
		var text = msg.substring(2, msg.length);
		text = text.replace(/\s/g,'&nbsp;');

		var div = document.createElement("div");
		div.setAttribute("class", "message_row");
		div.innerHTML = text;
		messageContainer.appendChild( div );
	}*/	
}