fvdDownloader.Utils = new UTILS();
fvdDownloader.Async = new ASYNC();

function displayDonate(){

	var downloadBox = document.getElementById("download_block");
	var donateBox = document.getElementById("donate_block");
		
	if( donateBox.style.display != "none" ){
		return;
	}	
	
	downloadBox.setAttribute( "style", "-webkit-transition: opacity 200ms; opacity: 0" );
		
	setTimeout( function(){
		donateBox.setAttribute( "style", "opacity:0");
		setTimeout( function(){
			donateBox.setAttribute( "style", "-webkit-transition: opacity 200ms; opacity: 1" );	
		}, 0 );		
		downloadBox.setAttribute( "style", "display:none" );
	}, 200 );
}

function displayDownloads(){
	var downloadBox = document.getElementById("download_block");
	var donateBox = document.getElementById("donate_block");
	
	donateBox.setAttribute( "style", "-webkit-transition: opacity 200ms; opacity: 0" );
		
	setTimeout( function(){
		downloadBox.setAttribute( "style", "opacity:0");
		setTimeout( function(){
			downloadBox.setAttribute( "style", "-webkit-transition: opacity 200ms; opacity: 1" );	
		}, 0 );		
		donateBox.setAttribute( "style", "display:none" );
	}, 200 );
}


var searchBox = null;

window.addEventListener( "load", function(){

	try	{
		fvdDownloader.Popup.init();		
		
		fvdDownloader.PopupHints.init();		
		
		fvdDownloader.PopupDummy.init();		
	}
	catch( ex ){

	}
	
	fvdDownloader.Locale.localizeCurrentPage();
	
	document.getElementById("help_link_options").addEventListener( "click", function(){
								chrome.extension.sendMessage({action:"SettingOptions"  });
							}, false );
			
	
	
}, false );

	

