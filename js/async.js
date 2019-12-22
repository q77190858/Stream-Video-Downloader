
var ASYNC = function(){

	function chain( callbacksChain ){
		
		var dataObject = {};
		
		var f = function(){
			if( callbacksChain.length > 0 ){
				var nextCallback = callbacksChain.shift();						
				nextCallback( f, dataObject );
			}					
		}
		
		f();
		
	};

	function arrayProcess( dataArray, callback, finishCallback ){
		
		var f = function( i ){
			
			if( i >= dataArray.length ){
				finishCallback();
			}
			else{
				callback( dataArray[i], function(){
					f(i + 1);
				} );
			}
			
		}	
		
		f(0);			
		
	}
	


	return {
		chain: chain,
		arrayProcess: arrayProcess,
	}	
	
};



