const DEBUG = false;

var host = null, 
	hash = null;
var isConvert = false;	

var media = null;

var fileName = "video";
var fileExt = "mp4";
var downloadName = "media";

var countTSFiles = 0,
	sizeOfVideo = 0;
	progress = 0;
	
var listSegm = null;
var loadSegm = null;
	
var tabId = null,
	options = null;	
	
var trial = 0;
var isRun = false;	

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

		if(message.type=="streamer-stop") {
			stop( );	
		}
	});


	// ------------- load file system
	chrome.extension.sendRequest( { command:"getVideoHash", hash: hash }, function( mm ){

		console.log( mm );
	
		media = mm.media;
		fileName = mm.fileName;
		
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

		sizeOfVideo = r.size; 
		progress = parseInt(  r.count / countTSFiles * 100  );
	
		var rr = {'msg': 'progress', 'hash': r.hash, 'size': sizeOfVideo, 'progress': progress };
		
		chrome.extension.sendRequest( { command:"messageStreamVideo", mediaId: media.id, hash: hash, data: rr });
		
		var e = document.getElementById("video_stream");
		e.querySelector(".progress").textContent = progress.toString()+"%";
		e.querySelector(".size").textContent = Utils.str_download_size( sizeOfVideo );

	}	
	else {
		chrome.extension.sendRequest( { command:"messageStreamVideo", mediaId: media.id, hash: hash, data: r });
	}	

}

// -------------------------------------------------------------------
function finish( r ) {

	console.log( r )
	
	message({'msg': 'finish', 'hash': hash, size: r.size, error: r.error });

	chrome.extension.sendRequest( { command:"finishStreamVideo", hash: hash, data: r });

	if (!DEBUG) window.close();
	
}


// -------------------------------------------
function start( ) {
	
	console.log(media);
	
	if (!media.combine) return;

	fileExt = media.ext;
	downloadName = media.downloadName;
	
	document.querySelector(".titleWrapper").textContent = downloadName;	
	Utils.jsonToDOM(media.displayLabel, document.querySelector(".labelWrapper"));
	
	document.getElementById("action_streams").setAttribute('style', 'display: block');
	document.getElementById("button_stream_cancel").removeAttribute("style");

	isRun = true;
	message( { msg: "start", hash: hash, status: 'start', size: 0, count: 0 });
	
	loadSegm = [];
	listSegm = [];
	
	load();
	
	// --------------------------
	function load() {
		
		if ( build_list(  ) > 0 ) {
			trial = 0;
			load_list();
		}
		else {
			load_pause();
		}	
		
	}	
	
	// ----------------------------------
	function load_pause(  ) {
		
		console.log('load_pause', trial);
		
		trial++;
		if (isRun && trial<3) {
			setTimeout( function(){

				if (isRun) {
					load();
				}
				
			}, 3000);
		}
		else {
			end();
		}
	}	
	
	// ----------------------------------
	function load_list(  ) {
		
		var list = [];
		
		for (var i=0; i<listSegm.length; i++) {
			if ( loadSegm.indexOf(listSegm[i].filename) == -1 )  list.push(listSegm[i]);
		}	
		
		if (list.length>0) {
		
			streamVideo = new STREAM_LOAD();
			streamVideo.init({ type: 'video',
							   list: list });
			streamVideo.start({ onMessage( msg ) {
									message( msg );
								},
								onFinish( rez ) {
									for (var i=0; i<rez.file.length; i++) {
										loadSegm.push(rez.file[i]);
									}	
									load_pause();
								}	
				
							  });	
		}
		else {
			load_pause();
		}
	
	}	
	
	// ----------------------------------
	function build_list(  ) {

		var options = media.combine;
		var kk = 0;
		
		//options.urls.length = 25;
	
		for (var i=0; i<options.urls.length; i++) {
			if (!find_segments( options.urls[i] )) {
				listSegm.push({ filename:   getFileNumber(),
								url:  		options.urls[i],  
								state: 		0   }); 
				kk++;				
			}	
		}
		
		countTSFiles = listSegm.length;
		
		return kk;
	}	
	
	// ----------------------------------
	function find_segments( url ) {

		for(var j = 0; j < listSegm.length; j++)  {
			
			if ( listSegm[j].url === url ) return true;
			
		}
		return false;
	}	

	// ---------------------------
	function end( rez ) {
		
		document.getElementById("button_stream_cancel").setAttribute("style", "display: none");
		
		convert( rez );

	}	
}

// -------------------------------------------------------------------
function convert( rez ) {
	
	if (isConvert) return;
	isConvert = true;

	rezultStatus.querySelector(".state").textContent = 'progress';
	rezultStatus.setAttribute("style", "display: block");
	
	message({'msg': 'saving', 'hash': hash  });
	
	var file_name = fileName+"."+fileExt;
	
	console.log(loadSegm);
	
	var pp = {  output: file_name, 
				ext: fileExt, 
				files: loadSegm   };
						   
	build_concat( pp, function(f){
			_finish(f);
	})
	
	function _finish(f) {
	
		rezultStatus.querySelector(".state").textContent = 'success';
		document.getElementById("action_streams").removeAttribute('style');
	
		message({'msg': 'finish', 'hash': hash, size: sizeOfVideo, filename: file_name, error: !f });
		var ff = [ { type: 'media', downloadName: downloadName, filename:  file_name  }]; 
		finish({ error: !f, hash: hash, size: sizeOfVideo, filename: ff, ext: fileExt });

		if (!DEBUG) {
			FileSystem.removeListFile(file);
		}	
	
	}	
}

// -------------------------------------------
//  files - или список файлов 
//  playlist
//  ext
//  output
//
function build_concat( params, callback ) {

	var cnct = 'concat:';
	for (var j=0; j<params.files.length; j++) {
		cnct = cnct + (j>0 ? '|' : '') + '/fs/' + params.files[j];
	}	
	
	var arg = [ "-i", cnct,		
				"-safe", "0",
				"-cpu-used", "4",
				"-threads", "0",
				"-preset", "veryfast",
				"-bsf:a", "aac_adtstoasc",
				"-c", "copy",
				"/fs/"+params.output ];

	console.log(arg.join(' '));

	ffmpegConvert.run(arg, {priority: true},
		function(f){
			console.log('finish', f);
			callback(f);
		},
		function(msg){
			if (DEBUG) console.log(msg);
	});
	
}

function E(event) {
	event.stopPropagation();												
}

// -------------------------------------------------------------------
lastFileNumber = 0;
function getFileNumber() {
	lastFileNumber++;
	var str = '00000' + lastFileNumber.toString();
	return str.substring(str.length - 5, str.length);
}	

// -------------------------------------------
function stop( ) {

	isRun = false;
	if (streamVideo) streamVideo.stop();

}


