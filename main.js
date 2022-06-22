import './style.css'
import * as d3 from 'd3'

// const svg = d3.select('#container')
const barData = [45, 67, 89, 23, 11, 88]
const select = d3.select('path')
const rectWidth = 50

const svg = d3.select("#app").append("svg").attr('width', rectWidth * barData.length)
  .attr('height', 100).attr('style', 'border: 1px dashed')

// barData.forEach(bar => {
//   svg.append('rect')
// })


d3.select('svg').selectAll('rect').data(barData).enter().append('rect')
  .attr('x', (d, i) => i * rectWidth)
  .attr('height', d => d)
  .attr('width', rectWidth)
  .attr('stroke-width', 3)
  .attr('stroke-dasharray', '5 5')
  .attr('stroke', 'green')
  .attr('fill', 'pink')
  .attr('y', (d, i) => 0)
  .attr('sss', (d, i) => { console.log(d, i) })

console.log(select)
