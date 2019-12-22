function localization_simple_load(fields)
{
	if (typeof(fields) == 'object')
	{
		for (var i in fields)
		{
			var el = document.getElementById(i);
			if (el != null)
			{
				var txt = chrome.i18n.getMessage(fields[i]);
				if ((txt) && (txt != undefined))
				{
					switch (el.nodeName.toLowerCase())
					{
						case 'input':
						{
							el.setAttribute('value', txt);
							break;
						}
						case 'img':
						{
							el.setAttribute('title', txt);
							break;
						}

						default:
						{
							el.innerHTML = txt;
							break;
						}
					}
				}
			}
		}
	}
}
