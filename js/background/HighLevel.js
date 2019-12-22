if (window == chrome.extension.getBackgroundPage()) {

	(function(){
	
		var HighLevel = function(){

			const DEBUG = false;
			var self = this;

			var tabsUrl =  {};
			
			// ===============================================================
			this.init = function(){
			
				if (DEBUG) console.log("HighLevel - init ");
				
				// ---------------------------   
				chrome.tabs.onRemoved.addListener( function( tabId ){
					if (DEBUG) console.log('onRemoved', tabId)					
					if( fvdDownloader.Storage.hasDataForTab( tabId ) )	{
						fvdDownloader.Storage.removeTabData( tabId );
						fvdDownloader.MainButton.MediaForTabUpdate( tabId );
					}
				});
				
				// --------------------------- 
				chrome.tabs.onUpdated.addListener( function( tabId, changeInfo, sender ){
					if (DEBUG) console.log('onUpdated', tabId, changeInfo, sender)					

					var status = '', 
					url = null;
					if ( changeInfo && changeInfo.status ) {
		
						status = changeInfo.status; 
						url = changeInfo.url ? changeInfo.url : (sender ? sender.url : url);
						
						if ( url.indexOf("youtube.com") != -1) {
							if (changeInfo.status == 'loading') {
								tabChangeUrl(tabId, null);
							}
							else if (changeInfo.status == 'complete') {
								if (tabsUrl[tabId] && tabsUrl[tabId] != url) {
									tabChangeUrl(tabId, url);
								}
								else {
									tabsUrl[tabId] = url;
								}
							}	
						}	
						else {
							if (changeInfo.status == 'loading' && !changeInfo.url) {
								tabChangeUrl(tabId, null);
							}
							else if (changeInfo.status == 'complete') {
								if (tabsUrl[tabId] && tabsUrl[tabId] != url) {
									tabChangeUrl(tabId, url);
								}
								else {
									tabsUrl[tabId] = url;
								}
							}	
						}
		
						if (DEBUG) console.log('---', status, url, tabsUrl[tabId]);
						fvdDownloader.MainButton.MediaForTabUpdate( tabId );
						
					}	
					
					if (changeInfo.status === "complete" && sender.url === "https://www.facebook.com/") {
						fvdDownloader.Gamp.facebook();
					}					
						
				});
				
				// --------------------------- 
				chrome.tabs.onActivated.addListener(function(info){
					if (DEBUG) console.log('onActivated', info)					
					fvdDownloader.MainButton.MediaForTabUpdate( info.tabId );
				});
				
			}

			// ----------------------------------------------
			function removeTabData(tabId) {
				if (DEBUG) console.log('===removeTabData====', tabId);
				if( fvdDownloader.Storage.hasDataForTab( tabId ) )	{
					fvdDownloader.Storage.removeTabData( tabId );
					fvdDownloader.MainButton.MediaForTabUpdate( tabId );
					fvdDownloader.PageButton.MediaButtonHide( tabId );
				}
			}
			
			// ----------------------------------------------
			function tabChangeUrl(tabId, tabUrl) {

				//console.log('---- tabChangeUrl ----', tabId, tabUrl);
				tabsUrl[tabId] = tabUrl;
				removeTabData(tabId);

			}	
			
			this.storage = function(media){
				if (DEBUG) console.log('---storage--add---', media);
			}
			
		}
		
		this.HighLevel = new HighLevel();
		
	}).apply(fvdDownloader);
	
}
else
{
	fvdDownloader.HighLevel = chrome.extension.getBackgroundPage().fvdDownloader.HighLevel;
}
