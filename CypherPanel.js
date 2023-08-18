// src/CypherPanel.js
//import React from "react";
/*
function CypherPanel({ cypher }) {
  return (
    <div className="cypher-panel">
      <h3>Cypher Query</h3>
      <pre>{cypher}</pre>
    </div>
  );
}

export default CypherPanel;
*/ 

// src/CypherPanel.js
import React from "react";

function CypherPanel({ cypher, onCypherChange }) {
  return (
    <div className="cypher-panel">
      <h3>Cypher test-02 Query</h3>
      <textarea 
        value={cypher} 
        onChange={(e) => onCypherChange(e.target.value)} 
      />
    </div>
  );
}

export default CypherPanel;
