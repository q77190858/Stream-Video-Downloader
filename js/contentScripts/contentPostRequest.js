(function(){
	
	if(window.__fvdDownloaderContentScriptInserted)	return;
	window.__fvdDownloaderContentScriptInserted = true;

	// ======================  POST  ==============================================================
	function fvd_post_request( data, callback ) {

        var xml = new XMLHttpRequest;

        xml.open("POST", data.url + (data.url.indexOf('?') == -1 ? '?__fvd__' : '&__fvd__') ); 

		xml.setRequestHeader('X-FVD-Extra', 'yes');
		xml.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		if (data.headers) {
			for (var key in data.headers) {
				xml.setRequestHeader(key, data.headers[key]);
			}
		}	

        xml.onreadystatechange = function() {
        	if (xml.readyState == 4) {
        		callback({ error: false, response: xml.responseText });
        	}
        }; 


		xml.onerror = function(){
			console.log('ERROR');
			callback({error: true });
		}
				
		var l = [];
		for (var k in data.form)  l.push(k + '=' + data.form[k]);
				
		xml.send( l.join('&') );

	}

	// ======================  GET  ==============================================================
	function fvd_get_request( data, callback ) {

		var xml = new XMLHttpRequest;
		
		xml.open("GET", data.url + (data.url.indexOf('?') == -1 ? '?__fvd__' : '&__fvd__') ); 

		xml.setRequestHeader('X-FVD-Extra', 'yes');
		xml.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		if (data.headers) {
			for (var key in data.headers) {
				xml.setRequestHeader(key, data.headers[key]);
			}
		}	

        xml.onreadystatechange = function() {
        	if (xml.readyState == 4) {
        		callback({ error: false, response: xml.responseText });
        	}
        }; 

		xml.onerror = function(){
			console.log('ERROR');
			callback({error: true });
		}
				
		xml.send( );

	}

	// ======================  DOWNLOAD  ==============================================================
	function fvd_page_download( data, callback ) {

		console.log('fvd_page_download', data);

		var a = document.createElement("a");
		
		a.setAttribute( "download", data.downloadName );
		a.setAttribute( "href", data.url );			
			
		document.body.appendChild( a );

		var theEvent = document.createEvent("MouseEvent");
		
		theEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		
		a.dispatchEvent(theEvent);
				
		document.body.removeChild( a );

		callback(true, data.url);

	}

	
	// ====================================================================================
	console.log('--insert post_request--');
	
	chrome.runtime.onConnect.addListener(function( port ){				
		
		port.onMessage.addListener( function( message ){

			switch( message.action ){
								
				// ====================================================================================
				case "post_request":
				
					fvd_post_request( message.data, function(x){

						port.postMessage( {	action:   "got_post_request",
											error:    x.error,
											content:  x.response  
										} );		

					});
				
				break;

				// ====================================================================================
				case "get_request":
				
					fvd_get_request( message.data, function(x){

						port.postMessage( {	action:   "got_get_request",
											error:    x.error,
											content:  x.response  
										} );		

					});
				
				break;

				// ====================================================================================
				case "page_download":
				
					fvd_page_download( message.data, function(x, url){

						port.postMessage( {	action:   "got_page_download",
											error:    !x,
											url:      url
										} );		

					});
				
				break;

				// ====================================================================================

			}
			
		} );

		
	});
	
})();

