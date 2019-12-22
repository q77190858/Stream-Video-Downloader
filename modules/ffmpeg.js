var FFMPEG_CONVERT = function(){

	const DEBUG = false;
	const FFMPEG_TIMEOUT = 600000;	// 10минут

	var output = '';
	
	// -----------------------------------------------------------
	function run_ffmpeg(params, options, finish, message) {
		
		if (DEBUG) console.log('--video_ffmpeg.run--', options, '\n', params.join(' '));
		
		var l = params.type || "nacl";
		var timer = null;
		output = '';

		var pnacl = document.createElement("embed");
		pnacl.setAttribute("id", "pnacl");
		pnacl.setAttribute("height", "0");
		pnacl.setAttribute("width", "0");
		pnacl.setAttribute("src", "/manifest_ffmpeg.nmf");
		pnacl.setAttribute("type", "application/x-nacl");
		
		pnacl.setAttribute("ps_stdout", "dev/tty");
		pnacl.setAttribute("ps_stderr", "dev/tty");
		pnacl.setAttribute("ps_tty_prefix", "''");
		
		var i = 0;
		pnacl.setAttribute("arg"+(i++).toString(), "ffmpeg");
		pnacl.setAttribute("arg"+(i++).toString(), "-y");

		for (var j=0; j<params.length; j++){
			pnacl.setAttribute("arg"+(i++).toString(), params[j]);
		}

		document.body.appendChild(pnacl);
		//console.log(pnacl.outerHTML)
		
		pnacl.addEventListener('loadstart', eventStatus("Load Start"));
		pnacl.addEventListener('progress', eventProgress);
		pnacl.addEventListener('load', eventStatus("load"));
		pnacl.addEventListener('error', eventStatus("error: "+pnacl.lastError));
		pnacl.addEventListener('abort', eventStatus("abort: "+pnacl.lastError));
		pnacl.addEventListener('loadend', eventRunning);	
		
		pnacl.addEventListener('message', function (ev) {
			msg = ev.data.replace(/^''/gm,'');
			message(msg);
			output += msg;
			if (timer && options.timeout) {
				clearTimeout(timer);
				abortTimeout();			
			}
		});
		pnacl.addEventListener('crash', function () {
			if (DEBUG) console.log('Exit:', pnacl.exitStatus);
			if (timer)  { clearTimeout(timer); timer = null; }
			document.body.removeChild(pnacl);	
			setTimeout( function(){
				finish( (pnacl.exitStatus == 0 ? false : true), output);	
			},0);
		});	
		function eventStatus(status) {
			if (DEBUG) console.log('Status:', status);
		}
		function eventProgress(event) {
			if (DEBUG) console.log('Progress:', event);
		}
		function eventRunning() {
			if (DEBUG) console.log("Running");
		}	
		function abortTimeout() {
			timer = setTimeout( function(){
				finish(false);
				document.body.removeChild(pnacl);
			}, options.timeout);
		}	
		
		if (options.timeout) {
			abortTimeout();
		}
	}
	
	function abort( ) {

		console.log('--ffmpeg.abort--');
		var pnacl = document.getElementById("pnacl");
		if (pnacl) document.body.removeChild(pnacl);

	}	
	
	function getInfo( name, callback ) {

		var args = [
				"-i",
				"/fs/"+name,
				"-strict",
				"-2",
			];
			
		var info = {};	

		run_ffmpeg( args, {}, 
					function(f, msg){

						if (DEBUG) console.log(f, msg)

						var m = msg.match(/Video\:\s(.+?)\s(.+?)\s([0-9]+)x([0-9]+)[\s|,]/i);
						if (m) {
							info.codec = m[1];
							info.quality = { width: m[3], height: m[4] };
						}	

					    m = msg.match(/Duration:\s+([0-9:.]+),/i);
						if (m) {
							info.duration = m[1];

						    m = info.duration.match(/([0-9]*):([0-9]*):([0-9]*)\.([0-9]*)/i);
						    if (m) {
						        var hour = parseInt(m[1]);
						        var minute = parseInt(m[2]);
						        var second = parseInt(m[3]);
						        info.dlitel = hour * 3600 + minute * 60 + second;
						    }
						}	

						callback(info);

					}, 
					function(msg){

					});
	}

	function command( str, message, finish ) {

		var params = [];

		var mm = str.split(' ');
		for (var i=0; i<mm.length; i++) {
			var m = mm[i].trim();
			if (m)	params.push( m );
		}
	
		run_ffmpeg( params, {}, 
					function(f, msg){

						if (DEBUG) console.log(f, msg)

						finish(f, msg);	
							
					}, 
					function(msg){
						
						message(msg);
					});
	}
	
	// =============================================================
	var queryRun = [];
	var isRun = false;
	
	function start(params, opt, finish, message) {
		
		opt = opt ? opt : {priority: false};
		if (!opt.timeout) opt.timeout = FFMPEG_TIMEOUT;
		
		// ставим в очередь
		if (opt.priority) {
			queryRun.unshift({  params: params,
								options: opt,
								trial: 0,
								state: 0,
								finish: finish,
								message: message
							 });
		}
		else {
			queryRun.push({ params: params,
							options: opt,
							trial: 0,
							state: 0,
							finish: finish,
							message: message
						   });
		}				   

		run_query();

	}
	
	// -------------------------------------------------------------------
	function run_query()   { 
	
		if (DEBUG) console.log("run_query", queryRun);
		
		if (isRun)  return;
		
		for (var i=0; i<queryRun.length; i++) {
			if (queryRun[i].state == 0) {
				queryRun[i].state = 1;
				queryRun[i].trial++;
				_run(queryRun[i]); 
				isRun = true;
			}	
		}

		function _run(qq) {
			
			run_ffmpeg(qq.params, qq.options, function(f){
									if (DEBUG) console.log(f);
									qq.state = 2;
									isRun = false;
									qq.finish( f );
									setTimeout( function(){
										run_query();	
									}, 0);
								},
								function(msg){
									qq.message( msg.replace("''","") );
								});
		}
	}
	
	// =============================================================
	function thumbnail(videoFileName, imageFileName, callback) {
		
		if (DEBUG) console.log("getThumbnail", videoFileName, imageFileName);
		
		var args = [
				"-ss",
				"00:00:01",
				"-i",
				"/fs/"+videoFileName,
				"-frames:v",
				"1",
				"/fs/"+imageFileName,
				"-y",
				"-strict",
				"-2",
				"-hide_banner",
				//"-nostats"
			];

		start( args, {priority: false, timeout: 5000 }, _success, _message);
		
		var info = { };
		
		// -----------------
		function _success( f ) {
			if (f) {
				fvdDownloader.FileSystem.isFile(imageFileName, 
													  function(rez){
															if (rez.error) {
																console.log(output);
																callback(null);
															}
															else {
																callback(info);
															}	
													  });
			}
			else {
				console.log(output);
				callback(null);
			}		
		}
		// -----------------
		function _message( msg ) {
			readInfo( msg );
		}
		// -----------------------------
		function readInfo(text) {
			var m = text.match(/Video\:\s(.+?)\s(.+?)\s([0-9]+)x([0-9]+)[\s|,]/i);
			if (m) {
				if (m[1] == 'mjpeg,') return;
				info.codec = m[1];
				info.quality = { width: m[3],
								 height: m[4]   };
			} 
			//m = text.match(/^([0-9]+):([0-9]+):([0-9]+)\.([0-9]+)/i);
			//if (m) info.duration = text.trim();
		}    
		// -----------------------------------------------------------
	}	
	

	return {
		run: run_ffmpeg,
		info: getInfo,
		command: command,
		abort: abort,
		start: start,
		thumbnail: thumbnail
	}	
}

