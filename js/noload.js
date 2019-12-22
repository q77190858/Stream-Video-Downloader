window.addEventListener( "load", function(){

	hash = document.location.hash.replace('#','');

	var BG = chrome.extension.getBackgroundPage();
	BG.navigateMessageDisabled( hash );
	
}, false );

	

