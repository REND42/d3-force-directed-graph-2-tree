import * as d3 from 'd3'
import _ from 'lodash'
import data from './data/miserables.json'
import nodes from './data/ndoes.json'
import links from './data/links.json'

const width = window.innerWidth
const height = window.innerHeight

let simulation = null
let linkEle = null
let nodeEle = null
let hullEle = null
let isTree = false

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
  })

// const { nodes, links } = data
// console.log(2333, nodes, links)

function create() {
  const svg = d3.select('svg').call(zoom)
  svg.attr('width', width).attr('height', height)

  svg.attr('opacity', 1e-6).transition().duration(1000).attr('opacity', 1)

  simulation = d3.forceSimulation()
    .force('link', linkForce)
    .force('charge', d3.forceManyBody().strength(-40))
    .force('center', d3.forceCenter(width/2, height/2))

  linkEle = svg.append('g')
    .attr('class', 'group links')
    // .attr('class', 'group')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke-width', 1)
    .attr('stroke', "rgba(50, 50, 50, 0.2)")
  
  nodeEle = svg.append('g')
    .attr('class', 'group nodes')
    // .attr('class', 'group')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', d => 3.6)
    .attr('fill', d => {
      console.log(d)
      return 'red'
    })
    .call(drag)
    .on('click', (d) => {
      console.log('click', d)
    })

    const groups = _(nodes).map('label').uniq().sort().value()
    _.each(nodes, (n, i) => {
      n.group = nodes[i].label
    })
    const nodeGroups = _.groupBy(nodes, 'group')
    console.log('groups', nodeGroups)

    // hullEle = svg.append('path')
    //   .attr('class', 'group hull')

    hullEle = svg.append('g')
      .selectAll('path')
      .data(groups)
      .enter()
      .append('path')
      .style('stroke', 'green')
      .style('fill', 'yellow')
      .style('stroke-width', 15)
      .style('stroke-opacity', 0.3)
      .style('fill-opacity', 0.3)
      .attr('stroke-linejoin', 'round')
    


    simulation.nodes(nodes).on('tick', () => {
      // if(isTree) {
      //   nodeEle
      //   .attr('cx', d => {
      //     return d.x
      //   })
      //   .attr('cy', d => {
      //     return 120 * d.group + 40
      //   })
    
      // linkEle
      //   .attr('x1', d => d.source.x)
      //   .attr('x2', d => d.target.x)
      //   .attr('y1', d => {
      //     return 120 * d.source.depth + 40
      //   })
      //   .attr('y2', d => {
      //     return 120 * d.target.depth + 40
      //   })
      // } else {
        nodeEle
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
    
        linkEle
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)
        // }

        hullEle.attr('d', g => {
          let hullPoints = nodeGroups[g].map(n => {
            return [n.x, n.y]
          })
          const hullData = d3.polygonHull(hullPoints)
          if(hullData === null) {
            return
          }
          hullData.push(hullData[0])
          return d3.line().curve(d3.curveCardinalClosed.tension(0.85))(hullData)
        })
    })
  
    simulation.force('link').links(links)


}

create()