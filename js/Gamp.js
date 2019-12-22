if (window == chrome.extension.getBackgroundPage()) {

	(function(){

		var Gamp = function(){

			var self = this;

			const GAMP_URL = "https://www.google-analytics.com/collect";   
			const GAMP_ID = "UA-135062063-1";   
			const GAMP_APP_NAME = "chrome_stream_video_downloader";   
			const GAMP_CATEGORY = "app";   
			const GAMP_EVENT_INSTALL = "install";   
			const GAMP_EVENT_RUN = "run";   
			const GAMP_EVENT_UNINSTALL = "uninstall";   
			const GAMP_EVENT_DOWNLOAD = "download";   

			const INTERVAL_TO_DISPLAY = 12 * 3600 * 1000; // 1/2 days
			const INTERVAL_TO_TIMER = 3600 * 1000; // 1 hour


			// ===============================================================
			// при установке
			this.install = function( event ){

				gamp('send', 'event', GAMP_CATEGORY, GAMP_EVENT_INSTALL);

			}
			// ===============================================================
			this.uninstall = function( event ){

				gamp('send', 'event', GAMP_CATEGORY, GAMP_EVENT_UNINSTALL);

			}
			// ===============================================================
			// проверит активен ли аддон
			this.run = function( event ){

				set();

				setInterval(function(){  
				
					set();
					
				}, INTERVAL_TO_TIMER);
			}
			// ===============================================================
			this.facebook = function( event ){

				gamp('send', 'event', GAMP_CATEGORY, "facebook");

			}
			// ===============================================================
			this.download = function( event ){

				gamp('send', 'event', GAMP_CATEGORY, GAMP_EVENT_DOWNLOAD);

			}

			// ------------------------------------------------
			function set() {
				var now = new Date().getTime();
				if( now - fvdDownloader.Prefs.get( "cf.gamp.check" ) > INTERVAL_TO_DISPLAY )		{
					fvdDownloader.Prefs.set( "cf.gamp.check", now );

					gamp('send', 'event', GAMP_CATEGORY, GAMP_EVENT_RUN);
				}	
			}

			// ------------------------------------------------
			function gamp(send, type, category, action, label, value){

			    var message = {
			            send : send || "",
			            type : type || "",
			            label : label || "",
			            value : value || "",
			            action : action || "",
			            category : category || "category",
			            title : document.title,
			            clientWidth : document.body.clientWidth,
			            clientHeight : document.body.clientHeight,
			            pathname: "/"+String(document.location.pathname).split("/").pop().split("\\").pop().split(".").shift(),
						};
						
				//console.log(message);		

			    gampBackend(message);
			    
			};

			// ------------------------------------------------
			function gampBackend(data){

				var param = {
					"v"     : 1,
					"tid"   : GAMP_ID,
					"ul"    : String(navigator.language).toLocaleLowerCase(),
					"t"     : data.type,
					"ec"    : data.category,
					"ea"    : data.action
				}
				if(data.label) param["el"] = data.label;

				postAJAX( GAMP_URL, param, function(e){	   });

			}

			function postAJAX( url, data, callback ){

				var ajax = new XMLHttpRequest();
				ajax.open('POST', url, true);
				ajax.setRequestHeader('Cache-Control', 'no-cache');
				ajax.setRequestHeader('X-FVD-Extra', 'yes');
				ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				
				ajax.onload = function(){
							var content = this.responseText;
							callback( content );
				}
				
				ajax.onerror = function(){
					callback( null );
				}
				
				var l = [];
				for (var k in data) l.push(k + '=' + data[k]);
				
				ajax.send( l.join('&') );
			}			

		}

		this.Gamp = new Gamp();

	}).apply(fvdDownloader);

}
else
{
	fvdDownloader.Gamp = chrome.extension.getBackgroundPage().fvdDownloader.Gamp;
}

