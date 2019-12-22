
if(typeof pdInitialized == "undefined") {
	var pdInitialized = true;

	var windowLocation = window.location.href; 

	chrome.extension.onRequest.addListener(function(message, sender, sendResponse) {
		
		if(message.type=="get-title") {
			var thUrl = null;
			var thSels = [{	sel: "meta[property='og:image:secure_url']",  	attr: "content" },
						  {	sel: "meta[property='og:image']",				attr: "content"	},
						  {	sel: "link[rel='thumbnail']",					attr: "href"	},
						  {	sel: "link[rel='image_src']",					attr: "href"	},
						  {	sel: "meta[property='twitter:image']",			attr: "content"	}];
			for(var i=0;i<thSels.length && !thUrl;i++) {
				var thSel = thSels[i];
				var elem = document.querySelector(thSel.sel);
				if(elem)  thUrl = elem.getAttribute(thSel.attr) || null;
			}
			if(thUrl) {
				var link = document.createElement("a");
				link.href = thUrl;
				thUrl = link.href; // make url absolute
			}
			
			sendResponse({
				url: windowLocation,
				thumbnail: thUrl,
			});
		}
	});
}
