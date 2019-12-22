(function(){

	// ---------------------------------  Class OPTIONS
	var Options = function(){
	
	}
	
	Options.prototype = {
		
		_roller: null,
		
		init: function(){
			var that = this;
			
			this._listenOptions();
			this.refreshOptionValues();			
			
			// init tabs
			this.Tabs.init();

			// hash
			var hash = document.location.hash;

			document.getElementById( "closeButton" ).setAttribute( "active", 1 );

			var clickberrystate = document.getElementById("clickberrystate");
			
			chrome.extension.sendMessage({type: "getClickberryState"}, function(response) {
				
				clickberrystate.checked = response.state === "true" ? true : false;
				
			});
			
			clickberrystate.addEventListener("click", function(){
				
				console.log(clickberrystate.checked);
				
		        chrome.extension.sendMessage({type: "setClickberryState", state:clickberrystate.checked ? "true" : "false"}, function(response) {
		        	console.log(arguments);
		        });
				
			}, false);
			
		},
		

		Tabs: {
			
			tabs: [],
			
			_createInstance: function( tabsBox ){
				
				var TabBox = function( tabsBox ){				
					
					function tabsContent()
					{
						return tabsBox.getElementsByClassName( "tabContent" );
					}
					
					// -------------	
					function tabsHeads()
					{
						return tabsBox.getElementsByClassName( "tabHead" );	
					}
					
					// -------------	
					function setActiveTab( tabNum )
					{
						
						var heads = tabsHeads();
						var contents = tabsContent();
						
						for( var i = 0; i != heads.length; i++ )
						{							
							if( i == tabNum )
							{
								heads[i].setAttribute( "active", 1 );
							}
							else
							{
								heads[i].removeAttribute( "active", 1 );
							}							
						}
						
						for( var i = 0; i != contents.length; i++ )
						{
							if( i == tabNum )
							{
								contents[i].style.display = "block";
							}
							else
							{
								contents[i].style.display = "none";
							}
						}
						
					}

					// -------------	
					this.setActiveTab = function( tabNum )
					{
						setActiveTab( tabNum );
					}
					
					var heads = tabsHeads();
					
					for( var i = 0; i != heads.length; i++ )
					{
						
						(function(i){
							heads[i].addEventListener( "click", function( event ){
								
								if( event.button != 0 )		return;
								
								setActiveTab( i );
								
							}, false );
						})(i);						

					}
					
					setActiveTab(0);
					
				}
				
				return new TabBox( tabsBox );
				
			},		
		
			
			init: function(){
				
				var tabs = document.getElementsByClassName( "tabs" );
				
				for( var i = 0; i != tabs.length; i++ ){
					
					this.tabs.push( this._createInstance( tabs[i] ) );
					
				}
				
			}
			
		},

		// ------------------------------------------   
		refreshOptionValues: function( callback ){
			var that = this;
			
			var options = document.querySelectorAll( "[sname]" );
			for (var i = 0; i != options.length; i++) 
			{
				var option = options[i];
				this._setOptionVal( option, fvdDownloader.Prefs.get( option.getAttribute( "sname" ) ) );				
			}
		},
		
		
		
		// ---------------------------------------------- 
		_refreshEnableTypes: function(){
		
		},
		
		// ---------------------------------------------- 
		_changeOption: function( option ){
			
			var settingName = option.getAttribute( "sname" );
			var newValue = this._getOptionValue( option );

			document.getElementById( "mainContainer" ).setAttribute( "havechanges", 1 );
			document.getElementById( "closeButton" ).setAttribute( "active", 0 );
			
		},
		
		// ---------------------------------------------- 
		_listenOptions: function(){
			var options = document.querySelectorAll( "[sname]" );
			var that = this;
			for( var i = 0; i != options.length; i++ )
			{
				var option = options[i];
				(function( option ){
					option.addEventListener( "change", function( event ){
						that._changeOption( option );
					}, false );									
				})( option );
			}
		},
		
		// ---------------------------------------------- 
		_setOptionVal: function( option, value ){
			try
			{
				if( option.tagName == "INPUT" )
				{
					if( option.className == "color" )
					{
						if( option.color )		option.color.fromString(value);							
									else		option.value = value;						
						return;
					}
				 	else if( option.type == "checkbox" )
					{
						option.checked = _b(value);
						return;
					}
					else if( option.type == "radio" )
					{
						var name = option.name;
						document.querySelector( "[name="+name+"][value="+value+"]" ).checked = true;
						return;					
					}
				}	
				option.value = value;				
			}
			catch( ex ){	console.log(ex);	}
		},
		
		// ---------------------------------------------- 
		_getOptionValue: function( option ){
			
			if( option.tagName == "INPUT" )
			{
			 	if( option.type == "checkbox" )
				{
					return option.checked;
				}
				else if( option.type == "radio" )
				{
					var name = option.name;
					return document.querySelector( "[name="+name+"]:checked" ).value;
				}
			}
			return option.value;
		},
		
		// ------------------------------------------------   
		applyChanges: function( applyChangesCallback ){
			
			var settedOptions = [];
			var setOptions = [];
			var options = document.querySelectorAll( "[sname]" );
									
			for( var i = 0; i != options.length; i++ )	{
				var name = options[i].getAttribute( "sname" );
				if( settedOptions.indexOf(name) != -1 )			continue;
				
				settedOptions.push( name );
				
				fvdDownloader.Prefs.set( name, this._getOptionValue( options[i] ) );
				
				
				console.log ('name=' + name + ' == ' + this._getOptionValue( options[i] ));
				
				setOptions[name] = this._getOptionValue( options[i] );
			}
			
			var applyChangesButton = document.getElementById( "applyChangesButton" );
			applyChangesButton.setAttribute( "loading", 1 );
			
			var doneCallback = function(){
				document.getElementById( "mainContainer" ).setAttribute( "havechanges", 0 );
				applyChangesButton.setAttribute( "loading", 0 );
				document.getElementById( "closeButton" ).setAttribute( "active", 1 );
				
				if( applyChangesCallback )	
				{
					applyChangesCallback(setOptions);					
				}
				
			}	

			doneCallback();

		},

		// ------------------------------------------------   	
		close: function(){
		
//			window.close();
//			document.location = 'newtab.html';
			chrome.tabs.query( 	{
							url: chrome.extension.getURL( "/options.html" )
						}, function( tabs ){

							if( tabs.length > 0 )	chrome.tabs.remove(tabs[0].id);
							
						} );

		},

		// -----------------------------------------------	
		openGetSatisfactionSuggestions: function(){
			window.open( "https://getsatisfaction.com/fvd_suite/topics/" );
		},
		// -----------------------------------------------	
		setType: function( type ){
			window.open( "chrome://chrome/settings/" );
		}
		
		
		
	};	
	
	this.Options = new Options();
	
	
}).apply( fvdDownloader );
