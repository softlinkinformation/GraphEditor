// src/App.js
import './App.css'
import React, { useState, useEffect, useRef } from "react";
import { DataSet, Network } from "vis-network/standalone";
import neo4j from "neo4j-driver";
import PropertiesPanel from "./PropertiesPanel";
import CypherPanel from "./CypherPanel";
import EditNodeModal from "./EditNodeModal";
import EditEdgeModal from "./EditEdgeModal";
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD,DATABASE } from "./COOnfig";
import NodeStylesPanel from "./NodeStylesPanel";




const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function App() {
  const [graphData, setGraphData] = useState({ nodes: new DataSet([]), edges: new DataSet([]) });
  //const [jsonGraphData, setjsonGraphData] = useState({ nodes: new DataSet([]), edges: new DataSet([]) });
  
  const [network, setNetwork] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeCount, setNodeCount] = useState(0); 
  const [editNodeModalOpen, setEditNodeModalOpen] = useState(false);
  const [editNodeData, setEditNodeData] = useState(null);
  const [cypherQuery, setCypherQuery] = useState("");
  const [labelColors, setLabelColors] = useState({});
  const [showCypher, setShowCypher] = useState(false);
  const [editEdgeData, setEditEdgeData] = useState(null);
  const [editEdgeModalOpen, setEditEdgeModalOpen] = useState(false);
  const [queryType, setQueryType] = useState(null);
  const [nodeId, setNodeId] = useState(1);
  const [loading, setLoading] = useState(true);
  const nextNodeId = useRef(1);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const networkContainerRef = useRef(null);
  const [isNodeStylesModalOpen, setIsNodeStylesModalOpen] = useState(false);


  //const [canvasState, setCanvasState] = useState({}); // New State for Canvas
  //const saveableCanvas = useRef();


  const showContextMenu = (position) => {
    setContextMenuPosition(position);
    setContextMenuVisible(true);
  };
  
  const hideContextMenu = () => {
    setContextMenuVisible(false);
  };
  


  
  useEffect(() => {
    const fetchMaxNodeId = async () => {
      const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),{database: DATABASE});
      const session = driver.session();
      try {
        const result = await session.run("MATCH (n) RETURN max(id(n))");
        const record = result.records[0];
        if (record) {
          const maxId = record.get(0);
          // If maxId is not null, increment it and set to nodeId state
          if (maxId !== null) {
            setNodeId(maxId.toNumber() + 1);
          }
        }
      } catch (error) {
        console.error("Error fetching max node id from Neo4j:", error);
      } finally {
        session.close();
        driver.close();
        setLoading(false);
      }
    };
  
    fetchMaxNodeId();
  }, [queryType]);


  
  

  useEffect(() => {
    localStorage.setItem("nodeId", nodeId);
  }, [nodeId]);


  useEffect(() => {
    const savedNodeId = localStorage.getItem("nodeId");
    if (savedNodeId) {
      setNodeId(Number(savedNodeId));
    }
  }, []);




  useEffect(() => {
    const fetchData = async () => {
      if(queryType !== null){
        if (queryType === 1) {
          await fetchDataQuery1();
          console.log("launched query1");
        } else if (queryType === 2) {
          await fetchDataQuery2();
          console.log("launched query2");
        } 
      } else {
        console.log("please click import graph to begin")
      }
    };
    
    fetchData();
  }, [labelColors, queryType]);

  

  useEffect(() => {
    console.log("inside click useeffect")
    if (network) {

      const canvasToDOM = (position) => {
        const DOMPos = network.canvasToDOM(position);
        return { x: DOMPos.x, y: DOMPos.y };
      };

      /*
      network.on("doubleClick", (params) => {
        if (params.nodes.length === 0 && params.edges.length === 0) {
          setNodeCount((prevCount) => {
            const newNodeId = `Node${prevCount + 1}`; // Use the node count as the node ID
            graphData.nodes.add({ id: newNodeId, label: newNodeId });
            network.redraw();
            return prevCount + 1;
          });
        }
      });
   */

      network.on('click', function(properties) {
        const ids = properties.nodes;
        const clickedNodes = graphData.nodes.get(ids);
    
        // If a node was clicked
        if(clickedNodes.length > 0) {
          // Update the clicked node to have a "halo"
          graphData.nodes.update([{id: clickedNodes[0].id, borderWidth: 5}]);
          showContextMenu(properties.pointer.DOM);
          //var nodePosition = network.getPositions([clickedNodes[0].id])[clickedNodes[0].id];
          //var DOMPosition = canvasToDOM(nodePosition);

          //setContextMenuPosition(DOMPosition);
          //console.log(DOMPosition);
          //setContextMenuVisible(true);
          
          // Get bounding box of the network container
          /*const { x, y } = networkContainerRef.current.getBoundingClientRect();

          const absoluteClickPosition = {
          x: properties.pointer.DOM.x + x,
          y: properties.pointer.DOM.y + y
          };

          setContextMenuPosition(absoluteClickPosition);
          setContextMenuVisible(true);
          */
        } else {
          // Hide the context menu if it's visible and reset node's "halo"
          setContextMenuVisible(false);
          const updatedNodes = graphData.nodes.get().map(node => ({ ...node, borderWidth: 1}));
          graphData.nodes.update(updatedNodes);
        }

          /*
          //const { x, y } = properties.pointer.DOM;
          //showContextMenu(x, y);
          // Show the context menu
          showContextMenu(properties.pointer.DOM);
        } else {
          // If the click was not on a node, hide the context menu
          hideContextMenu();
          // remove the "halo" from all nodes
          const updatedNodes = graphData.nodes.map(node => ({ ...node, borderWidth: 1}));
          graphData.nodes.update(updatedNodes);
        }
        */
      });
  

      network.on("afterDrawing", (params) => {
        // Handle edge label updates here
      });

      network.on("selectNode", (params) => {
        const [selectedNodeId] = params.nodes;
        const node = graphData.nodes.get(selectedNodeId);
        setSelectedNode(node);
      });

      network.on("deselectNode", (params) => {
        setSelectedNode(null);
      });
    }

  }, [network, graphData, nodeCount]);
/*
  const ContextMenu = ({x, y}) => {
    if (!contextMenuVisible) return null;
    return (
      <div className="context-menu active" style={{ top: y, left: x }}>
        <ul className="context-menu-circle">
          <li><button className="context-menu-option" onClick={expandNodeConnections}>Expand</button></li>
          <li><button className="context-menu-option" onClick={collapseIncommingConnections}>Launch</button></li>
          <li><button className="context-menu-option" onClick={collapseOutgoingConnections}>Collapse</button></li>
        </ul>
      </div>
    );
  };
*/
/*
  const ContextMenu = ({x, y, onOptionSelect}) => {
    if (!contextMenuVisible) return null;
  
    return (
        <ul id="context-menu" className="radial-menu" style={{left: `${x}px`, top: `${y}px`}}>
            <li><button onClick={expandNodeConnections}>Expand Connections</button></li>
            <li><button onClick={collapseIncommingConnections}>Launch Preset Cypher Query</button></li>
            <li><button onClick={collapseOutgoingConnections}>Collapse Connections</button></li>
        </ul>
    );
};
*/
/*
const ContextMenu = ({ x, y }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const radius = 100; // Adjust the radius to control the spread of the items
  const items = [
    { name: "Expand", action: expandNodeConnections },
    { name: "Launch", action: collapseIncommingConnections },
    { name: "Collapse", action: collapseOutgoingConnections },
  ];
  const angleStep = (2 * Math.PI) / items.length;

  const handleClick = () => setIsExpanded(!isExpanded);

  if (!contextMenuVisible) return null;
  const networkContainer = document.getElementById("network");
  const networkRect = networkContainer.getBoundingClientRect();

  return (
    <div
      className="context-menu"
      style={{ top: y + networkRect.top, left: x + networkRect.left }}
    >
      {isExpanded &&
        items.map((item, index) => {
          const angle = index * angleStep;
          const itemX = radius * Math.cos(angle);
          const itemY = radius * Math.sin(angle);

          return (
            <div
              key={index}
              className="menu-item"
              style={{
                top: `calc(50% + ${itemY}px)`,
                left: `calc(50% + ${itemX}px)`,
              }}
              onClick={item.action}
            >
              {item.name}
            </div>
          );
        })}
      <button className="menu-button" onClick={handleClick}>
        Menu
      </button>
    </div>
  );
};
*/


  const ContextMenu = ({x, y, onOptionSelect}) => {
    if (!contextMenuVisible) return null;
    //<button onClick={launchPresetCypherQuery}>Launch Preset Cypher Query</button>
    return (
      <div style={{ position: "fixed", top: contextMenuPosition.y, left: contextMenuPosition.x }}>
        <button onClick={expandNodeConnections}>Expand Connections</button>
        
        <button onClick={collapseIncommingConnections}>Collapse Incoming Connections</button>
        <button onClick={collapseOutgoingConnections}>Collapse Outgoing Connections</button>
      </div>
    );
  };

  

  const fetchDataQuery1 = async () => {
    // Existing code for fetchDataQuery1
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),{database: DATABASE});
      const session = driver.session();
    
      try {
        const result = await session.run("MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 10");
        const nodes = new DataSet([]);
        const edges = new DataSet([]);
    
        result.records.forEach((record) => {
          const nodeNeo4jId = record.get("n").identity.toNumber(); // Neo4j's internal ID
          const nodeLabel = record.get("n").labels[0];
          const nodeId = record.get("n").properties.id;

          //const nodeId = record.get("n").identity.toNumber();
          //const nodeLabel = record.get("n").labels[0];

          const mNodeNeo4jId = record.get("m").identity.toNumber(); // Neo4j's internal ID
          const mNodeLabel = record.get("m").labels[0];
          const mNodeId = record.get("m").properties.id;

          //const mNodeId = record.get("m").identity.toNumber();
          //const mNodeLabel = record.get("m").labels[0];

          
          
    
          if (!labelColors[nodeLabel]) {
            setLabelColors(prevColors => ({ ...prevColors, [nodeLabel]: { color: generateRandomColor(), shape: 'circle' } }));
          }
    
          if (!labelColors[mNodeLabel]) {
            setLabelColors(prevColors => ({ ...prevColors, [mNodeLabel]: { color: generateRandomColor(), shape: 'circle' } }));
          }
    
          if (!nodes.get(nodeId)) {
            nodes.add({
              id: nodeId,
              neo4jId: nodeNeo4jId,
              label: nodeLabel,
              color: labelColors[nodeLabel]?.color || '#97c2fc',
              shape: labelColors[nodeLabel]?.shape || 'circle',
              properties: record.get("n").properties,
            });
          }
          //console.log("added n node with ID:",nodeId);
    
          if (!nodes.get(mNodeId)) {
            nodes.add({
              id: mNodeId,
              neo4jId: mNodeNeo4jId,
              label: mNodeLabel,
              color: labelColors[mNodeLabel]?.color || '#97c2fc',
              shape: labelColors[mNodeLabel]?.shape || 'circle',
              properties: record.get("m").properties,
            });
          }

          //console.log("added m node with ID:",mNodeId);
          
          edges.add({
            id: record.get("r").identity.toNumber(),
            from: nodeId,
            to: mNodeId,
            label: record.get("r").type,
          });
        });

       // console.log("added edge with source ID",nodeId, "and target ID", );
    
        setGraphData({ nodes, edges });
    
      } catch (error) {
        console.error("Error fetching graph data:", error);
      } finally {
        session.close();
        driver.close();
      }
  };


  const fetchDataQuery2 = async () => {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),{database: DATABASE});
  const session = driver.session();
  
  try {
    const result = await session.run("MATCH (n) RETURN n LIMIT 10");
    const nodes = new DataSet([]);

    result.records.forEach((record) => {
      const nodeNeo4jId = record.get("n").identity.toNumber(); // Neo4j's internal ID
      const nodeLabel = record.get("n").labels[0];
      const nodeId = record.get("n").properties.id; // Get "id" property of the node
      //const nodeId = record.get("n").identity.toNumber();

      if (!labelColors[nodeLabel]) {
        setLabelColors(prevColors => ({ ...prevColors, [nodeLabel]: { color: generateRandomColor(), shape: 'circle' } }));
      }

      if (!nodes.get(nodeId)) {
        nodes.add({
          id: nodeId,
          neo4jId: nodeNeo4jId,
          label: nodeLabel,
          color: labelColors[nodeLabel]?.color || '#97c2fc',
          shape: labelColors[nodeLabel]?.shape || 'circle',
          properties: record.get("n").properties,
        });
      }
    });




    setGraphData({ nodes, edges: new DataSet([]) }); // Set edges as an empty DataSet
    console.log("Something has been changed")
  } catch (error) {
    console.error("Error fetching graph data:", error);
  } finally {
    session.close();
    driver.close();
  }
}



useEffect(() => {
  if (queryType === null ) {console.log("exiting the function "); return; } // exit if no query selected
  console.log("querytype", queryType);
  const container = document.getElementById("network");
  
    // Your options...
    const options = {
      
      configure: {
      enabled: false,
      //filter: ["physics"],
      filter: ["nodes", "edges", "physics"],
      //container: undefined,
      showButton: true,
      },
      edges: {
      arrows: "to", // this creates a directed network
      },
      manipulation: {
      enabled: true,
      initiallyActive: true,
      addNode: (nodeData, callback) => {

        setNodeId((prevNodeId) => {
          
          
            console.log(prevNodeId)
            nodeData.id = `${prevNodeId}`;
            const nextId = prevNodeId + 1;
            //nodeData.id = `${nextId}`;
            nodeData.label = `Node${prevNodeId}`;
            callback(nodeData);
            return nextId;
          
          
          
        });
      },

        //const timestampId = `Node${Date.now()}`; // Use timestamp as the node ID
        //no//deData.id = `Node${nextId}`;
        //nodeData.label = `Node${nextId}`;
        //nodeData.id = timestampId.replace(/[^\w]/g, ""); // Remove special characters
        //nodeData.label = timestampId;
        //callback(nodeData);
      
      editNode: (nodeData, callback) => {
        handleEditNode(nodeData, callback);
        callback(null);
      },
      addEdge: (edgeData, callback) => {
        callback(edgeData);
      },
      editEdge: {
        editWithoutDrag: (edgeData, callback) => {
          handleEditEdge(edgeData, callback);
          callback(edgeData);
        },
      },
      },
      };
      console.log("added nodes")
    
  

  const newNetwork = new Network(container, graphData, options);
  setNetwork(newNetwork);
  console.log("networkchanged")
  
}, [queryType, graphData, labelColors]);  // Listen to changes in queryType


const fetchNodeConnectionsFromDatabase = async (nodeId) => {
  console.log("node id is", nodeId)
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),{database: DATABASE});
  const session = driver.session();
  let result;

  try {
      result = await session.run("MATCH (n)-[r]->(m) WHERE n.id = $nodeId RETURN r, m", { nodeId: nodeId });
  } catch (error) {
      console.error("Error fetching node connections:", error);
  } finally {
      session.close();
      driver.close();
  }
  
  return result;
};



const expandNodeConnections = async () => {
  if (!selectedNode) return;  // Exit if no node is selected

  const result = await fetchNodeConnectionsFromDatabase(selectedNode.properties.id);
  
  
  result.records.forEach((record) => {
    // Assuming record contains the id of the target node and the relationship data
    //  const sourceNode = record.get("n");
    //const sourceNodeId = sourceNode.properties.id;
    const targetNode = record.get("m");
    const targetNodeId = targetNode.properties.id;
    //const targetNodeId = record.get("m").identity.toNumber();
   
    const relationship = record.get("r");

    if (!graphData.nodes.get(targetNodeId)) {
      graphData.nodes.add({ id: targetNodeId, label: `Node${targetNodeId}` });
    }

    const existingEdges = graphData.edges.get();
    const existingEdge = existingEdges.find(edge => 
      edge.from === selectedNode.id &&
      edge.to === targetNodeId &&
      edge.label === relationship.type
    );

    const existingReverseEdge = existingEdges.find(edge => 
      edge.from === selectedNode.id &&
      edge.to === targetNodeId &&
      edge.label === relationship.type
    );


    if (!existingEdge) {
      graphData.edges.add({ from: selectedNode.id, to: targetNodeId, label: relationship.type });
    }
  });

  network.redraw();
};

const collapseIncommingConnections = () => {
  if (!selectedNode) return;  // Exit if no node is selected

  const connectedEdges = graphData.edges.get({
    filter: function (edge) {
      return edge.to === selectedNode.id;
    }
  });

  graphData.edges.remove(connectedEdges);
  network.redraw();
};

const collapseOutgoingConnections = () => {
  if (!selectedNode) return;  // Exit if no node is selected

  const connectedEdges = graphData.edges.get({
    filter: function (edge) {
      return edge.from === selectedNode.id;
    }
  });

  graphData.edges.remove(connectedEdges);
  network.redraw();
};

/*
const launchPresetCypherQuery = async () => {
  const query = getPresetCypherQuery();  // This function would return the currently selected preset Cypher query
  const result = await executeCypherQuery(query);

  // Update graph data with the result
  // ...
};

*/

const handleImportGraph = () => {
    const userChoice = window.prompt("Please select the query type (Enter 1 or 2):");
    setQueryType(parseInt(userChoice, 10));

};

const handleEditEdge = (edgeData, callback) => {
  setEditEdgeData(edgeData);
  setEditEdgeModalOpen(true);
};

const handleEditEdgeConfirm = (updatedEdgeData) => {
  graphData.edges.update(updatedEdgeData);
  setEditEdgeModalOpen(false);
  setEditEdgeData(null);
};

  const handleEditNode = (nodeData, callback) => {
    setEditNodeData(nodeData);
    setEditNodeModalOpen(true);
  };

  const handleEditNodeConfirm = (updatedNodeData) => {
    graphData.nodes.update(updatedNodeData);
    setEditNodeModalOpen(false);
    setEditNodeData(null);
  };
  

  const handleCypherChange = (newCypherQuery) => {
    setCypherQuery(newCypherQuery);
  };

  const handleShowCypher = () => {
    const generatedQuery = generateCypherQuery();
    setCypherQuery(generatedQuery);
    setShowCypher(!showCypher);
  };


  const handleLabelColorChange = (label, color) => {
    setLabelColors(prevColors => ({
      ...prevColors,
      [label]: { ...prevColors[label], color }
    }));
  };

  const handleLabelShapeChange = (label, shape) => {
    setLabelColors(prevColors => ({
      ...prevColors,
      [label]: { ...prevColors[label], shape }
    }));
  };

  const handleSaveGraph = () => {
    const dataToExport = {
      nodes: graphData.nodes.get(),
      edges: graphData.edges.get(),
    };
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "graph-data.json";
    link.click();

    URL.revokeObjectURL(url);
  };

const generateCypherQuery = () => {
  const nodes = graphData.nodes.get();
  const edges = graphData.edges.get();

  const cypherCreateStatements = nodes
    .map((node) => {
      // Generate a key-value pair for each property
      const properties = node.properties
        ? Object.entries(node.properties)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join(", ")
        : "";
      // Merge command for the node
      let query = `MERGE (n${node.id}:${node.label} {id: "${node.id}"})`;

      // If the node has properties, add a SET command to add/modify them
      if (properties) {
        query += `\nSET n${node.id} += {${properties}}`;
      }
      return query;
    })
    .concat(
      edges.map(
        (edge) =>
          `MERGE (n${edge.from})-[:${edge.label}]->(n${edge.to})`
      )
    )
    .join("\n");

  return cypherCreateStatements;
};

  

  const writeGraphToDatabase = async () => {
    const cypherQuery = generateCypherQuery();
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),{database: DATABASE});
    const session = driver.session();

    try {
      await session.writeTransaction((tx) => tx.run(cypherQuery));
      console.log("Graph data written to the database.");
    } catch (error) {
      console.error("Error writing graph data to the database:", error);
    } finally {
      session.close();
      driver.close();
    }
  };

  function saveGraphData() {
    const nodes = graphData.nodes.get();
    const edges = graphData.edges.get();
  
    const serializedNodes = nodes.map(node => ({
      id: node.id,
      label: node.label,
      color: node.color,
      shape: node.shape,
      properties: node.properties,
      x: node.x,
      y: node.y
    }));
  
    const serializedEdges = edges.map(edge => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.label
    }));
  
    const dataToExport = {
      nodes: serializedNodes,
      edges: serializedEdges
    };
  
    const json = JSON.stringify(dataToExport, null, 2);
    console.log(json); // You can modify this line to save the JSON string as a file or send it to an API endpoint
    //setGraphData(dataToExport)
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "graph-data.json";
    link.click();

    URL.revokeObjectURL(url);
    //setjsonGraphData(dataToExport)
    
    // Alternatively, you can return the JSON object directly:
    return dataToExport;
  }

  

  //const [showCypher, setShowCypher] = useState(false);


  return (
    <div className="App">
      <div className="leftbar ">
        <button onClick={handleImportGraph}>Import Graph</button>
        <button onClick={handleSaveGraph}>Save Graph</button>
        <button onClick={handleShowCypher}>Show Cypher</button>
        <button onClick={writeGraphToDatabase}>Write to Database</button>
        <button onClick={saveGraphData}>Save Visualization</button>
        <button onClick={() => setIsNodeStylesModalOpen(true)}>Show Node Styles</button>
      </div>
      
      <div className="top-bar">
        <EditNodeModal
          isOpen={editNodeModalOpen}
          nodeData={editNodeData}
          onConfirm={handleEditNodeConfirm}
          onCancel={() => setEditNodeModalOpen(false)}
        />

        <EditEdgeModal
        isOpen={editEdgeModalOpen}
        edgeData={editEdgeData}
        onConfirm={handleEditEdgeConfirm}
        onCancel={() => setEditEdgeModalOpen(false)}
        />

      <NodeStylesPanel
      isOpen={isNodeStylesModalOpen}
      onRequestClose={() => setIsNodeStylesModalOpen(false)}
      labelColors={labelColors}
      onLabelColorChange={handleLabelColorChange}
      onLabelShapeChange={handleLabelShapeChange}
      />
        
      </div>
      
      <div 
        id="network" 
        ref={networkContainerRef}
        className="main-content"
      />
      
      <div className="rightbar">
      <PropertiesPanel
        node={selectedNode}
        onSave={(node) => console.log("Save node:", node)}

      />
      {showCypher && <CypherPanel cypher={cypherQuery} onCypherChange={handleCypherChange} />}
      </div>

      <NodeStylesPanel
          labelColors={labelColors}
          onLabelColorChange={handleLabelColorChange}
          onLabelShapeChange={handleLabelShapeChange}
      />
      
      
      <ContextMenu />
      
      
    </div>
  );
  
/*  
  return (
    <div className="App">
       <div 
      id="network" 
      ref={networkContainerRef}
      style={{ width: "70%", height: "600px", float: "left" }} 
    />
      <ContextMenu />
      <PropertiesPanel
        node={selectedNode}
        onSave={(node) => console.log("Save node:", node)}
      />
      <button onClick={saveGraphData}>Save Visualization</button>
      <button onClick={handleImportGraph}>Import Graph</button>
      <button onClick={handleSaveGraph}>Save Graph</button>
      <button onClick={handleShowCypher}>Show Cypher</button>
      <button onClick={writeGraphToDatabase}>Write to Database</button>
      {showCypher && <CypherPanel cypher={cypherQuery} onCypherChange={handleCypherChange} />}
      <EditNodeModal
        isOpen={editNodeModalOpen}
        nodeData={editNodeData}
        onConfirm={handleEditNodeConfirm}
        onCancel={() => setEditNodeModalOpen(false)}
      />
      <NodeStylesPanel
        labelColors={labelColors}
        onLabelColorChange={handleLabelColorChange}
        onLabelShapeChange={handleLabelShapeChange}
      />
      <EditEdgeModal
        isOpen={editEdgeModalOpen}
        edgeData={editEdgeData}
        onConfirm={handleEditEdgeConfirm}
        onCancel={() => setEditEdgeModalOpen(false)}
      />
    </div>
  );
*/
}
export default App;
