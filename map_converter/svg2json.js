var workFolder = './sources/';

Array.prototype.find = function (value) {
	for (var i in this) {
		if (this[i] == value) return i;
	}
	return null;
}

String.prototype.beginsWith = function (text) {
	return (this.substr(0, text.length) == text)
}

String.prototype.substrBetween = function (begin, end) {
	var i = this.indexOf(begin) + begin.length;
	return this.substr(i,  this.indexOf(end, i)-i);
}

String.prototype.trim = function () {
	return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

String.prototype.clean = function () {
	return this.replace(/\s/g, ' ');
}

String.prototype.parseArgs = function () {
	var result = {};
	var s = this.trim();
	var i0 = 0;
	var i1 = s.indexOf('=', i0+1);
	
	while (i1 >= 0) {
		var i2 = s.indexOf('"', i1+1);
		var i3 = s.indexOf('"', i2+1);
	
		var key = s.substr(i0  , i1-i0  ).trim();
		var val = s.substr(i2+1, i3-i2-1).trim();
		
		result[key] = val;
		
		i0 = i3+1;
		i1 = s.indexOf('=', i0+1);
	}
	
	return result;
}


function debug(data, level) {
	if (!level) level = '';
	
	console.log(level+data.type+' [');
	if (data.children) {
		for (var i = 0; i < data.children.length; i++) {
			debug(data.children[i], level+'   ');
		}
	} else {
		console.log(data);
	}
	console.log(level+']');
}


String.prototype.getXML = function () {
	var a = this.trim().clean().split('<');
	var b = [{type:'super',children:[]}];
	var level = 1;
	for (var i = 0; i < a.length; i++) {
		var s = (a[i]).replace(/\>.*/, '');
		var n = s.length;
		var firstChar = s.substr(0, 1);
		
		if ((firstChar != '!') && (firstChar != '?')) {
			var leadSlash = (firstChar        == '/') ? 1 : 0;
			var tralSlash = (s.substr(n-1, 1) == '/') ? 1 : 0;
			
			//console.log(firstChar, leadSlash, tralSlash);
			
			s = s.substr(leadSlash, n - leadSlash - tralSlash)+' ';
			var firstSpace = s.indexOf(' ');
			var newLevel = level + 1 - tralSlash - 2*leadSlash;
			
			var o = {
				type: s.substr(0, firstSpace),
				attributes: s.substr(firstSpace+1, n).parseArgs(),
				children: [],
				parent: null
			};
			
			if (!leadSlash) {
				o.parent = b[level-1];
				b[level] = o;
				b[level-1].children.push(o);
			}
			
			level = newLevel;
		}
	}
	
	b = b[0];
	
	//debug(b);
	
	return b
}



function convert(svgFileName) {
	console.info('Importiere "'+svgFileName+'"');

	var cleanName = function (text) {
		text = text.toLowerCase();
		text = text.replace(/x[0-9a-f]{2}/g, '');
		text = text.replace(/[^a-z]/g, '');
		return text;
	}
	
	var readSVG = function(text) {
	
	 	var findNode = function (xmlNode, id) {
	 		//console.log(xmlNode);
	 		if ((xmlNode.attributes) && (xmlNode.attributes.id == id)) {
	 			//debug(xmlNode);
	 			return xmlNode;
	 		}
	 		if (xmlNode.children) {
				for (var i = 0; i < xmlNode.children.length; i++) {
					var node = findNode(xmlNode.children[i], id);
					if (node) {
						return node;
					}
				}
	 		}
	 		return null;
	 	};
	 	
		var convertPolyPoints = function (text) {
			var result = [];
			var parts = text.split(' ');
			for (var i = 0; i < parts.length; i++) {
				if (parts[i].length >= 3) {
					var coor = parts[i].split(',');
					result.push('['+parts[i]+']');
				}
			}
			return '['+result.join(',')+']';
		}
	 	
		var convertPathPoints = function (text) {
			var result = [];

			var x = 0, y = 0, x0 = 0, y0 = 0;

			var matches = text.match(/[a-z][^a-z]*/gi);

			for (var i = 0; i < matches.length; i++) {
				var entry = matches[i];
				var command = entry[0];
				var coord = entry.match(/[-]?[0-9]+(\.[0-9]+)?/g);

				if (coord == null) coord = [];

				for (var j = 0; j < coord.length; j++) {
					var value = coord[j];
					value = parseFloat(value);
					coord[j] = value;
				}

				switch (command) {
					case 'M': x  = coord[0]; y  = coord[1]; x0 = x; y0 = y; break;
					
					case 'L': x  = coord[0]; y  = coord[1]; break;
					case 'l': x += coord[0]; y += coord[1]; break;
					
					case 'C': x  = coord[4]; y  = coord[5]; break;
					case 'c': x += coord[4]; y += coord[5]; break;
					
					case 'S': x  = coord[2]; y  = coord[3]; break;
					case 's': x += coord[2]; y += coord[3]; break;

					case 'H': x  = coord[0]; break;
					case 'h': x += coord[0]; break;

					case 'V': y  = coord[0]; break;
					case 'v': y += coord[0]; break;

					case 'z': x = x0; y = y0; break;
					default:
						console.error('Unknown Path command "'+command+'"');
				}

				if (isNaN(x) || isNaN(y)) {
					console.log(entry, command, coord);
					return;
				}

				result.push('[' + Math.round(x*1000)/1000 + ',' + Math.round(y*1000)/1000 +']');
			}

			return '['+result.join(',')+']';
		}
	 	
		var convertRegions = function(node) {
			if (node.attributes && (node.attributes.display == 'none')) return;
			
			var result = [];
			
			switch (node.type) {
				case '':
				case 'g':
				case 'super':
				case 'svg':
					for (var i = 0; i < node.children.length; i++) {
						result.push(convertRegions(node.children[i]));
					}
				break;
				
				case 'polygon':
				case 'polyline':
					result.push(convertPolyPoints(node.attributes.points));
				break;

				case 'path':
					result.push(convertPathPoints(node.attributes.d));
				break;
				
				case 'line':
					var a = node.attributes;
					result.push('[['+a.x1+','+a.y1+'],['+a.x2+','+a.y2+']]');
				break;
				
				case 'circle':
					var a = node.attributes;
					result.push('{"name":"'+a.id+'","x":'+a.cx+',"y":'+a.cy+',"lx":1,"ly":0}');
				break;
					
				default:
					console.error('unknown node type "'+node.type+'" of id "'+node+'"');
			}
			
			result.reverse();
			var s = result.join(',\r');
			s = s.replace(/\r/g, '\r\t');
			s = '[\r\t'+s+'\r]';
			if (node.attributes && (node.attributes.id)) s = '"'+node.attributes.id+'":'+s;
			return s;
		}
	 	
		var extractTowns = function(xml, id) {
			var data = [];
		
			var g = findNode(xml, id);
			if ((!g) || (!g.children)) {
				console.error('"'+id+'" not found');
				return null;
			}

			var c = g.children;
			
			for (var i = 0; i < c.length; i++) {
				var node = c[i];
				
				if (node.type == 'circle') {
					var a = node.attributes;
					data.push('{name:"'+a.id+'",x:'+a.cx+',y:'+a.cy+',lx:1,ly:0}');
				} else {
					console.error('Unerwarteter Region-Knotentyp: "'+node.type+'" in "'+id+'"');
				}
			}
			
			return data.join(",\n   ");
		}
	
		var xml = text.getXML();
		var s = convertRegions(xml);
		
		return s;
	};
	
   var fs = require('fs');
	var svgData = readSVG(fs.readFileSync(svgFileName, 'utf8'));
	fs.writeFileSync(svgFileName+'.js', svgData, 'utf8');
}

convert('map2.svg');

/*
convert(workFolder+'config_Bayern/', 'Originale/Karte5.svg');
convert(workFolder+'config_BW/', 'Originale/Karte2.svg');
convert(workFolder+'config_Hessen/', 'Originale/Karte5.svg');
convert(workFolder+'config_NRW/', 'Originale/Karte2.svg');*/