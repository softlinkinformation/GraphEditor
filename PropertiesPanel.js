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

  if (!node) return <div>Please select a node</div>;

  return (
    <div>
      <h3>Node Properties</h3>
      {Object.entries(properties).map(([key, value]) => (
        <div key={key}>
          <label>{key}:</label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}

export default PropertiesPanel;
