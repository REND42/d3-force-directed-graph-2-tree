import * as d3 from 'd3'
import _ from 'lodash'
import data from './data/miserables.json'
import nodes from './data/test_nodes.json'
import links from './data/test_links.json'
// import nodes from './data/ndoes.json'
// import links from './data/links.json'
const width = window.innerWidth
const height = window.innerHeight

const cloneNodes = _.cloneDeep(nodes)
const cloneLinks = _.cloneDeep(links)

const groupList = _(cloneNodes).map('label').uniq().value()

// console.log('clone', cloneNodes, cloneLinks, groupList)

let simulation = null
let linkEle = null
let nodeEle = null
let hullEle = null
let isTree = false

const { groupNodes, groupLinks } = groupAll(nodes, links)

console.log(111, groupNodes)

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
  const groups = _(nodes).map('label').uniq().sort().value()
  _.each(nodes, (n, i) => {
    n.group = nodes[i].label
  })
  const nodeGroups = _.groupBy(nodes, 'group')

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
    .data(groups)
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
    .style('fill-opacity', 0.5)
    .attr('stroke-linejoin', 'round')
    .on('click', (e, d) => {
      console.log('hull clicked', d)
      collapseDataByOneLabel(nodes, links, d)
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
      return color(groupList.findIndex(g => d.label === g))
    })
    .call(drag)
    .on('click', (e, d) => {
      if(d.type === 'group') {
        // console.log('expand it')
        expandDataByOneLabel(nodes, links, d)
      }
    })


    simulation.nodes(nodes).on('tick', () => {
      if(isTree) {
        nodeEle
          .attr('cx', d => {
            return d.x
          })
          .attr('cy', d => {
            let level = groupNodes.findIndex(gn => gn.label === d.label)
            return 120 * level + 40
          })
    
        linkEle
          .attr('x1', d => d.source.x)
          .attr('x2', d => d.target.x)
          .attr('y1', d => {
            let level = groupNodes.findIndex(gn => gn.label === d.source.label)
            return 120 * level + 40
          })
          .attr('y2', d => {
            let level = groupNodes.findIndex(gn => gn.label === d.target.label)
            return 120 * level + 40
          })

        hullEle.attr('d', g => {
          let hullPoints = nodeGroups[g].map(n => {
            let level = groupNodes.findIndex(gn => gn.label === n.label)
            // return 120 * level + 40
            return [n.x, 120 * level + 40]
          })
          const hullData = d3.polygonHull(hullPoints)
          if(hullData === null) {
            return
          }
          hullData.push(hullData[0])
          return d3.line().curve(d3.curveCardinalClosed.tension(0.8))(hullData)
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
          let hullPoints = nodeGroups[g].map(n => {
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

function update(nodes, links) {

  d3.select('svg').selectAll('.group').remove()
  create(nodes, links)
}

function collapseDataByOneLabel(nodes, links, curLabel) {
  console.log(nodes, links, curLabel)

  let newLinks = []
  let newNodes = []
  nodes.forEach(node => {
    if(node.label !== curLabel) {
      newNodes.push(node)
    }
  })
  let foundNode = groupNodes.find(gn => gn.label === curLabel)
  newNodes.push(foundNode)

  links.forEach(link => {
    if(link.target.label !== curLabel && link.source.label !== curLabel) {
      newLinks.push(link)
    }
  })
  let foundLink = groupLinks.find(gl => gl.target_label === curLabel || gl.source_label === curLabel)
  newLinks.push(foundLink)
  update(newNodes, newLinks)
}


function expandDataByOneLabel(nodes, links, curNode) {
  console.log(nodes, links, curNode)
  // let nodesCopy = _.cloneDeep(nodes)
  // let linksCopy = _.cloneDeep(links)

  let newNodes = []
  let newLinks = []
  nodes.forEach(node => {
    if(node.group !== curNode.label) {
      newNodes.push(node)
    }
  })
  newNodes.push(...curNode.node_list)
  links.forEach(link => {
    // let tNode = nodes.find(n => n.id === n.target)
    console.log(23333, link)
    if(link.group_source_id && link.group_target_id && link.group_source_id !== curNode.id && link.group_target_id !== curNode.id) {
      newLinks.push(link)
    }
  })

  curNode.node_list.forEach(node => {
    node.as_source_links.forEach(link => {
      let brandNewLink = cloneLinks.find(l => l.id === link.id)
      if(nodes.findIndex(gn => gn.id === link.group_target_id) !== -1) {
        brandNewLink.target = link.group_target_id
        newLinks.push(brandNewLink)
      }
    })

    node.as_target_links.forEach(link => {
      let brandNewLink = cloneLinks.find(l => l.id === link.id)
      if(nodes.findIndex(gn => gn.id === link.group_source_id) !== -1) {
        brandNewLink.source = link.group_source_id
        newLinks.push(brandNewLink)
      }
    })
  })
  console.log('new', newNodes, newLinks)
  update(newNodes, newLinks)
}

// function groupDataByOneLabel(label) {
//   let groupObj = {
//     type: 'group',
//     label: label,
//     total: 0
//   }
//   let groupNodeIdList = []
//   nodes.forEach(n => {
//     if(n.label === label) {
//       if(groupObj.total === 0) {
//         groupObj.id = n.id
//       }
//       groupObj.total++
//       groupNodeIdList.push(n.id)
//     }
//   })

//   let groupNodes = [groupObj, ...filterNodes(groupNodeIdList)]
//   let groupLinks = [...filterLinks(groupNodeIdList)]

//   update(groupNodes, groupLinks)
//   // return { nodes: groupNodes, links: groupLinks }
// }

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

function groupAll(nodes, links) {
  let groupNodes = []
  let groupLinks = []
  groupList.forEach(group => {
    let groupObj = {
      total: 0,
      type: 'group',
      label: group,
      node_list: []
    }
    nodes.forEach(n => {
      if(n.label === group) {
        n.as_source_links = links.filter(link => link.source === n.id)
        n.as_target_links = links.filter(link => link.target === n.id)

        if(groupObj.total === 0) {
          groupObj.id = `g_${n.id}`
          groupObj.origin_id = n.id
        }
        groupObj.total++
        groupObj.node_list.push(n)
      }
    })
    groupNodes.push(groupObj)
  })

  const allLinks = []
  nodes.forEach(n => {
    let sourceLinks = links.filter(link => {
      link.origin_source_id = link.source
      link.origin_target_id = link.target
      if(link.source === n.id) {
        link.source_label = n.label
        return true
      }
    })
    let targetLinks = links.filter(link => {
      if(link.target === n.id) {
        link.target_label = n.label
        return true
      }
    })
    allLinks.push(...sourceLinks, ...targetLinks)
  })

  allLinks.forEach(link => {
    let targetNode = groupNodes.find(gn => gn.label === link.target_label)
    let sourceNode = groupNodes.find(gn => gn.label === link.source_label)
    if(targetNode && sourceNode) {
      link.group_source_id = sourceNode.id
      link.group_target_id = targetNode.id
      link.source = sourceNode.id
      link.target = targetNode.id
    }
    if(groupLinks.findIndex(gl => (gl.source === link.source && gl.target === link.target)) === -1) {
      groupLinks.push(link)
    }
  })

  // console.log(24444, groupNodes, groupLinks)

  return { groupNodes, groupLinks }
  // create(groupNodes, groupLinks)
}

create(groupNodes, groupLinks)



// create(nodes, links)

document.getElementById('btn').addEventListener('click', () => {
  console.log('switch')
  isTree = !isTree
  simulation.restart()
})