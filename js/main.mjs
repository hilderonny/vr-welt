const LAT = 50.990594 // Ringelberg
const LON = 11.062017
const RADIUS = 300 // In Metern

const streetContainer = document.querySelector("#street-container")

// Wandelt Geokoordinaten in 3D Koordinaten um, relativ zum aktuellen Ursprung
function latLonToXYZ(lat, lon, origin_lat, origin_lon) {
  const R = 6371000;
  const x = (lon - origin_lon) * Math.cos((lat + origin_lat) / 2 * Math.PI / 180) * (Math.PI / 180) * R;
  const z = - (lat - origin_lat) * (Math.PI / 180) * R;
  return { x, y: 0, z };
}

// function latLonToXYZ(lat, lon, center_lat, center_lon) {
//     const scale = 10000;
//     const x = (lon - center_lon) * scale;
//     const z = (lat - center_lat) * -scale;
//     return { x, y: 0, z };
// }

// Liefert relevante Knoten anhand ihrer ID und rechnet deren Position in XY um
function getRelevantNodes(node_ids, all_nodes) {
    const relevantNodes = node_ids.map(id => {
        const node = all_nodes[id]
        if (!node.pos) {
            node.pos = latLonToXYZ(node.lat, node.lon, LAT, LON)
        }
        return node
    })
    return relevantNodes
}

// Erstellt ein Straßensegment und rendert es
function createStreetSegment(start_pos, end_pos, parent) {
    const dx = end_pos.x - start_pos.x
    const dz = end_pos.z - start_pos.z
    const length = Math.sqrt(dx * dx + dz * dz)
  
    const angle = Math.atan2(dz, dx) * (180 / Math.PI)
  
    const midX = (start_pos.x + end_pos.x) / 2
    const midZ = (start_pos.z + end_pos.z) / 2
  
    const plane = document.createElement("a-plane")
    plane.setAttribute("position", `${midX} 0.01 ${midZ}`)
    plane.setAttribute("rotation", `-90 ${-angle} 0`)
    plane.setAttribute("width", length)
    plane.setAttribute("height", 2) // Straßenbreite
    plane.setAttribute("color", "#444")
    plane.setAttribute("side", "double")
  
    parent.appendChild(plane);
}

// Verarbeitet Straßen und Wege
function handleHighway(highway, all_nodes) {
    const relevantNodes = getRelevantNodes(highway.nodes, all_nodes)
    // Straßensegmente generieren
    for (let i = 0; i < relevantNodes.length - 1; i++) {
        const startNode = relevantNodes[i]
        const endNode = relevantNodes[i + 1]
        console.log(highway.tags)
        createStreetSegment(startNode.pos, endNode.pos, streetContainer)
    }
}

// Verarbeitet alle Linien
function handleWays(ways, all_nodes) {
    for (const way of ways) {
        if (way.tags?.highway) handleHighway(way, all_nodes)
    }
}

// Holt Daten für eine Position und Radius von Overpass
async function fetchOverpass(lat, lon, radius) {
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];
        way(around:${radius},${lat},${lon})["highway"];
        (._;>;);
        out;`
    const response = await fetch (url)
    const data = await response.json()
    // Store nodes and way as hashmap with id as keys for faster reference
    const result = { node: {}, way: {} } // Einzahl für einfachere Referenzierung des Typs
    for (const element of data.elements) {
        const resultProperty = result[element.type]
        if (!resultProperty) {
            resultProperty = {}
            result[element.type] = resultProperty
        }
        resultProperty[element.id] = element
        delete element.id
        delete element.type
    }
    return result
}

// Daten laden und anzeigen
async function init() {
    const overpassData = await fetchOverpass(LAT, LON, RADIUS)
    handleWays(Object.values(overpassData.way), overpassData.node)
}

init()