$(function () {
	initData();

	var canvas = new Canvas();
	var graph = generateGraph(['eu']);
	canvas.setGraph(graph);

	$('.country_button').click(function (e) {
		var country = $(this).attr('country');
		$('.country_button').removeClass('active');
		$('.description').removeClass('active');
		$('#btn_'+country).addClass('active');
		$('#text_'+country).addClass('active');

		graph = generateGraph([country]);

		force.stop();
		force.nodes(graph.nodes).links(graph.links);
		force.start();
		canvas.setGraph(graph);
	})

	var force = d3.layout.force()
		.nodes(graph.nodes)
		.links(graph.links)
		.linkDistance(10)
		.linkStrength(0.1)
		.chargeDistance(80)
		.charge(function (node) { return node.size*node.size*(-8) })
		.gravity(0)
		.start()
		.on('tick', function () {
			var alpha = force.alpha();
			canvas.redraw();
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
})

function generateGraph(query) {
	var nodes = {};
	var edges = {};
	var links = [];
	var paths = [];

	query.forEach(function (cc) {
		paths = paths.concat(data.views[cc]);
	})

	paths = paths.map(function (path) {
		var count = path[0];
		var newPath = [count];

		for (var i = 1; i < path.length; i++) {
			var id = path[i];

			if (!nodes[id]) {
				var asn = data.asns[id];
				nodes[id] = asn;
				if (!asn.x) {
					asn.x = Math.random();
					asn.y = Math.random();
				}
				asn.count = 0;
			}

			nodes[id].count += count;

			newPath.push(nodes[id]);
			if (i > 1) addEdge(path[i-1], id, count);
		}

		return newPath;
	})

	return {
		nodes: Object.keys(nodes).map(function (key) {
			nodes[key].size = Math.sqrt(nodes[key].count)*0.3
			return nodes[key];
		}),
		edges: Object.keys(edges).map(function (key) { return edges[key] }),
		links: links,
		paths: paths
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