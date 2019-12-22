/*!
 *  Copyright � 2008 Fair Oaks Labs, Inc.
 *  All rights reserved.
 */

// Utility object:  Encode/Decode C-style binary primitives to/from octet arrays
var JSPACK = function(){

	// Module-level (private) variables
	var el,  
		bBE = false, 
		m = this;


	// Raw byte arrays
	function _DeArray(a, p, l)	{
		return [a.slice(p,p+l)];
	};
	function _EnArray(a, p, l, v)	{
		for (var i = 0; i < l; a[p+i] = v[i]?v[i]:0, i++);
	};

	// ASCII characters
	function _DeChar(a, p)	{
		return String.fromCharCode(a[p]);
	};
	function _EnChar(a, p, v) {
		a[p] = v.charCodeAt(0);
	};

	// Little-endian (un)signed N-byte integers
	function _DeInt(a, p) {
		var lsb = bBE ? (el.len-1):0, 
			nsb = bBE ? -1 : 1, 
			stop = lsb + nsb * el.len, 
			rv, i, f;
		for (rv = 0, i = lsb, f = 1; i != stop; rv += (a[p+i]*f), i += nsb, f *= 256);
		if (el.bSigned && (rv & Math.pow(2, el.len*8-1))) { rv -= Math.pow(2, el.len*8); }
		return rv;
	};
	function _EnInt(a, p, v) {
		var lsb = bBE?(el.len-1):0, nsb = bBE?-1:1, stop = lsb+nsb*el.len, i;
		v = (v<el.min)?el.min:(v>el.max)?el.max:v;
		for (i = lsb; i != stop; a[p+i]=v&0xff, i+=nsb, v>>=8);
	};

	// ASCII character strings
	function _DeString(a, p, l)	{
		for (var rv = new Array(l), i = 0; i < l; rv[i] = String.fromCharCode(a[p+i]), i++);
		return rv.join('');
	};
	function _EnString(a, p, l, v)	{
		for (var t, i = 0; i < l; a[p+i] = (t=v.charCodeAt(i))?t:0, i++);
	};

	// Little-endian N-bit IEEE 754 floating point
	function _De754(a, p)	{
		var s, e, m, i, d, nBits, mLen, eLen, eBias, eMax;
		mLen = el.mLen, eLen = el.len*8-el.mLen-1, eMax = (1<<eLen)-1, eBias = eMax>>1;

		i = bBE?0:(el.len-1); d = bBE?1:-1; s = a[p+i]; i+=d; nBits = -7;
		for (e = s&((1<<(-nBits))-1), s>>=(-nBits), nBits += eLen; nBits > 0; e=e*256+a[p+i], i+=d, nBits-=8);
		for (m = e&((1<<(-nBits))-1), e>>=(-nBits), nBits += mLen; nBits > 0; m=m*256+a[p+i], i+=d, nBits-=8);

		switch (e)
		{
			case 0:
				// Zero, or denormalized number
				e = 1-eBias;
				break;
			case eMax:
				// NaN, or +/-Infinity
				return m?NaN:((s?-1:1)*Infinity);
			default:
				// Normalized number
				m = m + Math.pow(2, mLen);
				e = e - eBias;
				break;
		}
		return (s?-1:1) * m * Math.pow(2, e-mLen);
	};
	function _En754(a, p, v) {
		var s, e, m, i, d, c, mLen, eLen, eBias, eMax;
		mLen = el.mLen, eLen = el.len*8-el.mLen-1, eMax = (1<<eLen)-1, eBias = eMax>>1;

		s = v<0?1:0;
		v = Math.abs(v);
		if (isNaN(v) || (v == Infinity))
		{
			m = isNaN(v)?1:0;
			e = eMax;
		}
		else
		{
			e = Math.floor(Math.log(v)/Math.LN2);			// Calculate log2 of the value
			if (v*(c = Math.pow(2, -e)) < 1) { e--; c*=2; }		// Math.log() isn't 100% reliable

			// Round by adding 1/2 the significand's LSD
			if (e+eBias >= 1) { v += el.rt/c; }			// Normalized:  mLen significand digits
			else { v += el.rt*Math.pow(2, 1-eBias); } 		// Denormalized:  <= mLen significand digits
			if (v*c >= 2) { e++; c/=2; }				// Rounding can increment the exponent

			if (e+eBias >= eMax)
			{
				// Overflow
				m = 0;
				e = eMax;
			}
			else if (e+eBias >= 1)
			{
				// Normalized - term order matters, as Math.pow(2, 52-e) and v*Math.pow(2, 52) can overflow
				m = (v*c-1)*Math.pow(2, mLen);
				e = e + eBias;
			}
			else
			{
				// Denormalized - also catches the '0' case, somewhat by chance
				m = v*Math.pow(2, eBias-1)*Math.pow(2, mLen);
				e = 0;
			}
		}

		for (i = bBE?(el.len-1):0, d=bBE?-1:1; mLen >= 8; a[p+i]=m&0xff, i+=d, m/=256, mLen-=8);
		for (e=(e<<mLen)|m, eLen+=mLen; eLen > 0; a[p+i]=e&0xff, i+=d, e/=256, eLen-=8);
		a[p+i-d] |= s*128;
	};

	// Class data
	var _sPattern	= '(\\d+)?([AxcbBhHsfdiIlL])';
	var _lenLut	= {'A':1, 'x':1, 'c':1, 'b':1, 'B':1, 'h':2, 'H':2, 's':1, 'f':4, 'd':8, 'i':4, 'I':4, 'l':4, 'L':4};
	var _elLut	= {	'A': {en: _EnArray,  de: _DeArray},
					's': {en: _EnString, de: _DeString},
					'c': {en: _EnChar,   de: _DeChar},
					'b': {en: _EnInt,    de: _DeInt, len:1, bSigned:true,  min:-Math.pow(2, 7), max:Math.pow(2, 7)-1},
					'B': {en: _EnInt,    de: _DeInt, len:1, bSigned:false, min:0, max:Math.pow(2, 8)-1},
					'h': {en: _EnInt,    de: _DeInt, len:2, bSigned:true,  min:-Math.pow(2, 15), max:Math.pow(2, 15)-1},
					'H': {en: _EnInt,    de: _DeInt, len:2, bSigned:false, min:0, max:Math.pow(2, 16)-1},
					'i': {en: _EnInt,    de: _DeInt, len:4, bSigned:true,  min:-Math.pow(2, 31), max:Math.pow(2, 31)-1},
					'I': {en: _EnInt,    de: _DeInt, len:4, bSigned:false, min:0, max:Math.pow(2, 32)-1},
					'l': {en: _EnInt,    de: _DeInt, len:4, bSigned:true,  min:-Math.pow(2, 31), max:Math.pow(2, 31)-1},
					'L': {en: _EnInt,    de: _DeInt, len:4, bSigned:false, min:0, max:Math.pow(2, 32)-1},
					'f': {en: _En754,    de: _De754, len:4, mLen:23, rt:Math.pow(2, -24)-Math.pow(2, -77)},
					'd': {en: _En754,    de: _De754, len:8, mLen:52, rt:0}};

	// Unpack a series of n elements of size s from array a at offset p with fxn
	function _UnpackSeries(n, s, a, p)	{
		for (var fxn = el.de, rv = [], i = 0; i < n; rv.push(fxn(a, p+i*s)), i++);
		return rv;
	};

	// Pack a series of n elements of size s from array v at offset i to array a at offset p with fxn
	function _PackSeries(n, s, a, p, v, i)	{
		for (var fxn = el.en, o = 0; o < n; fxn(a, p+o*s, v[i+o]), o++);
	};

	// Unpack the octet array a, beginning at offset p, according to the fmt string
	function Unpack(fmt, a, p)	{
		// Set the private bBE flag based on the format string - assume big-endianness
		bBE = (fmt.charAt(0) != '<');

		p = p ? p : 0;
		var re = new RegExp(_sPattern, 'g'), m, n, s, rv = [];
		while (m = re.exec(fmt))
		{
			n = ((m[1]==undefined)||(m[1]==''))?1:parseInt(m[1]);
			s = _lenLut[m[2]];
			if ((p + n*s) > a.length)
			{
				return undefined;
			}
			switch (m[2])
			{
				case 'A': case 's':
					rv.push(_elLut[m[2]].de(a, p, n));
					break;
				case 'c': case 'b': case 'B': case 'h': case 'H':
				case 'i': case 'I': case 'l': case 'L': case 'f': case 'd':
					el = _elLut[m[2]];
					rv.push(_UnpackSeries(n, s, a, p));
					break;
			}
			p += n*s;
		}
		return Array.prototype.concat.apply([], rv);
	};

	// Pack the supplied values into the octet array a, beginning at offset p, according to the fmt string
	function PackTo(fmt, a, p, values)	{
		// Set the private bBE flag based on the format string - assume big-endianness
		bBE = (fmt.charAt(0) != '<');

		var re = new RegExp(_sPattern, 'g'), m, n, s, i = 0, j;
		while (m = re.exec(fmt))
		{
			n = ((m[1]==undefined)||(m[1]==''))?1:parseInt(m[1]);
			s = _lenLut[m[2]];
			if ((p + n*s) > a.length)
			{
				return false;
			}
			switch (m[2])
			{
				case 'A': case 's':
					if ((i + 1) > values.length) { return false; }
					_elLut[m[2]].en(a, p, n, values[i]);
					i += 1;
					break;
				case 'c': case 'b': case 'B': case 'h': case 'H':
				case 'i': case 'I': case 'l': case 'L': case 'f': case 'd':
					el = _elLut[m[2]];
					if ((i + n) > values.length) { return false; }
					_PackSeries(n, s, a, p, values, i);
					i += n;
					break;
				case 'x':
					for (j = 0; j < n; j++) { a[p+j] = 0; }
					break;
			}
			p += n*s;
		}
		return a;
	};

	// Pack the supplied values into a new octet array, according to the fmt string
	function Pack(fmt, values)	{
		return PackTo(fmt, new Array(CalcLength(fmt)), 0, values);
	};

	// Determine the number of bytes represented by the format string
	function CalcLength(fmt) {
		var re = new RegExp(_sPattern, 'g'), m, sum = 0;
		while (m = re.exec(fmt))
		{
			sum += (((m[1]==undefined)||(m[1]==''))?1:parseInt(m[1])) * _lenLut[m[2]];
		}
		return sum;
	};

	// --------------------------------------------------------	
	function stringToBytes(str)	{
		var ch, st, re = [];
		for (var i = 0; i < str.length; i++ ) {
			ch = str.charCodeAt(i);  // get char 
			st = [];                 // set up "stack"
			do {
				st.push( ch & 0xFF );  // push byte to stack
				ch = ch >> 8;          // shift value down by 1 byte
			}  
			while ( ch );
			// add stack contents to result done because chars have "wrong" endianness
			re = re.concat( st.reverse() );
		}
		// return an array of bytes
		return re;
	};
	
	function ReadByte(arr, pos)	{
		var y = Unpack('B', arr, pos);
		return y ? y[0] : null;
	};
	function ReadInt16(arr, pos)	{
		var y = Unpack('H', arr, pos);
		return y ? y[0] : null;
	};
	function ReadInt24(arr, pos)	{
		var x = [0x00, arr[pos], arr[pos+1], arr[pos+2] ];	
		var y = Unpack('L', x, 0);
		return y ? y[0] : null;
	};
	function ReadInt32(arr, pos)	{
		var y = Unpack('L', arr, pos);
		return y ? y[0] : null;
	};
	function ReadInt64(arr, pos)	{
		var hi = arr.slice(pos, pos + 4);
		var lo = arr.slice(pos + 4, pos + 8);
		var y1 = Unpack('L', hi, 0);
		var y2 = Unpack('L', lo, 0);
		return y1[0] * 4294967295 + y2[0];
	};
	function ReadDouble(arr, pos)	{
		var y = Unpack('d', arr, pos);
		return y ? y[0] : null;
	};
	function ReadString(arr, pos)	{
		len = 0;
		while (arr[pos + len] != 0x00)  len++;
		t = arr.slice(pos, pos+len);
		return {arr: t, pos: pos + len + 1};
	};
	
	function bytesToString(array)	{
		var result = "";
		for (var i = 0; i < array.length; i++) {
			result += (String.fromCharCode(array[i]));	
		}
		return result;
	};
	function WriteByte(meta, pos, x)	{
		var y = Pack('B', [x]);
		meta[pos] = y[0];
	};
	function WriteInt24(meta, pos, x)	{
		var x1 = (x & 0xFF0000) >> 16;
		var x2 = (x & 0xFF00) >> 8;
		var x3 = (x & 0xFF);
		
		var y1 = Pack('B', [x1]);
		var y2 = Pack('B', [x2]);
		var y3 = Pack('B', [x3]);
		
		meta[pos] = y1[0];
		meta[pos + 1] = y2[0];
		meta[pos + 2] = y3[0];
	};
	function WriteInt32(meta, pos, x)	{
		var y = Pack('L', [x]);
		meta[pos] = y[0];
		meta[pos + 1] = y[1];
		meta[pos + 2] = y[2];
		meta[pos + 3] = y[3];
	};
	function WriteBoxSize(meta, pos, type, size)	{
		var mm = [];
		mm.push(meta[pos-4]); mm.push(meta[pos-3]); mm.push(meta[pos-2]); mm.push(meta[pos-1]);
		if (bytesToString(mm) == type)  {
			WriteInt32(meta, pos - 8, size);
		}	
		else  {
          WriteInt32(meta, pos - 8, 0);
          WriteInt32(meta, pos - 4, size);
        }
	};
	function WriteFlvTimestamp(frag, fragPos, packetTS)	{
		WriteInt24(frag, fragPos + 4, (packetTS & 0x00FFFFFF));
		WriteByte(frag, fragPos + 7, (packetTS & 0xFF000000) >> 24);		
	};
	// --------------------------------------------------------	
	function concat(a, b)	{
		if (!a) return b;
		if (!b) return a;

		var c = new Uint8Array(a.length + b.length);
		c.set(a);
		c.set(b, a.length);

		return c;
	};
	// --------------------------------------------------------	
	
	return {
		Unpack: Unpack,
		PackTo: PackTo,
		Pack: Pack,
		CalcLength: CalcLength,
		stringToBytes: stringToBytes,
		ReadByte: ReadByte,
		ReadInt16: ReadInt16,
		ReadInt24: ReadInt24,
		ReadInt32: ReadInt32,
		ReadInt64: ReadInt64,
		ReadDouble: ReadDouble,
		ReadString: ReadString,
		bytesToString: bytesToString,
		WriteByte: WriteByte,
		WriteInt24: WriteInt24,
		WriteInt32: WriteInt32,
		WriteBoxSize: WriteBoxSize,
		WriteFlvTimestamp: WriteFlvTimestamp,
		concat: concat
	}	
	
}
	
