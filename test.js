// import './style.css'
import * as d3 from 'd3'
import data2 from './flare-2.json'
import data3 from './flare-3.json'


const root = d3.hierarchy(data3)
const links = root.links()
const nodes = root.descendants()

const offset = -50
const svg = d3.select('svg')
const width = svg.attr('width')
const height = svg.attr('height')
const color = (d) => {
  const scale = d3.scaleOrdinal(d3.schemeCategory10)
  return d => scale(d.group)
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
    }
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
}

console.log(links, nodes)

root.fixed = true
root.fx = 0
root.fy = height / 2 + offset

const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links).id(d => d.id).distance(0).strength(1))
  .force('charge', d3.forceManyBody().strength(-50))
  .force('center', d3.forceCenter(width / 2, height / 2))

  .force('x', d3.forceX())
  .force('y', d3.forceY())

// const svg = d3.create('svg')
//   .attr('viewBox', [0, 0, width, height])


const link = svg.append('g').attr('stroke', '#999')
  .attr('stroke-opacity', 0.6)
  .selectAll('line')
  .data(links)
  .join('line')
  .attr('stroke-width', d => Math.sqrt(d.value))

const node = svg.append("g")
  .attr("stroke", "#fff")
  .attr("stroke-width", 1.5)
  .selectAll("circle")
  .data(nodes)
  .join("circle")
  .attr("r", 9)
  .attr("fill", color)
  .call(drag(simulation))
  // .on("click", clickNode)

simulation.on('tick', () => {
  link
  .attr("x1", d => d.source.x)
  .attr("y1", d => d.source.y)
  .attr("x2", d => d.target.x)
  .attr("y2", d => d.target.y)

  node
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
})