(function() {

var svg = d3.select("svg"),
    width = +$('svg')[0].width.baseVal.value,
    height = +$('svg')[0].height.baseVal.value;

var color = d3.scaleOrdinal(d3.schemeCategory10).domain("1", "2", "3", "4");

color(1);
color(2);
color(3);
color(4);


d3.json("/crandom2.json").then(function(graph) {

var label = {
    'nodes': [],
    'links': []
};

graph.nodes.forEach(function(d, i) {
    console.log('d:' + d.id, ' + i:' + i);
    label.nodes.push({node: d});
    label.nodes.push({node: d});
    label.links.push({
        source: i * 2,
        target: i * 2 + 1
    });
});

var labelLayout = d3.forceSimulation(label.nodes)
    .force("charge", d3.forceManyBody().strength(-50))
    .force("link", d3.forceLink(label.links).distance(0).strength(2));

var graphLayout = d3.forceSimulation(graph.nodes)
    .force("charge", d3.forceManyBody().strength(-3000))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(1))
    .force("y", d3.forceY(height / 2).strength(1))
    .force("link", d3.forceLink(graph.links).id(function(d) {return d.id; }).distance(50).strength(1))
    .on("tick", ticked);

var adjlist = [];

graph.links.forEach(function(d) {
    adjlist[d.source.index + "-" + d.target.index] = true;
    adjlist[d.target.index + "-" + d.source.index] = true;
});

function neigh(a, b) {
    return a == b || adjlist[a + "-" + b];
}


//var svg = d3.select("#viz").attr("width", width).attr("height", height);
var container = svg.append("g");

svg.call(
    d3.zoom()
        .scaleExtent([.1, 4])
        .on("zoom", function() { container.attr("transform", d3.event.transform); })
);

var link = container.append("g").attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter()
    .append("line")
    .attr("stroke", function(d) { return color(d.group); })
    .attr("stroke-width", function (d) { return d.width+"px"});

var node = container.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("circle")
    .attr("r", function(d) { return d.value; })
    .attr("fill", function(d) { return color(d.group); })

node.on("mouseover", focus).on("mouseout", unfocus).on("click", clicked).on("dblclick", twoclick);

node.call(
    d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
);

var labelNode = container.append("g").attr("class", "labelNodes")
    .selectAll("text")
    .data(label.nodes)
    .enter()
    .append("text")
    .text(function(d, i) { return i % 2 == 0 ? "" : d.node.id; })
    .style("fill", function(d) { return color(d.node.group); })
    .style("font-family", "Arial")
    .style("font-size", 10)
    .style("pointer-events", "none"); // to prevent mouseover/drag capture

/*
var labelLink = container.append("g").attr("class", "labelLinks")
    .selectAll("text")
    .data(graph.links)
    .enter()
    .append("text")
    .text(function(d) { return "0x"+d.value; })
    .style("fill", "#a00")
    .style("font-family", "Arial")
    .style("font-size", 10)
    .style("pointer-events", "none");
*/

  // Append text to Link edges
/*
var linkText = container.selectAll(".gLink")
        .data(force.links())
          .append("text")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("x", function(d) {
            if (d.target.x > d.source.x) { return (d.source.x + (d.target.x - d.source.x)/2); }
            else { return (d.target.x + (d.source.x - d.target.x)/2); }
        })
            .attr("y", function(d) {
            if (d.target.y > d.source.y) { return (d.source.y + (d.target.y - d.source.y)/2); }
            else { return (d.target.y + (d.source.y - d.target.y)/2); }
        })
        .attr("fill", "Black")
            .style("font", "normal 12px Arial")
            .attr("dy", ".35em")
            .text(function(d) { return d.linkName; });
*/

node.on("mouseover", focus).on("mouseout", unfocus);

function ticked() {

    node.call(updateNode);
    link.call(updateLink);

    labelLayout.alphaTarget(0.3).restart();
    labelNode.each(function(d, i) {
        if(i % 2 == 0) {
            d.x = d.node.x;
            d.y = d.node.y;
        } else {
            var b = this.getBBox();

            var diffX = d.x - d.node.x;
            var diffY = d.y - d.node.y;

            var dist = Math.sqrt(diffX * diffX + diffY * diffY);

            var shiftX = b.width * (diffX - dist) / (dist * 2);
            shiftX = Math.max(-b.width, Math.min(0, shiftX));
            var shiftY = 16;
            this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
        }
    });
    labelNode.call(updateNode);


}

function fixna(x) {
    if (isFinite(x)) return x;
    return 0;
}

function twoclick(d) {
    document.location = '/cluster/'+d.id;
}

var first_id = 'x';
var second_id = 'x';

function clicked(d) {

    if (first_id == 'x') {
        first_id = d.id;
    } else if (second_id == 'x') {
        second_id = d.id;
    } else {
        first_id = d.id;
        second_id = 'x';
    }
    console.log('First: ' + first_id);
    console.log('Second: ' + second_id);

    $('#highlight').children(0)
        .attr('href', '/id/'+first_id)
        .text(first_id!='x' ? first_id : '');

    // Update iframe and table
    $('#compare-frame').attr('src', '/compare-mid/'+first_id+'/'+second_id)
    $('#compare-td').children(0)
        .attr('href', '/id/'+second_id)
        .text(second_id!='x' ? second_id : '');

    // Color the clicked node green, and the other one ... orange?
    node.attr("fill", function(d2) { return d2.id==second_id ? color(3) : d2.id==first_id ? color(4) : color(d2.group); });
}

function focus(d) {
    var index = d3.select(d3.event.target).datum().index;
    node.style("opacity", function(o) {
        return neigh(index, o.index) ? 1 : 0.1;
    });
    labelNode.attr("display", function(o) {
      return neigh(index, o.node.index) ? "block": "none";
    });
    link.style("opacity", function(o) {
        return o.source.index == index || o.target.index == index ? 1 : 0.1;
    });
}

function focusLink(l) {
    var index = d3.select(d3.event.target).datum().index;

}

function unfocus() {
   labelNode.attr("display", "block");
   node.style("opacity", 1);
   link.style("opacity", 1);
}

function updateLink(link) {
    link.attr("x1", function(d) { return fixna(d.source.x); })
        .attr("y1", function(d) { return fixna(d.source.y); })
        .attr("x2", function(d) { return fixna(d.target.x); })
        .attr("y2", function(d) { return fixna(d.target.y); });
}

function updateNode(node) {
    node.attr("transform", function(d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
    });
}

function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) graphLayout.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

}); // d3.json

})();
