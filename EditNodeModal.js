import React, { useState, useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const EditNodeModal = ({ isOpen, nodeData, onConfirm, onCancel }) => {
  const [labels, setLabels] = useState(nodeData ? [nodeData.label] : []);
  const [properties, setProperties] = useState(nodeData ? nodeData.properties || {} : {});

  useEffect(() => {
    if (nodeData) {
      setLabels([nodeData.label]);
      setProperties(nodeData.properties || {});
    }
  }, [nodeData]);

  const handleConfirm = () => {
    onConfirm({
      ...nodeData,
      label: labels.join(", "),
      properties: properties,
    });
  };

  const addLabel = () => {
    setLabels([...labels, ""]);
  };

  const updateLabel = (index, value) => {
    setLabels(labels.map((label, i) => (i === index ? value : label)));
  };

  const removeLabel = (index) => {
    setLabels(labels.filter((_, i) => i !== index));
  };

  const handleKeyChange = (oldKey) => (event) => {
    const newKey = event.target.value;

    setProperties((prevProperties) => {
      const newProperties = { ...prevProperties };
      newProperties[newKey] = newProperties[oldKey];
      delete newProperties[oldKey];

      return newProperties;
    });
  };

  const handleValueChange = (key) => (event) => {
    const newValue = event.target.value;

    setProperties((prevProperties) => ({
      ...prevProperties,
      [key]: newValue,
    }));
  };

  const handleAddProperty = () => {
    setProperties(prevProperties => ({
      ...prevProperties,
      newProperty: '',
    }));
  };

  const handleRemoveProperty = (key) => () => {
    setProperties(prevProperties => {
      const newProperties = {...prevProperties};
      delete newProperties[key];
      return newProperties;
    });
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onCancel}>
      <h2>Edit Node</h2>
      <div>
        Labels:
        {labels.map((label, index) => (
          <div key={index}>
            <input
              type="text"
              value={label}
              onChange={(e) => updateLabel(index, e.target.value)}
            />
            <button onClick={() => removeLabel(index)}>Remove</button>
          </div>
        ))}
        <button onClick={addLabel}>Add Label</button>
      </div>
      <br />
      {Object.entries(properties).map(([key, value]) => (
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
      <br />
      <button onClick={handleConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </Modal>
  );
};

export default EditNodeModal;
