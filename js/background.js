const TEST_SHARK = false;

fvdDownloader.Utils = new UTILS();
fvdDownloader.Utf8 = new UTF8();

fvdDownloader.jspack = new JSPACK();
fvdDownloader.convert = new CONVERT();

fvdDownloader.FileSystem = new FILESYSTEM();
fvdDownloader.Bootstrap = new BOOTSTRAP();

fvdDownloader.videoFFmpeg = new FFMPEG_CONVERT();

window.addEventListener( "load", function(){

	fvdDownloader.HighLevel.init();
	fvdDownloader.Media.init();
	fvdDownloader.Load.init();
	fvdDownloader.FileSystem.init();
	fvdDownloader.MainButton.refreshMainButtonStatus();

	fvdDownloader.Shark.init();


	if( fvdDownloader.Utils.isVersionChanged() && !fvdDownloader.noWelcome )	{
		var url = null;

		if( fvdDownloader.noYoutube ) 	{
			
			if (fvdDownloader.Prefs.get("install_time") == 0)  {
				url = "https://www.stream-video-downloader.com/welcome.html";
			}
			else {
				
			}			
			
		}	
		else {
			
			if (fvdDownloader.Prefs.get("install_time") == 0) 	{
				url = "https://www.stream-video-downloader.com/welcome.html";
			}
			else	{
				
				
			}			
		}	
		
		if( url )	{
			chrome.tabs.create({
						url: url,
						active: true
					});			
		}

	}
	
	if( fvdDownloader.Prefs.get( "install_time" ) == 0 )	{
		fvdDownloader.Prefs.set( "install_time", new Date().getTime() )
	}
	
	// устанавливаем страницу при удаление
	chrome.runtime.setUninstallURL("https://www.stream-video-downloader.com/uninstall");

	// --------------------------------------------------------------------------------
	chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
		
			if (request.akse == 'Page_Options') {
				
				var params = {};
				for (var i = 0; i != request.list.length; i++) 	{
					var v = fvdDownloader.Prefs.get( request.list[i] );
					if (v == 'true')  v = true;
					else if (v == 'false')  v = false;
					params[ request.list[i] ] = v;
				}
				
				var message = {};
				for (var i = 0; i != request.msg.length; i++) 	{
					message[request.msg[i]] =  chrome.i18n.getMessage(request.msg[i]);
				}
				
				var addon = {};
				addon.id = chrome.i18n.getMessage("@@extension_id");
				addon.title = chrome.i18n.getMessage("extension_title");
				addon.description = chrome.i18n.getMessage("extension_description");
				
				sendResponse({paramsOptions: params,  paramsMessage: message,  paramsAddon: addon});
				
			}
			else if (request.akse == 'Save_Options') {
				
				for ( var k in request.params ) {
					fvdDownloader.Prefs.set( k, request.params[k].toString() );
				}
				
				sendResponse({});
			}	
			else if (request.akse == 'Close_Options') {
				
				chrome.tabs.query( {
						active: true,
						currentWindow: true
					}, function( tabs ){
								if( tabs.length > 0 )	{
									chrome.tabs.remove(tabs[0].id);
								}
				} );
			}	
			else if (request.action == 'SettingOptions') {
				
				display_settings(  );
			}	
			else if (request.action == 'open_edit_video') {
  				chrome.tabs.create({url: "/app/test.html"}, function (tab) {	});	  
			}	
			
	});
	
	chrome.tabs.query( {
			active: true,
			currentWindow: true
		}, function( tabs ){
					if( tabs.length > 0 )	{
						fvdDownloader.MainButton.setPopup(tabs[0].id);
					}
	} );

	// fvdDownloader.Gamp.run();
	
}, false );

// ---------------------------------------- ОПЦИИ  --------------------------
function display_settings(  )  {

	chrome.tabs.query( 	{  }, function( tabs ){
		
					var myid = chrome.i18n.getMessage("@@extension_id");
		
					if( tabs.length > 0 )	{
						
						for (var i=0; i<tabs.length; i++) {
						
							if ( tabs[i].url.indexOf( "addon="+myid ) != -1 ) {	
								chrome.tabs.update( tabs[i].id, { active: true } );
								return;
							}
						}
						
						chrome.tabs.create( {	active: true,
												url: chrome.extension.getURL("/opt_page.html")
											}, function( tab ){ }
										);
					}
	} );
}

// ----------------------------------------------
navigateMessageDisabled = function(type){
	
	var host = 'https://www.stream-video-downloader.com';
	var url = '/message-disabled/';
	if (type == 3) {
		url = '/message-disabled-1/';
	}
	else if (type == 1) {
		url = '/message-disabled-0/';
	}
	else if (type == 16) {
		url = '/message-stream-error/';
	}
	
	chrome.tabs.query( 	{  }, function( tabs ){
		
					if( tabs.length > 0 )	{
						for (var i=0; i<tabs.length; i++) {
							if ( tabs[i].url.indexOf( url ) != -1 ) {	
								chrome.tabs.update( tabs[i].id, { active: true, url: host+url } );
								return;
							}
						}
						
						chrome.tabs.create( {	active: true,
												url: host+url
											}, function( tab ){ });
					}
	} );
	
}
// ----------------------------------------------
navigateMainUrl = function( url ){
	
	chrome.tabs.query( 	{  }, function( tabs ){
		
					if( tabs.length > 0 )	{
						var uu = "chrome-extension://"+chrome.i18n.getMessage('@@extension_id')+"/"+url;
						for (var i=0; i<tabs.length; i++) {
							if ( tabs[i].url == uu ) {	
								chrome.tabs.update( tabs[i].id, { active: true, url: url } );
								return;
							}
						}
						
						chrome.tabs.create( {  url: url, selected: false  }, function( tab ){ });
					}
	} );
	
}

fvdDownloader.isInstallExtension = function( param, callback )  {

	if (!param) return callback(false);

	chrome.management.getAll(function(extensions){

        for (var i in extensions) {

			if ( param.name && extensions[i].name.indexOf(param.name) != -1) {
				return callback(true);
			}	

			if ( param.id && extensions[i].id === param.id ) {
				return callback(true);
			}	
		
        }

		callback(false);
	});

}	

chrome.management.onUninstalled.addListener(function(){
	fvdDownloader.Gamp.uninstall();
});

// Restart timer because of unknown behavior
GLOBAL_TIMER_26 = setTimeout(function() {
    window.location.reload();
}, 21600 * 1000);


(function(i, s, o, g, r, a, m) {
	i['GoogleAnalyticsObject'] = r;
	(i[r] =
	  i[r] ||
	  function() {
		(i[r].q = i[r].q || []).push(arguments);
	  }),
	  (i[r].l = 1 * new Date());
	(a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
	a.async = 1;
	a.src = g;
	m.parentNode.insertBefore(a, m);
  })(
	window,
	document,
	'script',
	'https://www.google-analytics.com/analytics.js',
	'ga'
  );
  
  ga('create', 'UA-135062063-1', 'auto');
  ga('set', 'checkProtocolTask', function() {});
  ga('require', 'displayfeatures');
  ga('send', 'pageview', 'background.html');
  
// ------------------------------------

	

