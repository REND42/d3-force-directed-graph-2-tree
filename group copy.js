import * as d3 from 'd3'
import _ from 'lodash'
import data from './data/miserables.json'
import nodes from './data/ndoes.json'
import links from './data/links.json'

const width = window.innerWidth
const height = window.innerHeight

const cloneNodes = _.cloneDeep(nodes)
const cloneLinks = _.cloneDeep(links)

const groupList = _(cloneNodes).map('label').uniq().value()

console.log('clone', cloneNodes, cloneLinks, groupList)

let simulation = null
let linkEle = null
let nodeEle = null
let hullEle = null
let isTree = false

// const groups = _(cloneNodes).map('label').uniq().sort().value()
// _.each(cloneNodes, (n, i) => {
//   n.group = cloneNodes[i].label
// })
// const nodeGroups = _.groupBy(cloneNodes, 'group')
// const groupList = Object.keys(nodeGroups)

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

function create(nodes, links) {
  const groups = _(nodes).map('label').uniq().sort().value()
  _.each(nodes, (n, i) => {
    n.group = nodes[i].label
  })
  const nodeGroups = _.groupBy(nodes, 'group')
  // const groupList = Object.keys(nodeGroups)

  const svg = d3.select('svg').call(zoom)
  svg.attr('width', width).attr('height', height)

  svg.attr('opacity', 1e-6).transition().duration(1000).attr('opacity', 1)

  simulation = d3.forceSimulation()
    .force('link', linkForce)
    .force('charge', d3.forceManyBody().strength(-40))
    .force('center', d3.forceCenter(width/2, height/2))

  console.log('groups', nodeGroups, groupList)
  hullEle = svg.append('g')
    .selectAll('path')
    .data(groups)
    .enter()
    .append('path')
    .style('stroke', d => {
      return color(groupList.findIndex(g => d === g))
    })
    .style('fill', 'red')
    .style('stroke-width', 80)
    .style('stroke-opacity', 0.5)
    .style('fill-opacity', 0)
    .attr('stroke-linejoin', 'round')
    .on('click', (e, d) => {
      groupDataByOneLabel(d)
      console.log('hull clicked', d, groupDataByOneLabel(d))
    })

  linkEle = svg.append('g')
    .attr('class', 'group links')
    // .attr('class', 'group')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke-width', 1)
    .attr('stroke', "rgba(50, 50, 50, 0.2)")
    .on('click', () => { console.log('link clicked') })
  
  nodeEle = svg.append('g')
    .attr('class', 'group nodes')
    // .attr('class', 'group')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', d => 10)
    .attr('fill', d => {
      return color(groupList.findIndex(g => d.label === g))
    })
    .call(drag)
    .on('click', (e, d) => {
      console.log('node clicked', d)
      if(d.type === 'group') {
        console.log('collapse it')
        collpaseDataByOneLabel(nodes, links, d.label)
      }
    })


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

function color(d) {
  return d3.schemePaired[d]
}

function update(nodes, links) {
  d3.select('svg').selectAll('.group').remove()
  create(nodes, links)
}

function collpaseDataByOneLabel(nodes, links, label) {
  // console.log(9999999, nodes, links, label)
  let fftargetLink = links.filter(l => l.target.label === label)
  let ffsourceLink = links.filter(l => l.source.label === label)

  console.log('zzzzzzz', fftargetLink, ffsourceLink)

  const idxNode = nodes.find(node => node.label === label)
  const foundNodes = cloneNodes.filter(n => n.label === label)
  const foundNodeIds = foundNodes.map(n => n.id)
  // console.log(44555, nodes, links, label, idxNode)

  // const foundLinks = cloneLinks.filter(link => {
  //   const tnode = cloneNodes.find((n) => n.id === link.target)
  //   const snode = cloneNodes.find((n) => n.id === link.source)
  //   console.log(555, tnode, snode, label)
  //   if(tnode && snode) {
  //     let tfnode = nodes.find(node => tnode.label === node.label)
  //     console.log(444, tfnode)
  //     link.source = tfnode.id
  //     let sfnode = nodes.find(node => snode.label === node.label)
  //     link.target = sfnode.id
  //   }
  //   return idxNode.idList.includes(link.target) || idxNode.idList.includes(link.source)
  // })

  const foundLinks = []
  console.log('fff', ffsourceLink, foundNodes)
  cloneLinks.forEach(link => {
    // if(ffsourceLink.idList.includes(link.source)) {
    //   console.log('xxx', link.source)
    // }

    ffsourceLink.forEach(sl => {
      // console.log(8888, sl)
      if(sl.source.idList.includes(link.source)) {
        // link.target = 
        console.log('xxx', link)
      }
    })




    

    
  })

  let newNodes = [...nodes, ...foundNodes]
  let newLinks = [...links, ...foundLinks]
  console.log('found', foundNodes, foundLinks)
  update(newNodes, newLinks)
}

function groupDataByOneLabel(label) {
  let groupObj = {
    type: 'group',
    label: label,
    total: 0
  }
  let groupNodeIdList = []
  nodes.forEach(n => {
    if(n.label === label) {
      if(groupObj.total === 0) {
        groupObj.id = n.id
      }
      groupObj.total++
      groupNodeIdList.push(n.id)
    }
  })

  let groupNodes = [groupObj, ...filterNodes(groupNodeIdList)]
  let groupLinks = [...filterLinks(groupNodeIdList)]

  update(groupNodes, groupLinks)
  // return { nodes: groupNodes, links: groupLinks }
}

function filterNodes(idList) {
  return cloneNodes.filter( n => !idList.includes(n.id))
}

function filterLinks(idList) {
  return cloneLinks.filter((link) => {
    return (
      !idList.includes(link.target) &&
      !idList.includes(link.source)
    )
  })
}

function groupAll() {
  // const groups = _(cloneNodes).map('label').uniq().sort().value()
  // _.each(cloneNodes, (n, i) => {
  //   n.group = cloneNodes[i].label
  // })
  // const nodeGroups = _.groupBy(cloneNodes, 'group')
  // const groupList = Object.keys(nodeGroups)


  let groupNodes = []
  let groupLinks = []
  groupList.forEach(group => {
    let groupObj = {
      total: 0,
      type: 'group',
      label: group,
      idList: []
    }
    nodes.forEach(n => {
      if(n.label === group) {
        if(groupObj.total === 0) {
          groupObj.id = n.id
        }
        groupObj.total++
        groupObj.idList.push(n.id)
      }
    })
    groupNodes.push(groupObj)
  })

  const groupIdList = groupNodes.map(n => n.id)
  links.forEach(l => {
    if(groupIdList.includes(l.target) && groupIdList.includes(l.source)) {
      groupLinks.push(l)
    }
  })

  console.log(2333, { nodes: groupNodes, links: groupLinks })
  create(groupNodes, groupLinks)
}

groupAll()

// create(cloneNodes, cloneLinks)