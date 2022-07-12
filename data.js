import links from './data/new_links.json'
import nodes from './data/new_nodes.json'

let newNodes = []
let newLinks = []

links.forEach(link => {
    newLinks.push(JSON.parse(link))
})

nodes.forEach(node => {
    newNodes.push(JSON.parse(node))
})

console.log(JSON.stringify(newNodes))

console.log(JSON.stringify(newLinks))