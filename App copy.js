// src/App.js
import React, { useState, useEffect } from "react";
import { DataSet, Network } from "vis-network/standalone";
import neo4j from "neo4j-driver";
import PropertiesPanel from "./PropertiesPanel";
import CypherPanel from "./CypherPanel";
import EditNodeModal from "./EditNodeModal";
import EditEdgeModal from "./EditEdgeModal";
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } from "./COOnfig";
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