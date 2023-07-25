// src/NodeStylesPanel.js
//import React from 'react';
import ReactModal from 'react-modal';
const shapes = ['ellipse', 'circle', 'database', 'box', 'text'];

function NodeStylesPanel({ isOpen, onRequestClose, labelColors, onLabelColorChange, onLabelShapeChange }) {
  return (
    <ReactModal 
    isOpen={isOpen}
    onRequestClose={onRequestClose}
    contentLabel="Node Styles Modal"
  >
    <div>
      <h2>Node Styles</h2>
      <div className="node-style">
        {Object.entries(labelColors).map(([label, { color, shape }]) => (
          <div key={label}>
            <h3>{label}</h3>
            <div>
              <label>
                Color: 
                <input type="color" value={color} onChange={e => onLabelColorChange(label, e.target.value)} />
              </label>
              <label>
                Shape: 
                <select value={shape} onChange={e => onLabelShapeChange(label, e.target.value)}>
                  {shapes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
    </ReactModal>
  );
}

//export default NodeStylesPanel;


export default NodeStylesPanel;
