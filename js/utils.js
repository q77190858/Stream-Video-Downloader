function _b( v ){
	if( typeof v == "boolean" ){
		return v;
	}
	
	if( v == "true" ){
		return true;
	}

	return false;
}

function _isb( v ){
	if( typeof v == "boolean" ){
		return true;
	}
	
	if( v == "true" || v == "false" ){
		return true;
	}

	return false;
}

function _r( v ){
	
	if( _isb( v ) ){
		return _b(v);
	}
	return v;
	
}

var UTILS = function(){
	
	var _isFirstRun = false;
	var _isVersionChanged = false;
	
	function extractExtension( path ){
		try	{
			var ext = String(file.name).toLocaleLowerCase().split('#').shift().split('?').shift().split('.').pop();
			return ext;
		}
		catch(ex)	{
			return null;
		}	
	};

	function extractPath( path ){
		if ( !path ) return null;
		try{
			var name = null, 
				ext = null,
				tmp = path;
				
			var k = tmp.indexOf('?');
			if ( k != -1 )   tmp = tmp.substring(0, k);
			k = tmp.indexOf('#');
			if ( k != -1 )   tmp = tmp.substring(0, k);

			tmp = tmp.split( "/" );
			tmp = tmp[tmp.length-1].toLowerCase();
			var k = tmp.lastIndexOf('.');
			if ( k != -1 )  {
				name = tmp.substring(0, k);
				ext = tmp.substring(k+1, tmp.length);
				return {ext: ext.toLowerCase(), name: name};
			}
			
			return null;
		}
		catch(ex){
			console.log(ex);
			return null;
		}
	};
	
	function getActiveTab( callback ){
				chrome.windows.getCurrent(function(window) {
					chrome.tabs.query({
						windowId: window.id,
						highlighted: true,
					},function(tabs) {
						if(tabs.length>0)
							callback(tabs[0]);
						else
							callback(null);
					});
				});				
	};
	
	function getOffset( obj ) {
		var curleft = curtop = 0;
		if (obj.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			}
			while(obj = obj.offsetParent);
		}
		return {
			"left": curleft,
			"top": curtop
		};
	};
	
	function getOS(){
		if (navigator.appVersion.indexOf("Mac OS X") != -1) {
			return "mac";
		}
		else{
			return "win";
		}
	};

	function getSizeByUrl( url, callback ){

		var ajax = new XMLHttpRequest();
		ajax.open('GET', url);
		ajax.setRequestHeader('Cache-Control', 'no-cache');
		ajax.url = url;

		var find = false;
				
		ajax.onreadystatechange = function() {
						if( this.readyState == 3 && !find )
						{
							var size = this.getResponseHeader("Content-Length");
							if (this.status == 200) 
							{
								if( size )
								{
									find = true;
									callback( size );		
									this.abort();
								}
							}				
						}
			
						if (this.readyState == 4 && !find ) 
						{
							if (this.status == 200) 
							{
								var size = null;
								try
								{
									size = this.getResponseHeader("Content-Length");
								}
								catch(ex){}
								callback( size );					
							}
							else
							{
								callback( null );
							}
						}
					}		
		
		ajax.send( null );
	};

	function upperFirst( str ){
		if (!str) return str;
		return str[0].toUpperCase() + str.slice(1);
	};	

	function getAllTabs( callback ){
		chrome.windows.getAll( {populate:true}, function(wins) {
				if (wins && wins.length>0) {
					for(var t=0; t<wins.length; t++)	{
						if (wins[t].tabs) {
							var win = wins[t].tabs;
							for(var r=0; r<win.length; r++)	{
								var tab = win[r];
								if(tab.url.indexOf("http")==0){
									callback(tab);
								}
							}
						}
					}
				}
		});
	};
	
	function isFirstRun(){
					
		if( this._isFirstRun ){
			return this._isFirstRun;
		}
		
		if( _b( fvdDownloader.Prefs.get( "is_first_run" ) ) ){
			this._isFirstRun = true;
			return true;
		}
		
		return false;
		
	};
	
	
	function isVersionChanged(){
		
		if( this._isVersionChanged ){
			return this._isVersionChanged;
		}
		
		var app = chrome.app.getDetails();
		
		if( fvdDownloader.Prefs.get( "last_run_version" ) != app.version ){
			this._isVersionChanged = true;
			fvdDownloader.Prefs.set( "last_run_version", app.version );
		}
		
		return this._isVersionChanged;
		
	};
	
	function parse_URL(url)	{
	
		const EXTENSIONS = ["htm", "html", "zhtml", "zhtm", "shtml", "php", "asp", "aspx", "ashx"];
		
		var pattern =
				// Match #0. URL целиком (#0 - это HREF, в терминах window.location).
				// Например, #0 == "https://example.com:8080/some/path/index.html?p=1&q=2&r=3#some-hash"
				"^" +
				// Match #1 & #2. SCHEME (#1 - это PROTOCOL, в терминах window.location).
				// Например, #1 == "https:", #2 == "https"
				"(([^:/\\?#]+):)?" +
				// Match #3-#6. AUTHORITY (#4 = HOST, #5 = HOSTNAME и #6 = PORT, в терминах window.location)
				// Например, #3 == "//example.com:8080", #4 == "example.com:8080", #5 == "example.com", #6 == "8080"
				"(" +
						"//(([^:/\\?#]*)(?::([^/\\?#]*))?)" +
				")?" +
				// Match #7. PATH (#7 = PATHNAME, в терминах window.location).
				// Например, #7 == "/some/path/index.html"    
				"([^\\?#]*)" +
				// Match #8 & #9. QUERY (#8 = SEARCH, в терминах window.location).
				// Например, #8 == "?p=1&q=2&r=3", #9 == "p=1&q=2&r=3"    
				"(\\?([^#]*))?" +
				// Match #10 & #11. FRAGMENT (#10 = HASH, в терминах window.location).
				// Например, #10 == "#some-hash", #11 == "some-hash"
				"(#(.*))?" + "$";			
				
				
				//var pattern = "^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$";
		var rx = new RegExp(pattern);
		var parts = rx.exec(url);					

		var href = parts[0] || "";
		var protocol = parts[1] || "";			// http
		var host = parts[4] || "";				
		var hostname = parts[5] || "";			// example.com
		var port = parts[6] || "";
		var pathname = parts[7] || "/";			// /some/path/index.html
		var search = parts[8] || "";			// ?gst=2&
		var hash = parts[10] || "";				// #12
				
		// проверим не путь ли вместо хоста		
		if (hostname == "." || hostname == "..")
		{
			pathname = hostname + pathname;
			hostname = "";
		}
		if (hostname != "")
		{
			var arr = hostname.split('.');
			if (arr == null || arr.length == 1)
			{
				pathname = hostname + parts[7];
				hostname = "";
			}
			else if (arr.length == 2)
			{
				if (EXTENSIONS.indexOf(arr[1]) != -1)
				{
					pathname = hostname + parts[7];
					hostname = "";
				}	
			}
		}
			
		if (pathname != "")
		{
			var arr = pathname.split('/');
			var k = arr.length-1;
			var file = arr[k];
			//if (file.indexOf('.') == -1)
			//{
				//k++;
				//file = '';	
			//}	
			var path = "";
			for (var i = 0;  i < k; i++)
			{
				path += (i==0 ? "" : "/" ) + arr[i];
			}	
		}
		
		var name = "";
		var ext = "";
		if ( file != "" )
		{
			var pos = file.lastIndexOf('.');
			if (pos != -1 )
			{
				name = file.substr(0, pos);	
				ext = file.substr(pos+1, file.length);
			}
			else
			{
				name = file;
			}
		}
		
		return { url: url,
				 protocol: protocol, 
				 port: port,
				 hostname: hostname,  
				 pathname: pathname,  
				 search: search,  
				 hash: hash, 
				 path: path, 
				 file: file, 
				 name: name, 
				 ext: ext };
	};
	
	function decode_unicode(str)	{
	
		var r = /\\u([\d\w]{4})/gi;
		str = str.replace(r, function (match, grp) {	return String.fromCharCode(parseInt(grp, 16)); });
		str = unescape(str);
		return str;
	};
	
	function parseXml(xmlStr)	{
		
		var parseXml;
		
		if (typeof window.DOMParser != "undefined") {
			parseXml = function(xmlStr) {
				return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
			};
		} 
		else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
			parseXml = function(xmlStr) {
				var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async = "false";
				xmlDoc.loadXML(xmlStr);
				return xmlDoc;
			};
		} 
		else {
			console.log("No XML parser found", xmlStr);
			return null;
		}			
	
		return parseXml(xmlStr);
	};
	
	function xmlToJson(xml, tab)	{
	   var X = {
		  toObj: function(xml) {
			 var o = {};
			 if (xml.nodeType==1) {   // element node ..
				if (xml.attributes.length)   // element with attributes  ..
				   for (var i=0; i<xml.attributes.length; i++)
					  o["@"+xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue||"").toString();
				if (xml.firstChild) { // element has child nodes ..
				   var textChild=0, cdataChild=0, hasElementChild=false;
				   for (var n=xml.firstChild; n; n=n.nextSibling) {
					  if (n.nodeType==1) hasElementChild = true;
					  else if (n.nodeType==3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
					  else if (n.nodeType==4) cdataChild++; // cdata section node
				   }
				   if (hasElementChild) {
					  if (textChild < 2 && cdataChild < 2) { // structured element with evtl. a single text or/and cdata node ..
						 X.removeWhite(xml);
						 for (var n=xml.firstChild; n; n=n.nextSibling) {
							if (n.nodeType == 3)  // text node
							   o["#text"] = X.escape(n.nodeValue);
							else if (n.nodeType == 4)  // cdata node
							   o["#cdata"] = X.escape(n.nodeValue);
							else if (o[n.nodeName]) {  // multiple occurence of element ..
							   if (o[n.nodeName] instanceof Array)
								  o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
							   else
								  o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
							}
							else  // first occurence of element..
							   o[n.nodeName] = X.toObj(n);
						 }
					  }
					  else { // mixed content
						 if (!xml.attributes.length)
							o = X.escape(X.innerXml(xml));
						 else
							o["#text"] = X.escape(X.innerXml(xml));
					  }
				   }
				   else if (textChild) { // pure text
					  if (!xml.attributes.length)
						 o = X.escape(X.innerXml(xml));
					  else
						 o["#text"] = X.escape(X.innerXml(xml));
				   }
				   else if (cdataChild) { // cdata
					  if (cdataChild > 1)
						 o = X.escape(X.innerXml(xml));
					  else
						 for (var n=xml.firstChild; n; n=n.nextSibling)
							o["#cdata"] = X.escape(n.nodeValue);
				   }
				}
				if (!xml.attributes.length && !xml.firstChild) o = null;
			 }
			 else if (xml.nodeType==9) { // document.node
				o = X.toObj(xml.documentElement);
			 }
			 else
				alert("unhandled node type: " + xml.nodeType);
			 return o;
		  },
		  toJson: function(o, name, ind) {
			 var json = name ? ("\""+name+"\"") : "";
			 if (o instanceof Array) {
				for (var i=0,n=o.length; i<n; i++)
				   o[i] = X.toJson(o[i], "", ind+"\t");
				json += (name?":[":"[") + (o.length > 1 ? ("\n"+ind+"\t"+o.join(",\n"+ind+"\t")+"\n"+ind) : o.join("")) + "]";
			 }
			 else if (o == null)
				json += (name&&":") + "null";
			 else if (typeof(o) == "object") {
				var arr = [];
				for (var m in o)
				   arr[arr.length] = X.toJson(o[m], m, ind+"\t");
				json += (name?":{":"{") + (arr.length > 1 ? ("\n"+ind+"\t"+arr.join(",\n"+ind+"\t")+"\n"+ind) : arr.join("")) + "}";
			 }
			 else if (typeof(o) == "string")
				json += (name&&":") + "\"" + o.toString() + "\"";
			 else
				json += (name&&":") + o.toString();
			 return json;
		  },
		  innerXml: function(node) {
			 var s = ""
			 if ("innerHTML" in node)
				s = node.innerHTML;
			 else {
				var asXml = function(n) {
				   var s = "";
				   if (n.nodeType == 1) {
					  s += "<" + n.nodeName;
					  for (var i=0; i<n.attributes.length;i++)
						 s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue||"").toString() + "\"";
					  if (n.firstChild) {
						 s += ">";
						 for (var c=n.firstChild; c; c=c.nextSibling)
							s += asXml(c);
						 s += "</"+n.nodeName+">";
					  }
					  else
						 s += "/>";
				   }
				   else if (n.nodeType == 3)
					  s += n.nodeValue;
				   else if (n.nodeType == 4)
					  s += "<![CDATA[" + n.nodeValue + "]]>";
				   return s;
				};
				for (var c=node.firstChild; c; c=c.nextSibling)
				   s += asXml(c);
			 }
			 return s;
		  },
		  escape: function(txt) {
			 return txt.replace(/[\\]/g, "\\\\")
					   .replace(/[\"]/g, '\\"')
					   .replace(/[\n]/g, '\\n')
					   .replace(/[\r]/g, '\\r');
		  },
		  removeWhite: function(e) {
			 e.normalize();
			 for (var n = e.firstChild; n; ) {
				if (n.nodeType == 3) {  // text node
				   if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
					  var nxt = n.nextSibling;
					  e.removeChild(n);
					  n = nxt;
				   }
				   else
					  n = n.nextSibling;
				}
				else if (n.nodeType == 1) {  // element node
				   X.removeWhite(n);
				   n = n.nextSibling;
				}
				else                      // any other node
				   n = n.nextSibling;
			 }
			 return e;
		  }
	   };
	   if (xml.nodeType == 9) // document node
		  xml = xml.documentElement;
	   var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");
	   
	   var ss = "{" + (json.replace(/\t|\n/g, "")) + "}";
	   return JSON.parse(ss)
	};		
	
	function getCaretPos(ctrl) {
	  ctrl.focus();
	  if (document.selection) { // IE
		var sel = document.selection.createRange();
		var clone = sel.duplicate();
		sel.collapse(true);
		clone.moveToElementText(obj);
		clone.setEndPoint('EndToEnd', sel);
		return clone.text.length;
	  } 
	  else if (ctrl.selectionStart!==false) return ctrl.selectionStart; // Gecko
	  else return 0;
	};
	
	function getJSON( data, type ){

		if (type == '/')  return data;

		var p = type.split('/');

		var h = data;
		for (var i=0; i<p.length; i++) {
			if ( h[p[i]] ) {
				h = h[p[i]];
			}
		}

		return h;
	};
	
	// -------------------------------------------------------------------
	function b64toBlob(b64Data, contentType, sliceSize)	{
		contentType = contentType || '';
		sliceSize = sliceSize || 512;

		var byteArrays = [];
		for (var offset = 0; offset < b64Data.length; offset += sliceSize) 
		{
			var slice = b64Data.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) 
			{
				byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}

		var blob = new Blob(byteArrays, {type: contentType});
		return blob;
	}
	
	function str_download_size( size ) {

		function prepareVideoSize( size ){
			var label = '';
			var text = '';
			if (size<1000) {						// 0..900 B
				text = size.toString();
				label = "B";
			}	
			else if (size<1024000) {					// 1000..1000KB
				text = ( size / 1024 ).toString();
				text = text.substring(0,4);
				label = "KB";
			}	
			else if (size<1048576000) {			    // 1000КB..1000MB
				text = (size / 1024 /1024).toString();
				text = text.substring(0,4);
				label = "MB";
			}	
			else if (size<1073741824000) {			    // 1000MB..1000GB
				text = (size / 1024 /1024 /1024).toString();
				text = text.substring(0,4);
				label = "GB";
			}	
			else {
				text = (Math.round( size / 1024 / 1024 / 1024 ) ).toString();
				label = "GB";
			}
			text = text.replace(/\.+$/, '');
			return text + label;
		};	
		if (!size) return null;

		try {
			var x = parseInt(size);
			if (x) return prepareVideoSize(x);
		}
		catch(ex) {	 }

		return size;
	}
	
	function get_X_INF( str ){
		var info = {};

		var m = str.match( /\s*([^=\s]+)\s*=\s*(?:\"([^\"]*?)\"|([^,]*)),?/gm ); 
		for (var jj=0; jj<m.length; jj++)  {
			var mm = m[jj].trim().match( /^([^=\s]+)\s*=\s*(?:\"([^\"]*?)\"|([^,]*)),?$/i ); 
			if (mm) {
				var x1 = mm[1];    
				var x2 = mm[2] || mm[3];    
				info[ x1.trim() ] = x2.trim();
			}
		}      

		return info;    
	}
	
	function jsonToDOM(jsonTemplate, elem) {

		if (!jsonTemplate) return;

		while (elem.firstChild)  elem.removeChild(elem.firstChild);

		jsonTemplate.forEach(function(part) {

		  	if(["b", "span"].indexOf(part.tag) == -1)   return;

		  	var el = document.createElement(part.tag);
		  	el.textContent = part.content;

		  	if (part.class) el.setAttribute('class', part.class)
		  	if (part.style) el.setAttribute('style', part.class)
		  
		  	elem.appendChild(el);
		});
	}

	function closest( target, selector ){
	
		while (target) {
			if (target.matches && target.matches(selector)) return target;
			target = target.parentNode;
			if (target.tagName == 'body') return null;
		}
		return null;	

	};

	function utf16to8(str)	{
	
		var out, i, len, c;

		out = "";
		len = str.length;
		for(i = 0; i < len; i++) {
			c = str.charCodeAt(i);
			if ((c >= 0x0001) && (c <= 0x007F)) {
				out += str.charAt(i);
			} 
			else if (c > 0x07FF) {
				out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
				out += String.fromCharCode(0x80 | ((c >>  6) & 0x3F));
				out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
			} 
			else {
				out += String.fromCharCode(0xC0 | ((c >>  6) & 0x1F));
				out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
			}
		}
		return out;

	};		
	
	function utf8to16(str)	{
	
		var out, i, len, c;
		var char2, char3;

		out = "";
		len = str.length;
		i = 0;
		while(i < len) {
			c = str.charCodeAt(i++);
			switch(c >> 4)	{ 
				case 0: 
				case 1: 
				case 2: 
				case 3: 
				case 4: 
				case 5: 
				case 6: 
				case 7:					// 0xxxxxxx
					out += str.charAt(i-1);
					break;
				case 12: 
				case 13:				// 110x xxxx   10xx xxxx
					char2 = str.charCodeAt(i++);
					out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
					break;
				case 14:				// 1110 xxxx  10xx xxxx  10xx xxxx
					char2 = str.charCodeAt(i++);
					char3 = str.charCodeAt(i++);
					out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
					break;
			}
		}

		return out;		
	};

	// --------------------------------------------------------------------------------
	function getAJAX( url, headers, callback ){
		
		//url = url + (url.indexOf('?') == -1 ? '?__fvd__' : '&__fvd__');

		var ajax = new XMLHttpRequest();
		ajax.open('GET', url, true);
		ajax.setRequestHeader('Cache-Control', 'no-cache');
		ajax.setRequestHeader('X-FVD-Extra', 'yes');
		
		if (headers) {
			for (var key in headers) {
				ajax.setRequestHeader(key, headers[key]);
			}
		}	
		
		ajax.onload = function(){
					var content = this.responseText;
					callback( content );
		}
		
		ajax.onerror = function(){
			callback( null );
		}
		
		ajax.send( null );
	
	}

	// --------------------------------------------------------------------------------
	function arrayAJAX( url, headers, callback ){
		
		//url = url + (url.indexOf('?') == -1 ? '"?__fvd__"' : '"&__fvd__"');

		var ajax = new XMLHttpRequest();
		ajax.open('GET', url, true);
		ajax.responseType = "arraybuffer"; 
		ajax.setRequestHeader('Cache-Control', 'no-cache');
		ajax.setRequestHeader('X-FVD-Extra', 'yes');

		if (headers) {
			for (var key in headers) {
				ajax.setRequestHeader(key, headers[key]);
			}
		}	

		ajax.onreadystatechange = function() {
				if ( ajax.readyState==4 ) {
					if ( is_req_success( ajax )) 	{

						var arr = new Uint8Array( ajax.response );
						callback( arr );
						
					}
					else 	{
						console.log('====ERROR====== httpRequest =====');
					}
				}
		};

		ajax.send( null );

		// -------------------------------------------------------------
		function is_req_success(httpReq) {
			var success = (httpReq.status == 0 || (httpReq.status >= 200 && httpReq.status < 300) || httpReq.status == 304 || httpReq.status == 1223);
			return success;
		}
	}

	// --------------------------------------------------------------------------------
	function postAJAX( url, data, callback ){

		url = url + (url.indexOf('?') == -1 ? '"?__fvd__"' : '"&__fvd__"');

		var ajax = new XMLHttpRequest();
		ajax.open('POST', url, true);
		ajax.setRequestHeader('Cache-Control', 'no-cache');
		ajax.setRequestHeader('X-FVD-Extra', 'yes');
		ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		
		ajax.onload = function(){
					var content = this.responseText;
					callback( content );
		}
		
		ajax.onerror = function(){
			callback( null );
		}
		
		var l = [];
		for (var k in data) l.push(k + '=' + data[k]);
		
		ajax.send( l.join('&') );
	}
	
	// --------------------------------------------------------------------------------
	function parseStr(str) {
		var array = {};
		var strArr = String(str).replace(/^&/, '').replace(/&$/, '').split('&'),
			sal = strArr.length,
			i, j, ct, p, lastObj, obj, lastIter, undef, chr, tmp, key, value,
			postLeftBracketPos, keys, keysLen,

			fixStr = function(str) {
				  return decodeURIComponent(str.replace(/\+/g, '%20'));
			};

		if (!array) array = this.window;
			  
		for (i = 0; i < sal; i++) {

			tmp = strArr[i].split('=');
			key = fixStr(tmp[0]);
			value = (tmp.length < 2) ? '' : fixStr(tmp[1]);

			while (key.charAt(0) === ' ') {
				key = key.slice(1);
			}

			if (key.indexOf('\x00') > -1) {
				key = key.slice(0, key.indexOf('\x00'));
			}

			if (key && key.charAt(0) !== '[') {
				keys = [];
				postLeftBracketPos = 0;
				for (j = 0; j < key.length; j++) {

					if (key.charAt(j) === '[' && !postLeftBracketPos) {
					  postLeftBracketPos = j + 1;
					} 
					else if (key.charAt(j) === ']') {
						if (postLeftBracketPos) {
							if (!keys.length) {
								keys.push(key.slice(0, postLeftBracketPos - 1));
							}
							keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos));
							postLeftBracketPos = 0;
							if (key.charAt(j + 1) !== '[') {
								break;
							}
						}
					}
				}

				if (!keys.length) {
					keys = [key];
				}
				for (j = 0; j < keys[0].length; j++) {
					chr = keys[0].charAt(j);
					if (chr === ' ' || chr === '.' || chr === '[') {
						keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
					}
					if (chr === '[') {
						break;
					}
				}

				obj = array;
				for (j = 0, keysLen = keys.length; j < keysLen; j++) {

					key = keys[j].replace(/^['"]/, '').replace(/['"]$/, '');
					lastIter = j !== keys.length - 1;
					lastObj = obj;
					if ((key !== '' && key !== ' ') || j === 0) {
						if (obj[key] === undef) {
							obj[key] = {};
						}
						obj = obj[key];
					} 
					else { // To insert new dimension
						ct = -1;
						for (p in obj) {
							if (obj.hasOwnProperty(p)) {
								if (+p > ct && p.match(/^\d+$/g)) {
									ct = +p;
								}
							}
						}
						key = ct + 1;
					}
				}
				lastObj[key] = value;
			}
		}

		return array;
	}
	
	function DamerauLevenshtein (prices, damerau) {
		// 'prices' customisation of the edit costs by passing an
		// object with optional 'insert', 'remove', 'substitute', and
		// 'transpose' keys, corresponding to either a constant
		// number, or a function that returns the cost. The default
		// cost for each operation is 1. The price functions take
		// relevant character(s) as arguments, should return numbers,
		// and have the following form:
		//
		// insert: function (inserted) { return NUMBER; }
		//
		// remove: function (removed) { return NUMBER; }
		//
		// substitute: function (from, to) { return NUMBER; }
		//
		// transpose: function (backward, forward) { return NUMBER; }
		//
		// The damerau flag allows us to turn off transposition and
		// only do plain Levenshtein distance.

		if (damerau !== false) damerau = true;
		if (!prices) prices = {};
		var insert, remove, substitute, transpose;

		switch (typeof prices.insert) {
		case 'function': insert = prices.insert; break;
		case 'number': insert = function (c) { return prices.insert; }; break;
		default: insert = function (c) { return 1; }; break; }

		switch (typeof prices.remove) {
		case 'function': remove = prices.remove; break;
		case 'number': remove = function (c) { return prices.remove; }; break;
		default: remove = function (c) { return 1; }; break; }

		switch (typeof prices.substitute) {
		case 'function': substitute = prices.substitute; break;
		case 'number':
			substitute = function (from, to) { return prices.substitute; };
			break;
		default: substitute = function (from, to) { return 1; }; break; }

		switch (typeof prices.transpose) {
		case 'function': transpose = prices.transpose; break;
		case 'number':
			transpose = function (backward, forward) { return prices.transpose; };
			break;
		default: transpose = function (backward, forward) { return 1; }; break; }

		function distance(down, across) {
			// http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
			var ds = [];
			if ( down === across ) {
				return 0;
			} else {
				down = down.split(''); down.unshift(null);
				across = across.split(''); across.unshift(null);
				down.forEach(function (d, i) {
					if (!ds[i]) ds[i] = [];
					across.forEach(function (a, j) {
						if (i === 0 && j === 0) ds[i][j] = 0;
						// Empty down (i == 0) -> across[1..j] by inserting
						else if (i === 0) ds[i][j] = ds[i][j-1] + insert(a);
						// Down -> empty across (j == 0) by deleting
						else if (j === 0) ds[i][j] = ds[i-1][j] + remove(d);
						else {
							// Find the least costly operation that turns
							// the prefix down[1..i] into the prefix
							// across[1..j] using already calculated costs
							// for getting to shorter matches.
							ds[i][j] = Math.min(
								// Cost of editing down[1..i-1] to
								// across[1..j] plus cost of deleting
								// down[i] to get to down[1..i-1].
								ds[i-1][j] + remove(d),
								// Cost of editing down[1..i] to
								// across[1..j-1] plus cost of inserting
								// across[j] to get to across[1..j].
								ds[i][j-1] + insert(a),
								// Cost of editing down[1..i-1] to
								// across[1..j-1] plus cost of
								// substituting down[i] (d) with across[j]
								// (a) to get to across[1..j].
								ds[i-1][j-1] + (d === a ? 0 : substitute(d, a))
							);
							// Can we match the last two letters of down
							// with across by transposing them? Cost of
							// getting from down[i-2] to across[j-2] plus
							// cost of moving down[i-1] forward and
							// down[i] backward to match across[j-1..j].
							if (damerau
								&& i > 1 && j > 1
								&& down[i-1] === a && d === across[j-1]) {
								ds[i][j] = Math.min(
									ds[i][j],
									ds[i-2][j-2] + (d === a ? 0 : transpose(d, down[i-1]))
								);
							};
						};
					});
				});
				return ds[down.length-1][across.length-1];
			};
		};
		return distance;
	};
	
	function Levenshtein(sentence1, sentence2) {

	  // returns -1 if the sentence is null or empty
		if (!sentence1 || !sentence2) {
			return -1;
		}
		sentence1 = sentence1.toLowerCase();
		sentence2 = sentence2.toLowerCase();

		let matrix = [];

		// increment along the first column of each row
		let i;
		for (i = 0; i <= sentence2.length; i = i + 1) {
			matrix[i] = [i];
		}

		// increment each column in the first row
		let j;
		for (j = 0; j <= sentence1.length; j = j + 1) {
			matrix[0][j] = j;
		}

		// Fill in the rest of the matrix
		for (i = 1; i <= sentence2.length; i = i + 1) {
			for (j = 1; j <= sentence1.length; j = j + 1) {
				if (sentence2.charAt(i - 1) === sentence1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
							Math.min(matrix[i][j - 1] + 1, // insertion
							matrix[i - 1][j] + 1)); // deletion
				}
			}
		}

		return matrix[sentence2.length][sentence1.length];
	}

	function find_json_param(param, data) {
	
		for (var k in data) {

			if ( k == param ) {
				return data[k]
			}
			else if ( typeof data[k] == 'object' ) {
				var x = find_json_param( param, data[k] );
				if (x) return x;
			}
		}	

		return null;
	}	

	return {
		extractExtension: extractExtension,
		extractPath: extractPath,
		getActiveTab: getActiveTab,
		getOffset: getOffset,
		getOS: getOS,
		getSizeByUrl: getSizeByUrl,
		upperFirst: upperFirst,
		getAllTabs: getAllTabs,
		isFirstRun: isFirstRun,
		isVersionChanged: isVersionChanged,
		parse_URL: parse_URL,
		decode_unicode: decode_unicode,
		parseXml: parseXml,
		xmlToJson: xmlToJson,
		getCaretPos: getCaretPos,
		getJSON: getJSON,
		b64toBlob: b64toBlob,
		str_download_size: str_download_size,
		get_X_INF: get_X_INF,
		jsonToDOM: jsonToDOM,
		closest: closest,
		utf16to8: utf16to8,
		utf8to16: utf8to16,
		getAJAX: getAJAX,
		arrayAJAX: arrayAJAX,
		postAJAX: postAJAX,
		parseStr: parseStr,
		DamerauLevenshtein: DamerauLevenshtein,
		Levenshtein: Levenshtein,
		find_json_param: find_json_param
	}	
	
};



