var can;

$(function () {
	initData();

	var canvas = new Canvas();
	var graph;
	can = canvas;

	$('.country_button').click(function (e) {
		var country = $(this).attr('country');
		setView(country);
	})

	function setView(country) {
		$('.country_button').removeClass('active');
		$('.description').removeClass('active');
		$('#btn_'+country).addClass('active');
		$('#text_'+country).addClass('active');

		graph = generateGraph([country]);

		force.stop();
		force.nodes(graph.nodes).links(graph.links);
		force.start();
		canvas.setGraph(graph);

		switch (country) {
			case 'eu': canvas.setView({dx:0,dy:0,zoom:1}); break;
			case 'de': canvas.setView({dx:0.03,dy:-0.02,zoom:2}); break;
			case 'fr': canvas.setView({dx:0.15,dy:-0.12,zoom:2}); break;
			case 'ch': canvas.setView({dx:0.06,dy:-0.12,zoom:3}); break;
		}
	}

	var force = d3.layout.force()
		.linkDistance(20)
		.linkStrength(0.1)
		.chargeDistance(80)
		.charge(function (node) { return Math.pow(node.size, 1.5)*(-100) })
		.gravity(0)
		.on('tick', function () {
			var alpha = force.alpha();
			graph.nodes.forEach(function (node) {
				if (!mapData.countries[node.country]) {
					//console.log(node.country)
					return;
				}
				var country = mapData.countries[node.country];
				var dx = country.x - node.x;
				var dy = country.y - node.y;
				dx *= 2*alpha;
				dy *= 2*alpha;
				node.x = node.x + dx;
				node.y = node.y + dy;
				node.px = node.x;
				node.py = node.y;
			})
		})

	setView('eu');
})

function generateGraph(query) {
	var nodes = {};
	var edges = {};
	var links = [];
	var paths = [];
	var sum = 0;

	query.forEach(function (cc) {
		paths = paths.concat(data.views[cc]);
	})

	paths = paths.map(function (path) {
		var count = path[0];
		var newPath = [];
		sum += count;

		for (var i = 1; i < path.length; i++) {
			var id = path[i];

			if (!nodes[id]) {
				var asn = data.asns[id];
				nodes[id] = asn;
				if (!asn.x) {
					var c = mapData.countries[asn.country];
					asn.x = c.x + (Math.random()-0.5)*10;
					asn.y = c.y + (Math.random()-0.5)*10;
				}
				asn.count = 0;
			}

			nodes[id].count += count;

			newPath.push(nodes[id]);
			if (i > 1) addEdge(path[i-1], id, count);
		}

		return newPath;
	})

	sum /= paths.length;

	return {
		nodes: Object.keys(nodes).map(function (key) {
			nodes[key].size = Math.sqrt(nodes[key].count/sum)/10
			return nodes[key];
		}),
		edges: Object.keys(edges).map(function (key) { return edges[key] }),
		links: links,
		paths: paths,
		queryString: query.join(',')
	}

	function addEdge(id1, id2, s) {
		var key = id1+'_'+id2;
		if (!edges[key]) {
			var edge = {source:nodes[id1], target:nodes[id2], strength:0};
			edges[key] = edge;
			if (nodes[id1].country == nodes[id2].country) links.push(edge);
		}
		edges[key].strength += s;
	}
}


function initData() {
	var asns = {};
	data.asns.forEach(function (provider) {
		asns[provider.asn] = provider;
	})
	data.asns = asns;
}