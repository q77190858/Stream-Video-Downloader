
var STREAM_LOAD = function(){
	
	const DEBUG = false;
	const MAX_STREAM_DOWNLOAD = 5;
	const MIN_STREAM_DOWNLOAD = 2;
	const LOAD_STREAM_TIMEOUT = 300000;  // 5мин

	const STATE_FILE_LOAD_UNDEFINED = 0;
	const STATE_FILE_LOAD_START = 1;
	const STATE_FILE_LOAD_SUCCESSFULL = 2;
	const STATE_FILE_LOAD_ERROR = 3;
	const STATE_FILE_LOAD_TIMEOUT = 4;
	const STATE_FILE_LOAD_WRITE = 5;
	
	var isRun = false, isEnd = false;
	var queue = 0;
	var blockStartReadTS = 0;

	var paramsBootstrap	= null;
	
	var typeStream = null,
		countLoad = 0,
		countTSFiles = 0,
		sizeOfVideo = 0,
		startIndex = 0;
	
	var listUrl = null;
	var file = [];
	
	var funcMessage, funcFinish;
	
	var listLoadFiles = [];
	var listConcatFiles = [];

	// ------------------------------------------
	function init( params ) {
		
		if (!DEBUG) console.log('---init---', params);
		
		listUrl = params.list;
		typeStream = params.type;
		
		for(var j = 0; j < listUrl.length; j++)  {
			file.push( { index: j,
						 url: listUrl[j].url,	   
						 name: listUrl[j].filename,
						 state: STATE_FILE_LOAD_UNDEFINED,
					   } );
		}	
		
		if (DEBUG) console.log( 'File: ', file.length, file );
		
		
	}	

	// ------------------------------------------
	function start( params ) {
		
		isRun = true;
		
		funcMessage = params.onMessage;
		funcFinish = params.onFinish;
		
		queue=0;
		load( );
	}	
	
	// ------------------------------------------
	function stop( ) {
		
		isRun = false;
		
		for(var i = 0; i < file.length; i++)     	{
			if (file[i].state == STATE_FILE_LOAD_START) file[i].req.abort();
		}	

		loadEnd();	
		
	}	
	
	// -------------------------------------------------------------------
	function load( ){
		
		if (DEBUG) console.log( 'load     queue:', queue );

		if ( queue < MIN_STREAM_DOWNLOAD && blockStartReadTS == 0) {
		
			countTSFiles = file.length;

			blockStartReadTS = 1;
			
			for(var i = 0; i < file.length; i++)     	{
				
				if (isRun && file[i].state == STATE_FILE_LOAD_UNDEFINED)      	{
					
					loadStreamFile(file[i].url, file[i].index);
														
					if (queue >= MAX_STREAM_DOWNLOAD)  {  // очеред заполнили
						blockStartReadTS = 0;
						return;
					}	
				}
			}
		}
	}
	
	// -------------------------------------------------------------
	function IsRequestSuccessful (httpReq) {
		var success = (httpReq.status == 0 || (httpReq.status >= 200 && httpReq.status < 300) || httpReq.status == 304 || httpReq.status == 1223);
		return success;
	}
	function loadStreamFile(url, index)  {
		if (DEBUG) console.log( 'loadStreamFile: '+index, url );
		try	{
			var httpRequest = new XMLHttpRequest(); 
			file[index].req = httpRequest;					
			file[index].state = STATE_FILE_LOAD_START;
			
			httpRequest.open ("GET", url, true);
			httpRequest.ind = index;
			httpRequest.responseType = "arraybuffer"; 
			httpRequest.onreadystatechange = function() {
					if (httpRequest.readyState==4) {
						if (IsRequestSuccessful (httpRequest)) 	{
							var i = httpRequest.ind;
							
							file[i].req = null;
							clearTimeout( file[i].timer );
							file[i].timer = null;
							file[i].state = STATE_FILE_LOAD_SUCCESSFULL;		
							
							if (!isRun) return;

							var t = httpRequest.getResponseHeader("Content-Type");

							var b = new Uint8Array(httpRequest.response);
							if (paramsBootstrap) {
								b = Bootstrap.DecodeFragment(b, i);
							}
							file[i].size = b.length;		
							sizeOfVideo += file[i].size;
							countLoad++;
							var blob = new Blob([b], {type: t});
							FileSystem.createFile(file[i].name, blob, function(){
								if (DEBUG) console.log('File: ', file[i].name, ' - success')								
								listLoadFiles.push(file[i].name);
								file[i].state = STATE_FILE_LOAD_WRITE;
								endLoadStreamFile(false);	
							})
								
						}
						else 	{
							console.error('===============ERROR===================== httpRequest ==========\n', url);
							file[httpRequest.ind].state = STATE_FILE_LOAD_ERROR;
							endLoadStreamFile(true);
						}
						queue--;	// очередь скачки уменьшаем (на эту скачку)
						
					}
			};
			
			file[index].timer = setTimeout(function () { 
			
					httpRequest.onreadystatechange = null;
					httpRequest.abort();
					file[index].req = null;
					clearTimeout( file[index].timer );
					file[index].timer = null;
					file[index].state = STATE_FILE_LOAD_TIMEOUT;	

					endLoadStreamFile(true, index);		
					
					queue--;	// очередь скачки уменьшаем (на эту скачку)
					
				}, LOAD_STREAM_TIMEOUT);
			
			
			httpRequest.send();
			
			queue++;		// еще одна закачка
		}
		catch(err)	{
			console.log('===============CATCH===================== httpRequest ==========', err);
			console.log(url);
			file[index].state = STATE_FILE_LOAD_ERROR;	
			endLoadStreamFile(true);
		}
	}	
	
	// -------------------------------------------------------------
	function endLoadStreamFile(error)  {

		if (DEBUG) console.log( 'endLoadStreamFile', error );
		
		// подсчитаем состояние
		var indexLoad = -1, flagEmpty = false;
		countLoad = startIndex;
		isEnd = true;
		
		for (var j=startIndex; j<file.length; j++) {
 
			if (file[j].state >= STATE_FILE_LOAD_WRITE) countLoad++;			// скачано и сохранено сегментов
			else if (file[j].state >= STATE_FILE_LOAD_ERROR) { if (DEBUG) console.log(file[j]);	}		// ошибочных сегментов
			else isEnd = false;
			
			if (!file[j].stream && file[j].state == STATE_FILE_LOAD_START) {			// на очереди на чтение, но не прочитано (
				flagEmpty = true;
			}	
		}

		// сообщение	
		funcMessage({'msg': 'progress', 'type': typeStream, 'hash': hash, 'size': sizeOfVideo, 'count': countLoad, 'progress': Math.round( 100 * countLoad / countTSFiles ) });
		
		// дальнейшие действия
		if (isEnd || !isRun ) {
			loadEnd();
			return;
		}
		
		if ( isRun ) {
			load();
		}
		
	}
	
	// -------------------------------------------------------------
	function loadEnd()  {

		if (DEBUG) console.log('FINISH', sizeOfVideo, file);	
		
		listConcatFiles = [];	// сюда запишем непрерывный кусок
		for (var j=startIndex; j<file.length; j++) {
			if (file[j].state == STATE_FILE_LOAD_WRITE) listConcatFiles.push({ name: file[j].name, size: file[j].size });			
			else break;
		}
	
		funcFinish({ error: false, 
					 type: typeStream,
					 file: listLoadFiles,	
					 concat: listConcatFiles,
					 end: (countLoad == countTSFiles),
					 count: countLoad,
					 total: countTSFiles
				  });

	}	

	// ------------------------------------------
	return {
		init: init,
		start: start,
		stop: stop,
	}	
	
};
