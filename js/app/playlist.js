const DEBUG = false;

var host = null, 
	hash = null;
var isConvert = false;	

var media = null;

var fileName = "video";
var fileExt = "mp4";
var downloadName = "media";

var listUrl = null,
	countTSFiles = 0,
	sizeOfVideo = 0,
	needConvert = false;
	
var streamVideo = null, streamAudio = null;	
var rezVideo = null, rezAudio = null;	
var size_video = 0, size_audio = 0;	
var progress_video = 0, progress_audio = 0;	

var rezultStatus = null;
var listRemoveFiles = [];
			
var options,
	initVideo = null,
	initAudio = null,
	videoPlaylistUrl = null,
	videoExt = null,
	audioPlaylistUrl = null,
	audioExt = null,
	videoPlaylistFileName = null,
	audioPlaylistFileName = null;
	
var Utf8 = new UTF8();
var Async = new ASYNC();
var Utils = new UTILS();
var jspack = new JSPACK();
var FileSystem = new FILESYSTEM();
var ffmpegConvert = FFMPEG_CONVERT();
var Bootstrap = new BOOTSTRAP();

//对刷新页面操作进行错误处理，麻烦
 window.onbeforeunload = function() {
 	chrome.extension.sendRequest( { command:"finishStreamVideo", hash: hash, mediaId: media.id, data: {error: true, metod: media.metod} });
 }

window.addEventListener( "load", function(){
	
	host = document.location.host;
	//得到页面地址栏中的hash值
	hash = document.location.hash.replace('#', '');
	
	console.log(hash);
	
	chrome.extension.onRequest.addListener(function(message, sender, sendResponse) {

		if(message.type=="streamer-stop") {
			stop( );	
		}
	});


	// ------------- load file system
	//这个下载页面单开一个tab因为下载和转换很费CPU，要是在bg页面会阻塞主线程，所以单开一个进程
	//通过hash值来发送请求给bg，获得要下载的视频信息
	//可以修改bg来实现控制下载数量
	chrome.extension.sendRequest( { command:"getVideoHash", hash: hash }, function( mm )
	{
		//如果不是自己请求的hash的信息，就不处理
		//console.log("mm.hash and hash:",mm.media.hash,hash);
		//if(mm.media.hash!=hash)return;
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

	//window.onbeforeunload会触发一次发送，这里就不需要发送了
	chrome.extension.sendRequest( { command:"finishStreamVideo", hash: hash, data: r });
	window.onbeforeunload = function() {}

	if (!DEBUG) window.close();
	
}


// -------------------------------------------
function start( ) {

	queue = 0;
	hash = media.hash;
	url = media.url;
	tabId = media.tabId;
	
	fileExt = media.ext;
	downloadName = media.downloadName;
	
	document.querySelector(".titleWrapper").textContent = downloadName;	
	Utils.jsonToDOM(media.displayLabel, document.querySelector(".labelWrapper"));
	
	document.getElementById("action_streams").setAttribute('style', 'display: block');

	message( { msg: "start", hash: hash, status: 'start', size: 0, count: 0 });
	
	var options = media.playlist;

	videoPlaylistUrl = options.video.url;
	videoExt = options.video.ext;
	initVideo = options.video.initSeg ? options.video.initSeg : null; 

	if (options.audio) {
		audioPlaylistUrl = options.audio.url;
		audioExt = options.audio.ext;
		initAudio = options.audio.initSeg ? options.audio.initSeg : null; 
	}

	var listUrl = [];

	Async.chain( [
	
		function( next ){			//   video m3u8
			if (videoPlaylistUrl) {
				get_playlist(videoPlaylistUrl, function(list, nw){

					videoPlaylistFileName = fileName+'_video.m3u8'; 
					
					for (var i=0; i<list.length; i++) {
						listUrl.push( list[i] );
					}
					videoPlaylist = nw;

					var text = videoPlaylist.join('\n');
					var blob = new Blob([text], {type:'text/plain'});
					
					FileSystem.createFile(videoPlaylistFileName, blob, function(){ 
						if (DEBUG) console.log('Playlist: '+videoPlaylistFileName+' create successfull');
						next();
					});
					
				}); 	
			}	
			else {
				next();
			}
		}, 
		function( next ){			//   audio m3u8
			if (audioPlaylistUrl) {
				get_playlist(audioPlaylistUrl, function(list, nw){

					audioPlaylistFileName = fileName+'_audio.m3u8';
				
					for (var i=0; i<list.length; i++) {
						listUrl.push( list[i] );
					}
					audioPlaylist = nw;

					var text = audioPlaylist.join('\n');
					var blob = new Blob([text], {type:'text/plain'});
					
					FileSystem.createFile(audioPlaylistFileName, blob, function(){ 
						if (DEBUG) console.log('Playlist: '+audioPlaylistFileName+' create successfull');
						next();
					});
				}); 	
			}	
			else {
				next();
			}
		}, 
		function( chainCallback ){		

			streamVideo = new STREAM_LOAD();
			streamVideo.init({ type: 'video',
							   list: listUrl });
							   
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
	] );
				 
	// ---------------------------
	function end( rez ) {
		
		if (DEBUG) console.log( rez );
		
		document.getElementById("button_stream_cancel").setAttribute("style", "display: none");
		
		if ( !rez.error ) {

			convert( function() {
			
				if (!DEBUG) {
					FileSystem.removeListFile(rez.file);
					if (videoPlaylistFileName) FileSystem.removeFile(videoPlaylistFileName);
					if (audioPlaylistFileName) FileSystem.removeFile(audioPlaylistFileName);
				}	
				
			});
			
		}			

	}	
}

// -------------------------------------------------------------------
function convert( callback ) {
	
	if (isConvert) return;
	isConvert = true;
	
	var hh = videoPlaylistFileName || audioPlaylistFileName || null;

	if (!hh) {
		message( { msg: "finish", hash: hash, status: 'stop' });
		finish({ error: true, hash: hash });
		return;
	}

	rezultStatus.querySelector(".state").textContent = 'progress';
	rezultStatus.setAttribute("style", "display: block");
	
	var file_name, file_name_video, file_name_audio, cnvrt = false;
	file_name = fileName+"."+fileExt;
	
	if (videoPlaylistFileName && audioPlaylistFileName) {
		file_name_video = "v_"+file_name;
		file_name_audio = "a_"+file_name;
		cnvrt = true;
	}
	
	message({'msg': 'saving', 'hash': hash  });
	
	Async.chain( [
		function( chainCallback ){			//   video
			if (videoPlaylistFileName) {
				var pp = { output: cnvrt ? file_name_video : file_name, 
						   ext: fileExt, 
						   playlist: videoPlaylistFileName     };
						   
				build_playlist( pp, function(f){
					
					if (cnvrt) {
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
		
			if (audioPlaylistFileName) {
				var pp = { output: cnvrt ? file_name_audio : file_name, 
						   ext: audioExt,
						   playlist: audioPlaylistFileName,
						 };
						   
				build_playlist( pp, function(f){

					if (cnvrt) {
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
		
			if ( cnvrt ) {
		
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

	function _finish(f) {
	
		rezultStatus.querySelector(".state").textContent = 'success';
		document.getElementById("action_streams").removeAttribute('style');
	
		message({'msg': 'finish', 'hash': hash, size: sizeOfVideo, filename: file_name, error: !f });
		var ff = [ { type: 'media', downloadName: downloadName, filename:  file_name  }]; 
		finish({ error: !f, hash: hash, size: sizeOfVideo, filename: ff, ext: fileExt });
	
		callback();
	}	

}

// -------------------------------------------
//  files - или список файлов 
//  playlist
//  ext
//  output
//
function build_playlist( params, callback ) {
	
	if (DEBUG) console.log('build_playlist', params);

	var arg = [ "-i", "/fs/"+params.playlist,		
				"-safe", "0",
				"-cpu-used", "4",
				"-threads", "0",
				"-preset", "veryfast",
				"-c", "copy" ];
			
	if (params.ext != 'mp3' && params.ext != 'ts') {
		arg.push("-bsf:a");
		arg.push("aac_adtstoasc");
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

// ----------------------------------
function get_playlist( url, callback ) {

	if (DEBUG) console.log('Playlister.load playlist', url );	
	
	if ( !url ) return callback( null );

	var domain = null, 
		host = url, 
		prot = "", 
		search = null;
	var x = Utils.parse_URL(url);
	host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
	domain = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '');
	search = x.search || "";

	if (DEBUG) console.log('host:', host, '\ndomain:', domain, '\nsearch:', search );	
	
	var results = [];
	var newPlaylist = [];

	FileSystem.loadText( url, function(rez){
		
		if (rez.error) {
			console.log('-----ERROR-----');
			callback( null );
		}
		else {
			
			var content = rez.response;

			var lines = content.split('\n');
			if ( lines.length<2 ) return;
			if ( lines[0].replace(/\r/, '') != '#EXTM3U' ) return;

			var ll = [];

			for (var i=0; i<lines.length; i++) {

				var line = lines[i].trim().replace(/\r/g,'');
				if (line=="")    continue;
				ll.push(line)
			}  

			_parsed( ll );

		}


	});	

	// -------------------------------------------------------------------
	function _parsed( lines ) {

		if (DEBUG) console.log(lines);

		lines.forEach(function( item ){

			if ( item.substring(0,1) == '#' )   {
				if( /#EXT-X-KEY:/.test(item) )  {
					var t = item.replace(/URI="(.+?)"/i, function(mtch, number) { 
						var m = mtch.match( /URI="(.+?)"/i ); 
						var uu = m[1]; 
						if (uu.indexOf('http') != 0) {
							if (uu.indexOf('/') == 0)  uu = domain + uu;
							else    uu = host + uu;
						}
						if (uu.indexOf('?') == -1 && search) {
							uu = uu + search;
						}  
						var fn = '';  
						var ff = find_results( uu );
						if (ff) {
							fn = ff.name;
						}
						else {
							fn = fileName + '_' + getFileNumber()+'.key';
							results.push({  url: uu, filename: fn });                              
						}   
						return 'URI="'+fn+'"';
					});
					newPlaylist.push(t);
				}
				else if( /https?:\/\/(.+?)/.test(item) )  {
					var t = item.replace(/https?:\/\/(.+?)$/i, function(match, number) { 
							var k = match.indexOf('"');
							if (k != -1) {
								var uu = match.substring(0, k); 
								var iv = match.substring(k+1, match.length); 
								
								var ff = find_results( uu );
								if (ff) {
									return ff.name + '"'+iv;
								}
								else {
									var fn = fileName + '_' + getFileNumber()+'.key';
									results.push({  url: uu, filename: fn });                               
									return fn + '"'+iv;
								}   
							}
							else {
								var ff = find_results( match );
								if (ff) {
									return ff.name;
								}
								else {
									var fn = fileName + '_' + getFileNumber()+'.key';
									results.push({  url: match,	filename: fn });                               
									return fn;
								}   
							}   
					});
					newPlaylist.push(t);
				}	
				else {
					newPlaylist.push(item);
				}   
			}
			else {
				var u = item;
				if (u.indexOf('http') != 0) {
					if (u.indexOf('/') == 0)  u = domain + u;
					else    u = host + u;
				}
				if (u.indexOf('?') == -1 && search) {
					u = u + search;
				}  
				var x = Utils.parse_URL(u);
				//var fn = x.file;
				var fn = fileName + '_' + getFileNumber()+'.'+x.ext;
				results.push({ 	url: u,	filename: fn });                               
				newPlaylist.push( fn );
			}	
		});	

		if (DEBUG) console.log(results, newPlaylist);  

		callback(results, newPlaylist);
	}

	// -------------------------------------------------------------------
	function find_results( url ){

		for (var iii in results) {
			if ( results[iii].url === url ) return results[iii];                                
		}
		return null;
	}
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

	if (streamVideo) streamVideo.stop();

}


