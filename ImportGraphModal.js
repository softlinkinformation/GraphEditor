// src/ImportGraphModal.js

import React, { useEffect, useState } from 'react';
import neo4j from 'neo4j-driver';
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, DATABASE } from './Config';
import Modal from 'react-modal';

const ImportGraphModal = ({ isOpen, onRequestClose, onImport }) => {
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const fetchLabels = async () => {
      const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), { database: DATABASE });
      const session = driver.session();

      try {
        const result = await session.run('CALL db.labels()');
        const labels = result.records.map(record => record.get(0));
        setLabels(labels);
      } catch (error) {
        console.error('Error fetching labels:', error);
      } finally {
        session.close();
        driver.close();
      }
    };

    fetchLabels();
  }, []);

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <h2>Import Graph</h2>
      <div className="labels-container">
        {labels.map((label, index) => (
          <button key={index} className="label-button" onClick={() => onImport(label)}>
            {label}
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default ImportGraphModal;
