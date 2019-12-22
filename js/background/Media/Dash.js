(function(){
	
	var Dash = function(){		

		var self = this;
		
		const DEBUG = false;
	
		const TITLE_MAX_LENGTH  = 96;
		
		const IGNORE_URL_SIGNS = [	
				"www.viki.com",
			];

		const EXT_PATTERN = new RegExp("\\.([a-z0-9]{1,5})(?:\\?|#|$)", "i");
		const NAME_PATTERN = new RegExp("/([^/]+?)(?:\\.([a-z0-9]{1,5}))?(?:\\?|#|$)", "i");

		var lastStreamId = 0;	

		var isNode = typeof exports !== "undefined";

		const DASH_URL_GET_PAGE = [	
				new RegExp("brightlightfineart\\.com", "i"),
			];

		// http://www.bbc.com/news/technology-39913630?utm_source=digg
		// http://www.ceskatelevize.cz/ivysilani/1093836883-na-plovarne/217522160100006-na-plovarne-s-ludkem-sobotou/
		// https://www.reddit.com/r/MMA/comments/7zch8b/luke_rockhold_teasing_his_debut_at_205_and_some/?st=je61pjm1&sh=310228b8
		// https://www.viki.com/videos/1121160v-my-golden-life-episode-44

		// --------------------------------------------------------------------------------
		this.detectMedia = function( data, callback ){

			var url = data.url.toLowerCase();
			
			if( /^https?:\/\/[^\?]*\.mpd/.test(url) )  {			
				detectVideo( data, callback );
				return;            
			} 
			else if(data.contentType && data.contentType.toLowerCase().indexOf("dash+xml") != -1) {
				detectVideo( data, callback );
				return;
			}       

			callback(null);
		}
		
		// --------------------------------------------------------------------------------
		function detectVideo( data, callback ){

			if (DEBUG) console.log(data);

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

			data.flag_get_page = false;
			DASH_URL_GET_PAGE.forEach(function( sign ){
				if ( sign.test(data.tabUrl) )		{
					data.flag_get_page = true;
					return false;
				}
			});

			fvdDownloader.Media.GetRequest( { tabId:   data.tabId,
											  page:    data.flag_get_page,
											  url:     data.url, 
											  headers: data.headers 
										    }, 
									    function(resp){
												if (!resp.error) {
													var xml = fvdDownloader.Utils.parseXml( resp.content );
													if (xml) {

														data.xml = xml;
														var media = self.ParseMPD(data);

														if (media.length>0) {

															if (DEBUG) console.log(media);
															data.foundMedia = "Dash";	
															callback(media, true);

														}
														else {
															callback(null);	
														}

													}
													else {
														callback(null);	
													}
												}	
												else {
													callback(null);
												}	
									});			

		}	

		// --------------------------------------------------------------------------------
		this.ParseMPD = function( data ){

			var parsedMedia = [];

			var url = data.url;
			
			var domain = null, 
				host = null, 
				prot = "", 
				search = null;

			var x = fvdDownloader.Utils.parse_URL(url);
			host = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '') + x.path+'/';
			domain = x.protocol + '//' + x.hostname + (x.port ? ':'+x.port : '');
			search = x.search || "";

			if (DEBUG) console.log('HOST:', host, '\nDOMAIN:', domain, '\nSEARCH:', search)


			var infoXML = data.xml;
			var t = infoXML.getElementsByTagName('MPD');
			if (!t || t.length==0) {  
				console.log('---error--- no MPD structure');
				return null;
			}	

			var infoMPD = {};

			var e = t.item(0);
			var x = e.getAttribute('mediaPresentationDuration');
			infoMPD.duration = parse_duration(x);	

			// -----------  Period  ---------------
			var ttt = infoXML.getElementsByTagName('Period');
			if (ttt && ttt.length>0) {
				for (var jj=0; jj<ttt.length; jj++) {		

					e = ttt.item(jj);
					var id = e.getAttribute('id');                  
					var start = e.getAttribute('start');                    

					var x = e.getAttribute('duration');
					if (x) 	infoMPD.duration = parse_duration(x);

					infoMPD.id = id;
					infoMPD.index_id = jj;
					_Representation( e, jj );
				}	
			}	


			// -------------------------	
			function _Representation( _info, index_id ) {

				if (DEBUG) console.log('________________________Representation_____________________________\n', _info);

				// -----------  BaseURL  ---------------
				infoMPD.baseUrl = get_base_url( _info ); 
				
				// ----------------- AdaptationSet --- Representation ---------------------------------------------------------
				infoMPD.RepresentationVideo = [];
				infoMPD.RepresentationAudio = [];
				var tt = _info.getElementsByTagName('AdaptationSet');
				if ( !tt ) return null;
				for (var i=0; i<tt.length; i++) {    

					var sgmt = segment_template(tt[i]);
				
					var dd = tt[i].getElementsByTagName('Representation');
					if ( !dd ) continue;

					for (var j=0; j<dd.length; j++) {    
						add_representation( tt[i], dd[j], sgmt );
					}
				}	

				// ------------------ собрать ссылку --------------------
				infoMPD.RepresentationAudio.sort(function(item1, item2){
					return item1.bandwidth < item2.bandwidth ? -1 : 1;
				});
				if (DEBUG) {
					console.log('-------------------------------------------------------------------');
					console.log(infoMPD.RepresentationVideo);
					console.log(infoMPD.RepresentationAudio);
					console.log('-------------------------------------------------------------------');
				}

				var	audioStream = infoMPD.RepresentationAudio.length > 0 ? infoMPD.RepresentationAudio[0] : null;
				var	videoStream = null;
				var groupMedia = fvdDownloader.Storage.nextGroupId();

				for (var i=0; i<infoMPD.RepresentationVideo.length; i++) {    

					videoStream = infoMPD.RepresentationVideo[i];

					var label = videoStream.width && videoStream.height ? videoStream.width+'x'+videoStream.height : ( videoStream.width || videoStream.height || null);

					var quality = videoStream.height ? parseInt(videoStream.height) : 0;

					var ft = [];
					ft.push({tag: 'span', content: '[' });
					if (label) ft.push({tag: 'span', content: label + ', ' });
					ft.push({tag: 'b',    content: fvdDownloader.Utils.upperFirst(videoStream.ext) });
					ft.push({tag: 'span', content: '] ' });

					var segments = {video: { baseUrl:		  videoStream.baseUrl,
											 initSeg:		  null,
											 initUrl:         videoStream.initUrl ? videoStream.initUrl : null,
											 segments:		  videoStream.segments ? videoStream.segments : null,
											 sidxUrl:         videoStream.sidxUrl ? videoStream.sidxUrl : null,
											 firstSegmentUrl: null,
											 ext:			  videoStream.ext,
											 paramsBootstrap: null
										   } };
					if (videoStream.firstSegmentUrl) {	
						segments.video.firstSegmentUrl = videoStream.firstSegmentUrl; 		  
						segments.video.firstOffset = videoStream.firstOffset; 		  
					}	

					if (audioStream)  {
						segments.audio =   { baseUrl:		  audioStream.baseUrl,
											 initSeg:		  null,
											 initUrl:         audioStream.initUrl ? audioStream.initUrl : null,
											 segments:		  audioStream.segments ? audioStream.segments : null,
											 sidxUrl:         audioStream.sidxUrl ? audioStream.sidxUrl : null,
											 firstSegmentUrl: null,
											 ext:			  audioStream.ext,
											 paramsBootstrap: null
										   }; 
						if (audioStream.firstSegmentUrl) {	
							segments.audio.firstSegmentUrl = audioStream.firstSegmentUrl; 		  
							segments.audio.firstOffset = audioStream.firstOffset; 		  
						}	
					}			  

					var m = {	url: 			videoStream.baseUrl ? videoStream.baseUrl : data.url,
								tabId: 			data.tabId,
								tabUrl: 		data.tabUrl,
								frameId: 		data.frameId,
								hash: 			index_id + '_' + videoStream.id,
								videoId:    	videoStream.id,
								ext: 			videoStream.ext,
								title: 			data.tabTitle,
								format: 		"",
							
								downloadName: 	data.tabTitle,
								displayName: 	data.tabTitle,
								displayLabel: 	ft,
								filename: 		videoStream.id,
							
								segments:       segments,
							
								size: 			0,
								type: 			"video",
								metod: 			'segments',
								source: 		"Dash",
								quality:    	quality,
								duration:		infoMPD.duration,
							
								group: 			groupMedia,
								order: 			quality,
							};

					parsedMedia.push(m);

				}	

			} 
			// -------------------------	

			if (DEBUG) {
				if (isNode) {
					write(infoMPD);
					write(parsedMedia);
				}
				else {
					console.log(infoMPD);
					console.log(parsedMedia);
				}	
			}	

			return parsedMedia;

			// -----------------------------------------------
			function get_segment_base(xml) {

				var indexRange = null;
				var firstSegmentRange = null;

				t = xml.getElementsByTagName('SegmentBase'); 
				if (t && t.length>0) {
					e = t.item(0); 
					if (e) { 
						indexRange = e.getAttribute('indexRange');
						firstSegmentRange = e.getAttribute('FBFirstSegmentRange');
					}    
				}

				return {indexRange: indexRange, firstSegmentRange: firstSegmentRange};    
			}	

			// -----------------------------------------------
			function get_initialization(xml) {

				var range = null;
				t = xml.getElementsByTagName('Initialization'); 
				if (t && t.length>0) {
					e = t.item(0);
					range = e.getAttribute('range');
				}

				return { range: range};    
			}	

			// -----------------------------------------------
			function get_base_url(xml) {

				var baseUrl = '';
				t = xml.getElementsByTagName('BaseURL'); 
				if (t && t.length>0) {
					e = t.item(0); 
					if (e) { 
						baseUrl = e.textContent || e['BaseURL'].textContent;
						if (baseUrl.indexOf('http') != 0) {
							if (baseUrl.indexOf('/') == 0)  baseUrl = domain + baseUrl;
							else    baseUrl = host + baseUrl;
						}   
					}    
				}

				return baseUrl;    
			}	

			// -----------------------------------------------
			function segment_template(videoXML) {

				if (DEBUG) console.log('segment_template', videoXML);

				var time = null;
				var _tmplt = {};
				var _frgmnts = [];

				var tmpl = videoXML.getElementsByTagName('SegmentTemplate');
				if (DEBUG) console.log('SegmentTemplate', tmpl);

				if (tmpl && tmpl.length>0) { 
					_tmplt.timescale = tmpl[0].getAttribute('timescale') || "1";                    
					_tmplt.duration = tmpl[0].getAttribute('duration');                    
					_tmplt.media = tmpl[0].getAttribute('media');                    
					_tmplt.initialization = tmpl[0].getAttribute('initialization');   
					_tmplt.startNumber = tmpl[0].getAttribute('startNumber') || "1";          

					time = tmpl[0].getElementsByTagName('SegmentTimeline');
				}
				else {
					_tmplt.timescale = "1";                    
					_tmplt.duration = infoMPD.duration;                    
					_tmplt.media = '';                    
					_tmplt.initialization = '';   
					_tmplt.startNumber = "1";          
				}	

				if (DEBUG) {	
					console.log('_tmplt.timescale:',_tmplt.timescale);	
					console.log('_tmplt.duration:',_tmplt.duration);	
					console.log('_tmplt.media:',_tmplt.media);	
					console.log('_tmplt.initialization:',_tmplt.initialization);	
					console.log('_tmplt.startNumber:',_tmplt.startNumber);	
				}	

				var segment_number = parseInt(_tmplt.startNumber);
				if (time && time.length>0) {
					var segment_time = 0;
					var tt = time[0].getElementsByTagName('S');
					for (var i=0; i<tt.length; i++) {    
						try {
							var t = tt[i].getAttribute('t');                    
							if (t)     segment_time = parseInt(t);   
							var d = parseInt(tt[i].getAttribute('d'));    
							var r = tt[i].getAttribute('r');   
							if (r) r = parseInt(r);
							else r = 0;
						}
						catch(ex) {
							console.log(ex);
							return;                         
						}   
						
						var f = { number: segment_number,   time: segment_time,   }; 
						
						segment_number += 1;
						segment_time += d
						_frgmnts.push(f);

						for (j=0; j<r; j++) {
							var f = { number: segment_number,   time: segment_time,   };   

							segment_number += 1
							segment_time += d
							_frgmnts.push(f);
						}
					}   
				}
				else if ( _tmplt.timescale && _tmplt.duration ){
					var periodDuration = _tmplt.duration/_tmplt.timescale;
					var countNumber = Math.ceil(infoMPD.duration / periodDuration);
					for (j=segment_number; j<=countNumber; j++) {
						var f = { number: j,   time: j*_tmplt.duration,   };   
						_frgmnts.push(f);
					}
				}    

				return { Template: _tmplt, Fragments: _frgmnts };

			}

			// -------------------------------------------------
			function add_representation( ttt, ddd, sgmt ) {

				if (DEBUG) console.log('add_representation', ttt, ddd, sgmt);

				var mimeType = ddd.getAttribute('mimeType') || ttt.getAttribute('mimeType');  
				if (!mimeType) return; 

				var baseUrl = get_base_url(ddd); 
				if (!baseUrl)  baseUrl = infoMPD.baseUrl;

				var oo = {};

				oo.id = ddd.getAttribute('id') || ttt.getAttribute('id') || null;
				oo.codecs = ddd.getAttribute('codecs') || ttt.getAttribute('codecs') || null;
				oo.type = mimeType;
				oo.ext = 'mp4';
				oo.baseUrl = baseUrl;

				// initialization
				var init = get_initialization(ddd);			
				if (init) {
					if (init.range) {
						var x = init.range.split('-');
						oo.initUrl =   baseUrl + '&bytestart='+x[0]+'&byteend='+x[1];
					}
				}

				// segments
				if (sgmt) {
					oo.template = sgmt.Template;
					oo.fragments = sgmt.Fragments;

					oo.initUrl =   baseUrl + set_RepresentationID( sgmt.Template.initialization, oo.id );

					oo.initSeg = null;
					oo.segments =   [ ];
					//oo.segments =   [ baseUrl + oo.initUrl ];
					
					for (var ii=0; ii<sgmt.Fragments.length; ii++) {
						var uu =    set_RepresentationID( sgmt.Template.media, oo.id);
						var url =   set_Number( uu, sgmt.Fragments[ii].number);
						url =   set_Time( url, sgmt.Fragments[ii].time);
						oo.segments.push( baseUrl+url );
					}
				}
				else {
					var x = get_segment_base(ddd);
					if (x) {
						var y = x.indexRange.split('-');
						oo.sidxUrl =   baseUrl + '&bytestart='+y[0]+'&byteend='+y[1];

						if (x.firstSegmentRange) {
							y = x.firstSegmentRange.split('-');
							oo.firstSegmentUrl =   baseUrl + '&bytestart='+y[0]+'&byteend='+y[1];
							oo.firstOffset = parseInt(y[0]);
						}	
					}
				}		 

				if ( mimeType.indexOf('video') != -1) {  

					oo.width =     ddd.getAttribute('width') || ttt.getAttribute('width') || null;
					oo.height =    ddd.getAttribute('height') || ttt.getAttribute('height') || null;
					oo.bandwidth = ddd.getAttribute('bandwidth') || ttt.getAttribute('bandwidth') || null;

					infoMPD.RepresentationVideo.push( oo );

				}	
				else if ( mimeType.indexOf('audio') != -1) {  

					oo.bandwidth = ddd.getAttribute('bandwidth') || ttt.getAttribute('bandwidth') || null;
					oo.rate =      ddd.getAttribute('audioSamplingRat') || ttt.getAttribute('audioSamplingRat') || null;

					infoMPD.RepresentationAudio.push( oo );
				}	

			}

		}

		// -------------------------------------
		function set_RepresentationID( str, value) {
			var t = str.replace(/\$RepresentationID\$/i, function replacer(match, p1, p2, p3, offset, string) {
									return value;
								});
			return t;
		}   
		// -------------------------------------
		function set_Number( str, value) {
			var t = str.replace(/\$Number%?[0-9]*d?\$/, function replacer(mtch, p1, p2, p3, offset, string) {
									var m = mtch.match(/\$Number%([0-6])+d\$/i);
									if (m) {
										var k = parseInt(m[1]);
										var s = value.toString();
										for (ii=0; ii<k; ii++)     s = '0' + s;
										var l = s.length;
										return s.substring(l-k, l);
									}   
									return value;
								});
			return t;
		}   
		// -------------------------------------
		function set_Time( str, value) {
			var t = str.replace(/\$Time\$/, function replacer(mtch, p1, p2, p3, offset, string) {
									return value;
								});
			return t;
		}   
		
		function parse_duration(s) {
			if (!s) return 0;
			var duration = 0;
			
			var m = s.match(/PT(([0-9]+)H)?(([0-9]+)M)?([0-9]+)(\.[0-9]+)?S/i);
			if (m) {
				try {
					if (m[2]) duration += parseInt(m[2]) * 60 * 60;
					if (m[4]) duration += parseInt(m[4]) * 60;
					if (m[5]) duration += parseInt(m[5]);
				}
				catch(ex) {
					console.log(ex);
				}	
			}	
			return duration;
		}

		// --------------------------------------------------------------------------------
		function write( data, pref ){

		  if (typeof pref == 'undefined') { 
		  	pref = '';
		  	console.log('-----------------------------------------------')
		  }	

		  for (var k in data) {

		    if ( typeof data[k] == 'object') { 
		      console.log(pref+k+': object');
		      write(data[k], pref+'      ');
		    }  
		    else {
		      console.log(pref+k+' : '+data[k]);
		    }

		  }

		  if (pref == '') console.log('-----------------------------------------------')

		}	

		// ====================================================================	
		this.getMedia = function( media ){
			
			var other_media = [];
			var sniffer_media = [];
			var stream_media = [];
			
			media.forEach(function( item ){
										if ( item.source == "Dash" ) {
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
		if (isNode) {
			hex_md5 = function(data) {  
				return require('crypto').createHash('md5').update(data).digest("hex");				
			};

		}

	};
	
	this.Dash = new Dash();
	
}).apply( fvdDownloader.Media );
