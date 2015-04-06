function Canvas () {
	var me = {};
	var wrapper = $('#map');
	var canvas1 = $('#canvas1');
	var canvas2 = $('#canvas2');
	var ctx1 = canvas1.get(0).getContext('2d');
	var ctx2 = canvas2.get(0).getContext('2d');
	var width, height, scale, x0, y0, graph;
	var ccount;

	canvas2.on('mousedown', function (e) {
		var x = e.offsetX;
		var y = e.offsetY;
		console.log(e);
		var img = ctx1.getImageData(x,y,1,1);
		if ((img.data[0] == img.data[1]) && (img.data[0] == img.data[2])) {
			var result = [img.data[0]+3];
			alert(result.join(','));
		}
	})

	initMap();
	resize();

	$(window).resize(resize);

	me.setGraph = function (_graph) {
		graph = _graph;
		redraw2();
	}

	me.redraw = redraw2;

	return me;

	function updateScale() {
		scale = Math.max(width, height);
		x0 = width/2;
		y0 = height/2;
	}

	function redraw1() {
		ctx1.fillStyle = '#f0eeec';
		ctx1.fillRect(0,0,width,height);

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

	function redraw2() {
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

		
		ctx2.fillStyle = '#000';
		graph.nodes.forEach(function (node) {
			ctx2.beginPath();
			var r = node.size * scale2;
			ctx2.ellipse(node.x*scale2 + x0, node.y*scale2 + y0, r, r, 0, 0, Math.PI*2);
			ctx2.fill();
		})

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
		ccount = Object.keys(mapData.countries).length;
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
}