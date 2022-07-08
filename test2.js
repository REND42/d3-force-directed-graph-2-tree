import * as d3 from 'd3'
import data2 from './flare-2.json'
import data3 from './flare-3.json'

let current = 'data2'
const width = window.innerWidth
const height = window.innerHeight
let simulation = null
let linkEle = null
let nodeEle = null
let transform = null

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

const zoom = d3.zoom().scaleExtent([0.1, 8])
.on('zoom', (event) => {
  const g = d3.selectAll('g')
  g.attr("transform", event.transform)
  console.log('zoom e', event.transform)
  transform = event.transform
})

function create(data) {
  const root = d3.hierarchy(data)
  const links = root.links()
  const nodes = root.descendants()
  
  let isTree = false
  
  const svg = d3.select('svg')
  svg.attr('width', width).attr('height', height)
  svg.call(zoom)
  
  simulation = d3.forceSimulation()
    .force('link', linkForce)
    .force('charge', d3.forceManyBody().strength(-40))
    .force('center', d3.forceCenter(width/2, height/2))
  
  linkEle = svg.append('g')
    .attr('class', 'links')
    .attr('class', 'group')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke-width', 1)
    .attr('stroke', "rgba(50, 50, 50, 0.2)")
  
  nodeEle = svg.append('g')
    .attr('class', 'nodes')
    .attr('class', 'group')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', d => 1.8 * (d.height + 2))
    .attr('fill', 'red')
    .call(drag)
    .on('click', (d) => {
      console.log('click', d)
    })
  
  if (transform) {
    console.log('memo', transform)
    const group = d3.selectAll('.group')
    group.attr('transform', transform)
  }
  
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
}


create(data2)

document.getElementById('btn').addEventListener('click', () => {
  isTree = !isTree
  console.log('clicked', isTree)
  simulation.restart()
})

function update(data) {
  const root = d3.hierarchy(data)
  const links = root.links()
  const nodes = root.descendants()

  console.log(links, nodes)

  simulation.stop()

  const svg = d3.select('svg')
  svg.attr('width', width).attr('height', height)
  svg.call(zoom)

  // linkEle = d3.selectAll('.links')
  linkEle.exit().remove()
  linkEle = svg.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke-width', 1)
    .attr('stroke', "rgba(50, 50, 50, 0.2)")
  
  // nodeEle.exit().remove()
  nodeEle = svg.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(nodes, d => d.id)
    .enter().append('circle')
    .attr('r', d => 1.8 * (d.height + 2))
    .attr('fill', 'red')
    .call(drag)
    .on('click', (d) => {
      console.log('click', d)
    })
}

document.getElementById('update').addEventListener('click', () => {
  // if(current === 'data2') {
  //   current = 'data3'
  //   update(data3)
  // } else {
  //   current = 'data2'
  //   update(data2)
  // }
  d3.select('svg').selectAll('.group').remove()
  console.log('memory', transform)
  create(data3)
})
