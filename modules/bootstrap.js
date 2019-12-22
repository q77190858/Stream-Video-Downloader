var BOOTSTRAP = function(){

	// ====================================================================	
	function listSegment( arr, params ){

		var list = [];

		var o = { fragPos: 0,
				  boxSize: 0,  
				  boxType: ''
				};

		ReadBoxHeader(arr, o);	

		ParseBootstrapBox(arr, o, params);
		
		var segNum  = params.segStart;
		var fragNum = params.fragStart;
		var lastFrag = fragNum;
		var firstFragment  = params.fragTable[0];
		
		while (fragNum < params.fragCount) {
			fragNum = fragNum + 1;
			var segNum = GetSegmentFromFragment(fragNum, params);
			list.push( params.uri + "Seg" + segNum + "-Frag" + fragNum	);
		}
		
		return list;

	}	
	
	// ====================================================================	
	//  opt: fragPos 
	//       boxType 
	//       boxSize
	//
	function ReadBoxHeader( arr, opt ){

		if (!arr || arr.length==0) return;
	
		opt.boxSize = fvdDownloader.jspack.ReadInt32(arr, opt.fragPos);
		opt.boxType = fvdDownloader.jspack.bytesToString(arr.slice(opt.fragPos + 4, opt.fragPos + 8));
		
		if (opt.boxSize == 1)   {
			opt.boxSize = fvdDownloader.jspack.ReadInt64(arr, opt.fragPos + 8) - 16;
			opt.fragPos += 16;
		}
		else  {
			opt.boxSize -= 8;
			opt.fragPos += 8;
		}
		if (opt.boxSize <= 0) opt.boxSize = 0;
	}	
				   
	// -----------------------------------------------------------
	//  opt: fragPos 
	//       boxType 
	//       boxSize
	//
	function ParseBootstrapBox( arr, opt, params ){

		if (!arr || arr.length==0) return;
		
		params.version          = fvdDownloader.jspack.ReadByte(arr, opt.fragPos);
		params.flags            = fvdDownloader.jspack.ReadInt24(arr, opt.fragPos + 1);
		params.bootstrapVersion = fvdDownloader.jspack.ReadInt32(arr, opt.fragPos + 4);
		var bt               = fvdDownloader.jspack.ReadByte(arr, opt.fragPos + 8);
		params.profile          = (bt & 0xC0) >> 6;
		
		if ((bt & 0x20) >> 5)  {
			params.live     = true;
			params.metadata = false;
		}
		params.update = (bt & 0x10) >> 4;
		if (!params.update)  {
			params.segTable  = [];
			params.fragTable = [];
		}
		params.timescale           = fvdDownloader.jspack.ReadInt32(arr, opt.fragPos + 9);
		params.currentMediaTime    = fvdDownloader.jspack.ReadInt64(arr, opt.fragPos + 13);
		params.smpteTimeCodeOffset = fvdDownloader.jspack.ReadInt64(arr, opt.fragPos + 21);
		opt.fragPos += 29;
		var x = fvdDownloader.jspack.ReadString(arr, opt.fragPos);
		params.movieIdentifier = x.str;
		opt.fragPos = x.pos;	
		params.serverEntryCount = fvdDownloader.jspack.ReadByte(arr, opt.fragPos++);
		
		params.serverEntryTable = [];
		for (var i = 0; i<params.serverEntryCount; i++)  {
			var x =  fvdDownloader.jspack.ReadString(arr, opt.fragPos);
			opt.fragPos = x.pos;
			params.serverEntryTable.push(x.str)
		}	
		
		params.qualityEntryCount = fvdDownloader.jspack.ReadByte(arr, opt.fragPos++);
		params.qualityEntryTable = [];
		for (var i=0; i<params.qualityEntryCount; i++) {
			var x =  fvdDownloader.jspack.ReadString(arr, opt.fragPos);
			opt.fragPos = x.pos;
			params.qualityEntryTable.push(x.str);
		}	
		
		var x =  fvdDownloader.jspack.ReadString(arr, opt.fragPos);
		opt.fragPos = x.pos;
		params.drmData = x.str;
		
		var x =  fvdDownloader.jspack.ReadString(arr, opt.fragPos);
		opt.fragPos = x.pos;
		params.metadata = x.str;

		params.segRunTableCount = fvdDownloader.jspack.ReadByte(arr, opt.fragPos++);
		
		params.segTable         = [];
		for (var i=0; i<params.segRunTableCount; i++)     {
			ReadBoxHeader(arr, opt);
			if (opt.boxType == "asrt") {
				params.segTable =  ParseAsrtBox(arr, opt.fragPos);
			}	
			opt.fragPos += opt.boxSize;
		}
		
		params.fragRunTableCount = fvdDownloader.jspack.ReadByte(arr, opt.fragPos++);
		params.fragTable         = [];
		for (var i=0; i<params.fragRunTableCount; i++)  {
			ReadBoxHeader(arr, opt);
			if (opt.boxType == "afrt") {
				params.fragTable = ParseAfrtBox(arr, opt.fragPos);
			}	
			opt.fragPos += opt.boxSize;
		}
		
		ParseSegAndFragTable( params );
		
		
		// -----------------------------
		function ParseAsrtBox(asrt, pos)	{
			
			if ( !asrt || asrt.length==0) return;
			
			var segTable          = [];
			var version           = fvdDownloader.jspack.ReadByte(asrt, pos);
			var flags             = fvdDownloader.jspack.ReadInt24(asrt, pos + 1);
			var qualityEntryCount = fvdDownloader.jspack.ReadByte(asrt, pos + 4);
			
			pos += 5;
			var qualitySegmentUrlModifiers = [];
			for (var i=0; i<qualityEntryCount; i++) {
				var x =  fvdDownloader.jspack.ReadString(asrt, pos);
				pos = x.pos;
				qualitySegmentUrlModifiers.push( x.str );
			}
			
			var segCount = fvdDownloader.jspack.ReadInt32(asrt, pos);
			
			pos += 4;
			for (var i=0; i<segCount; i++)  {
				var firstSegment = fvdDownloader.jspack.ReadInt32(asrt, pos);
				var fragmentsPerSegment = fvdDownloader.jspack.ReadInt32(asrt, pos + 4);
				segTable.push({  firstSegment: firstSegment,
								 fragmentsPerSegment: fragmentsPerSegment,
							  });
				pos += 8;
			}
			
			return segTable;  
		}
		
		// -----------------------------
		function ParseAfrtBox(afrt, pos)		{
			
			if ( !afrt || afrt.length==0 ) return;
			
			var fragTable         = [];
			var version           = fvdDownloader.jspack.ReadByte(afrt, pos);
			var flags             = fvdDownloader.jspack.ReadInt24(afrt, pos + 1);
			var timescale         = fvdDownloader.jspack.ReadInt32(afrt, pos + 4);
			var qualityEntryCount = fvdDownloader.jspack.ReadByte(afrt, pos + 8);
			pos += 9;
			
			var qualitySegmentUrlModifiers = [];
			for (var i=0; i<qualityEntryCount; i++) {
				var x =  fvdDownloader.jspack.ReadString(afrt, pos);
				pos = x.pos;
				qualitySegmentUrlModifiers.push( x.str );
			}
			
			var fragEntries = fvdDownloader.jspack.ReadInt32(afrt, pos);
			pos += 4;
			
			for (var i = 0; i<fragEntries; i++)	{
				var firstFragment = fvdDownloader.jspack.ReadInt32(afrt, pos);
				var firstFragmentTimestamp = fvdDownloader.jspack.ReadInt64(afrt, pos + 4);
				var fragmentDuration       = fvdDownloader.jspack.ReadInt32(afrt, pos + 12);
				var discontinuityIndicator = "";
				
				pos += 16;
				
				if (fragmentDuration == 0)		discontinuityIndicator = fvdDownloader.jspack.ReadByte(afrt, pos++);
				
				fragTable.push({  firstFragment: firstFragment,
								  firstFragmentTimestamp: parseInt(firstFragmentTimestamp),
								  fragmentDuration: fragmentDuration,
								  discontinuityIndicator: discontinuityIndicator  });
			}
			  
			return fragTable;
		}
	
	}	
	
	// -----------------------------------------------------------
	function ParseSegAndFragTable( params ){

		var firstSegment  = params.segTable[0];
		var lastSegment   = params.segTable[params.segTable.length-1];

		var firstFragment = params.fragTable[0];
		var lastFragment  = params.fragTable[params.fragTable.length-1];

		if (lastFragment['fragmentDuration'] == 0 && lastFragment['discontinuityIndicator'] == 0)   {
			params.live = false;
			params.fragTable.pop();
			lastFragment  = params.fragTable[params.fragTable.length-1];
		}

		var invalidFragCount = false;
		var prev = params.segTable[0];
		params.fragCount  = prev['fragmentsPerSegment'];
		for (var i=1; i<params.segTable.length; i++) {
			params.fragCount += (params.segTable[i]['firstSegment'] - params.segTable[i-1]['firstSegment'] - 1) * params.segTable[i-1]['fragmentsPerSegment'];
			params.fragCount += params.segTable[i]['fragmentsPerSegment'];
		}	
		if (!(params.fragCount & 0x80000000))  {
			params.fragCount += firstFragment['firstFragment'] - 1;
		}  
		if (params.fragCount & 0x80000000)    {
			params.fragCount  = 0;
			var invalidFragCount = true;
		}
		if (params.fragCount < lastFragment['firstFragment'])   { 
			params.fragCount = lastFragment['firstFragment'];
		}	  
		
		if (params.live)  {
			params.segStart = lastSegment['firstSegment'];
		}	
		else  {
			params.segStart = firstSegment['firstSegment'];
		}
		if (params.segStart < 1) {
			params.segStart = 1;
		}

		if (params.live && !invalidFragCount) {
			params.fragStart = params.fragCount - 2;
		}	
		else  {
			params.fragStart = firstFragment['firstFragment'] - 1;
		}	
		if (params.fragStart < 0) {
			params.fragStart = 0;
		}	

	}	
	
	// -----------------------------			
	function GetSegmentFromFragment(fragNum, params)		{
		
		var firstSegment  = params.segTable[0];
		var lastSegment   = params.segTable[params.segTable.length-1];

		var firstFragment = params.fragTable[0];
		var lastFragment  = params.fragTable[params.fragTable.length-1];
		
		if (params.segTable.length == 1) {
			return firstSegment['firstSegment'];
		}	
		else {
			var prev  = firstSegment['firstSegment'];
			var start = firstFragment['firstFragment'];
			for (var i = firstSegment['firstSegment']; i <= lastSegment['firstSegment']; i++)  {
				if (params.segTable[i]) {
					var seg = params.segTable[i];
				}	  
				else {
					var seg = prev;
				}	
				var end = start + seg['fragmentsPerSegment'];
				if ( fragNum >= start && fragNum < end) {
					return i;
				}	  
				prev  = seg;
				start = end;
			}
		}
		return lastSegment['firstSegment'];
	}

	// -----------------------------			
	function WriteMetadata( meta ){
		if (meta)	{
			
			var flvHeader = [0x46, 0x4c, 0x56, 0x01, 0x05, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00];
			var flvHeaderLen = flvHeader.length;
			var tagHeaderLen = 11;
			var prevTagSize = 4;
			var metadataSize = meta.length;
			metadata = [];
			
			fvdDownloader.jspack.WriteByte(metadata, 0, 0x12);
			fvdDownloader.jspack.WriteInt24(metadata, 1, metadataSize);
			fvdDownloader.jspack.WriteInt24(metadata, 4, 0);
			fvdDownloader.jspack.WriteInt32(metadata, 7, 0);
			
			for (var i=0; i<metadataSize; i++)  metadata.push(meta[i]);
			
			fvdDownloader.jspack.WriteByte(metadata, tagHeaderLen + metadataSize - 1, 0x09);
			fvdDownloader.jspack.WriteInt32(metadata, tagHeaderLen + metadataSize, tagHeaderLen + metadataSize);
			
			for (var i=flvHeaderLen-1; i>=0; i--)	metadata.unshift(flvHeader[i]);  
			
			metadata.length = flvHeaderLen + tagHeaderLen + metadataSize + prevTagSize;
			
			return fvdDownloader.jspack.bytesToString(metadata);
		}
		return false;
	}
	
	// -----------------------------			
	function decodeAMF( data ){

		try {
			var values = [];
			var offset = 0;
			while(offset>=0 && offset<data.length) {
				var ret = DecodeValue(data, offset);
				values.push(ret.value);
				offset = ret.offset;
			}
			return values;
		} catch(e) {
			console.error("decode error",e.message || e);
			return null;
		}
	}

	function DecodeValue(data, offset, type) {
		if(typeof type=="undefined") {
			if(offset>=data.length) throw new Error("End of structure");
			type = data[offset];
		}

		switch(type) {
			case 0x02: // string
				var length = fvdDownloader.jspack.ReadInt16(data,offset+1);
				var string = String.fromCharCode.apply(null, data.slice(offset+3,offset+3+length));
				return {
					offset: offset+3+length,
					value: string,
				}
			case 0x03: // anonymous
				var container = {};
				offset += 1;
				while(fvdDownloader.jspack.ReadInt24(data,offset)!=0x09) {
					var ret = DecodeValue(data,offset-1,0x02);
					var name = ret.value;
					offset = ret.offset;
					ret = DecodeValue(data,offset);
					var value = ret.value;
					offset = ret.offset;
					container[name] = value;
				}
				return {
					offset: offset+3,
					value: container,
				};
				break;
			case 0x08: // object
				var count = fvdDownloader.jspack.ReadInt32(data,offset+1);
				var container = {};
				offset += 5;
				while(fvdDownloader.jspack.ReadInt24(data,offset)!=0x09) {
					var ret = DecodeValue(data, offset-1, 0x02);
					var name = ret.value;
					offset = ret.offset;
					ret = DecodeValue(data, offset);
					var value = ret.value;
					offset = ret.offset;
					container[name] = value;
				}
				return {
					offset: offset+3,
					value: container,
				};
			case 0x0A:
				var count = fvdDownloader.jspack.ReadInt32(data,offset+1);
				var container = [];
				offset += 5;
				for(var i=0;i<count;i++) {
					var ret = DecodeValue(data,offset);
					var value = ret.value;
					offset = ret.offset;
					container.push(value);
				}
				return {
					offset: offset,
					value: container,
				};
			case 0x00: // number
				var number = fvdDownloader.jspack.ReadDouble(data,offset+1);
				return {
					offset: offset+9,
					value: number,
				};
			case 0x01: // boolean
				return {
					offset: offset+2,
					value: !!data[offset+1],
				}
				break;
			default:
				throw new Error("AMF not supported type 0x"+type.toString(16));
		}


	}    

	// ====================================================================	
	const AUDIO = 0x08;
	const VIDEO = 0x09;
	const AKAMAI_ENC_AUDIO = 0x0A;
	const AKAMAI_ENC_VIDEO = 0x0B;
	const SCRIPT_DATA = 0x12;
	
	function DecodeFragment( frag ){

		console.log('DecodeFragment: ', frag);
		
			try {

				var ad       = null,
					flvFile  = null,
					flvWrite = true,
					flvData  = null,
					flvTag   = "",
					packetTS = 0,
					packetType = '',
					packetSize = 0,
					fragLen  = frag.byteLength;
					
				var o = { fragPos: 0,	boxSize: 0,  boxType: ''	};

				var crypt = {};        

				while (o.fragPos < fragLen)  {
					ReadBoxHeader(frag, o);
					if (o.boxType == "mdat") {
						fragLen = o.fragPos + o.boxSize;
						break;
					}
					o.fragPos += o.boxSize;
				}

				while (o.fragPos < fragLen)  {

					packetType = fvdDownloader.jspack.ReadByte(frag, o.fragPos);
					packetSize = fvdDownloader.jspack.ReadInt24(frag, o.fragPos + 1);
					packetTS   = fvdDownloader.jspack.ReadInt24(frag, o.fragPos + 4);
					packetTS   = packetTS | (fvdDownloader.jspack.ReadByte(frag, o.fragPos + 7) << 24);
					if (packetTS & 0x80000000)  packetTS &= 0x7FFFFFFF;
					
					var totalTagLen = tagHeaderLen + packetSize + prevTagSize;
					var flvTag     = frag.slice(o.fragPos, o.fragPos + totalTagLen);
					
					if ((packetType == AKAMAI_ENC_AUDIO) || (packetType == AKAMAI_ENC_VIDEO))   {
						flvData = fvdDownloader.jspack.concat(flvData, flvTag);
					}
					else {
						flvData = fvdDownloader.jspack.concat(flvData, flvTag);
					}

					o.fragPos += totalTagLen;
				} 


				durationFrag = parseInt(packetTS / 1000);

				return flvData || [];
			}
			catch(ex) {
				console.error('ERROR: STREAMER.DecodeFragment: ', ex);
				return frag;
			}    

	}	

	// ===============================================================
	function getInfoSidx(data, firstOffset){

		var sidx = {},
            pos = 0,
            offset,
            time,
            sidxEnd,
            i,
            ref_type,
            ref_size,
            ref_dur,
            type,
            size,
            mediaRange,
            startRange,
            duration,
            endRange,
            charCode;

        while (type !== "sidx" && pos < data.length) {
            size = fvdDownloader.jspack.ReadInt32(data, pos);
            pos += 4;

            type = "";
            for (i = 0; i < 4; i += 1) {
                charCode = fvdDownloader.jspack.ReadByte(data, pos)
                type += String.fromCharCode(charCode);
                pos += 1;
            }

            if (type !== "moof" && type !== "traf" && type !== "sidx") {
                pos += size - 8;
            } 
            else if (type === "sidx") {
                pos -= 8;
            }
        }

        sidxEnd = fvdDownloader.jspack.ReadInt32(data, pos) + pos;
        if (sidxEnd > data.length) {
            console.log("sidx terminates after array buffer");
            return null;
        }

        sidx.version = fvdDownloader.jspack.ReadByte(data, pos + 8);
        pos += 12;

        // skipped reference_ID(32)
        sidx.timescale = fvdDownloader.jspack.ReadInt32(data, pos + 4);
        pos += 8;

        if (sidx.version === 0) {
            sidx.earliestPresentationTime = fvdDownloader.jspack.ReadInt32(data, pos);
            sidx.firstOffset = fvdDownloader.jspack.ReadInt32(data, pos + 4);
            pos += 8;
        } 
        else {
            sidx.earliestPresentationTime = MathUtil.to64BitNumber( fvdDownloader.jspack.ReadInt32(data, pos + 4), fvdDownloader.jspack.ReadInt32(data, pos));
            sidx.firstOffset = (fvdDownloader.jspack.ReadInt32(data, pos + 8) << 32) + fvdDownloader.jspack.ReadInt32(data, pos + 12);
            pos += 16;
        }

        if (firstOffset) {
        	sidx.firstOffset = firstOffset;
        }
        else {
        	sidx.firstOffset += sidxEnd;	
        }

        // skipped reserved(16)
        sidx.referenceCount = fvdDownloader.jspack.ReadInt16(data, pos + 2) - (firstOffset ? 0 : 0);
        pos += 4;

        sidx.references = [];
        offset = sidx.firstOffset;
        time = sidx.earliestPresentationTime;
        console.log('\t reference count:', sidx.referenceCount);
        for (i = 0; i < sidx.referenceCount; i += 1) {
            ref_size = fvdDownloader.jspack.ReadInt32(data, pos);
            ref_type = (ref_size >>> 31);
            ref_size = ref_size & 0x7fffffff;
            ref_dur = fvdDownloader.jspack.ReadInt32(data, pos + 4);
            endRange = (offset + ref_size - 1);
            startRange = offset;
            mediaRange = startRange + '-' + endRange;
            pos += 12;
            sidx.references.push(
                new DashSidxReference(ref_size, ref_type, offset, ref_dur, time, sidx.timescale, mediaRange, startRange, endRange, ref_dur / sidx.timescale, time / sidx.timescale)
            );
            offset += ref_size;
            time += ref_dur;
        }

        if (pos !== sidxEnd) {
            throw "Error: final pos " + pos + " differs from SIDX end " + sidxEnd;
            return null;
        }


        return sidx;

		// ------------------------------
	    function DashSidxReference(size, type, offset, duration, time, timescale, mediaRange, startRange, endRange, durationSec, startTimeSec) {
	        this.size = size;
	        this.type = type;
	        this.offset = offset;
	        this.duration = duration;
	        this.time = time;
	        this.timescale = timescale;
	        this.mediaRange = mediaRange;
	        this.startRange = startRange;
	        this.endRange = endRange;
	        this.durationSec = durationSec;
	        this.startTimeSec = startTimeSec;
	    }


	}	

	

	return {
		listSegment: listSegment,
		ReadBoxHeader: ReadBoxHeader,
		ParseBootstrapBox: ParseBootstrapBox,
		ParseSegAndFragTable: ParseSegAndFragTable,
		WriteMetadata: WriteMetadata,
		decodeAMF: decodeAMF,
		DecodeFragment: DecodeFragment,
		getInfoSidx: getInfoSidx
	}	
	
};
