function Canvas () {
	var me = {};
	var wrapper = $('#map');
	var canvas1 = $('#canvas1');
	var canvas2 = $('#canvas2');
	var ctx1 = canvas1.get(0).getContext('2d');
	var ctx2 = canvas2.get(0).getContext('2d');
	var width, height, scale, x0, y0;

	initMap();
	resize();

	$(window).resize(resize);

	return me;

	function updateScale() {
		scale = Math.max(width, height);
		x0 = width/2;
		y0 = height/2;
	}

	function redraw1() {
		ctx1.fillStyle = '#f0eeec';
		ctx1.fillRect(0,0,width,height);

		ctx1.beginPath();
		mapData.all.forEach(function (poly) {
			for (var i = 0; i < poly.length; i++) {
				var x = poly[i][0]*scale + x0;
				var y = poly[i][1]*scale + y0;
				if (i == 0) {
					ctx1.moveTo(x,y);
				} else {
					ctx1.lineTo(x,y);
				}
			}
		})
		ctx1.fillStyle = '#fff';
		ctx1.fill();
		ctx1.strokeStyle = '#f0eeec';
		ctx1.lineWidth = 2;
		ctx1.stroke();
	}

	function redraw2() {

	}

	function resize() {
		width = wrapper.innerWidth();
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
			mapData.all.push(country);
		})

		var scale = 1100;//1700;
		var dx = 1800;//1886.65;
		var dy = 1200;//891.55
		mapData.all.forEach(function (polygon) {
			polygon.forEach(function (p) {
				p[0] = (p[0]-dx)/scale;
				p[1] = (p[1]-dy)/scale;
			})
		})
	}
}