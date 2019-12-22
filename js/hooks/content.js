const BUTTON_ID = "fvdDownloader_page_button";

function init() {

	console.log('--------init-----------', document.location.href)

	var url = document.location.href;

	if (url.indexOf('stream-video-downloader.com') == -1)  {

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

		//console.log("thUrl:",thUrl);
		if(thUrl) {
			var link = document.createElement("a");
			link.href = thUrl;
			thUrl = link.href; // make url absolute

			if (chrome.runtime) {
				console.log('thumbnail: ', thUrl)
				chrome.extension.sendRequest({ command: 	"gotThumbnail",	tabUrl: url, thumbnail:	thUrl	});
			}
			else {
				console.error('TypeError: browser.runtime is undefined')
			}
		}
	}

	chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {

		if (request.command == "hide_button") 
		{
			console.log('--hide--');
			var e1 = document.getElementById( BUTTON_ID );
			if (e1) 
			{
				e1.setAttribute("style", "display: none");
			}
		}
		//达内视频抓取专属代码，获得tmooc视频播放页的视频名称
		else if (request.command == "tmooc_vidoename") 
		{
			var head=document.getElementById("video_stage_lty").innerText;
			var s=head.indexOf("-")+1;
			head=head.substring(s,head.length);
			var name = head+"-"+document.querySelector("div.video-list p.active a").innerText;
			console.log('tmooc_vidoename:',name);
			sendResponse({name:name,tabId:request.tabId});
		}
				
	});	
			
}

// ================================================================================================ 
window.addEventListener("load", init);

