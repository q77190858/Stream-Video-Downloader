(function(){
	
	var MediaStorage = function(){
		
		var self = this;
		
		const READ_THUMBNAIL_STREAM = false;
		const READ_THUMBNAIL = false;
		
		const AD_UPDATE_URLS = ["https://stream-video-downloader.com/ads/ads.txt"];
		const DOWNLOAD_AD_SIGNS_INTERVAL = 1000 * 3600 * 24 * 3; // every 3 days
		const DOWNLOAD_AD_SIGNS_CHECK_INTERVAL = 1000 * 60 * 5; // every 5 minutes
		
		const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
		
		// data stores by tab id		
		var data = {};
		var imageThumbnail = {};
		var adSigns = [];
		
		var lastItemId = 0;
		
		var mediaRemoveListeners = [];

		// ----------------------------------------------------------------------------------------------------
		var _lastGroupId = 0;
		this.nextGroupId = function( ){
			_lastGroupId++;
			return _lastGroupId;
		}

		// ----------------------------------------------------------------------------------------------------
		//劫持了add函数，实现修改文件名
		this.add = function(media)
		{
			console.log("media add:",media);
			if(media.length==1 && media[0].tabUrl.indexOf("tmooc.cn")!=-1)
			{
				//专门针对达内网页抓取获得视频名
				chrome.tabs.sendMessage(media[0].tabId, {command:"tmooc_vidoename",tabId:media[0].tabId}, 
				function(response)
				{
					if(response.name&&response.tabId==media[0].tabId)
					{
						console.log("get name:",response.name);
						//console.log(data[media[0].tabId].length);
						for(var i=0;i<data[media[0].tabId].length;i++)
						{
							if(data[media[0].tabId][i].hash==media[0].hash)
							{
								data[media[0].tabId][i].displayName=response.name;
								data[media[0].tabId][i].downloadName=response.name;
								console.log("modify data:",data[media[0].tabId]);
							}
						}
						//修改media没用了，必须修改data
						//add_later(media);
					}
				});
			}
			return add_later(media);
		}
		//真正的add函数
		function add_later( media ){

			fvdDownloader.HighLevel.storage(media);
			
			var a = [];

			if (media)	
			{	
				if( media.length )	
				{	
					media.forEach(function( item ){
											var ii = _add_item(item);
											if (ii) a.push(ii)
										});
				}
				else	
				{							
					var ii = _add_item(media);
					if (ii) a.push(ii)
				}
			}	

			return a;

			// -------------------------------------
			//真实的添加媒体项目的函数
			function _add_item( item ) {

				if (!item || !item.tabId) return null;
				
				var hash = ('hash' in item && item.hash) ? item.hash : hex_md5(item.url);
				var tabId = item.tabId;

				var thumbnail = item.thumbnail ? item.thumbnail : null;
				if (imageThumbnail[tabId])   thumbnail = imageThumbnail[tabId];
				
				if ( item.metod == 'playlist' ) 		item.displayLabel.push({tag: 'span', content: '(Stream)', class: 'stream-video' });
				else if ( item.metod == 'segments' )	item.displayLabel.push({tag: 'span', content: '(Stream.)', class: 'stream-video' });
				else if ( item.metod == 'convert' ) 	item.displayLabel.push({tag: 'span', content: '(Convert)', class: 'stream-video' });

				item.displayName = fvdDownloader.FileSystem.removeChars( item.displayName );
				console.log("displayName:",item.displayName);
				item.downloadName = fvdDownloader.FileSystem.removeChars( item.downloadName );
				item.downloadName = fvdDownloader.FileSystem.substringName(item.downloadName);

				var file_item = {	
							tabId:			item.tabId,
							tabUrl:			item.tabUrl,
							frameId:		item.frameId,

							hash:			hash,
							url:			item.url,
							downloadName:	item.downloadName,
							displayName:	item.displayName,
							displayLabel:	item.displayLabel,
							filename:		item.filename,
							ext:			item.ext,

							group:			item.group ? item.group : self.nextGroupId(),
							order:			item.order ? item.order : new Date().getTime(),
							quality:		item.quality ? item.quality : null,
							headers:		item.headers ? item.headers : null,

							videoId:		item.videoId ? item.videoId : null,
							
							icons:          item.icons ? item.icons : null, 
							source:			item.source,
							metod:			item.metod ? item.metod : "download",

							status:			item.status ? item.status : 'stop',
							size:			item.size ? item.size : null,
							progress:       0,
							progressByte:   null, 
							duration:       item.duration ? item.duration : null,
							thumbnail:      thumbnail, 
				};
				
				if (item.params)    file_item['params'] = item.params;
				if (item.playlist)  file_item['playlist'] = item.playlist;
				if (item.segments)  file_item['segments'] = item.segments;
				if (item.template)  file_item['template'] = item.template;
				if (item.manifest)  file_item['manifest'] = item.manifest;
				if (item.combine)   file_item['combine'] = item.combine;

				if( !self.hasDataForTab( tabId ) )		data[tabId] = [];

				//替换，如果hash有重复的，就替换掉之前的数据
				if ( 'noRepeat' in item && item.noRepeat ) {
					for( var i=0; i<data[tabId].length; i++ )  {
						if (data[tabId][i].hash == hash)  {

			                file_item.id = data[tabId][i].id;
			                file_item.status = data[tabId][i].status;
			                if (data[tabId][i].size) file_item.size = data[tabId][i].size;

							data[tabId][i] = file_item;
							return data[tabId][i].id;
						}	
					}
				}	


				var flagAdd = true;
				if ( 'noReplace' in item && item.noReplace ) {
					flagAdd = true;
				}
				else {
					flagAdd = !self.itemHashExists( tabId, hash );

				}

				if ( flagAdd )  {
					// add
					lastItemId++;
					file_item.id = lastItemId;

					data[tabId].push( file_item );	

					if ( ('getSize' in item && item.getSize) || !item.size ) {
						self.getSize( item );
					}

					if ( 'ffmpegThumb' in item && item.ffmpegThumb ) {
						self.ffmpegThumb( item );
					}

					return lastItemId;
				}
				else {
					return null;			// уже есть		
				}
			}	

		}

		// ----------------------------------------------------------------------------------------------------
		this.ffmpegThumb = function( item ){

			//fvdDownloader.Thumbnail.get({  group:  item.group,
			//							   url:    item.url,
			//							   ext:    item.ext  } );

		}	
		
		// ----------------------------------------------------------------------------------------------------
		this.getSize = function( item ){

			if ( ["download", "convert" ].indexOf(item.metod) == -1 ) return;

			var hash = item.hash;
			var url = item.url;

			var size = 0;

			async.series([
				function(next) {
					fvdDownloader.Utils.getSizeByUrl(url, function(sz){
						if (sz) {  
							try {
								size = parseInt(sz);	
							}
							catch(ex) {};
							next();
						}	
					});
				},	
				function(next) {
					if (item.metod == "convert") {
						fvdDownloader.Utils.getSizeByUrl(item.params.audio_url, function(sz){
							if (sz) {  
								try {
									size += parseInt(sz);	
								}
								catch(ex) {};
								next();
							}	
						});
					}
					else {
						next();
					}
				},
				function(next) {
					for( var tabId in data ){
						for( var i=0; i<data[tabId].length; i++ )  {
							if (data[tabId][i].hash == hash)  {
								data[tabId][i].size = size;
								chrome.extension.sendMessage( {  subject:  "mediaGotAttribute",	
															     id:       data[tabId][i].id,	
															     data:  	  { 'size': size }	
															  } );
							}	
						}
					}	
				}
			]);

		}	
		
		// ----------------------------------------------------------------------------------------------------
		this.gotThumbnail = function( message, tabInfo ){

			var tabId = tabInfo.id;
			var thumbnail = message.thumbnail;

			imageThumbnail[tabId] = thumbnail;

			if ( data[tabId] ) {
				for( var i=0; i<data[tabId].length; i++ )  {
					var fl = false;
					if ( !data[tabId][i].thumbnail ) {
						data[tabId][i].thumbnail = thumbnail;
						imageThumbnail[tabId] = thumbnail;								
						fl = true;
					}
					if (message.quality) {
						data[tabId][i].quality = message.quality.height;
						data[tabId][i].display_label = [];
	                    data[tabId][i].display_label.push({tag: 'span', content: '['+message.quality.width+'x'+message.quality.height+', ' });
	                    data[tabId][i].display_label.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(data[tabId][i].ext) });
	                    data[tabId][i].display_label.push({tag: 'span', content: '] ' });
						fl = true;
					}                                         
					if (message.duration) {  
						data[tabId][i].duration = message.duration;
						fl = true;
					}	

					if (fl) {
						fvdDownloader.Media.mediaForTabUpdate(tabId);	
					}
				}    
			}    

		}	
		
		// -----------------------------------------------------
		function gotThumbnailStream(groupId, rez) {

			for( var tabId in data ){
				var f = false;
				for( var i=0; i<data[tabId].length; i++ )  {
					if (data[tabId][i].group == groupId)  {
						if (rez.thumbnail)  data[tabId][i].thumbnail = rez.thumbnail;
						if (rez.quality) {
							data[tabId][i].quality = rez.quality.height;
							data[tabId][i].display_label = 
												'<span>[</span>' 
											   +'<span>'+rez.quality.width+'x'+rez.quality.height+', </span>'
											   +'<b>'+fvdDownloader.Utils.upperFirst(data[tabId][i].ext)+'</b>'
									           +'<span>] </span>';
						}                                         
						if (rez.duration)  data[tabId][i].duration = rez.duration;
						
						f = true;
					}	
				}

				if (f) fvdDownloader.Media.mediaForTabUpdate(tabId);	
			}	
		
		} 

		// ----------------------------------------------------------------------------------------------------
		this.gotThumbnailFaceBook = function( rez ){

			var title = rez.name || rez.from.name;
			
			for( var tabId in data ){
				var f = false;
				for( var i=0; i<data[tabId].length; i++ )  {
					if (data[tabId][i].group == rez.id)  {
						
						data[tabId][i].thumbnail = rez.picture;
						
						if (title) {
							data[tabId][i].displayName = title;
							data[tabId][i].downloadName = title;
							data[tabId][i].title = title;
						}	
						
						f = true;
					}	
				}

				if (f) fvdDownloader.Media.mediaForTabUpdate(tabId);	
			}	
		
		}
		
		// -----------------------------------------------------
		function isPlaylist(tabId) {
			
			if( data[tabId] )	{			
				for( var i=0; i<data[tabId].length; i++ )  {
					if (data[tabId][i].source == 'MediaStream')  return true;
				}    
			}    
			return false;
		}    
		
		// ----------------------------------------------------------------------------------------------------
		this.itemHashExists = function( tabId, hash ){

			if( data[tabId] )	{
				for( var i = 0; i != data[tabId].length; i++ )	{
					if ( data[tabId][i].hash === hash ) return true;
				}
			}
			return false;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function itemAlreadyExists( tabId, item ){

			if( data[tabId] )	{
				for( var i = 0; i != data[tabId].length; i++ )	{
					var existsItem = data[tabId][i];
					if(fvdDownloader.Media[item.source].isEqualItems( item, existsItem ))	{
						return true;
					}
				}
			}
			return false;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function itemAlreadyExists_source( tabId, item ){
			var exists = false;
			if( data[tabId] )
			{
				for( var i = 0; i != data[tabId].length; i++ )
				{
					var existsItem = data[tabId][i];
					if( existsItem.source == item.source )
					{
						if(fvdDownloader.Media[item.source].isEqualItems( item, existsItem ))
						{
							exists = true;
							break;
						}
					}
				}
			}
			return exists;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getMaxPriorityForTab( tabId ){
			var max = 0;
			data[tabId].forEach(function( item ) {
				
				     if( item.priority > max )		max = item.priority;
					 
			});
			
			return max;			
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getDataForTab( tabId ){
			var result = [];
			
			data[tabId].forEach( function( item ){
				
						result.push( item );
				
			} );
			
			return result;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getDataForHash( hash ){
			
			var result = null;
			
			for( var tabId in data ){
				data[tabId].forEach( function( item ){
						if ('hash' in item && item.hash == hash)  result = item;
				} );
			}	
			
			return result;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getLink( tabId ){
		
			var result_link = [];
			var result_image = [];
			var result_file = [];
			var result_video = [];
			var count_link = 0;
			var count_image = 0;
			var count_file = 0;
			var count_video = 0;
			var vubor_link = 0;
			var vubor_image = 0;
			var vubor_file = 0;
			var vubor_video = 0;
			
			data[tabId].forEach( function( item ){
			
						if ( item.type == "video" || item.type == "audio" || item.type == "game")
						{
							result_video.push( item );
							count_video++;
							if (item.vubor == 1) vubor_video++;
						}
						else if ( item.type == "file" || item.type == "archiv")
						{
							result_file.push( item );
							count_file++;
							if (item.vubor == 1) vubor_file++;
						}
						else if ( item.type == "image" )
						{
							result_image.push( item );
							count_image++;
							if (item.vubor == 1) vubor_image++;
						}
						else
						{
							result_link.push( item );
							count_link++;
							if (item.vubor == 1) vubor_link++;
						}
					} );
					
			return { 	video: result_video, k_video: count_video, v_video: vubor_video,
						file: result_file, k_file: count_file, v_file: vubor_file, 
						image: result_image, k_image: count_image, v_image: vubor_image,
						link: result_link, k_link: count_link, v_link: vubor_link };
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getMedia( tabId ){
		
			var result_video = [];
			data[tabId].forEach( function( item ){
						result_video.push( item );
					});
			
			return result_video;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getDataByPriority( tabId, priority ){
			var result = [];
			data[tabId].forEach( function( item ){
				
						if( item.priority == priority )		result.push( item );
				
			} );
			
			return result;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function refreshAdList(  ){
			
			var adSignsString = "";
			
			async.series([
				function( chainCallback ){
					
					if( fvdDownloader.Prefs.get( "snif_ad_signs" ) ){	
						adSignsString = fvdDownloader.Prefs.get( "snif_ad_signs" );
						chainCallback();
					}
					else{
						var localAdFilePath = chrome.extension.getURL( "data/ad_signs.txt" );
						fvdDownloader.Utils.downloadFromUrl( localAdFilePath, function( contents ){
							
							adSignsString = contents;
							chainCallback();
							
						} );													
					}
										
				},
				
				function(){
						
					adSigns = adSignsString.split( "\n" );					
											
				}
			]);	
			
		}
		
		// ----------------------------------------------------------------------------------------------------
		function downloadAdList( callback ){
			
			fvdDownloader.Utils.downloadFromUrlsList(AD_UPDATE_URLS, function( text ){
				
				if( text ){
					fvdDownloader.Prefs.set( "snif_ad_signs", text );					
				}
				
				if( callback ){
					callback();			
				}
				
			});			
			
		}
		
		// ----------------------------------------------------------------------------------------------------
		function isAdUrl( url ){

			url = url.toLowerCase();
			
			for( var i = 0; i != adSigns.length; i++ ){
				
				if( !adSigns[i] ){
					continue;
				}
				
				if( url.indexOf( adSigns[i] ) != -1 ){
					return true;
				}
				
			}
			
			return false;
			
		}

		// ----------------------------------------------------------------------------------------------------
		this.hasDataForTab = function( tabId ){		
		
			if( data[tabId] && data[tabId].length > 0 )			return true;
			
			return false;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.setData = function( par, opt ){

			var list = [];
			
			if ( par.id ) {
				for( var tabId in data ){
					data[tabId].forEach( function( item ){
							if (item.id == par.id)  {
								for (var k in opt) 	if ( k in item )  item[k] = opt[k];
								list.push(item.id);	
							}
					} );
				}	
				fvdDownloader.MainButton.refreshMainButtonStatus(tabId);
			}	
			else if ( par.hash ) {
				for( var tabId in data ){
					data[tabId].forEach( function( item ){
							if (item.hash == par.hash)  {
								for (var k in opt) 	if ( k in item )  item[k] = opt[k];
								list.push(item.id);	
							}
					} );
				}	
				fvdDownloader.MainButton.refreshMainButtonStatus(tabId);
			}	
			else if ( par.group ) {
				for( var tabId in data ){
					data[tabId].forEach( function( item ){
							if (item.group == par.group)  {
								for (var k in opt) 	if ( k in item )  item[k] = opt[k];
								list.push(item.id);	
							}
					} );
				}	
				fvdDownloader.MainButton.refreshMainButtonStatus(tabId);
			}

			return list;
		}	
		
		// ----------------------------------------------------------------------------------------------------
		this.setData_Status = function( tabId, id, t ){
			
			if( !self.hasDataForTab( tabId ) )		return null;
			
			data[tabId].forEach( function( item ){
				
						if ( item.id == id)
						{
							item.vubor = t;
							return;
						}	
				
					} );
		}
		
		this.setData_Attribute = function( tabId, id, attr, val ){
			
			//console.log('setData_Attribute', tabId, id, attr, val );
			
			if( !self.hasDataForTab( tabId ) )		return null;
			
			data[tabId].forEach( function( item ){
				
						if ( item.id == id)	{
							switch (attr)	{
								case "size":			item.size = val;     break;
								case "status":			item.status = val;     break;
								case "downloadId":      item.downloadId = val;
														item.progress = 0;
														item.progressByte = 0; 
														item.status = 'start';     break;
								case "progress":      	item.progress = val.progress;
														item.progressByte = val.progressByte;      break;
								case "playlist":		item.playlist = val;     break;
							}
							
							fvdDownloader.MainButton.refreshMainButtonStatus(tabId);
							return;
						}	
					} );
		}
		
		this.setParams_Attribute = function( tabId, id, attr, val ){
			
			//console.log('setParams_Attribute', tabId, id, attr, val );
			
			if( !self.hasDataForTab( tabId ) )		return null;
			
			data[tabId].forEach( function( item ){
				
						if ( item.id == id)	{
							item.params[attr] = val;
							chrome.extension.sendMessage( {	subject: "mediaGotParams", 
															id: item.id, 
															hash: item.hash, 
															params: item.params	});
							return;
						}	
					} );
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.setData_AttributeUrl = function( tabId, url, attr, val ){

			if( !self.hasDataForTab( tabId ) )		return null;
		
			data[tabId].forEach( function( item ){
				
						if ( item.url == url)
						{
							switch (attr)
							{
								case "size":			item.size = val;     break;
								case "title":			item.title = val;     break;
								case "format":			item.format = val;     break;
								case "downloadName":	item.downloadName = val;     break;
							}
							return;
						}	
					} );
			
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.setTitle_FaceBook = function( tabId, videoId, val ){

			if( !self.hasDataForTab( tabId ) )		return null;
		
			data[tabId].forEach( function( item ){
						if ( item.videoId && item.videoId == videoId)	{
							item.title = val;
							item.downloadName = "["+item.quality+"] "+val; 
							item.displayName = "["+item.quality+"] "+val;     
						}	
					});
			
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getData_Media = function( tabId, v ){

			var result = [];
		
			if (v)
			{
				data[tabId].forEach( function( item ){
							if ( v.indexOf(item.id) != -1 )			result.push(item);
						} );
			}			
					
			return result;		
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getDataForTab = function( tabId ){
		
			if( !self.hasDataForTab( tabId ) )		return null;
			
			var d = getDataForTab( tabId );
			
			return d;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getDataForHash = function( hash ){
		
			var d = getDataForHash( hash );
			
			return d;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getDataForId = function( id ){
			
			var d = null;
			for( var tabId in data ){
				data[tabId].forEach( function( item ){
						if (item.id == id)  d = item;
				} );
			}	
			
			return d;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getDataForSource = function( tabId, source ){
			
			if( !self.hasDataForTab( tabId ) )		return null;

			var result = [];
			
			data[tabId].forEach( function( item ){
				
						if (item.source == source)	result.push( item );
				
			} );
			
			return result;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getLink = function( tabId ){
		
			if( !self.hasDataForTab( tabId ) )		return null;
			
			var d = getLink( tabId );
			
			return d;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getMedia = function( tabId ){
		
			if( !self.hasDataForTab( tabId ) )		return null;
			
			var d = getMedia( tabId );

			return d;
		}

		// ----------------------------------------------------------------------------------------------------
		this.setTwitch = function( hash, status, size ){
		
			var f = false;
			for( var tabId in data ){

				for( var i = 0; i != data[tabId].length; i++ ) {

							if ( data[tabId][i].hash == hash )	{

								if (status) data[tabId][i].status = status;
								if (size) data[tabId][i].size = size;
								
								f = true;
							}
				};
			}	
			if (f) fvdDownloader.MainButton.refreshMainButtonStatus(tabId);

			return;
		}

		// ----------------------------------------------------------------------------------------------------
		this.getTwitch = function( tId, hash ){
		
			for( var tabId in data ){
				
				if (tabId == tId) continue;

				for( var i = 0; i != data[tabId].length; i++ ) {

					if ( data[tabId][i].hash == hash )	{

						return data[tabId][i];
					}
				};
			}	

			return null;
		}

		// ----------------------------------------------------------------------------------------------------
		this.setStream = function( hash, params ) {		

			var f = false;
			for( var tabId in data ){
				for( var i = 0; i != data[tabId].length; i++ ) {
							if ( data[tabId][i].hash == hash )	{
								for (var k in params) {
									data[tabId][i][k] = params[k];
								}	
								f = true;
							}
				};
			}
			
			if (f) fvdDownloader.MainButton.refreshMainButtonStatus(tabId);

			return;
		}

		// ----------------------------------------------------------------------------------------------------
		this.setPlaylist = function( tabId, id, list ) {		

			for( var i = 0; i != data[tabId].length; i++ ) {
				if ( data[tabId][i].id == id )	{
					data[tabId][i].playlist = list;
				}
			};
			
			return;
		}

		// ----------------------------------------------------------------------------------------------------
		this.setDataForTab = function( tabId, tabData ){
			data[tabId] = tabData;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.addItemForTab = function( tabId, item ){
		
			if (!item.source) return;
			
			if( data[tabId] )	{
				for( var i = 0; i != data[tabId].length; i++ )	{
					var existsItem = data[tabId][i];
					var is = fvdDownloader.Media[item.source].isEqualItems( item, existsItem );
					if(is == 1)	{
						console.log('REPEAT', tabId, item, existsItem);
						item.id = data[tabId][i].id;
						item.status = data[tabId][i].status;
						if (data[tabId][i].size) item.size = data[tabId][i].size;
						data[tabId][i] = item;
						return;
					}
					else if (is == -1) {
						return;
					}
				}
			}
			
			// add	
			lastItemId++;
			item.id = lastItemId;
			if (!item.status) item.status = 'stop';	
			if (!item.metod) item.metod = 'download';
			
			if( !self.hasDataForTab( tabId ) )	{
				data[tabId] = [];
			}
			data[tabId].push( item );
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.removeItemForUrl = function( tabId, url ){

			if (data[tabId])  {
				for( var i = 0; i != data[tabId].length; i++ ) {
							if ( data[tabId][i].url == url)	{
								data[tabId][i].type = 'remove';
							}
				};
			}			
		
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.removeTabSourceData = function( tabId, source, listId_NoRemove ){
			
			if (typeof listId_NoRemove == 'undefined') listId_NoRemove = [];

			if (source)  {
				if (data[tabId])  {
					var result = [];
					var listRemoved = [];
					
					data[tabId].forEach( function( item ) {
								if ( item.source != source || listId_NoRemove.indexOf(item.id) != -1 )  result.push(item);
								else listRemoved.push(item);
							} );
				
					if (result) data[tabId] = result;
							else delete data[tabId];
							
					return listRemoved;		
				}			
				
			}			
			else  {
				delete data[tabId];
			}	
			return null;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.removeTabData = function( tabId ){

			console.log('removeTabData', tabId);	

			if (data[tabId])  {
				var result = [];
				
				data[tabId].forEach( function( item ) {
							if ( item.status === 'start' )  result.push(item);
				} );
			
				if (result.length>0) data[tabId] = result;
				else delete data[tabId];
					
				if (imageThumbnail[tabId])   delete imageThumbnail[tabId];
			}			

			fvdDownloader.Media.removeTabData( tabId );
			
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.removeItem = function( id ){
			
			for( var tabId in data ){
				
				var index = - 1;
				for( var i = 0; i != data[tabId]; i++ ){
					if( data[tabId][i].id = id ){
						index = i;
						break;
					}
				}
				
				if( index != -1 ){					
					data[tabId].splice( index, 1 );
					
					var removeListeners = [];
					
					mediaRemoveListeners.forEach(function( listener ){
						
						try{
							listener( tabId );
						}
						catch( ex ){
							removeListeners.push( listener );
						}
						
					});
					
					removeListeners.forEach(function( listener ){
							
						self.onMediaRemove.removeListener( listener );							
						
					});
					
					
				}
				
			}
			
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getActiveConvertStream = function( ){

			var d = false;
			for( var tabId in data ){
				data[tabId].forEach( function( item ){
					if ( ['stream', 'convert'].indexOf(item.metod) != -1 ) {
						if ( item.status == 'start' ) 	d = true;	
					}	
				} );
			}	
			
			return d;
		}
		
	}
	
	this.Storage = new MediaStorage();
	
}).apply( fvdDownloader );
