var supported_sites_check_interval = 345600000;
var supported_sites_wait_interval = 60000;
	
function FVD_site_detector()
{
	var self = this;
	this.sites = {};
	this.timer = 0;

	this.supported_sites_timer = function()
	{
		var current_dt =  new Date();
		var current_time =  current_dt.getTime();

		var last_time = 0;
		if ('supported_sites.check_date' in window.localStorage)
		{
			last_time = Date.parse(window.localStorage['supported_sites.check_date']);
			if (isNaN(last_time)) last_time = 0;
		}

		if (Math.abs(current_time - last_time) > supported_sites_check_interval) 
		{
			self.supported_sites_downloader.call(self, function(success)
			{
				if (success)
				{
					window.localStorage['supported_sites.check_date'] = current_dt.toUTCString();
					window.localStorage['supported_sites.sites'] = JSON.stringify(self.sites);
				}
				self.timer = setTimeout(function(){self.supported_sites_timer.call(self)}, supported_sites_wait_interval);
			});
		} else
		{
			self.timer = setTimeout(function(){self.supported_sites_timer.call(self)}, supported_sites_wait_interval);
		}
	};

	this.supported_sites_downloader = function(done_callback)
	{
		var ajax = new XMLHttpRequest();
		ajax.open('GET', 'http://fvdmedia.com/to/s/dwsts', true);
		ajax.setRequestHeader('Cache-Control', 'no-cache');
		ajax.onreadystatechange = function()
		{
			try
			{
				if (this.readyState == 4)
				{
					if ((this.status == 200) && (this.responseText))
					{
						var r = self.supported_sites_parse.call(self, this.responseText);
						if (typeof(done_callback) == 'function') return done_callback(r);
							
					}
					if (typeof(done_callback) == 'function') return done_callback(false);
				}
       			} catch (e) {}
		};
		ajax.send(null);
	};

	this.supported_sites_parse = function(txt)
	{
		var matches = txt.match(/^[^\|]+\|[^\r\n]+/gm);
		if (matches != null)
		{
			var sites = {};
			matches.forEach(function(el, index, array)
			{
				var m = el.match(/^([^\|]+)\|([^\r\n]+)/m);
				if (m != null)
				{	
					var cat = m[1].replace(/^\s+/, '').replace(/\s+$/, '');
					var site = m[2].replace(/^\s+/, '').replace(/\s+$/, '');
					if (!(cat in sites)) sites[cat] = new Array();
					if (sites[cat].indexOf(site) == -1) sites[cat].push(site);
				}
			});
                       
			this.sites = sites;
			return true;
		}
		return false;
	};

	this.supported_sites_loader = function()
	{
		if (('supported_sites.sites' in window.localStorage) && (window.localStorage['supported_sites.sites']))
		{
			try
			{
				this.sites = JSON.parse(window.localStorage['supported_sites.sites']);

			} catch (e)
			{
				delete window.localStorage['supported_sites.sites'];
				delete window.localStorage['supported_sites.check_date'];
				return this.supported_sites_loader();
			}
		} else
		{
			this.sites = {};
			delete window.localStorage['supported_sites.check_date'];
			self.supported_sites_downloader.call(self, function(success)
			{
				if (success)
				{
					window.localStorage['supported_sites.check_date'] = (new Date()).toUTCString();
					window.localStorage['supported_sites.sites'] = self.sites;
				}
			});
		}
	};

	this.is_supported = function(url)
	{
		var m = url.match(/^((https?:\/\/)(www\.)?([0-9a-z-\.]+))\//);
		if (m != null)
		{
			var url = m[1] + '/';
			var s_url = ((m[3] == '') ? m[2] + 'www.' + m[4] : m[2] + m[4]) + '/';

			for (var i in this.sites)
			{
				if (i != 'RTMP')
				{
					if ((this.sites[i].indexOf(url) != -1) && (url.indexOf('youtube.com') == -1)) return true;
					if ((this.sites[i].indexOf(s_url) != -1) && (s_url.indexOf('youtube.com') == -1)) return true;
				}
			}
		}

		return false;
	};

	this.is_adult = function(url)
	{
		var m = url.match(/^((https?:\/\/)(www\.)?([0-9a-z-\.]+))\//);
		if (m != null)
		{
			var url = m[1] + '/';
			var s_url = ((m[3] == '') ? m[2] + 'www.' + m[4] : m[2] + m[4]) + '/';

			for (var i in this.sites)
			{
				if (((this.sites[i].indexOf(url) != -1) || (this.sites[i].indexOf(s_url) != -1)) && (i == 'VIDEO:ADULT')) return true;
			}
		}

		return false;
	};

	this.supported_sites_loader();
	this.supported_sites_timer();
}
