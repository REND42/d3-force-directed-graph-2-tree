import * as d3 from 'd3'
import data from './data/miserables.json'

data.nodes.forEach((node, idx) => {
  // node.id = `${idx+1}`
  node.id = idx
})

console.log(233, data)

const width = window.innerWidth
const height = window.innerHeight
let dr = 4, off = 15, expand = {}, net, force, hullg, hull, linkg, link, nodeg, node

const curve = d3.line().curve(d3.curveCardinalClosed.tension(0.85))

const fill = d3.schemeCategory10

console.log('fill', d3.schemeCategory10[1])

const drag = d3.drag().on('start',  (event, node) => {
  if(!event.active) force.alphaTarget(0.2).restart()
  node.fx = node.x
  node.fy = node.y
}).on('drag', (event, node) => {
  if(!event.active) force.alphaTarget(0.2).restart()
  node.fx = event.x
  node.fy = event.y
}).on('end', (event, node) => {
  if(!event.active) {
    force.alphaTarget(0)
  }
  node.fx = null
  node.fy = null
})

function noop() {
  return false
}

function nodeid(n) {
  // console.log('nodeid', n)
  return n.size ? "_g_" + n.group : n.name
}

function linkid(l) {
  let u = nodeid(l.source)
  let v = nodeid(l.target)
  return u < v ? u + '|' + v : v + '|' + u
}

function getGroup(n) {
  return n.group
}

function network(data, prev, index, expand) {
  console.log(99999, data, prev,  expand)

  expand = expand || {}
  let gm = {},
    nm = {},
    lm = {},
    gn = {},
    gc = {},
    nodes = [],
    links = []
  
  if(prev) {
    prev.nodes.forEach(n => {
      let i = index(n), o
      if(n.size > 0) {
        gn[i] = n
        n.size = 0
      } else {
        o = gc[i] || (gc[i] = {x: 0, y: 0, count: 0})
        o.x += n.x
        o.y += n.y
        o.count += 1
      }
    })
  }

  for(let k=0; k<data.nodes.length; ++k) {
    let n = data.nodes[k], i = index(n), l = gm[i] || (gm[i]=gn[i]) || (gm[i]={group:i, size:0, nodes:[]})
    if (expand[i]) {
      nm[n.name] = nodes.length
      nodes.push(n)
      if(gn[i]) {
        n.x = gn[i].x + Math.random()
        n.y = gn[i].y + Math.random()
      }
    } else {
      if(l.size === 0) {
        nm[i] = nodes.length
        nodes.push(l)
        if(gc[i]) {
          l.x = gc[i].x / gc[i].count
          l.y = gc[i].y / gc[i].count
        }
      }
      l.nodes.push(n)
    }

    l.size += 1
    n.group_data = l
  }

  for(let i in gm) {
    gm[i].link_count = 0
  }

  for(let k=0; k<data.links.length; ++k) {
    let e = data.links[k], u = index(e.source), v = index(e.target)
    if(u !== v) {
      gm[u].link_count++
      gm[v].link_count++
    }
    u = expand[u] ? nm[e.source.name] : nm[u]
    v = expand[v] ? nm[e.target.name] : nm[v]
    let i = (u<v ? u+'|'+v : v+'|'+u),
      l = lm[i] || (lm[i] = {source: u, target: v, size: 0})
    l.size += 1
  }

  for(let i in lm) {
    links.push(lm[i])
  }

  nodes.forEach((n, idx) => {
    n.id = idx
  })

  // links.forEach(l => {
  //   let u = nodeid(l.source)
  //   let v = nodeid(l.target)
  //   return u < v ? u + '|' + v : v + '|' + u
  // })

  return {nodes: nodes, links: links}
}

function convexHulls(nodes, index, offset) {
  let hulls = {}
  for(let k=0; k<nodes.length; ++k) {
    let n = nodes[k]
    if(n.size) continue
    let i = index(n), l = hulls[i] || (hulls[i] = [])
    l.push([n.x-offset, n.y-offset])
    l.push([n.x-offset, n.y+offset])
    l.push([n.x+offset, n.y-offset])
    l.push([n.x+offset, n.y+offset])
  }

  let hullset = []
  for(let i in hulls) {
    hullset.push({ group: i, path: d3.polygonHull(hulls[i]) })
  }
  return hullset
}

function drawCluster(d) {
  return curve(d.path)
}

function init() {
  if(force) force.stop()

  net = network(data, net, getGroup, expand)

  console.log('net', net)

  force = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).strength(0.1))
    .force('collide', d3.forceCollide(40).iterations(1))
    .force('charge', d3.forceManyBody().strength(-80))
    .force('center', d3.forceCenter(width/2, height/2))
  
  hullg.selectAll('path.hull').remove()
  hull = hullg.selectAll('path.hull')
    .data(convexHulls(net.nodes, getGroup, off))
    .enter().append('path')
    .attr('class', 'hull')
    .attr('d', drawCluster)
    .style('fill', d => {
      fill[d.group]
    })
    .on('click', (e, d) => {
      expand[d.group] = false
      init()
    })
  
  link = linkg.selectAll('.link')
    .data(net.links)
  link.exit().remove()
  link.enter().append('line')
    .attr('class', 'link')
    .attr('x1', d => {
      return d.source.x
    })
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
    .style('stroke-width',  1)
    .attr('stroke', "rgba(50, 50, 50, 0.2)")

  node = nodeg.selectAll('.node')
    .data(net.nodes)
  node.exit().remove()
  node.enter().append('circle')
    .attr('class', d => 'node' + (d.size ? "" : " leaf"))
    .attr('r', d => d.size ? d.size + dr : dr + 1)
    .attr('cx', d => {
      return d.x
    })
    .attr('cy', d => d.y)
    .style('fill', d => fill[d.group])
    .on('click', (e, d) => {
      console.log('node click', d)

      expand[d.group] = !expand[d.group]
      init()
    })
    .call(drag)

  force.nodes(net.nodes).on('tick', () => {
    // console.log('tick', link, node)
    link.attr('x1', d => {
      // console.log(2333, d.source.x)
      return d.source.x
    })
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)

    node.attr('cx', d => {
      // console.log('cx', d.x)
      return d.x
    })
      .attr('cy', d => d.y)

    if(!hull.empty) {
      hull.data(convexHulls(net.nodes, getGroup, off))
        .attr('d', drawCluster)
    }
  })

  force.force('link').links(net.links)

}




const vis = d3.select('svg')
vis.attr('width', width).attr('height', height)

for(let i=0; i<data.links.length; ++i) {
  let o = data.links[i]
  o.source = data.nodes[o.source]
  o.target = data.nodes[o.target]
}

hullg = vis.append('g')
linkg = vis.append('g')
nodeg = vis.append('g')

init()

vis.attr("opacity", 1e-6)
  .transition()
  .duration(1000)
  .attr("opacity", 1)

