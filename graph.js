import './style.css'
import * as d3 from 'd3'

const graph = {
  nodes: [
    { name: 'Alice' },
    { name: 'Bob' },
    { name: 'Chen' },
    { name: 'Dang' },
    { name: 'Ethan' },
    { name: 'Frank' },
    { name: 'Hames' }
  ],
  links: [
    { source: 'Alice', target: 'Bob' },
    { source: 'Chen', target: 'Bob' },
    { source: 'Dang', target: 'Chen' },
    { source: 'Hames', target: 'Frank' },
    { source: 'Hames', target: 'Ethan' },
    { source: 'Alice', target: 'Dang' },
  ]
}

const svg = d3.select('svg')
const width = svg.attr('width')
const height = svg.attr('height')

const simulation = d3.forceSimulation(graph.nodes).force(
  'link',
  d3.forceLink().id((d) => d.name).links(graph.links)
).force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .on('tick', () => ticked() )

const link = svg.append('g').selectAll('line')
  .data(graph.links).enter().append('line').attr('stroke-width', 3)
  .style('stroke', 'pink')

const node = svg.append('g').selectAll('circle').data(graph.nodes)
  .enter().append('circle').attr('r', 5).attr('fill', 'orange')
  .attr('stroke', 'yellow')


function ticked() {
  link.attr('x1', d => d.source.x)
  .attr('y1', d => d.source.y)
  .attr('x2', d => d.target.x)
  .attr('y2', d => d.target.y)

  node.attr('cx', d => d.x)
  .attr('cy', d => d.y)
}