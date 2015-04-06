$(function () {
	initData();

	var canvas = new Canvas();
	var graph = generateGraph(['ch']);
	canvas.setGraph(graph);

	var force = d3.layout.force()
		.nodes(graph.nodes)
		.links(graph.links)
		.linkDistance(10)
		.linkStrength(0.1)
		.charge(-30)
		.gravity(0)
		.start()
		.on('tick', function () {
			force.alpha(0.1);
			canvas.redraw();
			graph.nodes.forEach(function (node) {
				if (!mapData.countries[node.country]) {
					//console.log(node.country)
					return;
				}
				var country = mapData.countries[node.country];
				var dx = country.x - node.x;
				var dy = country.y - node.y;
				var r = Math.sqrt(dx*dx + dy*dy);
				if (r > 1.0) r = 1.0;
				dx *= 0.2;
				dy *= 0.2;
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
		var newPath = [path[0]];

		for (var i = 1; i < path.length; i++) {
			var id = path[i];

			if (!nodes[id]) {
				var asn = data.asns[id];
				nodes[id] = {
					country:asn.country,
					x:Math.random(),
					y:Math.random()
				}
			}

			newPath.push(nodes[id]);
			if (i > 1) addEdge(path[i-1], id, path[0]);
		}

		return newPath;
	})

	return {
		nodes: Object.keys(nodes).map(function (key) { return nodes[key] }),
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
		edges[key].strength += s/10;
	}
}


function initData() {
	var asns = {};
	data.asns.forEach(function (provider) {
		asns[provider.asn] = provider;
	})
	data.asns = asns;
}