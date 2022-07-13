import * as d3 from 'd3'
import _, { forEach } from 'lodash'
import nodes from './data/test_nodes.json'
import links from './data/test_links.json'

const width = window.innerWidth
const height = window.innerHeight

const cloneNodes = _.cloneDeep(nodes)
const cloneLinks = _.cloneDeep(links)

const groupList = _(cloneNodes).map('label').uniq().value()
const expand = {  }
let groups = {}

let simulation = null
let linkEle = null
let nodeEle = null
let hullEle = null
let isTree = false

const linkForce = d3.forceLink()
  .id(d => d.id)
  .strength(d => 0.1)

const drag = d3.drag().on('start',  (event, node) => {
    if(!event.active) simulation.alphaTarget(0.2).restart()
    node.fx = node.x
    node.fy = node.y
  }).on('drag', (event, node) => {
    if(!event.active) simulation.alphaTarget(0.2).restart()
    node.fx = event.x
    node.fy = event.y
  }).on('end', (event, node) => {
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


function create(nodes, links) {
  let groupKeys = Object.keys(groups)
  console.log('init', groups, groupKeys)

  const svg = d3.select('svg').call(zoom)
  svg.attr('width', width).attr('height', height)

  svg.attr('opacity', 1e-6).transition().duration(1000).attr('opacity', 1)

  simulation = d3.forceSimulation()
    .force('link', linkForce)
    .force('collide', d3.forceCollide(40).iterations(1))
    .force('charge', d3.forceManyBody().strength(-80))
    .force('center', d3.forceCenter(width/2, height/2))

  hullEle = svg.append('g')
    .attr('class', 'group hulls')
    .selectAll('path')
    .data(groupKeys)
    .enter()
    .append('path')
    .style('stroke', d => {
      return color(groupList.findIndex(g => d === g))
    })
    .style('fill', d => {
      return color(groupList.findIndex(g => d === g))
    })
    .style('stroke-width', 30)
    .style('stroke-opacity', 0.5)
    .style('fill-opacity', 0)
    // .attr('stroke-linejoin', 'round')
    .on('click', (e, d) => {
      console.log('hull clicked', d)
      // collapseDataByOneLabel(nodes, links, d)
      expand[d] = false
      update()
    })

  linkEle = svg.append('g')
    .attr('class', 'group links')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke-width', 1)
    .attr('stroke', "rgba(50, 50, 50, 0.2)")
    .on('click', () => { console.log('link clicked') })
  
  nodeEle = svg.append('g')
    .attr('class', 'group nodes')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', d => 10)
    .attr('fill', d => {
      return color(groupList.findIndex(g => d.group === g))
    })
    .call(drag)
    .on('click', (e, d) => {
      console.log('node clicked', d.group, expand)
      expand[d.group] = !expand[d.group]
      update()
    })


  simulation.nodes(nodes).on('tick', () => {
    if(isTree) {
      nodeEle
        .attr('cx', d => {
          return d.x
        })
        .attr('cy', d => {
          let level = groupList.findIndex(gn => gn === d.group)
          return 120 * level + 40
        })
  
      linkEle
        .attr('x1', d => d.source.x)
        .attr('x2', d => d.target.x)
        .attr('y1', d => {
          let level = groupList.findIndex(gn => gn === d.source.group)
          return 120 * level + 40
        })
        .attr('y2', d => {
          let level = groupList.findIndex(gn => gn === d.target.group)
          return 120 * level + 40
        })

      hullEle.attr('d', g => {
        let min = 10000, max = 0
        let hullPoints = groups[g].map(n => {
          let level = groupList.findIndex(gn => gn === n.label)
          if(n.x < min) {
            min = n.x
          }
          if(n.x > max) {
            max = n.x
          }
          return [n.x, 120 * level + 40]
        })

        hullPoints.push([min-20, hullPoints[0][1]], [max+20, hullPoints[0][1]])
        const hullData = d3.polygonHull(hullPoints)
        if(hullData === null) {
          return
        }
        hullData.push(hullData[0])
        return d3.line().curve(d3.curveCardinal)(hullData)
        // return d3.area().curve(d3.curveLinearClosed)(hullData)
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

      hullEle.attr('d', g => {
        let hullPoints = groups[g].map(n => {
          return [n.x, n.y]
        })
        const hullData = d3.polygonHull(hullPoints)
        if(hullData === null) {
          return
        }
        hullData.push(hullData[0])
        return d3.line().curve(d3.curveCardinalClosed.tension(0.8))(hullData)
      })
    }
  })

  simulation.force('link').links(links)
}

function color(d) {
  return d3.schemePaired[d]
}

function update() {
  d3.select('svg').selectAll('.group').remove()
  let { nodes: new_nodes, links: new_links } =  groupAll({nodes: cloneNodes, links: cloneLinks})
  create(new_nodes, new_links)
}

function groupAll(originData) {
  const cloneOriginNodes = _.cloneDeep(originData.nodes)
  const cloneOriginLinks = _.cloneDeep(originData.links)

  let nodes = [], links = []
  const getGroup = (node) => { return node.label}
  groups = {}

  for(let i=0; i<cloneOriginNodes.length; i++) {
    let n = cloneOriginNodes[i], group = getGroup(n)
    n.group = group
    let groupNode = {
      group: group,
      id: `g_${i}`,
      node_list: []
    }
    if(expand[group]) {
      nodes.push(n)
      if(!groups[group]) {
        groups[group] = [n]
      } else {
        groups[group].push(n)
      }
    } else {
      let existGroup = nodes.find(n => n.group === group)
      if(!existGroup) {
        groupNode.node_list.push(n.id)
        nodes.push(groupNode)
      } else {
        existGroup.node_list.push(n.id)
      }
    }
  }

  for(let k=0; k<cloneOriginLinks.length; k++) {
    let l = cloneOriginLinks[k]
    let targetNode = cloneOriginNodes.find(n => n.id === l.target)
    let sourceNode = cloneOriginNodes.find(n => n.id === l.source)
    if(expand[targetNode.group]) {
      if(expand[sourceNode.group]) {
        links.push(l)
      } else {
        let groupNode = nodes.find(n => n.group === sourceNode.group)
        let groupLink = {
          id: `g_${l.id}`,
          target: targetNode.id,
          source: groupNode.id,
          type: l.type
        }
        links.push(groupLink)
      }
    } else if(expand[sourceNode.group]) {
      if(expand[targetNode.group]) {
        links.push(l)
      } else {
        let groupNode = nodes.find(n => n.group === targetNode.group)
        let groupLink = {
          id: `g_${l.id}`,
          target: groupNode.id,
          source: sourceNode.id,
          type: l.type
        }
        links.push(groupLink)
      }
    } else {
      let targetGroupNode = nodes.find(node => node.node_list && node.node_list.includes(l.target))
      let sourceGroupNode = nodes.find(node => node.node_list && node.node_list.includes(l.source))

      if(targetGroupNode && sourceGroupNode) {
        let groupLink = {
          id: `g_${l.id}`,
          target: targetGroupNode.id,
          source: sourceGroupNode.id,
          type: l.type
        }
        // fixed
        if(!links.find(link => link.target === groupLink.target && link.source === groupLink.source )) {
          links.push(groupLink)
        }
      }
    }
  }
  return {nodes, links}
}

let { nodes: new_nodes, links: new_links } =  groupAll({nodes, links})
create(new_nodes, new_links)

document.getElementById('btn').addEventListener('click', () => {
  console.log('switch')
  isTree = !isTree
  simulation.restart()
})