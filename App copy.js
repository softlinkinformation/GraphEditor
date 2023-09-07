<<<<<<< HEAD
// src/App.js
import React, { useState, useEffect } from "react";
=======
import './App.css'
import React, { useState, useEffect, useRef } from "react";
>>>>>>> b776cbb (Saving local changes before checking out main branch)
import { DataSet, Network } from "vis-network/standalone";
import neo4j from "neo4j-driver";
import PropertiesPanel from "./PropertiesPanel";
import CypherPanel from "./CypherPanel";
import EditNodeModal from "./EditNodeModal";
import EditEdgeModal from "./EditEdgeModal";
<<<<<<< HEAD
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } from "./COOnfig";
import NodeStylesPanel from "./NodeStylesPanel";
=======
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD,DATABASE } from "./Config";
import NodeStylesPanel from "./NodeStylesPanel";
import ImportGraphModal from './ImportGraphModal';


>>>>>>> b776cbb (Saving local changes before checking out main branch)


const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function App() {
<<<<<<< HEAD
=======

>>>>>>> b776cbb (Saving local changes before checking out main branch)
  const [graphData, setGraphData] = useState({ nodes: new DataSet([]), edges: new DataSet([]) });
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
<<<<<<< HEAD
  
 

  useEffect(() => {
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    const session = driver.session();

    async function fetchData() {
      try {
        const result = await session.run("MATCH (n)-[r]->(m) RETURN n, r, m");
        //const result = await session.run("MATCH (n) RETURN n");

        const nodes = new DataSet([]);
        const edges = new DataSet([]);
      
        
        result.records.forEach((record) => {
          const nodeId = record.get("n").identity.toNumber();

          console.log("Node ID:", nodeId);
          console.log("Node Record:", record.get("n"));


          const nodeLabel = record.get("n").labels[0];
          const mNodeId = record.get("m").identity.toNumber();
          const mNodeLabel = record.get("m").labels[0];

          console.log("Edge Record:", record.get("r"));

          if (!labelColors[nodeLabel]) {
            setLabelColors(prevColors => ({ ...prevColors, [nodeLabel]: { color: generateRandomColor(), shape: 'circle' } }));
          }

          if (!labelColors[mNodeLabel]) {
            setLabelColors(prevColors => ({ ...prevColors, [mNodeLabel]: { color: generateRandomColor(), shape: 'circle' } }));
          }

          if (!nodes.get(nodeId)) {
          nodes.add({
            id: nodeId,
            label: nodeLabel,
            color: labelColors[nodeLabel]?.color || '#97c2fc', // default color if not yet assigned
            shape: labelColors[nodeLabel]?.shape || 'circle',
            properties: record.get("n").properties,
          });
        }

        if (!nodes.get(mNodeId)) {
          nodes.add({
            id: mNodeId,
            label: mNodeLabel,
            color: labelColors[mNodeLabel]?.color || '#97c2fc', // default color if not yet assigned
            shape: labelColors[mNodeLabel]?.shape || 'circle',
            properties: record.get("m").properties,
          });
        }
          edges.add({
            id: record.get("r").identity.toNumber(),
            from: nodeId,
            to: mNodeId,
            label: record.get("r").type,
          });
        });

        setGraphData({ nodes, edges });
      } catch (error) {
        console.error("Error fetching graph data:", error);
      } finally {
        session.close();
        driver.close();
      }
    }

    fetchData();
  }, [labelColors]);

  useEffect(() => {
    if (network) {
      network.on("doubleClick", (params) => {
        if (params.nodes.length === 0 && params.edges.length === 0) {
          setNodeCount((prevCount) => {
            const newNodeId = `Node${prevCount + 1}`; // Use the node count as the node ID
            graphData.nodes.add({ id: newNodeId, label: newNodeId });
            network.redraw();
            return prevCount + 1;
          });
        }
=======
  const [queryType, setQueryType] = useState(null);
  const [nodeId, setNodeId] = useState(1);
  const [loading, setLoading] = useState(true);
  const nextNodeId = useRef(1);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const networkContainerRef = useRef(null);
  const [isNodeStylesModalOpen, setIsNodeStylesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [label, setLabel] = useState("");


  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }
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
            console.log("the max node id is",maxId.toNumber())
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

  }, [queryType,network]);


  
  
//This hook sets the node ID, and listens to the NodeID state, it will change when a node is created in the editor. 
  useEffect(() => {
    localStorage.setItem("nodeId", nodeId);
    console.log("the node id is being set")
  }, [nodeId]);

//This hook retrieves the nodeId from the local storage. (browser)
  useEffect(() => {
    const savedNodeId = localStorage.getItem("nodeId");
    if (savedNodeId) {
      setNodeId(Number(savedNodeId));
    }
  }, [queryType]);

  useEffect(() => {
    console.log("Selected node has changed: ", selectedNode);
 }, [selectedNode]);



//This hook asks the user to select the query to be used to import the data from neo4j. 
  useEffect(() => {
    const fetchData = async () => {
      if(queryType !== null){
        if (queryType === 1) {
          //fetchDataQuery1 is the function that imports the data of all nodes but no relationships
          await fetchDataQuery1();
          //await fetchDataBasedOnLabel(label);
          console.log("launched query1");
        } else if (queryType === 2) {
          //fetchDataQuery2 is the function that imports the data of all nodes that have relationships
          await fetchDataQuery2();
          console.log("launched query2");
          //fetchDataBasedOnLabel(label);
        } 

        else if (queryType === 3) {
          //fetchDataQuery2 is the function that imports the data of all nodes that have relationships
          //await fetchDataQuery2();
          console.log("launched query 3");
          await fetchDataBasedOnLabel(label);
        } 
      } else {
        console.log("please click import graph to begin")
        //fetchDataBasedOnLabel(label);
      }
    };
    
    fetchData();
  }, [labelColors, queryType, label]);

  
//this hook has all the event manipulation, for example what happens on click, doubleclick etc.  

const prevSelectedNode = usePrevious(selectedNode);

  useEffect(() => {
    console.log("inside click useeffect")
    let singleClickTimeout = null;

    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'z') {
        collapseAllConnections();
      }
    };

    if (network) {

      //Ignore this Function, its not being used anymore. 
      const canvasToDOM = (position) => {
        const DOMPos = network.canvasToDOM(position);
        return { x: DOMPos.x, y: DOMPos.y };
      };

      

      // Listen to keydown event
    
  
  // Add keydown event listener
  window.addEventListener('keydown', handleKeyDown);

      network.on('doubleClick', function(properties) {
        clearTimeout(singleClickTimeout);
        
        const ids = properties.nodes;
        const clickedNodes = graphData.nodes.get(ids);
        //graphData.nodes.update([{id: clickedNodes[0].id, borderWidth: 5}]);
        console.log("the clicked node is", clickedNodes )
        console.log("the node to be selected", clickedNodes[0] )
        // If a node was double-clicked
        if(clickedNodes.length >= 0) {
          //  graphData.nodes.update([{id: clickedNodes[0].id, borderWidth: 5}]);
          setSelectedNode(clickedNodes[0]);
          console.log("the selected node is", selectedNode); 
          
          console.log("inside doubleclick"); 
        }
        expandNodeConnections();
>>>>>>> b776cbb (Saving local changes before checking out main branch)
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
<<<<<<< HEAD
  }, [network, graphData, nodeCount]);

  const handleImportGraph = () => {
  const container = document.getElementById("network");
   const options = {
  configure: {
    enabled: true,
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
      const timestampId = `Node${Date.now()}`; // Use timestamp as the node ID
      nodeData.id = timestampId.replace(/[^\w]/g, ""); // Remove special characters
      nodeData.label = timestampId;
      callback(nodeData);
    },
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

  const newNetwork = new Network(container, graphData, options);
  setNetwork(newNetwork);
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
/*
  const generateCypherQuery = () => {
    const nodes = graphData.nodes.get();
    const edges = graphData.edges.get();

    const cypherCreateStatements = nodes
      .map((node) => {
        const properties = Object.entries(node.properties)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(", ");
        return `CREATE (n${node.id}:${node.label} {${properties}})`;
      })
      .concat(
        edges.map(
          (edge) =>
            `CREATE (n${edge.from})-[:${edge.label}]->(n${edge.to})`
        )
      )
      .join("\n");

    return cypherCreateStatements;
  };
*/
  const generateCypherQuery = () => {
    const nodes = graphData.nodes.get();
    const edges = graphData.edges.get();
  
    const cypherCreateStatements = nodes
      .map((node) => {
        const properties = node.properties
          ? Object.entries(node.properties)
              .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
              .join(", ")
          : "";
        return `MERGE (n${node.id}:${node.label} {${properties}})`;
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
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
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

  //const [showCypher, setShowCypher] = useState(false);
  
  return (
    <div className="App">
      <div id="network" style={{ width: "70%", height: "600px", float: "left" }} />
      <PropertiesPanel
        node={selectedNode}
        onSave={(node) => console.log("Save node:", node)}
      />
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
}
export default App;
=======

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  

  }, [network, graphData, nodeCount,queryType, labelColors,selectedNode]);


  const fetchDataBasedOnLabel = async (label) => {
    console.log("inside fetchdatalabel");
    // Open neo4j driver session
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),{database: DATABASE});
    const session = driver.session();

    try {
        // Run cypher query that matches nodes with a specific label
        const result = await session.run(`MATCH (n:${label}) RETURN n LIMIT 10`);
        const nodes = new DataSet([]);

        result.records.forEach((record) => {
            const nodeNeo4jId = record.get("n").identity.toNumber(); // Neo4j's internal ID
            const nodeLabel = record.get("n").labels[0];
            const nodeId = record.get("n").properties.id; // Get "id" property of the node

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
    } catch (error) {
        console.error("Error fetching graph data:", error);
    } finally {
        session.close();
        driver.close();
    }
}


  
//The function to import data from neo4j
  const fetchDataQuery1 = async () => {
    // Existing code for fetchDataQuery1
    //open neo4j driver session
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),{database: DATABASE});
      const session = driver.session();
    //run cypher query
      try {
        const result = await session.run("MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 10");
        const nodes = new DataSet([]);
        const edges = new DataSet([]);
    //store the node information in variables. 
        result.records.forEach((record) => {
          const nodeNeo4jId = record.get("n").identity.toNumber(); // Neo4j's internal ID
          const nodeLabel = record.get("n").labels[0];
          const nodeId = record.get("n").properties.id;

          const mNodeNeo4jId = record.get("m").identity.toNumber(); // Neo4j's internal ID
          const mNodeLabel = record.get("m").labels[0];
          const mNodeId = record.get("m").properties.id;
          
    //Sets label colors from the random color generator function declared at the top
          if (!labelColors[nodeLabel]) {
            setLabelColors(prevColors => ({ ...prevColors, [nodeLabel]: { color: generateRandomColor(), shape: 'circle' } }));
          }
    
          if (!labelColors[mNodeLabel]) {
            setLabelColors(prevColors => ({ ...prevColors, [mNodeLabel]: { color: generateRandomColor(), shape: 'circle' } }));
          }
    //Add the nodes to the canvas. 
          if (!nodes.get(nodeId)) {
            console.log("adding nodes");
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
            console.log("adding nodes m");
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
    
       //The graphdata state is set here. 
        setGraphData({ nodes, edges });
    
      } catch (error) {
        console.error("Error fetching graph data:", error);
      } finally {
        session.close();
        driver.close();
      }
  };

//Another function to import data from neo4j, follows the same principle of fetchDataQuery1. 
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
        console.log("adding nodes");
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
    //console.log("Something has been changed")
  } catch (error) {
    console.error("Error fetching graph data:", error);
  } finally {
    session.close();
    driver.close();
  }
}


//This hook contains all the manipulations of the vis-network library, where the user can add, delete and edit ndoes.
useEffect(() => {
  if (queryType === null ) {console.log("exiting the function "); return; } // exit if no query selected
  console.log("querytype", queryType);
  const container = document.getElementById("network");
  
    // Your options...
    const options = {
      //configuration options of viz-network
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
      //Handles creation of new nodes on the canvas. 
      
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
      
      //Handles edit nodes. 
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
    
  
//Updates the network after adding the nodes,edes etc. 
  const newNetwork = new Network(container, graphData, options);
  setNetwork(newNetwork);
  console.log("networkchanged")
  
}, [queryType, graphData, labelColors]);  // Listen to changes in queryType, and graphData. 

>>>>>>> b776cbb (Saving local changes before checking out main branch)
