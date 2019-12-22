const DEBUG = false;

var host = null, 
	hash = null;
var isConvert = false;	

var media = null;

var fileName = "video";
var fileExt = "mp4";
var downloadName = "media";

var countTSFiles = 0,
	sizeOfVideo = 0,
	needConvert = false;
	
var initVideo = null,
	fn_InitVideo = null,
	initAudio = null,
	fn_InitAudio = null,
	audioExt = 'mp4';
	
var listVideoSegm = null,
	listAudioSegm = null;
	
var tabId = null,
	options = null;	
	
var streamVideo = null, streamAudio = null;	
var size_video = 0, size_audio = 0;	
var progress_video = 0, progress_audio = 0;	

var Utf8 = new UTF8();
var Async = new ASYNC();
var Utils = new UTILS();
var jspack = new JSPACK();
var FileSystem = new FILESYSTEM();
var ffmpegConvert = FFMPEG_CONVERT();
var Bootstrap = new BOOTSTRAP();
var fvdDownloader = {jspack: jspack};

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

		if (r.type == 'video') {
			progress_video = r.progress; 
			size_video = r.size; 
		}	
		else if (r.type == 'audio') {
			size_audio = r.size;	
			progress_audio = r.progress;	
		}
		if (progress_video && progress_audio) {
			var xv = size_video / progress_video * 100;
			var xa = size_audio / progress_audio * 100;
			sizeOfVideo = size_video + size_audio;
			var prg = parseInt(  sizeOfVideo / (xa+xv) * 100  );	
		}
		else {
			var prg = progress_video || progress_audio || 0;
		}	
		
		var rr = {'msg': 'progress', 'hash': r.hash, 'size': sizeOfVideo, 'progress': prg };
		
		chrome.extension.sendRequest( { command:"messageStreamVideo", mediaId: media.id, hash: hash, data: rr });

	}	
	else {
		chrome.extension.sendRequest( { command:"messageStreamVideo", mediaId: media.id, hash: hash, data: r });
	}	

}

// -------------------------------------------------------------------
function finish( r ) {

	console.log( r )
	
	message({'msg': 'finish', 'hash': hash, size: sizeOfVideo, error: r.error });

	chrome.extension.sendRequest( { command:"finishStreamVideo", hash: hash, data: r });

	if (!DEBUG) window.close();
	
}


// -------------------------------------------
function start( ) {
	
	console.log(media);
	
	if (!media.segments) return;

	var options = media.segments;

	needConvert = !!options.video && !!options.audio ? true : false;

	fileExt = media.ext;
	downloadName = media.downloadName;
	
	document.querySelector(".titleWrapper").textContent = downloadName;	
	Utils.jsonToDOM(media.displayLabel, document.querySelector(".labelWrapper"));
	
	document.getElementById("action_streams").setAttribute('style', 'display: block');
	document.getElementById("button_stream_cancel").removeAttribute("style");

	message( { msg: "start", hash: hash, status: 'start', size: 0, count: 0 });

	Async.chain([
		function(next) {				// segments
			if (options.video) {
				if (options.video.segments) {
					listVideoSegm = get_segments(options.video.segments, 'video');
					next();
				}
				else if (options.video.sidxUrl)  {
					Utils.arrayAJAX( options.video.sidxUrl, null, function( b ){
						var sidx = Bootstrap.getInfoSidx( b, options.video.firstOffset );
						listVideoSegm = get_index_range( options.video.baseUrl, sidx, 'video' );
						next();
					});	
				}
				else {
					next();
				}	
			}	
			else {
				next();
			}	
		},	
		function(next) {				// init video
			if (options.video) {
				if (options.video.initSeg) {
					initVideo = options.video.initSeg;
					fn_InitVideo = fileName + 'v_init';
					var b = Utils.b64toBlob(initVideo, 'video/mp4');
					FileSystem.writeFile(fn_InitVideo, b, function(){  
						if (DEBUG) console.log('write '+fn_InitVideo+' - success ');
						next();
					});
				}
				else if (options.video.initUrl) {
					Utils.arrayAJAX( options.video.initUrl, null, function( bb ){
						fn_InitVideo = fileName + 'v_init';
						initVideo = bb;
						var blob = new Blob([initVideo], {type: 'video/mp4'});
						FileSystem.createFile(fn_InitVideo, blob, function(){  
							if (DEBUG) console.log('write '+fn_InitVideo+' - success ');
							next();
						});
					});	
				}
				else {
					next();
				}	
			}	
			else {
				next();
			}	
		},	
		function(next) {
			if (options.audio) {
				if (options.audio.segments) {
					listAudioSegm = get_segments(options.audio.segments, 'audio');
					next();
				}
				else if (options.audio.sidxUrl)  {
					Utils.arrayAJAX( options.audio.sidxUrl, null, function( b ){
						var sidx = Bootstrap.getInfoSidx( b, options.audio.firstOffset );
						listAudioSegm = get_index_range( options.audio.baseUrl, sidx, 'audio' );
						next();
					});	
				}
				else {
					next();
				}	
			}	
			else {
				next();
			}	
		},		
		function(next) {				// init audio
			if (options.audio) {

				if (options.audio.initSeg) {
					initAudio = options.audio.initSeg;
					fn_InitAudio = fileName + 'a_init';
					var b = Utils.b64toBlob(initAudio, 'video/mp4');
					FileSystem.writeFile(fn_InitAudio, b, function(){  
						if (DEBUG) console.log('write '+fn_InitAudio+' - success ');
						next();
					});
				}
				else if (options.audio.initUrl) {
					Utils.arrayAJAX( options.audio.initUrl, null, function( bb ){
						fn_InitAudio = fileName + 'a_init';
						initAudio = bb;
						var blob = new Blob([initAudio], {type: 'video/mp4'});
						FileSystem.createFile(fn_InitAudio, blob, function(){  
							if (DEBUG) console.log('write '+fn_InitAudio+' - success ');
							next();
						});
					});	
				}
				else {
					next();
				}	
			}	
			else {
				next();
			}	
		},	
		function(next) {

			if (DEBUG) console.log( listVideoSegm, listAudioSegm);

			var listSegm = merge_array( listVideoSegm, listAudioSegm);

			if ( listSegm && listSegm.length>0 )  {

				streamVideo = new STREAM_LOAD();
				streamVideo.init({ type: 'video',
								   list: listSegm });
				streamVideo.start({ onMessage( msg ) {
										message( msg );
										if (msg.msg == "progress") {
											var e = document.getElementById("video_stream");
											e.querySelector(".progress").textContent = msg.progress.toString()+"%";
											e.querySelector(".size").textContent = Utils.str_download_size( msg.size );
											
										}
									},
									onFinish( rez ) {
										end( rez );	
									}	
					
								  });	

			}	
			else {
				end( {error: true } );	
			}

		}
	]);

	// ----------------------------------
	function get_index_range( baseUrl, sidx, type ) {

		var list = [];
		for(var j = 0; j < sidx.references.length; j++)  {
			list.push({ filename:    fileName.substring(1,4) + getFileNumber(),
						url: baseUrl + '&bytestart='+sidx.references[j].startRange+'&byteend='+sidx.references[j].endRange,
						type: type   }); 
		}
		return list;
	}
				 
	// ----------------------------------
	function get_segments( segm, type ) {
	
		var list = [];
		for(var j = 0; j < segm.length; j++)  {
			list.push({ filename:   fileName.substring(1,4) + getFileNumber(),
						url:  segm[j],  
						type: type   }); 
		}
		return list;
	}
				 
	// ---------------------------
	function end( rez ) {
		
		if (DEBUG) console.log( rez );
		
		document.getElementById("button_stream_cancel").setAttribute("style", "display: none");
		
		if ( !rez.error ) {
			convert( rez );
		}
		else {		
			message( { msg: "finish", hash: hash, status: 'stop' });
			finish({ error: true, hash: hash });
		}

	}	
}

// -------------------------------------------------------------------
function convert( rez ) {
	
	if (isConvert) return;
	isConvert = true;

	rezultStatus.querySelector(".state").textContent = 'progress';
	rezultStatus.setAttribute("style", "display: block");
	
	var file_name, file_name_video, file_name_audio;
	file_name = fileName+"."+fileExt;

	if (needConvert) {
		file_name_video = fileName+"_v."+fileExt;;
		file_name_audio = fileName+"_a."+fileExt;;
	}
	
	message({'msg': 'saving', 'hash': hash  });
	
	var fileVideo = [];
	var fileAudio = [];
	
	Async.chain( [
		function( chainCallback ){			//   load file
			if (fn_InitVideo)  fileVideo.push(fn_InitVideo);
			if (fn_InitAudio)  fileAudio.push(fn_InitAudio);
			
			for(var j = 0; j < rez.file.length; j++)  {
				
				var t = find( rez.file[j] );
				if (t == 'video') { 
					fileVideo.push(rez.file[j]);	
				}	
				else if (t == 'audio') { 
					fileAudio.push(rez.file[j]);	
				}	
			}	
			
			chainCallback();
		}, 
		function( chainCallback ){			//   video
			if (fileVideo.length>0) {
				var pp = { output: needConvert ? file_name_video : file_name, 
						   ext: fileExt, 
						   files: fileVideo   };
						   
				build_concat( pp, function(f){
					
					if (needConvert) {
						chainCallback();
					}
					else {
						_finish(f);
					}
				})
			}
			else {
				chainCallback();
			}	
		}, 
		function( chainCallback ){			//   audio
		
			if (fileAudio.length>0) {
				var pp = { output: needConvert ? file_name_audio : file_name, 
						   ext: audioExt,
						   files: fileAudio	 };
						   
				build_concat( pp, function(f){

					if (needConvert) {
						chainCallback();
					}
					else {
						_finish(f);
					}
				})
				
			}
			else {
				chainCallback();
			}	
		}, 
		function( chainCallback ){			// ffmpeg
		
			if ( needConvert ) {
		
				var arg = [ "-i", "/fs/"+file_name_video,
							"-i", "/fs/"+file_name_audio,
							"-cpu-used", "4",
							"-threads", "0",
							"-preset", "veryfast",
							"-c", "copy",
							"/fs/"+file_name ];
				
				console.log(arg.join(' '));
				
				ffmpegConvert.run(arg, {priority: true},
					function(f){
						console.log('finish', f);
						
						_finish(f)
						
						if (!DEBUG) {
							FileSystem.removeFile(file_name_video);
							FileSystem.removeFile(file_name_audio);
						}	
					},
					function(msg){
						if (DEBUG) console.log(msg);
					});
			}
		}
	] );
	
	function find( filename ) {
	
		if (listVideoSegm) {
			for (var ii=0; ii<listVideoSegm.length; ii++) {
				if ( listVideoSegm[ii].filename == filename ) return listVideoSegm[ii].type;	
			}	
		}
		if (listAudioSegm) {
			for (var ii=0; ii<listAudioSegm.length; ii++) {
				if ( listAudioSegm[ii].filename == filename ) return listAudioSegm[ii].type;	
			}	
		}		
		return null;
	}	

	function _finish(f) {
	
		rezultStatus.querySelector(".state").textContent = 'success';
		document.getElementById("action_streams").removeAttribute('style');
	
		message({'msg': 'finish', 'hash': hash, size: sizeOfVideo, filename: file_name, error: !f });
		var ff = [ { type: 'media', downloadName: downloadName, filename:  file_name  }]; 
		finish({ error: !f, hash: hash, size: sizeOfVideo, filename: ff, ext: fileExt });

		if (!DEBUG) {
			FileSystem.removeListFile(fileVideo);
			FileSystem.removeListFile(fileAudio);
		}	
	
	}	


}

// ---------------------------
function merge_array( arr1, arr2) {
	if ( !arr2 || !arr2.length )  return arr1;
	if ( !arr1 || !arr1.length )  return arr2;
	var list = [];
	var j1 = 0, j2 = 0;
	do {
		if (j1 < arr1.length) list.push(arr1[j1]);
		if (j2 < arr2.length) list.push(arr2[j2]);
		j1++;
		j2++;
	} while (j1 < arr1.length || j2 < arr2.length);	
	return list;
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
				"-c", "copy"];
	if (params.output.indexOf('mp3') == -1)  {
		arg.push('-bsf:a');
		arg.push('aac_adtstoasc');
	} 

	arg.push("/fs/"+params.output);

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
	return str.substring(str.length - 4, str.length);
}	

// -------------------------------------------
function stop( ) {

	if (streamVideo) streamVideo.stop();

}


