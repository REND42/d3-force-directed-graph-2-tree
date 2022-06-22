import * as d3 from 'd3'

const data = d3.json('https://gist.githubusercontent.com/cbuie/948605a0ec520c81affdc87751184542/raw/cd25a2e67694a8865195d2b22214f17194a56a7d/trumpConnectionsThroughCindyYang')
const groupData = [
  { name: 'guest', mx: 1 },
  { name: 'event', mx: 1.5 },
  { name: 'organization', mx: 1.75 },
  { name: 'president', mx: 2 }
]
const getRadius = group => {
  let res;
  switch (group) {
    case 'guest':
      res = groupData[0].mx;
      break;
    case 'event':
      res = groupData[1].mx;
      break;
    case 'organization':
      res = groupData[2].mx;
      break;
    case 'president':
      res = groupData[3].mx;
      break;
  }
  return res * 17;
}
const drag = simulation => {
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}
const width = 928
const height = 700
const xStr = 0.2
const yStr = 2

data.then(res => {
  console.log(res)
  // const links = res.links.map(d => Object.create(d))
  // const nodes = res.nodes.map(d => Object.create(d))
  // const nodeRadius = 17

  // const zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', _ => {
  //   return g
  // })





  const links = res.links.map(d => Object.create(d));
  const nodes = res.nodes.map(d => Object.create(d));
  const nodeRadius = 17;

  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .on("zoom", _ => {  
      console.log(2333, g)
      return g.attr("transform", d3.event.transform) });


  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .distance(510)
        .id(d => d.id)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("collide", d3.forceCollide(d => getRadius(d.group)))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(xStr))
    .force("y", d3.forceY(height * 0.4).strength(yStr));

  const svg = d3.select('svg');
  // const svg = d3.select(DOM.svg(width, height));


  svg.call(zoom);

  const defs = svg.append('defs');
  defs
    .selectAll('clipPath')
    .data(groupData)
    .join('clipPath')
    .attr('id', d => d.name + '-clip')
    .append('circle')
    .attr('r', d => nodeRadius * d.mx);

  // group that gets the transfrom
  const g = svg.append("g");

  const linkG = g
    .append('g')
    .selectAll('g')
    .data(links)
    .join('g');

  const line = linkG
    .append('path')
    .attr('id', d => d.index)
    .attr('stroke-opacity', 0.6)
    .attr('stroke', '#333')
    .attr('stroke-width', '1.5');

  const lineText = linkG
    .append('text')
    .append('textPath')
    .attr('href', d => `#${d.index}`)
    .attr('startOffset', '50%')
    .append('tspan')
    .attr('class', 'link-arrow')
    .attr(
      "style",
      "text-anchor: middle; font: 24px sans-serif; user-select: none"
    )
    .attr('fill', '#333')
    .text(d =>
      (d.source.id == "Yujing Zhang") | (d.source.id == "Safari Night 2019")
        ? ''
        : '→'
    )
    .attr('dy', 8.75);

  const node = g
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("data-name", d => d.id)
    .attr("class", d => `img-group ${d.group}`)
    .attr("fill", "none")
    .call(drag(simulation));

  function trumpCheck(id) {
    return id == "Donald J. Trump" ? nodeRadius * 2 : nodeRadius;
  }

  const cir = node
    .append('circle')
    .attr('r', d => getRadius(d.group))
    .attr('stroke', '#333')
    .attr('stroke-width', 2)
    .attr('fill', '#999');

  const img = node
    .append('image')
    .attr(
      'xlink:href',
      "https://storage.needpix.com/rsynced_images/attribution-icon-2888829_1280.png"
    )
    .attr('clip-path', d => `url(#${d.group}-clip)`)
    .attr('width', d => getRadius(d.group) * 2)
    .attr('height', d => getRadius(d.group) * 2)
    .attr('x', d => getRadius(d.group) * -1)
    .attr('y', d => getRadius(d.group) * -1);

  tooltip
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden");

  node.on('touchmove mousemove', d => {
    tooltip.style("visibility", "visible");
    tooltip.text(d.tooltip);
    tooltip
      .style("top", `${d3.event.pageY - 10}px`)
      .style("left", `${d3.event.pageX + 10}px`);
  });

  linkG.on('touchmove mousemove', function(d) {
    tooltip.style('visibility', 'visible');
    tooltip.text(`${d.source.id} ${d.relationship} ${d.target.id}`);
    tooltip
      .style('top', `${d3.event.pageY - 10}px`)
      .style('left', `${d3.event.pageX + 10}px`);

    d3.select(this)
      .select('path')
      .style('stroke', hlColor)
      .style('stroke-opacity', 1)
      .style('stroke-width', '3');

    d3.selectAll(
      `g[data-name="${d.source.id}"] > circle, g[data-name="${d.target.id}"] > circle`
    )
      .style('stroke', hlColor)
      .style('stroke-width', '6');
  });

  node.on('touchend mouseleave', () => tooltip.style('visibility', 'hidden'));

  linkG.on('touchend mouseleave', function(d) {
    tooltip.style('visibility', 'hidden');

    d3
      .select(this)
      .select('path')
      .node().style = '';

    d3.selectAll(
      `g[data-name="${d.source.id}"] > circle, g[data-name="${d.target.id}"] > circle`
    )
      .style('stroke', '#333')
      .style('stroke-width', '2');
  });

  let pres = node.filter(d => d.group == "president").datum();
  let tVict = node.filter(d => d.id == 'Trump Victory').datum();
  let tOrg = node.filter(d => d.id == 'The Trump Organization').datum();

  simulation.on("tick", function() {
    pres.fy = height / 12;
    pres.fx = width / 2;

    tVict.fy = height / 6;
    tVict.fx = width / 2 + nodeRadius * 6;

    tOrg.fy = height / 6;
    tOrg.fx = width / 2 - nodeRadius * 6;

    line.attr(
      "d",
      d => `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`
    );
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  invalidation.then(() => simulation.stop());

})

