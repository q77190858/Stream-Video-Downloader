(function(){
	
	var DailyMotion = function(){		
	
		const DEBUG = false;
	
		const TITLE_MAX_LENGTH  = 96;
		
		const IGNORE_URL_SIGNS = [	];

		const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
		const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)", "i");

		var titleDM = {};

		// было в 2017
		//http://www.dailymotion.com/cdn/manifest/video/x645tfn.m3u8?auth=1508762245-2562-srxetnhz-9a8afb89aee6cd986e7efe0913f5c015icHQvPbaVNdPQHlTL4Eplk525NRK9uebzE7vqVqkSVH_Puzo6OaAjRvX-E99rIknCws6zWdHhvKOJSXNb6Kynwl_KX_fYL5crDVUSK5UoqKkgFW0HEOA6MzCYBjQTKvY7ksoCQ692dSEmlz7xs20-NoptyA1MWBc8q1HEiZqRCa4iuXst4LrfuyOQJiyAnpq8e6xaxGx3Yc3NEic3fCHFqxPYknxg6Cs9np2qNKzA81lE6DbH5ED1GuSH1-AWqe-OqvxZ35NWu5YLQwW2ZsDHYYqLqDie5ocblJLYAumGCD2F-47UD-BKzvSfMvCsLZMpqOdNR8EF1IyPMlDaoY7T3YFaXZjgiXLGFwt92IjLBkxNxWXYIs43hNw9tqq5cbom2m-jldw9HpMTgHarojmwXV9nkV_aF5MjO7MDiL_pBeggpJ9y-nvPsHOX-Wp__5CDSEE-B-pJ2e2TfP7WsmUXaW1uGXL0_bh2ZljnK0xAPmTqlyxCFYScmOH8wSTHmAQwA8CJ9JqUbYqVOOdUTkXmAHK4eRMxLgW21hTk6FV9A6rmrMDFvKRFYhNFG9bWKuT072UweWqOjWq8XlhgAUaZrQYM5pRer_rRHF0oVJZ0h8sm7ZtViDQknTwp1N7Iyac9EuqFYsYIHDXOSKIJfDlcVcOIpkTLkC5jkdfJGL67boTbp_vMA6sHHSwx3VccLXMWfVW2zrBm_BXERVKXFDfP60-zIurFP4zxyn2IMVzKNLoKl58fkUxdiv5PpADjocw_9zr9m5SC2FuFdVmU-11DfxTwAZt6pCZ0JjbY3rVrwMv3OxtLbnCtPLgg2YRIi8MGGNe34Wz29C3qS1O7qwwqWdx7KH2r5e1WEBMwdSVjHVSAGiA4W8VRx2v5OjTN5NG4ItBXQvDzWkLncjo1RWI0Xz1YthSpQWIKWVrM3gcdHHF5Ya9r7gHVPwGMqM9bszq3ZqtQ3D-XatPiHydFCsDRsQYnTvn-BHwE1IJL32ZcG3Z0bObaWeJGGfbsWQYxr1aEMeisBAjEbL6TxwcE96a5AVoxtE50VP-xmbre7fwkLxrN_Hiesyys87Wxf5rRl5b7JJur5Why2NWKiud9Eybi2H4u391y8yR0Zbk56SQbpgaHs7a4n4m-d8Jx0BU8164jzfVlZPveW9Rrfs8t3sKT_sepNfUVceIb1hr-QzEAzmWPRMlK0_uXHXQMGqVXGkvAbSZTJe3HlHlzuVAeXZQOEH4BbIzIqIpQq9iLhGp9txSFG1h5YJYAwawre9qpWQuMRJU3JMmlnFBCBrhKP6uZPLwU4HfNAICR5ef1cY-KofhTzagLZQ20nxaOTnk-JdUnN7uRd4mK8KaEhKdRXBb5t-jL4doTuivNEPGu8iPfnqoDare5Nt64WNYvsxNoKcizBnWVeK1Ysd4Y1eO0vA9P_jRVfHnqY31n8u0iCN2Mok_UK2_sOm5oWTEx__yOgqhJRvgweeSsW7ljkR2jNmXg5tpG80mPvXQKoV72zXRXb_idPuPgZBsdVcl6RUo4HUrSixS9qZjhSApPjtOhjSHULwMN57ZYgAsK4unR7F-u28EYpBIanrTUSMbNAsib1MRbRmcIMRogY5CNCFJz04tJWWupmlnXoaWFe1P9NlrGovt1v59ovmdA31RMIk14RunDZdNM_4KWW44gA8U65S8hIoxEXa1uNSDsSr-fGBq-buWnewJtOt8zb7na_rbKbsn3kW6SVjd9HCuInxkFyKOjJbKG0gLfD778fISwpeY35ITsiPkC3bWfxw18eka9vjywfadqzY5BNitP3E_lwkplTOnDOxOO0rjPB0XHAgfSMuP4wNbSRrQXc25RqwCFsXIvnKCqLuDvSWYsy2KbDnmKPV9H5utwMbibhzorjtkLaDYMs60xNdQyY7xfoPleNtNm&ps=574x324&ct=&callback=jsonp_1508589446111_89174
		//http://www.dailymotion.com/cdn/manifest/video/x645tfn.m3u8?auth=1508762245-2688-ulmirowf-29e932b634babc72a2513cea692d9c64

		// с 2018
		//http://dmxleo.dailymotion.com/cdn/manifest/video/x2b7ucm.m3u8?auth=1516126673-2688-t24kot6a-932a0859e27724c8b560c50
		//http://www.dailymotion.com/cdn/manifest/video/x2b7ucm.m3u8?auth=1515968192-2690-ydw0ujys-6c5049895e9aa9280774e7821c6e0107

	
		//http://proxy-29.sv6.dailymotion.com/sec(642107591d511972d6e16b04cb06d0d1)/video/749/687/369786947_mp4_h264_aac_l2.m3u8#cell=sv6&p2p=sr&comment=QOEP2PVODSR14


		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			if( /^https?:\/\/[www|dmxleo]+\.dailymotion\.com\/cdn\/manifest\/video\/[^\?]*\.m3u8/.test(data.url) )  {		
				detectDailyMotion( data, callback );
				return;            
			}    
			else if( /\.dailymotion\.com\/sec[^\?]*/.test(data.url) )  {		
   	 			callback(null, true);
   	 			return;
			}	

			callback(null);
		}
		
		// --------------------------------------------------------------------------------
		function detectDailyMotion( data, callback ){
			
			var ignore = false;
			IGNORE_URL_SIGNS.forEach(function( sign ){
				if( data.url.toLowerCase().indexOf( sign ) != -1 ){
					ignore = true;
					return false;
				}
				if( data.tab.url.toLowerCase().indexOf( sign ) != -1 ){
					ignore = true;
					return false;
				}
			});
			if( ignore ) {
				callback(null);	
				return false;
			}	
			
			parse_DailyMotion(data, callback);
		}	

		// --------------------------------------------------------------------------------
		function parse_DailyMotion( data, callback ){

			if (DEBUG) console.log( data );

			var url = data.url;
			var hh = hex_md5(url);
			var foundMedia = false;
			var parsedMedia = [];

			async.series([
				function(next) {
					fvdDownloader.Utils.getAJAX( url, null, function(content){
						var x = content.substring(0, 30);
						if (x.indexOf("jsonp_") != -1)	{
                   	 		var mm = content.match( /content\.title\s*:(.+?)\n/i );
                   	 		if (mm) {
                   	 			var tt = mm[1];
                   	 			var kk = tt.indexOf("|");
                   	 			if (kk != -1) tt = tt.substring(0, kk);
                   	 			titleDM[data.tabId] = tt.trim();
                   	 		}	
               	 			callback(null, true);
                   	 		return;
						}	
						else {
							fvdDownloader.Media.ExtM3U.detectMedia( data, function(mm, ff){

								if (mm) {
									for (var ii=0; ii<mm.length; ii++) {
										mm[ii]["source"] = 'DailyMotion';
										mm[ii]["displayName"] = titleDM[data.tabId];
										mm[ii]["downloadName"] = titleDM[data.tabId];
										parsedMedia.push( mm[ii] );
									}
									foundMedia = true;
								}	
								next();
							});
						}				
					});	
				},
				function(next) {
					if (foundMedia) {
						data.foundMedia = "DailyMotion";	
						callback(parsedMedia, true);
					}
					else {
						callback(null);
					}	
				}
			]);

		}

		
		// ====================================================================	
		this.getMedia = function( media ){
			
			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "DailyMotion" ) {
											var iii = find( item ); 
											if (iii == -1) stream_media.push( item );
											else stream_media[iii] = item;
										}	
										else if ( item.source == "Sniffer" )  sniffer_media.push( item );
										else  other_media.push( item );
									});
			
			if (stream_media.length > 0) {
				other_media.forEach(function( item ){	 stream_media.push( item )  });
				return stream_media;
			}	
			else {
				other_media.forEach(function( item ){	 sniffer_media.push( item )  });
				return sniffer_media;
			}	
			
			function find( e ) {
				if ( !e.quality ) return -1;
				for (var ii=0; ii<stream_media.length; ii++) {
					if (stream_media[ii].quality == e.quality && stream_media[ii].group == e.group)  return ii;	
				}	
				return -1;
			}
		}

		// ====================================================================	
		this.removeTabData = function( tabId ){

			if ( titleDM[tabId] ) delete titleDM[tabId];

		}	

	};
	
	this.DailyMotion = new DailyMotion();
	
}).apply( fvdDownloader.Media );
