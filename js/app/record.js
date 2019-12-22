const DEBUG = false;

var host = null, 
	hash = null;

var media = null;

var fileName = "video";
var fileExt = "mp4";
var downloadName = "media";

const MAX_RECORD_DOWNLOAD = 15;
const MIN_RECORD_DOWNLOAD = 3;
const COUNT_RECORD_CHUNK = 3;
const LOAD_RECORD_TIMEOUT = 300000;  // 5мин

const RECORD_UNDEFINED = 0
const RECORD_LOAD_PLAYLIST = 1
const RECORD_WORKING = 3
const RECORD_START_DOWNLOAD = 5;
const RECORD_SAVING = 10;
const RECORD_END_PLAYLIST = 11
const RECORD_FINALIZING = 20;
const RECORD_ABORT = 21;
const RECORD_FINISHING = 99;

const FILE_NULL = 0
const FILE_GET = 1
const FILE_LOAD = 2
const FILE_ERROR = 3
const FILE_SAVE = 4
const FILE_REMOVE = 5

var stateRecord = RECORD_UNDEFINED;
var endLoadPlayList = 0;

var playlist = null,
	template = null,
	manifest = null;

var host, domain, prot = "", search = null;

var sourceLive, 
	initSeg = null, 
	templateFrag = null,
	baseUrl = null,
	paramsBootstrap = null,
	paramsMetadata = null,
	headerUrl = null,
	fn_InitSeg = null;

var isRun = false;
var isSave = false;
var isEnd = false;

var countLoad = 0;
var countTSFiles = 0;
var sizeOfVideo = 0;

var blockStartReadTS = 0,
	queue=0,
	file = [];
	
var listFN = null;

var Utf8 = new UTF8();
var Async = new ASYNC();
var Utils = new UTILS();
var jspack = new JSPACK();
var FileSystem = new FILESYSTEM();
var ffmpegConvert = FFMPEG_CONVERT();
var Bootstrap = new BOOTSTRAP();
	
window.onbeforeunload = function() {
	chrome.extension.sendRequest( { command:"finishStreamVideo", hash: hash, mediaId: media.id, data: {error: true, metod: media.metod} });
}

window.addEventListener( "load", function(){
	
	host = document.location.host;
	hash = document.location.hash.replace('#', '');
	
	console.log(hash);
	
	chrome.extension.onRequest.addListener(function(message, sender, sendResponse) {

		if(message.type=="recorder-stop") {
			stop( );	
		}
	});


	// ------------- load file system
	chrome.extension.sendRequest( { command:"getVideoHash", hash: hash }, function( mm ){

		console.log( mm );
	
		media = mm.media;
		fileName = mm.fileName;
		fileExt = media.ext;
		
		start( );
	
	});	
	
	rezultStatus = document.getElementById("rezult_status")
	rezultStatus.removeAttribute("style");

	document.getElementById("button_stream_cancel").addEventListener("click", stop, false);	
	document.getElementById("button_stream_close").addEventListener("click", function(){
		window.close();
	}, false);	

}, false );

// -------------------------------------------
function message( r ) {
	
	r.metod = media.metod;
	
	if (r.msg == "progress") {

		var e = document.getElementById("video_stream");
		e.querySelector(".size").textContent = Utils.str_download_size( sizeOfVideo );

		var rr = {'msg': 'progress', 'hash': r.hash, 'size': sizeOfVideo  };
		
		chrome.extension.sendRequest( { command:"messageStreamVideo", mediaId: media.id, hash: hash, data: rr });

	}	
	else {
		chrome.extension.sendRequest( { command:"messageStreamVideo", mediaId: media.id, hash: hash, data: r });
	}	

}

// -------------------------------------------------------------------
function finish( r ) {
	
	message({'msg': 'finish', 'hash': hash, size: sizeOfVideo, filename: fileName, error: r.error });

	chrome.extension.sendRequest( { command:"finishStreamVideo", hash: hash, data: r });

	if (!DEBUG) window.close();
	
}


// -------------------------------------------
function start( ) {

	console.log(media);

	playlist = media.playlist ? media.playlist : null;
	template = media.template ? media.template : null;
	manifest = media.manifest ? media.manifest : null;

	hash = media.hash;
	tabId = media.tabId;
	sourceLive = media.source; 
	fileExt = media.ext;
	downloadName = media.downloadName;

	countLoad = 0;
	countTSFiles = 0;
	sizeOfVideo = 0;
	blockStartReadTS = 0;
	queue=0;
	file = [];
	
	document.querySelector(".titleWrapper").textContent = downloadName;	
	Utils.jsonToDOM(media.displayLabel, document.querySelector(".labelWrapper"));
	
	document.getElementById("action_streams").setAttribute('style', 'display: block');
	document.getElementById("button_stream_cancel").removeAttribute("style");


	message( { msg: "start", hash: hash, status: 'start', size: 0, count: 0 });

	isRun = true;
	stateRecord = RECORD_LOAD_PLAYLIST;

	listFN = [];

	if ( playlist ) {
		initSeg = playlist.video.initSeg ? playlist.video.initSeg : null;
		var url = playlist.video.url;
		var x = Utils.parse_URL(url);
		host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
		domain = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '');
		search = x.search || "";
		
	}
	else if ( template ) {
		initSeg = template.video.initSeg ? template.video.initSeg : null;
		headerUrl = template.video.headerUrl ? template.video.headerUrl : null;
		templateFrag = template.video.frag ? template.video.frag : null;

		var url = template.video.url;
		var x = Utils.parse_URL(url);
		host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
		domain = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '');
		search = x.search || "";

		baseUrl = template.video.base_url ? template.video.base_url : host;
		
	}
	else if ( manifest ) {
		paramsBootstrap = {	uri: manifest.video.base_url   };
	}

	if (initSeg) {
		fn_InitSeg = fileName + '_init.mp4';
		var b = new Blob([initSeg], {type: 'video/mp4'});
		FileSystem.writeFile(fn_InitSeg, b, function(){  
			if (DEBUG) console.log('write '+fn_InitSeg+' - success ');
		});
		listFN.push(fn_InitSeg);
	}	
	
	if (headerUrl) {
		var f = { fn: "header",
				  url: headerUrl, 
				  name: "header.mp4", 	
				  state: FILE_NULL,
				  stream: null
				};
		file.push(f);		
	}

	load( );
}

// -------------------------------------------------------------------
function load( ){

	if (DEBUG) console.log( 'load ', isRun );

	if (!isRun)   return;

	if (stateRecord != RECORD_LOAD_PLAYLIST)  return;

	if ( playlist ) {
		load_playlist();
	}
	else if ( template ) {
		load_template();
	}
	else if ( manifest ) {
		load_manifest();
	}

}

// -------------------------------------------------------------------
function load_playlist( ){

	if (DEBUG) console.log( 'load_playlist: ', playlist.video.url );

	load_playlist_file( playlist.video.url, function( results ){

			if (!isRun)   return;

			if (stateRecord == RECORD_FINISHING)      return;
			
			var kk = 0;
			for (var i=0; i<results.length; i++)    {
			
				if ( !find_file(results[i]) ) {
					
					var u = results[i];
					if (u.indexOf('http') != 0) {
						if (u.indexOf('/') == 0)  u = domain + u;
						else	u = host + u;
					}
					if (u.indexOf('?') == -1 && search) {
						u = u + search;
					}    

					var f = { fn: results[i], 
							  url: u, 
							  name: _nextRecordId()+"."+fileExt, 	
							  state: FILE_NULL,
							  stream: null
					        };

					file.push( f );
					
					kk++;
				}    
			}	
			
			if ( kk > 0 ) {
				loadFile(f);
			}
			else {	
				setTimeout(function() {  
					load();
				}, 3000);    
			}
			countTSFiles = file.length;

	}); 

	// -------------------------------------------------------------
	function load_playlist_file(url, callback)  {
		
		if (DEBUG) console.log( 'load_playlist_file: ', hash, url );
		
		var results = [];
		
		getAJAX( url, function(content){
			if (!content) return;
			if (stateRecord != RECORD_LOAD_PLAYLIST || !isRun)  return;

			var line = content.split('\n');
			
			for (var i=0; i<line.length; i++)    {

				line[i] = line[i].trim();
				if ( !line[i] )   continue;   
				
				if ( line[i].substring(0,1) != '#' )   {
					var u = line[i];
					results.push(u);
				}
			}
			
			callback(results);
		});	

	}


}	

// -------------------------------------------------------------------
function load_template( ){

	var httpRequest = new XMLHttpRequest(); 
	httpRequest.open ("GET", template.video.url, true);
	httpRequest.responseType = "arraybuffer"; 
	httpRequest.onreadystatechange = function() {
			if (httpRequest.readyState==4) {
				if (IsRequestSuccessful (httpRequest)) 	{

					var arr = new Uint8Array(httpRequest.response);
					var ind = jspack.ReadInt32(arr, 0);

					var u = templateFrag.replace('%%id%%', ind).trim();

					if ( !find_file(u) ) {
						
						var f = { fn: u,
								  url: baseUrl + u, 
								  name: _nextRecordId()+"."+fileExt, 	
								  state: FILE_NULL,
								  stream: null
						        };
						
						file.push( f );
						countTSFiles = file.length;
						
						loadFile(f);
					}    
					else {
						setTimeout(function() {  
							load();
						}, 3000);    
					}
					
				}
				else 	{
					console.log('====ERROR=====load_dash==== httpRequest =====');
				}
			}
	};

	httpRequest.send();
}	

// -------------------------------------------------------------------
function load_manifest( ){
	
	console.log(playlistUrl);
	var paramsBootstrap = {	uri: baseUrl };

	var httpRequest = new XMLHttpRequest(); 
	httpRequest.open ("GET", playlistUrl, true);
	httpRequest.responseType = "arraybuffer"; 
	httpRequest.onreadystatechange = function() {
			if (httpRequest.readyState==4) {
				if (IsRequestSuccessful (httpRequest)) 	{

					var arr = new Uint8Array(httpRequest.response);

					var list = Bootstrap.listSegment(arr, paramsBootstrap);

					var kk = 0;
					for (var i=0; i<list.length; i++)    {
					
						if ( !find_file(list[i]) ) {
							
							var u = list[i];
							if (u.indexOf('?') == -1 && search) {
								u = u + search;
							}    
							
							var f = { fn: list[i],
									  url: u, 
									  name: _nextRecordId()+"."+fileExt, 	
									  state: FILE_NULL,
									  stream: null
									};
							
							file.push( f );
							
							kk++;
						}    
					}	
			
					if ( kk > 0 ) {
						loadFile(f);
					}
					else {	
						setTimeout(function() {  
							load();
						}, 3000);    
					}
					countTSFiles = file.length;

				}
				else 	{
					console.log('====ERROR=====load_dash==== httpRequest =====');
				}
			}
	};

	httpRequest.send();
}	

// -------------------------------------------------------------
function loadFile( )  {

	if (DEBUG) console.log( 'loadFile: ', queue, file);
	
	if (!isRun)   return;
	
	if ( queue < MIN_RECORD_DOWNLOAD ) {
		
		var kk = 0;
		for(var i = 0; i < file.length; i++)     	{
			
			if (isRun && file[i].state==0)      	{
				
				kk++;
				loadRecordFile(file[i]);
													
				if (queue >= MAX_RECORD_DOWNLOAD)  {  // очеред заполнили
					return;
				}	
			}
		}
		
		if (kk==0) {		// playlist пуст - обращаемся за новым
			load();	
		}
	}
}

// -------------------------------------------------------------
function IsRequestSuccessful (httpReq) {
	var success = (httpReq.status == 0 || (httpReq.status >= 200 && httpReq.status < 300) || httpReq.status == 304 || httpReq.status == 1223);
	return success;
}
function loadRecordFile( f )  {

	if (DEBUG) console.log( 'loadRecordFile: ', f);
	
	if (!isRun)   return;

	try	{
		var httpRequest = new XMLHttpRequest(); 
		f.req = httpRequest;					
		f.state = FILE_GET;
		
		httpRequest.open ("GET", f.url, true);
		httpRequest.responseType = "arraybuffer"; 
		httpRequest.onreadystatechange = function() {
				if (httpRequest.readyState==4) {
					if (IsRequestSuccessful (httpRequest)) 	{
						
						f.req = null;
						clearTimeout( f.timer );
						f.timer = null;
						
						f.state = FILE_LOAD;						
						
						var t = httpRequest.getResponseHeader("Content-Type");

						var b = new Uint8Array(httpRequest.response);
						sizeOfVideo += b.length;
						
						var blob = new Blob([b], {type: t});
						FileSystem.writeFile(f.name, blob, function(){
							listFN.push(f.name);
							f.state = FILE_SAVE;
							endLoadRecordFile(false);	
						})
						
					}
					else 	{
						console.log('===============ERROR===================== httpRequest ==========');
						endLoadRecordFile(true);
					}
					queue--;	// очередь скачки уменьшаем (на эту скачку)
				}
		};
		
		f.timer = setTimeout(function () { 
		
				httpRequest.onreadystatechange = null;
				httpRequest.abort();
				file[index].req = null;
				clearTimeout( f.timer );
				f.timer = null;
				f.state = FILE_ERROR;	

				endLoadRecordFile(true);		
				
			}, LOAD_RECORD_TIMEOUT);
		
		
		httpRequest.send();
		queue++;		// еще одна закачка
		
	}
	catch(err)	{
		console.log('===============CATCH===================== httpRequest ==========', err);
		endLoadRecordFile(true);
	}
}

// -------------------------------------------------------------
function endLoadRecordFile(error)  {

	if (DEBUG) console.log( 'endLoadRecordFile:  error:',error, ', isSave:',isSave );
	
	if (isSave) return;

	// подсчитаем состояние
	var flagEmpty = false;
	isEnd = true;

	countLoad = 0;

	for (var j=0; j<file.length; j++) {

		if (file[j].state > FILE_GET) countLoad++;			// скачано сегментов
		else isEnd = false;
		
		if (!file[j].stream && file[j].state == FILE_GET) {			// на очереди на чтение, но не прочитано (
			flagEmpty = true;
		}	
	}

	// сообщение	
	message({'msg': 'progress', 'hash': hash, 'size': sizeOfVideo, 'count': countLoad,  });
	
	if (isRun) {
		if (isEnd) {
			load();			// дальнейшие обращаемся за плейлистом
		}
		else {
			loadFile();		// остальные файлы
		}	
	}	
		
}


// -------------------------------------------------------------------
function find_file( fn ) {

	for (var j=0; j<file.length; j++)    {
		if (file[j].fn === fn) return true;
	}    
	return false;
}

// --------------------------------------------------------------------------------
function getAJAX( url, callback ){
	var ajax = new XMLHttpRequest();
	ajax.open('GET', url, true);
	ajax.setRequestHeader('Cache-Control', 'no-cache');
	ajax.onload = function(){
				var content = this.responseText;
				callback( content );
	}
	ajax.onerror = function(){
		callback( null );
	}
	ajax.send( null );
}

// --------------------------------------------------------------------------------
function workingEnd( ){
	
	if (DEBUG) console.log(' workingEnd', file );   

	document.getElementById("button_stream_cancel").setAttribute("style", "display: none");
	
	message({'msg': 'saving', 'hash': hash  });

	isSave = true;

	runConcat();
	
	
}

// --------------------------------------------------------------------------------
function runConcat( ){
	
	var file_name = fileName+"."+fileExt;
	var fileSave = [];
	var k = 0;  
	for(var j = 0; j < file.length; j++)       {
		if (file[j].state == FILE_SAVE) {
			fileSave.push(file[j].name);
			k++;
		}
		else {
			break;	
		}	
	}
	
	var ii = 0;
	var cnct = 'concat:';
	if (fn_InitSeg)  {
		cnct = cnct + '/fs/' + fn_InitSeg;
		ii++;
	}	
	for (var j=0; j<fileSave.length; j++) {
		cnct = cnct + (ii>0 ? '|' : '') + '/fs/' + fileSave[j];
		ii++;
	}	
	
	var params = [ "-i",  cnct,
				   "-safe", "0",
				   "-cpu-used", "4",
				   "-threads", "0",
				   "-preset", "veryfast",
				   "-c", "copy",
				   "-bsf:a", "aac_adtstoasc",
				   "/fs/"+file_name	
				 ];
	
	ffmpegConvert.run(params, {priority: true},
		function(f){
			console.log('finish', f);
			rezultStatus.querySelector(".state").textContent = 'success';
			document.getElementById("action_streams").removeAttribute('style');
			
			message({'msg': 'finish', 'hash': hash, size: sizeOfVideo, filename: file_name, error: !f });

			var ff = [ { type: 'media', downloadName: downloadName, filename:  file_name  }]; 
			finish({ error: false, hash: hash, size: sizeOfVideo, filename: ff, ext: fileExt});

			if (!DEBUG) 		FileSystem.removeListFile(listFN);
		},
		function(msg){
			if (DEBUG) console.log(msg);
		});
	
	
}


// --------------------------------------------------------------------------------
function runConcatFile( ){

	var file_name = fileName+"."+fileExt;

	message({'msg': 'saving', 'hash': hash  });

	Async.arrayProcess( file, function( f, apCallback ){

					var blob = new Blob([f.stream], {type: "video/mp4"});
					FileSystem.writeFile(file_name, blob, function(){  
							if (DEBUG) console.log('write: '+file_name+' - success ');
							apCallback();
					});
					
			}, function(){

					rezultStatus.querySelector(".state").textContent = 'success';
					message({'msg': 'finish', 'hash': hash, size: sizeOfVideo, filename: file_name, error: false });
					
					var ff = [ { type: 'media', downloadName: downloadName, filename:  file_name  }]; 
					
					finish({ error: false, hash: hash, size: sizeOfVideo, filename: ff, ext: fileExt});

			});

}


// ---------------------------
var _lastRecordId = 0;
function _nextRecordId(){
	_lastRecordId++;
	var str = '000000' + _lastRecordId.toString();
	return fileName+'_'+str.substring(str.length - 6, str.length);
}


function E(event) {
	event.stopPropagation();												
}

// -------------------------------------------
function stop( ) {

	isRun = false;

	for (var i = 0; i < file.length; i++)        {
		if ( file[i].state == FILE_GET ) {
			file[i].req.abort(); 
			file[i].state = FILE_ERROR;
		}
	} 
	
	workingEnd();
}


