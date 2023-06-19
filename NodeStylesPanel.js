// src/NodeStylesPanel.js
import React from 'react';

const shapes = ['ellipse', 'circle', 'database', 'box', 'text'];

function NodeStylesPanel({ labelColors, onLabelColorChange, onLabelShapeChange }) {
  return (
    <div>
      <h2>Node Styles</h2>
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
  );
}

export default NodeStylesPanel;
