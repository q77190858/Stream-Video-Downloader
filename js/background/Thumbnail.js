(function(){

	var Thumbnail = function(){

		var self = this;
		
		var lastFileNumber = 0;
		var detectThumbnail = {};
		
		const LOAD_STREAM_TIMEOUT = 300000;  // 5мин
		const DEBUG_FACEBOOK = false;
		const DEBUG_THUMBNAIL = false;
		const LOAD_SIZE_THUMBNAIL = 2*1024*1024;  // 2мB

		// ---------------------------
		function getFileName() {
			lastFileNumber++;
			var str = '00000' + lastFileNumber.toString();
			return 'thumb_'+str.substring(str.length - 5, str.length);
		}	
			

		// ===============================================================
		this.getInfoFaceBook = function(url, callback){
			
			if (DEBUG_FACEBOOK) console.log('getInfoFaceBook', url);
		
			var ff = fvdDownloader.Utils.extractPath( url );
			
			var ext = ff.ext;
			var filename = ff.name;
			
			loadFile(url, {ext: ext}, function(resp){
				
				if (resp) {
					var rez = read_info_mp4(resp);

					if (rez.compatible == "isomiso2avc1mp41")            rez.type = 'full';
					rez.filename = filename;
				
					if ( DEBUG_FACEBOOK )  console.log('REZ: ', rez);
					callback(rez);
				}	
					
			});
			
		}	
		
		// -------------------------------------------------------------
		function read_info_mp4(data) {
			
			var Info = {};
			var moov_data = null, ftyp_data = null;
		
			var dataLen  = data.length;
			var o = { dataPos: 0,   boxSize: 0,  boxType: '',   boxData: null,   nextID: 0    };
					
			while (o.dataPos < dataLen)  {
				ReadBoxHeader(data, o);
				if (o.boxType == "ftyp")       ftyp_data = o.boxData;
				else if (o.boxType == "moov")  moov_data = o.boxData;
				o.dataPos += o.boxSize;
			}

			if (ftyp_data)            ReadFTYP(ftyp_data)
			if (moov_data)            ReadMOOV(moov_data)

			return Info;

			// -----------------------------
			function ReadFTYP(data) {
				var major = fvdDownloader.jspack.bytesToString(data.slice(0, 4));
				var minor = fvdDownloader.jspack.ReadInt32(data, 4);
				var compatible = fvdDownloader.jspack.bytesToString(data.slice(8, data.length));
				if (compatible)  Info.compatible = compatible;       
			}    

			// -----------------------------
			function ReadMOOV(data) {
				var trak_data = null, udta_data = null;
			
				// читаем MOOV  
				o = { dataPos: 0,   boxSize: 0,  boxType: '',   boxData: null,   nextID: 0     };
				dataLen  = data.length;
				while (o.dataPos < dataLen)  {
					ReadBoxData(data, o);
					o.dataPos = o.dataPos + o.boxSize;
					if (o.boxType == "trak")       trak_data = o.boxData;
					else if (o.boxType == "udta")  udta_data = o.boxData;
				}

				if (trak_data)             ReadTRAK(trak_data)
				
				if (udta_data)             ReadUDTA(udta_data)
				
			}   

			// -----------------------------
			function ReadTRAK(data) {

				var tkhd_data = null, edts_data = null, mdia_data = null;

				o = { dataPos: 0,   boxSize: 0,  boxType: '',   boxData: null,   nextID: 0     };
				dataLen  = data.length;
				while (o.dataPos < dataLen)  {
					ReadBoxData(data, o);
					o.dataPos = o.dataPos + o.boxSize;
					if (o.boxType == "tkhd")       tkhd_data = o.boxData;
				}

				if (tkhd_data) 		ReadTKHD(tkhd_data)
			}	
			
			// -----------------------------
			function ReadTKHD(tkhdData) {

				var pos = 0;

				var version         = fvdDownloader.jspack.ReadByte(tkhdData, pos);
				var flags           = fvdDownloader.jspack.ReadInt24(tkhdData, pos + 1);
				var createTime      = fvdDownloader.jspack.ReadInt32(tkhdData, pos + 4);
				var modifiTime      = fvdDownloader.jspack.ReadInt32(tkhdData, pos + 8);
				var trackID         = fvdDownloader.jspack.ReadInt32(tkhdData, pos + 12);
				
				var duration    = fvdDownloader.jspack.ReadInt32(tkhdData, 70);
				var width       = fvdDownloader.jspack.ReadInt32(tkhdData, 74);
				var height      = fvdDownloader.jspack.ReadInt32(tkhdData, 78);
				if (DEBUG_FACEBOOK) console.log('duration:', duration, 'quality:',  width, 'x', height)

				if (height>10000) height = width;
				
				if (duration) Info.duration = duration;
				if (width && height) {
					Info.quality = { width: width, height: height};
					Info.type = 'video';
				}
				else {
					Info.type = 'audio';
				}
			}   
			
			// -----------------------------
			function ReadUDTA(udtaData) {

				var metaSize = fvdDownloader.jspack.ReadInt32(udtaData, 0);
				var metaType = fvdDownloader.jspack.bytesToString(udtaData.slice(4, 8));

				// читаем user Data List
				data = udtaData.slice(12, metaSize);    
				
				o = { dataPos: 0,   boxSize: 0,  boxType: '',   boxData: null,   nextID: 0     };
				dataLen  = data.length;
				while (o.dataPos < dataLen)  {
					ReadBoxData(data, o);
					
					if (o.boxType == 'ilst') {
					
						var meta = o.boxData;
						var x = ReadMetaData(meta)
						if (x) {
							if (x['©nam'])  Info.title = x['©nam'].trim();
						}
					}   

					o.dataPos = o.dataPos + o.boxSize;
				}
		
			}
		}	
		
		// -----------------------------
		function ReadBoxHeader(arr, opt) {

			opt.boxSize = fvdDownloader.jspack.ReadInt32(arr, opt.dataPos);
			opt.boxType = fvdDownloader.jspack.bytesToString(arr.slice(opt.dataPos + 4, opt.dataPos + 8));
			opt.boxData = arr.slice(opt.dataPos + 8, opt.dataPos + opt.boxSize);			
			
			if (opt.boxSize == 1)   {
			  opt.boxSize = fvdDownloader.jspack.ReadInt64(arr, opt.dataPos + 8) - 16;
			  opt.dataPos += 16;
			}
			else  {
			  opt.boxSize -= 8;
			  opt.dataPos += 8;
			}
			if (opt.boxSize <= 0) opt.boxSize = 0;
		}
		
		// -----------------------------
		function ReadBoxData(arr, opt) {

			opt.boxSize = fvdDownloader.jspack.ReadInt32(arr, opt.dataPos);
			opt.boxType = fvdDownloader.jspack.bytesToString(arr.slice(opt.dataPos + 4, opt.dataPos + 8));
			opt.boxData = arr.slice(opt.dataPos + 8, opt.dataPos + opt.boxSize);			
			opt.nextID = fvdDownloader.jspack.ReadByte(arr, opt.dataPos + opt.boxSize - 1);
			
		}
		
		// -----------------------------
		function ReadMetaData(arr) {

			var k = arr.length;
			var i = 0;
			var size = 0, name ='', dd = null;
			var data_size, data_name, data_type, data_value; 
			
			var info = {};
			
			while (i < k)  {
				size = fvdDownloader.jspack.ReadInt32(arr, i);
				name = fvdDownloader.jspack.bytesToString(arr.slice(i + 4, i + 8));
				dd = arr.slice(i + 8, i + size);			

				data_size = fvdDownloader.jspack.ReadInt32(dd, 0);
				data_name = fvdDownloader.jspack.bytesToString(dd.slice(4, 8));
				data_type = fvdDownloader.jspack.ReadInt32(dd, 8);
				data_value = dd.slice(12, data_size)

				if ( data_type == 1 ) {
					info[name] = StringfromBytes(data_value);
				}	
				else {
					console.log(name, size, data_size, data_name, data_type);
					console.log('>>', fvdDownloader.Utils.convertHex.fromBytes(data_value)	);	//	stik 25 17 data 21  >> 00 00 00 00 09
				}	

				i += size;
			}

			return info;	
		}
		
		// -----------------------------
		function StringfromBytes(arr) {
			var d = [];
			for (var i=0; i<arr.length; i++)  if ( arr[i] != 0 ) d.push(arr[i]);
			return fvdDownloader.jspack.bytesToString(d);
		}	
		
		// ===============================================================
		this.readThumbnail = function(params, callback) {
			if (DEBUG_THUMBNAIL) console.log('readThumbnail: ',params);
			
			if (["swf", "mp3", "m4a"].indexOf(params.ext) != -1) {
				callback({error: -15});
				return;
			}

			load_thumbnail(params.url, callback)
			
		}	
		
		// ===============================================================
		this.set = function( info )  {

			if (DEBUG) console.log(info);

			var pp = { thumbnail: info.thumbnail };
			if (info.title) pp.title = info.title;

			var list = fvdDownloader.Storage.setData({ group: info.group },  pp);

			/*if (list.length>0) {
				for (var i=0; i<list.length; i++) {
					browser.runtime.sendMessage( {  subject:  "mediaGotAttribute",	
												    id:       list[i],	
												    data:  	  pp	
												  } );
				}
			}*/

		}	

		// ===============================================================
		this.get = function(params) {
			if (DEBUG_THUMBNAIL) console.log('get: ',params);
			
			if (["swf", "mp3", "m4a"].indexOf(params.ext) != -1) {
				callback({error: -15});
				return;
			}

			/*if ( !detectThumbnail[params.group] )  {

				detectThumbnail[params.group] = params.url;

				loadPlaylist_from_File(params.url, function(file_url){

					load_thumbnail(file_url, callback)

				})    
			}*/    
			
		}	
		// ---------------------------
		function load_thumbnail(url, callback)  {

			if (DEBUG_THUMBNAIL) console.log('load_thumbnail: ',url);
			
			var uuu = new Date().getTime();
			var image_file = uuu + '.jpg';
			var video_file = uuu + '.mp4';

			loadFile(url, {part: LOAD_SIZE_THUMBNAIL}, function(resp, ct){
				
				if (resp) {
					
					var blob = new Blob([resp], {type: ct});
					writeFile(video_file, blob, function(){
						
						fvdDownloader.videoFFmpeg.thumbnail(video_file, image_file, function(info){
							if (info) {
								info.thumbnail = 'filesystem:chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/persistent/'+image_file;

								callback(info);
							}
							if (!DEBUG_THUMBNAIL) {
								setTimeout( function(){
									fvdDownloader.FileSystem.removeFile(video_file);
								}, 100);	
							}	
						});
						
					})
				}	
					
			});

		}
		
		// ===============================================================
		function loadPlaylist_from_File(url, callback)  {

			if (DEBUG_THUMBNAIL) console.log('loadPlaylist_from_File: ', url);
			
			var domain = null, k, tt, host = url, prot = "", search = null;
			var x = fvdDownloader.Utils.parse_URL(url);
			host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
			domain = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '');
			search = x.search || "";
			
			var newPlaylist = [];
			var results = [];
			
			getAJAX( url, function(content){
				
				var line = content.split('\n');
				if (line.length<2 || line[0] != '#EXTM3U' ) return callback(null);

				for (var ii=0; ii<line.length; ii++) {

					item = line[ii].trim();
					if ( !item )   return;
					if (DEBUG_THUMBNAIL) console.log('>', item);   

					if ( item.substring(0,1) != '#' )   {
						var u = item;
						if (u.indexOf('http') != 0) {
							if (u.indexOf('/') == 0)  u = domain + u;
							else    u = host + u;
						}
						if (u.indexOf('?') == -1 && search) {
							u = u + search;
						}    

						callback(u);    
						return;                
					}   
				}; 
			});	
		}	
		// ---------------------------
		function loadFile(url, opt, callback)  {
			
			if (DEBUG_FACEBOOK || DEBUG_THUMBNAIL) console.log( 'loadFile: ', url, opt );
		    if ( !opt )  opt = {part: 0}
			
			var httpRequest = new XMLHttpRequest(); 
			
			httpRequest.open ("GET", url, true);
			httpRequest.responseType = "arraybuffer"; 
			if (opt.part) httpRequest.setRequestHeader("Range", "bytes=0-"+opt.part);
			
			httpRequest.addEventListener("progress", _progress, false);
			httpRequest.addEventListener("load", _load, false);
			httpRequest.addEventListener("error", _error, false);
			httpRequest.addEventListener("abort", _error, false);				

			httpRequest.send();
			
			// -----------------------
			function _progress(ev) {
				if (opt.part && ev.lengthComputable) {
					if (ev.loaded > 10*opt.part )  {
						httpRequest.abort();	
					}	
				}
			}
			// -----------------------
			function _load(ev) {
				if (httpRequest.status == 200 || httpRequest.status == 206) {
					var b = new Uint8Array(httpRequest.response);
					var t = httpRequest.getResponseHeader("Content-Type");
					callback(b, t)
				}
			}
			// -----------------------
			function _error(ev) {
				console.log('ERROR: loadFile', httpRequest.statusText, ev.type, httpRequest.status);
				callback(null);
			}
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
							if (DEBUG_THUMBNAIL) console.log("write success", fileName);
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
		
		
	}
	
	this.Thumbnail = new Thumbnail();
	
}).apply(fvdDownloader);
