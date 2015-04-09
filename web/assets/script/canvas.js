function Canvas () {
	var me = {};
	var wrapper = $('#map');
	var canvas1 = $('#canvas1');
	var canvas2 = $('#canvas2');
	var ctx1 = canvas1.get(0).getContext('2d');
	var ctx2 = canvas2.get(0).getContext('2d');
	var width, height, scale, x0, y0, graph;
	var view = {dx:0,dy:0,zoom:1, initial:true};
	var viewInterval = false;
	var lastRedraw2 = 0;
	var packets = [];
	var packetCount = 2000;
	var clickObjects = [];
	var popup = $('#popup');
	var countryCircles = {};

	initMap();
	resize();

	$(window).resize(resize);

	canvas2.on('mousemove', function (e) {
		var x = e.offsetX;
		var y = e.offsetY;
		var node = false;
		var minDistance = 1e10;

		clickObjects.forEach(function (obj) {
			var d = Math.sqrt(sqr(obj.x-x) + sqr(obj.y-y));
			if ((d < obj.r+5) && (d < minDistance)) {
				minDistance = d;
				node = obj;
			}
		})
		if (node) {
			showPopup(node);
		} else {
			hidePopup();
		}
	})

	me.setGraph = function (_graph) {
		graph = _graph;
		packets = [];

		var paths = [];
		graph.paths.forEach(function (entry) {
			for (var i = 0; i < entry.count; i++) paths.push(entry.path);
		})
		paths.sort(function (a,b) {
			return Math.random()-0.5;
		})

		var index = 0
		for (var i = 0; i < packetCount; i++) {
			index = (index+1) % paths.length;
			var path = paths[index];
			packets.push({
				path: path,
				offset: Math.floor(Math.random()*(path.length-1)) + Math.random()/2
			})
		}

		Object.keys(countryCircles).forEach(function (key) {
			countryCircles[key].used = false;
		});
		graph.nodes.forEach(function (node) {
			var key = node.country;
			if (!countryCircles[key]) {
				countryCircles[key] = {
					r:0,
					code:key,
					x: mapData.countries[key].x,
					y: mapData.countries[key].y
				}
			}
			countryCircles[key].used = true;
		})
		Object.keys(countryCircles).forEach(function (key) {
			if (!countryCircles[key].used) delete countryCircles[key];
		});
	}

	me.setView = function (_view) {
		if (view.initial) {
			view = _view;
			updateScale();
			redraw1();
			redraw2();
			return;
		}
		if (viewInterval) clearInterval(viewInterval);
		var t0 = (new Date()).getTime();
		var duration = 2000;
		var view0 = view;
		viewInterval = setInterval(function () {
			var t = (new Date()).getTime();
			var a = (t-t0)/duration;
			if (a > 1) {
				a = 1;
				clearInterval(viewInterval);
				viewInterval = false;
			}
			a = 0.5-Math.cos(Math.PI*a)/2;
			view = {
				dx: view0.dx*(1-a) + a*_view.dx,
				dy: view0.dy*(1-a) + a*_view.dy,
				zoom: Math.exp(Math.log(view0.zoom)*(1-a) + a*Math.log(_view.zoom))
			}
			updateScale();
			redraw1();
			redraw2(true);
		}, 40);
	}

	setInterval(redraw2, 40);
	setInterval(function () {
		packets.forEach(function (packet) {
			packet.offset += 0.005;
			if (packet.offset > packet.path.length-1) packet.offset -= packet.path.length-1;

			var index = Math.floor(packet.offset);
			var p1 = packet.path[index];
			var p2 = packet.path[index+1];

			var l = Math.sqrt(sqr(p1.x-p2.x) + sqr(p1.y-p2.y));
			l = 5/(l+1e-5);
			var a2 = (packet.offset - index)*2;
			var a1 = a2-l;

			if (a1 < 0) { a1 = 0; }
			if (a2 < 0) { a2 = 0; }
			if (a1 > 1) { a1 = 1; packet.offset = index+1; }
			if (a2 > 1) { a2 = 1; }

			packet.x  = p1.x*(1-a2) + a2*p2.x;
			packet.y  = p1.y*(1-a2) + a2*p2.y;
			packet.x0 = p1.x*(1-a1) + a1*p2.x;
			packet.y0 = p1.y*(1-a1) + a1*p2.y;

			packet.sameCountry = (p1.country == p2.country);
			packet.inEu = (p1.country != 'US') && (p2.country != 'US');
		})
	}, 40);

	return me;

	function updateScale() {
		scale = Math.max(width, height)*view.zoom;
		x0 = view.dx*scale + width/2;
		y0 = view.dy*scale + height/2;
	}

	function redraw1() {
		//return;
		ctx1.fillStyle = '#f0eeec';
		ctx1.fillRect(0, 0, width, height);

		ctx1.strokeStyle = '#f0eeec';
		ctx1.lineWidth = 2;

		ctx1.beginPath();
		mapData.all.forEach(drawPolygon);
		ctx1.fillStyle = '#fff';
		ctx1.fill();
		ctx1.stroke();

		ctx1.beginPath();
		mapData.negative.forEach(drawPolygon);
		ctx1.fillStyle = '#f0eeec';
		ctx1.fill();
		ctx1.stroke();

		function drawPolygon(poly) {
			for (var i = 0; i < poly.length; i++) {
				var x = poly[i][0]*scale + x0;
				var y = poly[i][1]*scale + y0;
				if (i == 0) {
					ctx1.moveTo(x,y);
				} else {
					ctx1.lineTo(x,y);
				}
			}
		}
	}

	function redraw2(force) {
		var now = (new Date()).getTime();
		if (!force && (lastRedraw2 > now - 30)) return;
		lastRedraw2 = now;

		ctx2.clearRect(0,0,width,height);

		if (!graph) return;

		var scale2 = scale / 1000;

		
		var vectors = [[0,1],[1,0],[1,1],[1,-1]].map(function (v) {
			var r = Math.sqrt(v[0]*v[0] + v[1]*v[1]);
			return [v[0]/r, v[1]/r];
		});

		Object.keys(countryCircles).forEach(function (key) {
			var circle = countryCircles[key];
			circle.minMax = vectors.map(function () { return [1e100,-1e100] });
		});

		graph.nodes.forEach(function (node) {
			var circle = countryCircles[node.country];
			vectors.forEach(function (vector, index) {
				var v = vector[0]*node.x + vector[1]*node.y;
				var minMax = circle.minMax[index];
				if (minMax[0] > v) minMax[0] = v;
				if (minMax[1] < v) minMax[1] = v;
			})
		})

		Object.keys(countryCircles).forEach(function (key) {
			var circle = countryCircles[key];

			var cx = 0;
			var cy = 0;
			var r = 0;

			vectors.forEach(function (vector, index) {
				var minMax = circle.minMax[index];
				var avg = (minMax[1] + minMax[0])/2;
				var dis =  minMax[1] - minMax[0];
				cx += vector[0]*avg;
				cy += vector[1]*avg;
				r = Math.max(r, dis);
			})

			circle.x += (cx/2 - circle.x)*0.2;
			circle.y += (cy/2 - circle.y)*0.2;
			circle.r += ( r/2 - circle.r)*0.2;

			drawCircle(circle);
		});

		function drawCircle(circle) {
			//return
			var x = circle.x*scale2 + x0;
			var y = circle.y*scale2 + y0;
			var r = circle.r*scale2*1.1 + 10;

			ctx2.beginPath();

			if (ctx2.ellipse) {
				ctx2.ellipse(x, y, r, r, 0, 0, Math.PI*2);
			} else {
				ctx2.arc(x, y, r, 0, Math.PI*2, false)
			}
			ctx2.fillStyle = 'rgba(255,255,255,1)';
			ctx2.fillStyle = 'rgba(255,127,0,0.1)';
			ctx2.fill();
		}
		
		packets.forEach(function (p) {

			var blue = 'rgba(124,176,255,0.5)';
			var red = 'rgba(230,0,0,0.5)';

			if (graph.queryString == 'eu') {
				ctx2.strokeStyle = p.inEu ? blue : red;
			} else {
				ctx2.strokeStyle = p.sameCountry ? blue : red;
			}
			ctx2.lineWidth = 1.5;

			ctx2.beginPath();
			ctx2.moveTo(p.x0*scale2 + x0, p.y0*scale2 + y0);
			ctx2.lineTo(p.x*scale2 + x0, p.y*scale2 + y0);
			ctx2.stroke();
		})

		
		ctx2.fillStyle = 'rgb(128,128,128)';
		clickObjects = [];
		graph.nodes.forEach(function (node) {
			var r = node.size * scale2 + 1;
			var x = node.x*scale2 + x0;
			var y = node.y*scale2 + y0;
			
			ctx2.beginPath();
			circle(x, y, r);
			ctx2.fill();

			clickObjects.push({
				x:x,
				y:y,
				r:r,
				node:node
			})
		})

		function circle(x,y,r) {
			if (ctx2.ellipse) return ctx2.ellipse(x, y, r, r, 0, 0, Math.PI*2);
			ctx2.arc(x, y, r, 0, Math.PI*2, false)
		}
	}

	function resize() {
		width  = wrapper.innerWidth();
		height = wrapper.innerHeight();
		canvas1.prop({width:width, height:height});
		canvas2.prop({width:width, height:height});
		updateScale();
		redraw1();
		redraw2();
	}

	function initMap() {
		Object.keys(mapData.countries).forEach(function (key) {
			var country = mapData.countries[key];
			mapData.all.unshift(country);
		})

		var scale = 1700;//1700;
		var dx = 1900;//1886.65;
		var dy = 1150;//891.55

		mapData.all.forEach(project);
		mapData.negative.forEach(project);

		Object.keys(mapData.countries).forEach(function (key) {
			var country = mapData.countries[key];
			var sumX = 0;
			var sumY = 0;
			var count = 0;
			for (var i = 1; i < country.length; i++) {
				var p1 = country[i-1];
				var p2 = country[i];
				var d = p1[0]*p2[1]-p1[1]*p2[0];
				sumX += (p1[0]+p2[0])*d/3;
				sumY += (p1[1]+p2[1])*d/3;
				count += d;
			}
			key = key.toUpperCase();
			mapData.countries[key] = { x:1000*sumX/count, y:1000*sumY/count };
		})

		mapData.countries.AT.x += 10;

		mapData.countries.BE.x += 10;

		mapData.countries.DE.x -= 10;

		mapData.countries.FI.x -= 10;
		mapData.countries.FI.y += 60;

		mapData.countries.GB.x += 10;
		mapData.countries.GB.y += 40;

		mapData.countries.GR.x -= 10;

		mapData.countries.IE.x += 10;

		mapData.countries.NO.x -= 30;
		mapData.countries.NO.y += 80;

		mapData.countries.SE.x -= 14;
		mapData.countries.SE.y += 100;

		mapData.countries.TR.x -= 100;
		mapData.countries.TR.y += 30;

		function project(polygon) {
			polygon.forEach(function (p) {
				p[0] = (p[0]-dx)/scale;
				p[1] = (p[1]-dy)/scale;
			})
		}
	}

	function sqr(v) {
		return v*v;
	}

	function showPopup(node) {
		popup.show();
		popup.css({
			left:Math.round(node.x+node.r+13),
			top:Math.round(node.y-10)
		});
		popup.find('span').text(node.node.provider);
	}

	function hidePopup() {
		popup.hide();
	}
}