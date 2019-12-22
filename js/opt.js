window.addEventListener( "load", function(){
	
	var myid = chrome.i18n.getMessage("@@extension_id");
	
    page = "https://www.stream-video-downloader.com/svdsettings/?addon=";	

	if (page && myid) {
		window.location=page+myid;	
	}	
	
}, false );

