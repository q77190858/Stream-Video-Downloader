const DEBUG = false;

var host = null, hash = null;

var media = null;

var fileName = "video";
var fileExt = "mp4";
var downloadName = "media";

var streamVideo = false, 
	streamAudio = false;

var video_size = 0, video_total = 0,
	audio_size = 0, audio_total = 0;	

var rezultStatus = null;

var video_xhr = null,
	audio_xhr = null;    
			
var videoUrl = null,
	videoExt = 'mp4',
	audioUrl = null,
	audioExt = 'mp4',
	tabId = null;
	
var filename_video = null,    
	filename_audio = null,
	filename_video_tmp = null;
	
var Utf8 = new UTF8();
var Async = new ASYNC();
var Utils = new UTILS();
var jspack = new JSPACK();
var FileSystem = new FILESYSTEM();
var ffmpegConvert = new FFMPEG_CONVERT();
var Bootstrap = new BOOTSTRAP();

window.onbeforeunload = function() {
	chrome.extension.sendRequest( { command:"finishStreamVideo", hash: hash, mediaId: media.id, data: {error: true, metod: media.metod} });
}

window.addEventListener( "load", function(){
	
	host = document.location.host;
	hash = document.location.hash.replace('#', '');
	
	console.log(hash);
	
	chrome.extension.onRequest.addListener(function(message, sender, sendResponse) {

		if(message.type=="converter-stop") {
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
	
	rezultStatus = document.getElementById("rezult_status");
	rezultStatus.removeAttribute("style");

	document.getElementById("button_stream_cancel").addEventListener("click", stop, false);	
	document.getElementById("button_stream_close").addEventListener("click", function(){
		window.close();
	}, false);	
	
	
}, false );

// -------------------------------------------
function message( r ) {
	
	chrome.extension.sendRequest( { command:"messageStreamVideo", mediaId: media.id, hash: hash, data: r });

}

// -------------------------------------------------------------------
function finish( r, fn, err ) {
	
	message({'msg': 'finish', 'hash': hash, size: r, error: err });

	if ( err ) {
		rezultStatus.querySelector(".progress").textContent = "";
		rezultStatus.querySelector(".state").textContent = "";
		
		chrome.extension.sendRequest( { command:"finishStreamVideo", hash: hash, data: {error: true, hash: hash} });
	}
	else {	
		rezultStatus.querySelector(".progress").textContent = "100%";
		rezultStatus.querySelector(".state").textContent = 'success';
		
		var data = { error: err, 
					 hash: hash, 
					 size: r,
					 ext: videoExt,	
					 filename: fn
				   };
		
		chrome.extension.sendRequest( { command:"finishStreamVideo", hash: hash, data: data });
	}	

	if (!DEBUG) window.close();
	
}


// -------------------------------------------
function start( ) {

	if (!media.params) return;
	
	hash = media.hash;
	videoUrl = media.url;
	audioUrl = media.params.audio_url;
	videoExt = media.ext;
	audioExt = media.params.audio_ext;
	tabId = media.tabId;
	
	filename_video = 'v'+fileName + '.'+videoExt;
	filename_audio = 'a'+fileName + '.'+audioExt;
	
	downloadName = media.downloadName;
	
	document.querySelector(".titleWrapper").textContent = downloadName;	
	Utils.jsonToDOM(media.displayLabel, document.querySelector(".labelWrapper"));

	document.getElementById("action_streams").setAttribute('style', 'display: block');
	
	message( { msg: "start", hash: hash, status: 'start', size: 0, count: 0 });
	
	document.getElementById("button_stream_cancel").removeAttribute("style");
	
	Async.chain( [
	
		function( chainCallback ){			//   video
			video_xhr = FileSystem.get( videoUrl, 
				function(size, total) {
					var elem = document.getElementById("video_stream");
					elem.querySelector(".progress").textContent = parseInt( size / total * 100) +"%";
					elem.querySelector(".size").textContent = Utils.str_download_size( size ) + ' / ' + Utils.str_download_size( total );
					video_total = total;
					video_size = size;
					progress();
				},
				function(rez){ 
					if (rez.error) {
						console.log('-----ERROR-----');
						end_error();
					}
					else {
						var blob = new Blob([ rez.stream ]);
						FileSystem.createFile(filename_video, blob, function(){		
							streamVideo = true;
							end();
						})
					}
					video_xhr = null;
				});					
			chainCallback();	
		}, 
		function( chainCallback ){			//   audio
			audio_xhr = FileSystem.get( audioUrl, 
				function(size, total) {
					var elem = document.getElementById("audio_stream");
					elem.querySelector(".progress").textContent = parseInt( size / total * 100) +"%";
					elem.querySelector(".size").textContent = Utils.str_download_size( size ) + ' / ' + Utils.str_download_size( total );
					audio_total = total;
					audio_size = size;
					progress();
				},
				function(rez){ 
					if (rez.error) {
						console.log('-----ERROR-----');
						end_error();
					}
					else {
						var blob = new Blob([ rez.stream ]);
						FileSystem.createFile(filename_audio, blob, function(){		
							streamAudio = true;
							end();
						})
					}
					audio_xhr = null;
				});					
		}
	] );
	
	// ---------------------------
	function progress(  ) {
		var x = video_size + audio_size;
		var y = video_total + audio_total;
		if (y>0)  var p = Math.round( 100 * x / y );
		message({'msg': 'progress', 'hash': hash, 'size': x, 'progress': p });
	};

	// ---------------------------
	function end_error(  ) {

		console.log('END_ERROR');

		if (video_xhr) video_xhr.abort();
		if (audio_xhr) audio_xhr.abort();
		
		finish( 0, null, true );
	}	
				 
	// ---------------------------
	function end(  ) {
		
		if (DEBUG) console.log( 'END', streamVideo, streamAudio );

		if ( !streamVideo || !streamAudio ) return;

		document.getElementById("button_stream_cancel").setAttribute("style", "display: none");
		
		message({'msg': 'saving', 'hash': hash  });
		
		rezultStatus.querySelector(".state").textContent = 'progress';
		rezultStatus.setAttribute("style", "display: block");
		
		var y = video_total + audio_total;
		var file_name = fileName+"."+fileExt;

		var arg = [ "-i", "/fs/"+filename_video,
					"-i", "/fs/"+filename_audio,
					"-cpu-used", "4",
					"-threads", "0",
					"-preset", "veryfast",
					"-c", "copy",
					"/fs/"+file_name ];
		
		console.log(arg.join(' '));
		
		ffmpegConvert.run(arg, {priority: true},
			function(f){
				console.log('finish', f);
				rezultStatus.querySelector(".state").textContent = 'success';
				document.getElementById("action_streams").removeAttribute('style');
				
				message({'msg': 'finish', 'hash': hash, size: y, filename: fileName, error: !f });

				var ff = [ { type: 'media', downloadName: downloadName, filename:  file_name  } ]; 
				finish(y, ff, false);

				if (!DEBUG) {
					FileSystem.removeFile(filename_video);
					FileSystem.removeFile(filename_audio);
				}	
			},
			function(msg){
				if (DEBUG) console.log(msg);
				//var prg = readMessage(msg);
				//if (prg) message({'msg': 'concat', 'hash': hash, 'progress': prg, size: concatByte, run: runTime });
			});


	}	
}


function E(event) {
	event.stopPropagation();												
}

// -------------------------------------------
function stop( ) {
	
	document.getElementById("button_stream_cancel").setAttribute("style", "display: none");
	
	if (video_xhr) video_xhr.abort();
	if (audio_xhr) audio_xhr.abort();
	
}


