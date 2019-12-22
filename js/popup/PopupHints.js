(function(){
	
	var PopupHints = function(){
		
		var self = this;
		
		const HINTS_HEADER = [ 
					{ 	"name":	  "rate",
						"label":  "If you like us, please rate our product.",		
						"url": 	  "https://chrome.google.com/webstore/detail/stream-video-downloader/imkngaibigegepnlckfcbecjoilcjbhf/reviews",			  
						"icon":   " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAQCAYAAACC/vbpAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkFEQTNDMjY4NUY5NTExRTZBMkIxQzczQzM4MDcwOEVGIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkFEQTNDMjY5NUY5NTExRTZBMkIxQzczQzM4MDcwOEVGIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QURBM0MyNjY1Rjk1MTFFNkEyQjFDNzNDMzgwNzA4RUYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QURBM0MyNjc1Rjk1MTFFNkEyQjFDNzNDMzgwNzA4RUYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4kv07tAAAA5UlEQVR42mL8//8/w1ADTAxDEAxJR2OA/ws0/w92NSgh/X+53hRkGqshg0ANIx5fMTImXCfk8wFRwwiW+P8byARiRi4kHd+ABCtQjBXKHzxqWL7/Z9nHycjgBBZAiQOIBpA8iB5Mapi4Ei+nP//0axu2NPX8zddtIPnBpgaWphWAyeQ+uiJgGlIEij+ApqVBowZcevxf5VAOFuVhY3j65tc6eDJaqFUOS/yDTQ3D/9UO///N0/yYbMPtCeTKJ9tweoIyKBhDq/nBpgZWtOgDMRvUUyBaH8WgQaSGcbTBNOpo3AAgwABq4nTyCrK95wAAAABJRU5ErkJggg=="	
					},	
					{ 	"name":	  "facebook",
						"label":  "No videos to download or wrong videos displayed? Click to read.",		
						"url": 	  "https://www.stream-video-downloader.com/facebook-video/",			  
						"icon":   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAIAAAB1KUohAAAACXBIWXMAAAsSAAALEgHS3X78AAADJUlEQVQ4jV1STWtdVRRda599815eXknSJrTGoiNTqlbMQASlo4KICoJDHYjg1JEo/oT+g+LYcakjlZZOxFFEpA2IgyYGadXYQtSXvo9779nLwblJ054Ll3P3XeuctddefPOzqyRpRuveoNFoRxWSZjAaDYeYsvemaWlmJhphIkkTzZLDYFDQSADBTNG6vzRR9LbJNNHERB6SU9JoXGeg8kSjaP2e9ypHAAVsJM3bNjpysKuaxtPm9QtrF19cWx72AxjOV99s7t7Y2jux0IvIh2R5mzODZBQxye3huPnkvZc/fON8SEbmHCnZ5u3d8Xg6mK9y6Ei5txEESTJkSeNZ89zZkx9cOgcgAjCBABBS3ea2zTnAQ+Xe5jASIEkHJtPm2dNDT5ZzeLKHk/rGjzv9Of9l9wGJuskSjmzzJofxaAFScTeHUsLX3//66Zc/rJ5adLf5Qb+pG5hZGJIY8rrJJGk0smnz3QcH/4wmAAQA2D+YtUpiEixyKAiDmSiDKS2/8DYAAHWb11aGH7/z0msXnj73zEkCJSCnlxcubZydNc3OnyNPFqEstaEmywVAMuOszk+dWvj8/VclAUjJALxyfm1j/Ywn++3e/esHk96cl6ZhBqNLAikJKqwnF0kAd++PnIwcAZBBAChkQEIy/ncwu765s7o02Fg/EyEz7v7179b2Xn/O79zb77lFziBFAiCYlp5/q9jjbvuj6ZVrP09nzbsX1+s2PNlX393+6PK3N3/6fdqgX7kkAiCLJg/B2AmmcWVx/sSgB5RooFf56tLCyuKwbnPkTDMBFGAU4IBCJAVBUp0jh45G1QUrt1FAEQBAEQbAJZGQCKqzDY/7JoVQHgKIUCcb3ahKD4IK6HEuAKnIFQgBVICAd3VCgtTdjifogWNjJCQyBFk8OlmSJEQIQOQoPaNrpZyqR/iQ4fg3JKmkwpIBSMY4rENS4DjeS8BCIJlD/bm0tb33xZWbk7od9Kpbd/YGfW+7AYiEgjSFYIQfz2RIc5Vt/7F/a/tvM0qY71UL/SpHkCzGkFCARIAuCGJJN8gcqjytLDrJ4m8OGXn8joIm8D8J1xnVhelZ2wAAAABJRU5ErkJggg=="
					},					
					{ 	"name":	  "stream",
						"label":  "Problem downloading Streaming content? Click to read.",		
						"url": 	  "https://www.stream-video-downloader.com/streaming-videos/",			  
						"icon":   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAUCAYAAABF5ffbAAABWElEQVQYV2OMm3fwACe/iD0DFHz/8GYvY/SMPed5RCUNYIKfXz09yxgxdecxfgkZS5jgx6f3jzCGTd68V1BKyQkm+P7J3d2MYRM3bxGUUfKGCb57dGsjY1j/xpWCciphMMG3D24uZwzuXTtfREEjASb4+u61OYzBXauniChrZcMEX92+OJExoGNZp7iqfhlM8MX1M22M/m1L6iTUDRthgs+vna1i9G9eVCihZdwHE3x66WQ+o0/j/FRpHbNZMMHH5w8nMXrWzQ6X07daARN8dOZAKKOeW6yYuJ5pLQPTfxbG//9+3zuxq5kRqILROSjVhF9I1O7z+7cHd6+deZYxJKUmSFhCdiUTMxPL////fz9/dDeYMaGw5wQnH785POg+vTvKGFPYfZGXT0APJvjl3dtzjN5ReSVyqrrdEMF//+/duFgIsojDzjs2WkBIzPHd25d7j2xbsgIAOkiFc78dqlYAAAAASUVORK5CYII="
					},					
					{ 	"name":	  "audio",
						"label":  "Please read information about Audio downloads",		
						"url": 	  "https://www.stream-video-downloader.com/audio-download/",			  
						"icon":   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAUCAYAAABF5ffbAAABWElEQVQYV2OMm3fwACe/iD0DFHz/8GYvY/SMPed5RCUNYIKfXz09yxgxdecxfgkZS5jgx6f3jzCGTd68V1BKyQkm+P7J3d2MYRM3bxGUUfKGCb57dGsjY1j/xpWCciphMMG3D24uZwzuXTtfREEjASb4+u61OYzBXauniChrZcMEX92+OJExoGNZp7iqfhlM8MX1M22M/m1L6iTUDRthgs+vna1i9G9eVCihZdwHE3x66WQ+o0/j/FRpHbNZMMHH5w8nMXrWzQ6X07daARN8dOZAKKOeW6yYuJ5pLQPTfxbG//9+3zuxq5kRqILROSjVhF9I1O7z+7cHd6+deZYxJKUmSFhCdiUTMxPL////fz9/dDeYMaGw5wQnH785POg+vTvKGFPYfZGXT0APJvjl3dtzjN5ReSVyqrrdEMF//+/duFgIsojDzjs2WkBIzPHd25d7j2xbsgIAOkiFc78dqlYAAAAASUVORK5CYII="
					}	
		];

		const HINTS_FOOTER = [ 
					{ "name":	"weather",
					  "label":  "Weather",
					  "url":    "https://chrome.google.com/webstore/detail/weather/ihbiedpeaicgipncdnnkikeehnjiddck",
					  "icon":   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAASAAAAEgARslrPgAABdBJREFUWMO1ln1sVmcZxn/Xc85b+ralb7fyIdnGFjWKzjFREmNwQYkLorRGZtQZs/gXWaLG7NMJBd1oy9gWZTqXLBk6ozHGLG6jjcwa/1FiECcfMY7RsImi0NEV2re09H3fc57LP94yJ2zKR7mT549zzvPkus593899XeKsGOvrBmgBeoEjIcSttmqtqzcAMPrbe2DyCsDzhBcJ9gHl1o4uLibC2S9UXxXQCOimPIY5tjg5cH99w+kSMWQSrALdaZjni4J+CwJpA8RIDXsXMFfoBhChkjDa14ssQkznA2uAo0bHjWaOQNPKLkIQgj3APvDVDgkY5AgYOS4F5gDPEF1O03CBsG/44bf8ovAa+BGhVDG/FtFu1CBzArkMflTWHyzRsuqbF01A5e2b5gBl4WpUQsQUEDkuYW5CuhlYAjQDkXqbHAP2GH4j9IJhKiXSchGNqLG+7l+AXgI/I8cXqyVVCuVwA3A78F7gEPAC5l/INaAdtARYBjQCz0F8IoYwNOt0labP3n/BBL4OrASagIcQJzAbQZPYjxn+7IQJ2TE6I1dGwY1FOVyH6ABuBXaCu41eTWOVlk+fP4k0pPH7MQ/9WB8G5mKvBQ2De/K0YTDNKrR+asPZ506P9fUeEDpk4t+A+4C1wt/JQ2HiQjIQZq/aGIl6GfMc8H5QitkMyWCSV2jt3PCmB0sd6zBZTc6eBX4EWgNafni0hXJ/9/mXoNy3iZyEQPwI6GHg0dZkzs9P5SPM7lhHuX8ToGBrnuGd4CuBCaG/yj4eIUpaADwODMvcYZhoPd2EPn/H/y+BLYKzgMLHEMfAO8v5MDHkHB9YhythIfWhs0LQBjpz6U9aGhB+trE08c+pseYfA+8hIAH4/IaTyn29BKkxd9wGDKHavTjJCUFEPgTcDbRh/x5pP/Bq/ZlliGXACPCQ7H0WBVImqRGABHCC85PJ8XhVvI7Qcde5BMb7uhG052ibYXca1FvJM1Ili4EtwClgSyF6bxR5S2cX5f4HSGIo1GAJUte0ftxtmACun15zgalpggex988uV4dPN6c0f2bjGzLQ34PwnGg9afzHxGEzuBhhE+IDwJ0xT/eFtEpp9X8asrzjAWrlJtKmylLgYfAUKAOuBirTmSoDDcAVwBD2gGBHFvORYrGJ4sp70Fh/N8iNxPBD8NHYkN2bVArvMjwJ/LTQyBNZFbeuXn9O+srbewiRkCfcBnyZujT/CjiMmUDUMAliAfBx4BPAQZnvZifnD6btQ6Q22FSFXxJ6e1ItlIyvR6rZ7KlO4bbOc8EBJmalNE9lEfO0xE6ko42zmBwfh/Y1617fd6q/+1gQf6lF7aJeqg3JlUMb8lyHU0nUKllsaCj8EnwtUhW4CpiUPPK/OnjBym+8jkF9ZL9ptKzuYnR7T20qS35XLGQTSJtBaxOxJZRWr6ehsQAJL2IdtPkS6IvgBkF+8Ur/39HWuZ5iY0YyO99jvA1YjvhoGO3rJkYK5KxEfA+4DdgFPB7g+EwRACh9sou8nFjWrzGHbG5JQ1DiSAfwNeom5GdGB4YGJyavWdxKy833zSCF+nCoKowmjrsRn0sdvRi4HbQriAcdGQuJWXRX74wCn4mICEQkBg1JCroVsO2ncmtsdsspkhWbLws4ABLCUJ8RCsBSYLfrinh5wQFhpl10E9RNaQkYbPNjmcKlGOzzC9vTNHjHGQIA+ZHCg5dgri+AgETARcwHMSMBGAcWlnQkWJeXwsm+nukSeCniRmAgAAeAG4lq5zJW4ERfDwGI0jWgtcDfLbYH4GngbUBnmpCO9/fMOHh5x7cploYxXiTzLWAh8IP9L7/vHxrr723E/ipwC7DVoj8ln0qcX1I+IpCRBkuFgEo2K6grZgPwSBDP22QpMU4BTyEVga/ILM9JXslJZqIgs2TmG78bVKQu1z+JxL228raOLtKQp8Qkfw3YCn4F+AJoOczIpTjjiPaCn0f603BzZXzeqVm0dtQl/t8L1JDg3Ewj2QAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxOC0xMi0yMFQxMDowOTo0MyswMDowMNJtCmQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTgtMTItMjBUMTA6MDk6NDMrMDA6MDCjMLLYAAAARnRFWHRzb2Z0d2FyZQBJbWFnZU1hZ2ljayA2LjcuOC05IDIwMTQtMDUtMTIgUTE2IGh0dHA6Ly93d3cuaW1hZ2VtYWdpY2sub3Jn3IbtAAAAABh0RVh0VGh1bWI6OkRvY3VtZW50OjpQYWdlcwAxp/+7LwAAABh0RVh0VGh1bWI6OkltYWdlOjpoZWlnaHQAMTkyDwByhQAAABd0RVh0VGh1bWI6OkltYWdlOjpXaWR0aAAxOTLTrCEIAAAAGXRFWHRUaHVtYjo6TWltZXR5cGUAaW1hZ2UvcG5nP7JWTgAAABd0RVh0VGh1bWI6Ok1UaW1lADE1NDUzMDA1ODM8fwkMAAAAD3RFWHRUaHVtYjo6U2l6ZQAwQkKUoj7sAAAAVnRFWHRUaHVtYjo6VVJJAGZpbGU6Ly8vbW50bG9nL2Zhdmljb25zLzIwMTgtMTItMjAvNWYwMTUwZDMzMTY3MTI3MDBiMzJhOTdlY2NhZDY3YjIuaWNvLnBuZxbcS3cAAAAASUVORK5CYII="	
					},			 				
					{ "name":	"auto-refresh",
					  "label":  "Auto Refresh",
					  "url":    "https://chrome.google.com/webstore/detail/auto-refresh/ifooldnmmcmlbdennkpdnlnbgbmfalko",
					  "icon":   "data:image/png;base64,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"	
					},			 				
					{ "name":   "unseen",
					  "label": "Unseen for Facebook",
					  "url":   "https://chrome.google.com/webstore/detail/unseen-for-facebook/jiomcgpfgkeefipihnplhadgdoollmap",
					  "icon":   "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAyNTIgMjUyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAyNTIgMjUyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6dXJsKCNYTUxJRF82NV8pO30KCS5zdDF7ZmlsbDojRkZGRkZGO30KPC9zdHlsZT4KPGcgaWQ9IlhNTElEXzFfIj4KCTxnIGlkPSJYTUxJRF8yMl8iPgoJCTxsaW5lYXJHcmFkaWVudCBpZD0iWE1MSURfNjVfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjEyNS45ODA2IiB5MT0iMTcuODA3NiIgeDI9IjEyNS45ODA2IiB5Mj0iMjAxLjkwNTQiPgoJCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojMDBDNkZGIi8+CgkJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDZGRkYiLz4KCQk8L2xpbmVhckdyYWRpZW50PgoJCTxjaXJjbGUgaWQ9IlhNTElEXzZfIiBjbGFzcz0ic3QwIiBjeD0iMTI2IiBjeT0iMTI2IiByPSIxMjAiLz4KCQk8cGF0aCBpZD0iWE1MSURfMTVfIiBjbGFzcz0ic3QxIiBkPSJNMTI2LDI1MkM1Ni41LDI1MiwwLDE5NS40LDAsMTI2QzAsNTYuNSw1Ni41LDAsMTI2LDBjNjkuNSwwLDEyNiw1Ni41LDEyNiwxMjYKCQkJQzI1MiwxOTUuNCwxOTUuNCwyNTIsMTI2LDI1MnogTTEyNiwxMkM2My4xLDEyLDEyLDYzLjEsMTIsMTI2YzAsNjIuOCw1MS4xLDExNCwxMTQsMTE0YzYyLjgsMCwxMTQtNTEuMSwxMTQtMTE0CgkJCUMyNDAsNjMuMSwxODguOCwxMiwxMjYsMTJ6Ii8+Cgk8L2c+Cgk8ZyBpZD0iWE1MSURfMTZfIj4KCQk8cGF0aCBpZD0iWE1MSURfMThfIiBjbGFzcz0ic3QxIiBkPSJNODIuNSwxNTguMWMtMTUuMi0xMS41LTI1LjYtMjYtMjkuNi0zMi4xYzcuMi0xMC45LDM0LjQtNDguMSw3My4xLTQ4LjEKCQkJYzEwLjgsMCwyMC43LDIuOSwyOS41LDcuM2w5LTljLTExLjEtNi4xLTI0LTEwLjMtMzguNS0xMC4zYy01Mi4yLDAtODQsNTQuOC04NS40LDU3LjJsLTEuNywzbDEuNywzYzAuOCwxLjQsMTIuNiwyMS44LDMzLjMsMzcuOAoJCQlMODIuNSwxNTguMXoiLz4KCQk8cGF0aCBpZD0iWE1MSURfMTdfIiBjbGFzcz0ic3QxIiBkPSJNMjExLjMsMTIzYy0wLjgtMS40LTEyLjYtMjEuOC0zMy4zLTM3LjhsLTguNiw4LjZjMTUuMiwxMS41LDI1LjYsMjYsMjkuNiwzMi4xCgkJCWMtNy4yLDEwLjktMzQuNCw0OC4xLTczLjEsNDguMWMtMTAuOCwwLTIwLjctMi45LTI5LjUtNy4zbC05LDljMTEuMSw2LjEsMjQsMTAuMywzOC41LDEwLjNjNTIuMiwwLDg0LTU0LjgsODUuNC01Ny4ybDEuNy0zCgkJCUwyMTEuMywxMjN6Ii8+Cgk8L2c+Cgk8cGF0aCBpZD0iWE1MSURfOV8iIGNsYXNzPSJzdDEiIGQ9Ik0xNzMuNyw4OS41bC0xNywxN2MzLjYsNS42LDUuNiwxMi4zLDUuNiwxOS41YzAsMjAuMS0xNi4zLDM2LjQtMzYuNCwzNi40CgkJYy03LjIsMC0xMy44LTIuMS0xOS41LTUuNkw5MiwxNzEuM2MxMCw1LjMsMjEuNCw4LjgsMzQsOC44YzQ5LjMsMCw4MC4xLTU0LjEsODAuMS01NC4xUzE5NC4zLDEwNS4zLDE3My43LDg5LjV6Ii8+Cgk8cGF0aCBpZD0iWE1MSURfOF8iIGNsYXNzPSJzdDEiIGQ9Ik04OS41LDEyNmMwLTIwLjEsMTYuMy0zNi40LDM2LjQtMzYuNGM3LjIsMCwxMy44LDIuMSwxOS41LDUuNkwxNjAsODAuNwoJCWMtMTAtNS4zLTIxLjQtOC44LTM0LTguOGMtNDkuMywwLTgwLjEsNTQuMS04MC4xLDU0LjFzMTEuOCwyMC42LDMyLjQsMzYuNGwxNy0xN0M5MS42LDEzOS44LDg5LjUsMTMzLjEsODkuNSwxMjZ6Ii8+CjwvZz4KPC9zdmc+Cg=="	
					}			 				
		];
		
		const HINTS_MESSAGE = [ 
					{ "name":	"youtube",
					  "html":   '<div class="message-wrapped">'+
					  			'  <span><%popup_noyoutube_message1%></span><br>'+
								'  <span><%popup_noyoutube_message2%></span><br>'+
								'  <span><%popup_noyoutube_message3%></span>'+
								'</div>',
					  "button": false			
					},			 				
					{ "name":	"stream",
					  "html":   '<div class="message-wrapped streams">'+
					  			'  <div class="title"><%popup_streams_message1%></div><br>'+
								'  <div class="text"><%popup_streams_message2%></div>'+
								'  <div class="text"><%popup_streams_message3%></div><br><br>'+
								'  <div class="image">'+
								'     <img src="/images/popup/message_converter.png">'+
								'  </div><br>'+
								'  <div class="button">'+
								'     <a href="https://chrome.google.com/webstore/detail/stream-video-downloader/imkngaibigegepnlckfcbecjoilcjbhf" target="_blank">'+
								'        <div><%popup_streams_button%></div>'+
								'     </a>'+ 
								'  </div>'+
								'</div>',
					  "button": true			
					}			 				
		];
		
		const INTERVAL_TO_DISPLAY_RATE = 2 * 24 * 3600; // 2 days

		var hints_header = null, hints_footer = null;
		
		// ---------------------------------------------- INIT ---------------------------
		this.init = function(){		
		
			fvdDownloader.Utils.getActiveTab( function( tab ){
					if( tab )	{
	
						var rate = buildHints( tab );
							
						buildHeader( rate.header );

						buildFooter( rate.footer );

					
			
					}
			});			
			
		}

		// ----------------------------------------------------- 
		function buildHints( tab ){

			var url = tab.url;
			var isStream = false;
			var media = fvdDownloader.Media.getMedia( tab.id );
			if (media) {
				for (var i=0; i<media.length; i++) { 
				  if (media[i].type == 'stream' || media[i].type == 'record') isStream = true; 
				}    
			}	

			var text = fvdDownloader.Prefs.get( "hints_disabled" );			
			var flagDisabled = text ? JSON.parse(text) : [];

			var flagRate = false;
			var flagProblem = false;
			var flagPriority = false;
			var hh = null;
			var installTime = fvdDownloader.Prefs.get( "install_time" );

			// показ сообщения об facebook
			if (flagDisabled.indexOf('facebook') == -1 && /^https?:\/\/www\.facebook\.com\//.test(url))  {
			  for (var i=0; i<HINTS_HEADER.length; i++) {
				  if (HINTS_HEADER[i].name == 'facebook') {
					  flagPriority = true;
					  hh = HINTS_HEADER[i];
				  }
			  }
			}  

			// показ сообщения об soundcloud
			if (flagDisabled.indexOf('audio') == -1 && /soundcloud\.com/.test(url))  {
			  for (var i=0; i<HINTS_HEADER.length; i++) {
				  if (HINTS_HEADER[i].name == 'audio') {
					  flagPriority = true;
					  hh = HINTS_HEADER[i];
				  }
			  }
			}  

			// показ сообщения об stream
			if (!flagPriority && flagDisabled.indexOf('stream') == -1 && isStream )  {
			  for (var i=0; i<HINTS_HEADER.length; i++) {
				  if (HINTS_HEADER[i].name == 'stream') {
					  flagPriority = true;
					  hh = HINTS_HEADER[i];
				  }
			  }
			}  

			// показ сообщения об ошибке
			if (!flagPriority) {
			  if (flagDisabled.indexOf('problem') == -1)  {
				for (var i=0; i<HINTS_HEADER.length; i++) {
					if (HINTS_HEADER[i].name == 'problem') {
						flagProblem = true;
						hh = HINTS_HEADER[i];
					}
				}
			  }  
			} 

			// показ рейтинга
			var now = parseInt(new Date().getTime() / 1000);
			if (!flagProblem && !flagPriority) {
				if (flagDisabled.indexOf('rate') == -1)  {
				  for (var i=0; i<HINTS_HEADER.length; i++) {
					  if (HINTS_HEADER[i].name == 'rate') {
						  flagRate = true;
						  hh = HINTS_HEADER[i];
					  }
				  }
				}  
				if (flagRate) {
					if( now - installTime < INTERVAL_TO_DISPLAY_RATE )       flagRate = false;
				}

				if (!flagRate) {      // случайный выбор
					// выбор сообщений
					var h = [];
					for (var i=0; i<HINTS_HEADER.length; i++) {
						if (flagDisabled.indexOf(HINTS_HEADER[i].name) == -1 && 
							['rate', 'facebook', 'stream', 'audio'].indexOf(HINTS_HEADER[i].name) == -1) {
										h.push( HINTS_HEADER[i] );
						}
					}
					var k = h.length;
					if (k>0) {             // случайность    
						var ind = Math.floor(Math.random() * k );
						hh = h[ind];
					}
				}
			}    
    
			// нижние сообщения
			if( now - installTime > INTERVAL_TO_DISPLAY_RATE )       {
				flagRate = true;
			}
			if (flagDisabled.indexOf('rate') != -1)  flagRate = false; 
			if (flagRate && HINTS_FOOTER.length>0 && HINTS_FOOTER[0].name != 'rate')  flagRate = false; 

			var f = [];
			for (var i=0; i<HINTS_FOOTER.length && f.length<4; i++) {
				if (!flagRate && HINTS_FOOTER[i].name == 'rate') continue;
				f.push( HINTS_FOOTER[i] );
			}
		
			return {header: hh, footer: f};
		}
		
		// ----------------------------------------------------- 
		function closeHints( name ){
		
			console.log(name);
			
			var text = fvdDownloader.Prefs.get( "hints_disabled" );			
			var flagDisabled = text ? JSON.parse(text) : [];
			
			flagDisabled.push(name);
			text = JSON.stringify(flagDisabled);
			fvdDownloader.Prefs.set( "hints_disabled", text);

		}
		
		// ----------------------------------------------------- 
		function buildHeader( rr ){

			var container = document.getElementById("header_container");
			while( container.firstChild )  {
				container.removeChild( container.firstChild );
			}

			if (rr) {
				container.removeAttribute('style');

				if (rr.name == 'rate') {
					var d = document.createElement("div");
					d.setAttribute("class", "header-rate");
					var d1 = document.createElement("div");
					d1.setAttribute("class", "header-rate-text");
					d1.textContent = rr.label;
					var d2 = document.createElement("div");
					d2.setAttribute("class", "header-rate-img");
					d.appendChild(d1);
					d.appendChild(d2);

					var a = document.createElement("a");
					a.setAttribute("target", "_blank");
					a.appendChild(d);
					container.appendChild(a);
					
					a.addEventListener( "click", function( event ){
							self.navigate_url( rr.url );
							event.stopPropagation();
						}, false );

					var div = document.createElement("div");
					div.setAttribute("class", "close");
					container.appendChild(div);
					
					div.addEventListener( "click", function( event ){
							closeHints( rr.name );
							container.setAttribute('style', 'opacity: 0');
							a.removeAttribute('href');
							event.stopPropagation();
						}, false );

				}
				else {
					var a = document.createElement("a");
					a.setAttribute("class", "text");
					a.setAttribute("target", "_blank");
					a.setAttribute("style", "background: url('"+rr.icon+"') 6px center no-repeat;");
					a.setAttribute("href", rr.url);
					a.textContent = rr.label;
					container.appendChild(a);
					var div = document.createElement("div");
					div.setAttribute("class", "close");
					container.appendChild(div);

					div.addEventListener( "click", function( event ){
							closeHints( rr.name );
							a.setAttribute('style', 'opacity: 0');
							a.removeAttribute('href');
							div.setAttribute('style', 'opacity: 0');
							event.stopPropagation();
						}, false );
				}	
			}	
			else {
				container.setAttribute('class', 'headerHint');
			}

		}
		
		// ----------------------------------------------------- 
		function buildFooter( rr ){

			var container = document.getElementById("footer_container");
			while( container.firstChild )  {
				container.removeChild( container.firstChild );
			}

			for (var i=0; i<rr.length; i++) {

				if (rr[i].name == 'rate') {
					var d = document.createElement("div");
					d.setAttribute("class", "footer-rate");
					var d1 = document.createElement("div");
					d1.setAttribute("class", "footer-rate-text");
					var d2 = document.createElement("div");
					d2.setAttribute("class", "footer-rate-img");
					d.appendChild(d1);
					d.appendChild(d2);

					var a = document.createElement("a");
					a.setAttribute("target", "_blank");
					a.setAttribute("href", rr[i].url);
					a.appendChild(d);
					container.appendChild(a);

				}
				else {
					var a = document.createElement("a");
					a.setAttribute("class", "footer-item");
					a.setAttribute("target", "_blank");
					a.setAttribute("style", "background-image: url('"+rr[i].icon+"'); background-position: 0px center;");
					a.setAttribute("href", rr[i].url);
					a.textContent = rr[i].label;
					container.appendChild(a);
				}	
			}
		

		}	

		// ---------------------------------------------- INIT ---------------------------
		this.message = function(type){		

			var xx = null;

			for (var i=0; i<HINTS_MESSAGE.length; i++) {
				if (HINTS_MESSAGE[i].name == type) {
					  var xx = HINTS_MESSAGE[i];
					  break;
				}
			}
			
			if (xx) {
				xx.html = xx.html.replace(/\<\%(.+?)\%\>/gm, function(m) { 
					var mm = m.match(/\<\%(.+?)\%\>/);
					if (mm) {
						return _(mm[1]);	
					}	
					return m;
				});

				document.getElementById("download_item_container").setAttribute('hidden', true);

				var container = document.getElementById("containerMessage");
				container.removeAttribute('hidden');

				while( container.firstChild )	{
					container.removeChild( container.firstChild );
				}

				container.innerHTML = xx.html;

				if (xx.button) {
					var div = document.createElement("div");
					div.setAttribute("class", "message-disabled");
					container.appendChild(div);

					var div1 = document.createElement("div");
					div1.setAttribute("class", "message-disabled-wrapped");
					div.appendChild(div1);

					var btn1 = document.createElement("button");
					btn1.setAttribute("class", "message-button-dont-show");
					btn1.setAttribute("type", "button");
					btn1.textContent = _("popup_disabled_message");
					div1.appendChild(btn1);
					
					btn1.addEventListener( "click", function( event ){
							_close();
							event.stopPropagation();
						}, false );
					

					var btn2 = document.createElement("button");
					btn2.setAttribute("class", "message-button-closed");
					btn2.setAttribute("type", "button");
					btn2.textContent = _("popup_closed_message");
					div1.appendChild(btn2);
					
					btn2.addEventListener( "click", function( event ){
							_close();
							event.stopPropagation();
						}, false );
					
				}
		
			}			

			function _close() {
				document.getElementById("download_item_container").removeAttribute('hidden');
				container.setAttribute('hidden', true);
			}	


			return null;
		}

		// ----------------------------------------------
		this.navigate_url = function( url ){
			chrome.tabs.query( 	{
							url:  url 
						}, function( tabs ){

									if( tabs.length > 0 )
									{
										foundTabId = tabs[0].id;
										chrome.tabs.update( foundTabId, {
																		active: true
																		} );
									}
									else
									{
										chrome.tabs.create( {	active: true,
																url: url
															}, function( tab ){ }
														);
									}
					} );
		}
		
	}
	
	this.PopupHints = new PopupHints();
	
}).apply( fvdDownloader );
