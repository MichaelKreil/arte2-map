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
		for (var i = 0; i < packetCount; i++) {
			var index = Math.floor(graph.paths.length*i/(packetCount+1));
			var path = graph.paths[index];
			packets.push({
				path: path,
				offset: Math.random()*(path.length-1)
			})
		}
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
			packet.offset += 0.03;
			if (packet.offset > packet.path.length-1) packet.offset -= packet.path.length-1;
		})
	}, 40);

	return me;

	function updateScale() {
		scale = Math.max(width, height)*view.zoom;
		x0 = view.dx*scale + width/2;
		y0 = view.dy*scale + height/2;
	}

	function redraw1() {
		ctx1.fillStyle = '#f0eeec';
		ctx1.fillRect(0, 0, width, height);

		ctx1.strokeStyle = '#f0eeec';
		ctx1.lineWidth = 2;

		ctx1.beginPath();
		mapData.all.forEach(draw);
		ctx1.fillStyle = '#fff';
		ctx1.fill();
		ctx1.stroke();

		ctx1.beginPath();
		mapData.negative.forEach(draw);
		ctx1.fillStyle = '#f0eeec';
		ctx1.fill();
		ctx1.stroke();

		function draw(poly) {
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

		ctx2.strokeStyle = 'rgba(170,170,170,0.1)';
		
		/*
		graph.edges.forEach(function (edge) {
			ctx2.beginPath();
			ctx2.lineWidth = edge.strength*0.1;
			ctx2.moveTo(edge.source.x*scale2 + x0, edge.source.y*scale2 + y0);
			ctx2.lineTo(edge.target.x*scale2 + x0, edge.target.y*scale2 + y0);
			ctx2.stroke();
		})
		*/
		
		
		packets.forEach(function (packet) {
			var index = Math.floor(packet.offset);
			var a = packet.offset - index;
			var p1 = packet.path[index];
			var p2 = packet.path[index+1];

			if (!p1 || !p2) debugger;

			var x = p1.x*(1-a) + a*p2.x;
			var y = p1.y*(1-a) + a*p2.y;

			if (graph.queryString == 'eu') {
				ctx2.fillStyle = 'rgba(0,0,0,0.5)';
			} else {
				if (p1.country == p2.country) {
					ctx2.fillStyle = 'rgba(0,170,0,0.5)';
				} else {
					ctx2.fillStyle = 'rgba(200,0,0,0.5)';
				}
			}
			var r = 0.7;

			ctx2.beginPath();
			circle(x*scale2 + x0, y*scale2 + y0, r);
			ctx2.fill();
		})

		
		ctx2.fillStyle = '#000';
		clickObjects = [];
		graph.nodes.forEach(function (node) {
			var r = node.size * scale2 + 1;
			var x = node.x*scale2 + x0;
			var y = node.y*scale2 + y0
			
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