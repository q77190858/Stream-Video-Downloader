function SimplyCache(ttl)
{
	this.ttl = ttl;
	this.purge = 0;
	this.cache = {};

	this.check_info = function(key)
	{
		if (key in this.cache)
		{
			if (this.cache[key].ttl > (new Date()).getTime() - this.ttl)
			{
				return true;
			} else
			{
				delete this.cache[key];
			}
		}
		return false;
	};

	this.put_info = function(key, value)
	{
		var info = {

			value : value,
			ttl : (new Date()).getTime()
		};

		this.cache[key] = info;
		this.cache_purge();
	};

	this.get_info = function(key)
	{
		return ((this.check_info(key)) ? this.cache[key].value : null);
	};

	this.clear_info = function(key)
	{
		if (key in this.cache) delete this.cache[key];
	};

	this.cache_purge = function()
	{
		this.purge ++;
		if (this.purge > 20)
		{
			var del_after = (new Date()).getTime() - this.ttl;
			for (var i in this.cache)
			{
				if (this.cache[i].ttl < del_after) delete this.cache[i]; 
			}
			this.purge = 0;
		}
	};
}
