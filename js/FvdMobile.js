(function(){
	
	var requestManager = new function(){
		
		var activeRequests = [];
		
		this.createRequest = function( aCallback ){
			
			var newRequest = new SuiteRequest();
			activeRequests.push( newRequest );
			
			return newRequest;
			
		}
		
		this.freeRequest = function( aRequest ){
			
			var index = activeRequests.indexOf( aRequest );
			
			if( index != -1 ){
				activeRequests.splice( index, 1 );
			}
			
		}
		
	}
	
	function SuiteRequest( aCallback ){
		
		var suitePort = 8634;
		
		var timeout = 2000;
		
		var startTime = null;
		
		var req = new XMLHttpRequest();
		
		var timer = null;
		
		this.init = function( port ){
			port = port || suitePort;
			
			req.open('POST', "http://localhost:" + port, true);
		}
		
		this.send = function( data ){
				
			var timer = setTimeout( function(){
				req.abort();
				aCallback( false );
			}, timeout );	
							
			try{
				req.send(data);		
				req.onload = function(){
					clearTimeout( timer );
					
					aCallback( req.status == 200, req.responseText );
				};	
				req.onerror = function(){
					clearTimeout( timer );
								
					aCallback( false );
				}
			}
			catch( ex ){	
				clearTimeout( timer );
				
				aCallback( false );
			}	
			
		}
		
	}
	
	var FvdMobile = function(){
		
		var self = this;
		
		this.downloadMedia = function( media, callback ){
			
			media.headers = media.headers || [];
			
			var tabInfo = {};
			
			async.series([
				function( chainCallback ){
					
					if( !media.tabId ){
						fvdDownloader.Utils.getActiveTab( function( tab ){
							tabInfo = tab;
							chainCallback();
						} );
					}
					else{
						chrome.tabs.get( media.tabId, function( tab ){
							tabInfo = tab;
							chainCallback();
						} );
					}
					
				},
				function(  ){
					
					var data = {
						headers: media.headers.join("\n"),
						mediaUrl: media.url,
						parentUrl: tabInfo.url,
						entity: "",
						title: tabInfo.title
					};
					
					self.sendRequest( "download", data, callback );							
					
				}
			]);
			

			

			
		}
		
		this.sendRequest = function( actionName, params, callback ){
			
			ping( function( success, text ){
				
				if( !success ){
					callback( success, text );
				}
				else{
				
					try{
						params.action = actionName;
						var data = createXMLData( params );			
						
						sendMessage( data, callback );
					}
					catch( ex ){
						return false;
					}	
						
				}			
				
			} );
		
			return true;
		}
		
		
		function ping( callback ){
			
			var params = {
				action: "ping"
			};
			
			var data = createXMLData( params );			
			
			sendMessage( data, callback );
			
		}

		
		function createXMLData( object ){

			var request = document.createElement( "request" );
			
			var keys = Object.keys( object );
			
			keys.sort();
			
			keys.forEach(function( key ){
				
				var el = document.createElement( key );
				el.textContent = object[key];
				request.appendChild( el );
				
			});
			
			var s = new window.XMLSerializer();			
					
			var string = s.serializeToString( request );		
			
			// fix registry troubles
			
			for( var k in object ){
				var lower = k.toLowerCase();
				string = string.replace( "<"+lower+">", "<"+k+">" );
				string = string.replace( "</"+lower+">", "</"+k+">" );				
			}
			
			return string;		
			
		}
	
		function sendMessage( data, callback ){		
	
			var request = new SuiteRequest( callback );
			
			request.init(  );		
			
			request.send( data );			
			
		}	
	
		
		
	}
	
	this.FvdMobile = new FvdMobile();
	
}).apply( fvdDownloader );
