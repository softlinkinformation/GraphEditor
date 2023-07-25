// src/PropertiesPanel.js
import React, { useState, useEffect } from "react";

function PropertiesPanel({ node, onSave }) {
  const [properties, setProperties] = useState(node?.properties || {});

  useEffect(() => {
    setProperties(node?.properties || {});
  }, [node]);

  const handleChange = (key, value) => {
    setProperties({ ...properties, [key]: value });
  };

  const handleSave = () => {
    onSave({ ...node, properties });
  };

  //if (!node) return <div>Please select a node</div>;

  return (
    <div>
      <h4>Node Properties</h4>
      {Object.entries(properties).map(([key, value]) => (
        <div key={key}>
          <label>{key} : {value} </label>
      
        </div>
      ))}

    </div>
  );
}

export default PropertiesPanel;
