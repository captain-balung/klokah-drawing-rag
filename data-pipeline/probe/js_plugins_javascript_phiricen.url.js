function URL(_url)
{
	this.domain   = '';
	this.anchor   = '';
	this.qString  = '';
	this.fileName = '';
	this.queries  = [];
	
	this.init = function()
	{
		console.log(_url);
		if (!(
		_url.substring(0,7) == 'http://' || 
		_url.substring(0,8) == 'https://' )){ 
		console.warn('Invalid URL : ' + _url); }
		
		var U1 = _url.split('?');
		
		this.fileName = U1[0];
		this.qString  = U1[1] || '';
		
		
		// URL - main
		var U2 = this.fileName.split('/');
		this.domain = U2[2];
		
		// URL - query
		if ( U1.length > 1 )
		{
			var U2 = this.qString.split('&');
			for ( var i in U2 )
			{
				var U3 = U2[i].split('=');

				// 確保 U3[1] 是存在的，且確保其不為 undefined
				var value = U3[1] ? U3[1] : '';
				if ( value.indexOf('#') > -1 )
				{
					var U4 = value.split('#');
					this.queries.push({key:U3[0],value:U4[0]});
					this.anchor = U4[1];
				}
				else
				{
					this.queries.push({key:U3[0],value:value});
				}
			}
		}
	}
	this.get = function(_key)
	{
		for ( var i in this.queries )
		{
			if ( this.queries[i].key == _key )
			{
				return this.queries[i].value;
			}
		}
	}
	this.set = function(_key,_value)
	{
		var exists = false;
		for ( var i in this.queries )
		{
			if ( this.queries[i].key == _key )
			{
				exists = true;
				this.queries[i].value = String(_value);
			}
		}
		if ( exists ){ this.queries.push({key:_key,value:_value}); }
	}
	this.remove = function(_key)
	{
		for ( var i in this.queries )
		{
			if ( this.queries[i].key == _key )
			{
				this.queries.splice(i,1);
			}	
		}	
	}
	this.getData = function()
	{
		return {
			anchor   : this.anchor,
			qString  : this.qString,
			fileName : this.fileName,
			queries  : this.queries };
	}
	this.getURL = function()
	{
		var url = this.fileName;
		if ( this.queries.length > 0 )
		{
			url += '?';
			for(var i in this.queries)
			{
				url += i > 0 ? '&' : '';
				url += this.queries[i].key + '=' + this.queries[i].value;
			}	
		}
		url += this.anchor == '' ? '' : '#' + this.anchor;
		return url;	
	}
	this.init();		
}