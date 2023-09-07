import React, { useState, useEffect } from "react";
import Modal from "react-modal";

function EditEdgeModal({ isOpen, edgeData, onConfirm, onCancel, setGraphData  }) {
  const [edgeType, setEdgeType] = useState("");
  const [edgeProperties, setEdgeProperties] = useState({});

  useEffect(() => {
    if (edgeData) {
      setEdgeType(edgeData.label);
      setEdgeProperties(edgeData.properties || {});
    }
  }, [edgeData]);

  const handleConfirm = async () => {
    const newEdgeData = { ...edgeData, label: edgeType, properties: edgeProperties };
  
    onConfirm(newEdgeData);
  
    // Here, we update the edge in our state
    /*setGraphData((prevData) => {
      const updatedEdges = prevData.edges.map((edge) => edge.id === newEdgeData.id ? newEdgeData : edge);
      return { ...prevData, edges: updatedEdges };
    });
  
    await saveGraph();  // Call to save graph */
  };

  const handleKeyChange = (oldKey) => (event) => {
    const newKey = event.target.value;

    setEdgeProperties((prevProperties) => {
      const newProperties = { ...prevProperties };
      newProperties[newKey] = newProperties[oldKey];
      delete newProperties[oldKey];

      return newProperties;
    });
  };

  const handleValueChange = (key) => (event) => {
    const newValue = event.target.value;

    setEdgeProperties((prevProperties) => ({
      ...prevProperties,
      [key]: newValue,
    }));
  };

  const handleAddProperty = () => {
    setEdgeProperties(prevProperties => ({
      ...prevProperties,
      newProperty: '',
    }));
  };

  const handleRemoveProperty = (key) => () => {
    setEdgeProperties(prevProperties => {
      const newProperties = {...prevProperties};
      delete newProperties[key];
      return newProperties;
    });
  };

  return (
    <Modal isOpen={isOpen}>
      <h2>Edit Edge</h2>
      <label>
        Type:
        <input type="text" value={edgeType} onChange={e => setEdgeType(e.target.value)} />
      </label>
      {Object.entries(edgeProperties).map(([key, value]) => (
        <div key={key}>
          <label>
            Key:
            <input type="text" defaultValue={key} onBlur={handleKeyChange(key)} />
          </label>
          <label>
            Value:
            <input type="text" value={value} onChange={handleValueChange(key)} />
          </label>
          <button onClick={handleRemoveProperty(key)}>Remove property</button>
        </div>
      ))}
      <button onClick={handleAddProperty}>Add property</button>
      <button onClick={handleConfirm}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </Modal>
  );
}

export default EditEdgeModal;
