window.addEventListener( "load", function(){

	var list = [];
	var options = document.querySelectorAll( "[sname]" );
	for (var i = 0; i != options.length; i++) 	{
		list.push( options[i].getAttribute( "sname" ) );				
		(function( option ){
			option.addEventListener( "change", function( event ){
					changeOption( option );
			}, false );		
		})( options[i] );
	}

	var msg = [];
	var mm = document.querySelectorAll( "[msg]" );
	for (var i = 0; i != mm.length; i++) 	{
		msg.push( mm[i].getAttribute( "msg" ) );				
	}

	chrome.i18n.getAcceptLanguages(function(languages){
		var lang = 'en';
		if ( languages.indexOf("ru") != -1 ) {
			lang = 'ru';
		}
		
		chrome.runtime.sendMessage({akse: 'Page_Options', list: list, msg: msg}, function(response) {
	  
			var params = response.paramsOptions;
			var message = response.paramsMessage;
			var addons = response.paramsAddon;
			addons.height = document.getElementById('mainContainer').offsetHeight;
			addons.message = 'loaded';
			addons.lang = lang;
			//addons.ads = {client: "ca-pub-8568998613366461", slot: "9788361633"};		// fvddownloader
			addons.ads = {client: "ca-pub-8568998613366461", slot: "4579432836"};		// fvdmedia
			
			for ( var k in params ) {
				var option = document.querySelector( '[sname="' + k + '"]' );
				setOptionVal( option, params[k] );	
			}
			
			for ( var k in message ) {
				try {	
					var e = document.querySelector( '[msg="'+k+'"]' );
					if (e) e.textContent = message[k];
				} catch(e) { console.log(e) }
			}	
			
			// signal the parent that we're loaded.
			window.parent.postMessage(addons, "*");
			
		
		});
	
	});	
	
	// -------- события на Click
	document.getElementById("applyChangesButton").addEventListener( "click", function( event ){			
		applyChanges( );
	}, false );
	
	document.getElementById("buttonCloseButton").addEventListener( "click", function( event ){			
		closePage();
	}, false );
	
	// ---------------------------------------------- 
	function setOptionVal( option, value ){
		try	{
			if( option.tagName == "INPUT" )	{
				if( option.className == "color" )	{
					if( option.color )		option.color.fromString(value);							
								else		option.value = value;						
					return;
				}
			 	else if( option.type == "checkbox" ) {
					option.checked = value;
					return;
				}
				else if( option.type == "radio" ) {
					var name = option.name;
					document.querySelector( "[name="+name+"][value="+value+"]" ).checked = true;
					return;					
				}
			}	
			option.value = value;				
		}
		catch( ex ){	console.log(ex);	}
	};
	
	// ---------------------------------------------- 
	function getOptionValue( option ){
		
		if( option.tagName == "INPUT" )	{
			if( option.type == "checkbox" )	{
				return option.checked;
			}
			else if( option.type == "radio" )	{
				var name = option.name;
				return document.querySelector( "[name="+name+"]:checked" ).value;
			}
		}
		return option.value;
	};
	
	// ---------------------------------------------- 
	function changeOption( option ){
		
		var settingName = option.getAttribute( "sname" );
		var newValue = getOptionValue( option );

		document.getElementById( "mainContainer" ).setAttribute( "havechanges", 1 );
		document.getElementById( "closeButton" ).setAttribute( "active", 0 );
		
	};
	
	// ------------------------------------------------   
	function applyChanges( applyChangesCallback ){
		
		var settedOptions = [];
		var setOptions = [];
		var options = document.querySelectorAll( "[sname]" );
								
		var params = {};							
								
 		for( var i = 0; i != options.length; i++ )	{
			var name = options[i].getAttribute( "sname" );
			if( settedOptions.indexOf(name) != -1 )			continue;
			settedOptions.push( name );
			var v = getOptionValue( options[i] );
			params[name] = v;
			setOptions[name] = v;
		}
		
		chrome.runtime.sendMessage({akse: 'Save_Options', params: params}, function(response) {
				console.log(response);
		});	
		
		
		var applyChangesButton = document.getElementById( "applyChangesButton" );
		applyChangesButton.setAttribute( "loading", 1 );
		
		var doneCallback = function(){
			document.getElementById( "mainContainer" ).setAttribute( "havechanges", 0 );
			applyChangesButton.setAttribute( "loading", 0 );
			document.getElementById( "closeButton" ).setAttribute( "active", 1 );
		}	

		doneCallback(); 

	};

	// ------------------------------------------------   	
	function closePage(){
		
		chrome.runtime.sendMessage({akse: 'Close_Options'});

	};

	// -----------------------------------------------	
	function openGetSatisfactionSuggestions(){
		window.open( "http://help.everhelper.me/customer/portal/emails/new" );
	};
	
	
	
}, false );

