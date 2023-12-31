// src/App.js

//ALL THE IMPORTS
import './App.css'
import React, { useState, useEffect, useRef } from "react";
import { DataSet, Network } from "vis-network/standalone";
import neo4j from "neo4j-driver";
import PropertiesPanel from "./PropertiesPanel";
import CypherPanel from "./CypherPanel";
import EditNodeModal from "./EditNodeModal";
import EditEdgeModal from "./EditEdgeModal";
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD,DATABASE } from "./Config";
import NodeStylesPanel from "./NodeStylesPanel";
import ImportGraphModal from './ImportGraphModal';



//Random color generator function to generate colors for populated nodes from the graph database
const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function App() {

//Here we set all the states that will be used in the editor. 
//Each state contains a variable followed by a function to update  the state.

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
  const [isMounted, setIsMounted] = useState(false);



  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }
  
//Function to set the contextMenu to true. 
  const showContextMenu = (position) => {
    setContextMenuPosition(position);
    setContextMenuVisible(true);
  };
  

  //Ignore this function, it is not ued anymore. 
  const hideContextMenu = () => {
    setContextMenuVisible(false);
  };
  

  // define a function to open your modal and fetch the labels from your database


const onLabelButtonClick = (label) => {
  console.log(`Importing graph for label: ${label}`);
  // insert your graph import logic here
};



  // This hook gets the latest node ID in neo4j, to maintain uniqueness of IDs of new nodes created in the editor. 
  //It listens to the queryType state, hence once we select the query to import the data into the editor, the queryType state will change
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
      //This is the click event handle. 
      network.on('click', function(properties) {
        clearTimeout(singleClickTimeout);
        const ids = properties.nodes;
        const clickedNodes = graphData.nodes.get(ids);

        singleClickTimeout = setTimeout(() => {
          const ids = properties.nodes;
          const clickedNodes = graphData.nodes.get(ids);
      
          // If a node was clicked
          if (clickedNodes.length > 0) {
              graphData.nodes.update([{id: clickedNodes[0].id, borderWidth: 5}]);
          } else {
              setContextMenuVisible(false);
              const updatedNodes = graphData.nodes.get().map(node => ({ ...node, borderWidth: 1}));
              graphData.nodes.update(updatedNodes);
          }
      }, 1); // 250ms delay; adjust as needed
    });
    /*
        // If a node was clicked
        if(clickedNodes.length > 0) {
          // Update the clicked node to have a "halo" (the border width becomes thicker)
          graphData.nodes.update([{id: clickedNodes[0].id, borderWidth: 5}]);
          //showContextMenu(properties.pointer.DOM);

          //Below are old code snippets that might be needed. 

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
         /*
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
        // add star slash also
      });
        */
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

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  

  }, [network, graphData, nodeCount,queryType, labelColors,selectedNode]);

//OLD CODE
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

//The menu that appears when a node is selected. 
  const ContextMenu = ({x, y, onOptionSelect}) => {
    if (!contextMenuVisible) return null;
    //<button onClick={launchPresetCypherQuery}>Launch Preset Cypher Query</button>
    //MORE BUTTONS CAN BE ADDED IN THE RETURN STATEMENT, 
    return (
      <div style={{ position: "fixed", top: contextMenuPosition.y, left: contextMenuPosition.x }}>
        
        <button onClick={expandNodeConnections}>Expand Connections</button>
        
        <button onClick={collapseIncommingConnections}>Collapse Incoming Connections</button>
        <button onClick={collapseOutgoingConnections}>Collapse Outgoing Connections</button>
      </div>
    );
  };

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
  } catch (error) {
    console.error("Error fetching graph data:", error);
  } finally {
    session.close();
    driver.close();
  }
}

useEffect(() => {
  setIsMounted(true);
  return () => {
    setIsMounted(false);
  };
}, [network]);


//This hook contains all the manipulations of the vis-network library, where the user can add, delete and edit ndoes.
useEffect(() => {

  if (!isMounted || queryType === null) {
    console.log("exiting the function "); 
    return; 
  }
  if (queryType === null ) {console.log("exiting the function "); return; } // exit if no query selected
  console.log("querytype", queryType);
  const container = document.getElementById("network");
  console.log("the container is", container)
  
    // Your options...
    const options = {
      //configuration options of viz-network
      configure: {
      enabled: true,
      filter: ["physics"],
      filter: ["nodes", "edges", "physics"],
      container: undefined,
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



//Functions of different buttons in the context menu. this functions is used inside the expand and colapse node functions. 
const fetchNodeConnectionsFromDatabase = async (nodeId) => {
  console.log("inside fetch node connections")
  console.log("node id is", nodeId)
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),{database: DATABASE});
  const session = driver.session();
  let result;
//Fetches the nodes connected to the selected node. 
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


//Function to expand the node connections. 


const expandNodeConnections = async () => {
  console.log("inside expand")
  if (!selectedNode) {
    console.log("selected node is", selectedNode );
    console.log("exiting expand") 
    return;  // Exit if no node is selected
  }
  
  try {
    const result = await fetchNodeConnectionsFromDatabase(selectedNode.properties.id);

    if (!result) {
      console.error("Nothing to expand. The result from the database is undefined.");
      return;
    }
    
    result.records.forEach((record) => {
      // Assuming record contains the id of the target node and the relationship data
      const targetNode = record.get("m");
      const targetNodeId = targetNode.properties.id;
      const properties = targetNode.properties; 
      const targetNodeLabel = targetNode.labels[0]; // Get "label" property of the node
      const relationship = record.get("r");
      const nodeLabel = record.get("m").labels[0]
      // If no color is assigned to the label of the node, generate a random color
      if (!labelColors[targetNodeLabel]) {
        setLabelColors(prevColors => ({ 
          ...prevColors, 
          [targetNodeLabel]: { color: generateRandomColor(), shape: 'circle' }
        }));
      }

      // Check if the node already exists
      if (!graphData.nodes.get(targetNodeId)) {
        graphData.nodes.add({
          id: targetNodeId,
          label: nodeLabel,
          color: labelColors[targetNodeLabel]?.color || '#97c2fc',  // Set the node's color
          shape: labelColors[targetNodeLabel]?.shape || 'circle',
          properties : properties
        });
      }

      const existingEdges = graphData.edges.get();
      const existingEdge = existingEdges.find(edge => 
        edge.from === selectedNode.id &&
        edge.to === targetNodeId &&
        edge.label === relationship.type
      );

      const existingReverseEdge = existingEdges.find(edge => 
        edge.to === selectedNode.id &&
        edge.from === targetNodeId &&
        edge.label === relationship.type
      );

      if (!existingEdge && !existingReverseEdge) {
        graphData.edges.add({ from: selectedNode.id, to: targetNodeId, label: relationship.type });
      }
    });

    network.redraw();
  } catch (error) {
    console.error("Failed to expand node connections: ", error);
  }
};


/*
const expandNodeConnections = async () => {
  if (!selectedNode) return;  // Exit if no node is selected


  try {
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
} catch (error) {
  console.error("Error expanding node connections:", error);
}

};
*/

//Function to Collapse the node (Incomming connections)
  const collapseIncommingConnections = () => {
    if (!selectedNode) return;  // Exit if no node is selected

    const connectedEdges = graphData.edges.get({
      filter: function (edge) {
        return edge.to === selectedNode.id;
      }
    });

    //const sourceNodes = connectedEdges.map(edge => edge.from);
    const sourceNodes = connectedEdges.map(edge => edge.from)
                                     .filter(nodeId => nodeId !== selectedNode.id);


    graphData.edges.remove(connectedEdges);
    graphData.nodes.remove(sourceNodes);

    network.redraw();
  };

//Function to Collapse the node (outgoing connections)
const collapseOutgoingConnections = () => {
  if (!selectedNode) return;  // Exit if no node is selected

  const connectedEdges = graphData.edges.get({
    filter: function (edge) {
      return edge.from === selectedNode.id;
    }
  });

  //const targetNodes = connectedEdges.map(edge => edge.to);
  const targetNodes = connectedEdges.map(edge => edge.to)
                                    .filter(nodeId => nodeId !== selectedNode.id);

  graphData.edges.remove(connectedEdges);
  graphData.nodes.remove(targetNodes);

  network.redraw();
};


const collapseAllConnections = () => {
  collapseOutgoingConnections();
  collapseIncommingConnections();
};





/*
const launchPresetCypherQuery = async () => {
  const query = getPresetCypherQuery();  // This function would return the currently selected preset Cypher query
  const result = await executeCypherQuery(query);

  // Update graph data with the result
  // ...
};

*/

//Asks the user to select the query they want to use to import the data from neo4j into the canvas. 
const handleImportGraph = () => {
    const userChoice = window.prompt("Please select the query type (Enter 1 or 2):");
    setQueryType(parseInt(userChoice, 10));

};

//Launches the Edit Edge modal when the edit edge button is clicked
const handleEditEdge = (edgeData, callback) => {
  setEditEdgeData(edgeData);
  setEditEdgeModalOpen(true);
};


const handleEditEdgeConfirm = (updatedEdgeData) => {
  graphData.edges.update(updatedEdgeData);
  setEditEdgeModalOpen(false);
  setEditEdgeData(null);
  writeGraphToDatabase();
};

//Launches the Edit Node modal when the edit node button is clicked
  const handleEditNode = (nodeData, callback) => {
    setEditNodeData(nodeData);
    setEditNodeModalOpen(true);
  };

  const handleEditNodeConfirm = (newNodeData) => {
    graphData.nodes.update(newNodeData);  
    //graphData.nodes.update(updatedNodeData);
    writeGraphToDatabase();
    setEditNodeModalOpen(false);
    setEditNodeData(null);
  };
  

//the next two functions deal with showing the cypher query of the network created on canvas. 
  const handleCypherChange = (newCypherQuery) => {
    setCypherQuery(newCypherQuery);
  };


  const handleShowCypher = () => {
    const generatedQuery = generateCypherQuery();
    setCypherQuery(generatedQuery);
    setShowCypher(!showCypher);
  };


//Function to handle color change of nodes.
  const handleLabelColorChange = (label, color) => {
    setLabelColors(prevColors => ({
      ...prevColors,
      [label]: { ...prevColors[label], color }
    }));
  };
  //Function to handle shape change of nodes.
  const handleLabelShapeChange = (label, shape) => {
    setLabelColors(prevColors => ({
      ...prevColors,
      [label]: { ...prevColors[label], shape }
    }));
  };


//Function to handle the JSON export of the canvas details. 
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

  
//Function to Write the created nodes into Neo4j. 
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


//Function to handle what happens when save vizualization button is clicked. 
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

//RETURN ELEMENTS OF THE HTML.
//<button onClick={handleSaveGraph}>Save Graph</button>
  return (
    <div className="App">
      <div className="leftbar ">
      <button onClick={() => setIsImportModalOpen(true)} >Import Labels</button>
        <button onClick={saveGraphData}>Export JSON</button>
        <button onClick={() => setIsNodeStylesModalOpen(true)}>Show Node Styles</button>
      </div>

      <ImportGraphModal 
  isOpen={isImportModalOpen} 
  onRequestClose={() => setIsImportModalOpen(false)} 
  onImport={(label) => {
    // Set the query type to 3 and the label
    setQueryType(3);
    setLabel(label);
    setIsImportModalOpen(false);
  }}
/>
      
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
      <ContextMenu />
      </div>
      <div className="rightbar">
      <PropertiesPanel
        node={selectedNode}
        onSave={(node) => console.log("Save node:", node)}
      />
      <EditNodeModal
        isOpen={editNodeModalOpen}
        nodeData={editNodeData}
        onConfirm={handleEditNodeConfirm}
        onCancel={() => setEditNodeModalOpen(false)}
      />
      </div>

      <div 
        id="network" 
        ref={networkContainerRef}
        className="main-content"
      />
      
      <NodeStylesPanel
        labelColors={labelColors}
        onLabelColorChange={handleLabelColorChange}
        onLabelShapeChange={handleLabelShapeChange}
      />
      
      
    </div>
  );

}
export default App;
