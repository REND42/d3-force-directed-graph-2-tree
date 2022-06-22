import * as d3 from 'd3'
import data from './flare-2.json'

const root = d3.hierarchy(data)
const links = root.links()
const nodes = root.descendants()

console.log(root)
let isTree = false


const width = window.innerWidth
const height = window.innerHeight

const svg = d3.select('svg')
svg.attr('width', width).attr('height', height)

const linkForce = d3.forceLink()
  .id(d => d.id)
  .strength(d => 0.5)

const drag = d3.drag().on('start',  (event, node) => {
  if(!event.active) simulation.alphaTarget(0.7).restart()
  node.fx = node.x
  node.fy = node.y
}).on('drag', (event, node) => {
  if(!event.active) simulation.alphaTarget(0.7).restart()
  node.fx = event.x
  node.fy = event.y
}).on('end', (event, node) => {
  console.log('end', event, node)
  if(!event.active) {
    simulation.alphaTarget(0)
  }
  node.fx = null
  node.fy = null
})

const zoom = d3.zoom().scaleExtent([0, 8])
  .on('zoom', (event) => {
    const g = d3.selectAll('g')
    g.attr("transform", event.transform)
  })
  
svg.call(zoom)

const simulation = d3.forceSimulation()
  .force('link', linkForce)
  .force('charge', d3.forceManyBody().strength(-40))
  .force('center', d3.forceCenter(width/2, height/2))

const linkEle = svg.append('g')
  .attr('class', 'links')
  .selectAll('line')
  .data(links)
  .enter().append('line')
  .attr('stroke-width', 1)
  .attr('stroke', "rgba(50, 50, 50, 0.2)")

const nodeEle = svg.append('g')
  .attr('class', 'nodes')
  .selectAll('circle')
  .data(nodes)
  .enter().append('circle')
  .attr('r', d => 1.8 * (d.height + 2))
  .attr('fill', 'red')
  .call(drag)
  .on('click', (d) => {
    console.log('click', d)
  })



simulation.nodes(nodes).on('tick', () => {
  if(isTree) {
    nodeEle
    .attr('cx', d => {
      return d.x
    })
    .attr('cy', d => {
      return 120 * d.depth + 40
    })

  linkEle
    .attr('x1', d => d.source.x)
    .attr('x2', d => d.target.x)
    .attr('y1', d => {
      return 120 * d.source.depth + 40
    })
    .attr('y2', d => {
      return 120 * d.target.depth + 40
    })
  } else {
    nodeEle
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)

    linkEle
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
    }

})

simulation.force('link').links(links)

document.getElementById('btn').addEventListener('click', () => {
  isTree = !isTree
  console.log('clicked', isTree)
  simulation.restart()
})

