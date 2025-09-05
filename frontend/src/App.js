// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [premise, setPremise] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [selectedRules, setSelectedRules] = useState([]);
  const [newKnowledge, setNewKnowledge] = useState([]);
  const [argumentPremises, setArgumentPremises] = useState('');
  const [argumentConclusion, setArgumentConclusion] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const rules = [
    "Modus Ponens",
    "Modus Tollens",
    "Silogismo Hipotético"
  ];

  // Cargar la base de conocimiento al iniciar
  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await fetch('http://localhost:8000/get_knowledge');
      const data = await response.json();
      setKnowledgeBase(data.knowledge_base);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
    }
  };

  const addPremise = async () => {
    try {
      const response = await fetch('http://localhost:8000/add_premise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statement: premise }),
      });
      const data = await response.json();
      setKnowledgeBase(data.knowledge_base);
      setPremise('');
    } catch (error) {
      console.error('Error adding premise:', error);
    }
  };

  const clearKnowledge = async () => {
    try {
      const response = await fetch('http://localhost:8000/clear_knowledge', {
        method: 'POST',
      });
      const data = await response.json();
      setKnowledgeBase([]);
      setNewKnowledge([]);
    } catch (error) {
      console.error('Error clearing knowledge:', error);
    }
  };

  const applyInference = async () => {
    try {
      const response = await fetch('http://localhost:8000/apply_inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          premises: knowledgeBase,
          rules: selectedRules,
        }),
      });
      const data = await response.json();
      setNewKnowledge(data.new_knowledge);
      setKnowledgeBase(data.all_knowledge);
    } catch (error) {
      console.error('Error applying inference:', error);
    }
  };

  const validateArgument = async () => {
    try {
      const premises = argumentPremises.split('\n').filter(p => p.trim() !== '');
      
      const response = await fetch('http://localhost:8000/validate_argument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          premises: premises,
          conclusion: argumentConclusion,
        }),
      });
      const data = await response.json();
      setValidationResult(data);
    } catch (error) {
      console.error('Error validating argument:', error);
    }
  };

  const handleRuleChange = (rule) => {
    if (selectedRules.includes(rule)) {
      setSelectedRules(selectedRules.filter(r => r !== rule));
    } else {
      setSelectedRules([...selectedRules, rule]);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistema de Inferencia Lógica</h1>
      </header>

      <div className="container">
        <section className="section">
          <h2>Gestión de Premisas</h2>
          <div className="input-group">
            <input
              type="text"
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="Ingresa una premisa (ej: P -> Q)"
            />
            <button onClick={addPremise}>Añadir Premisa</button>
            <button onClick={clearKnowledge}>Limpiar Base</button>
          </div>

          <h3>Base de Conocimiento</h3>
          <ul>
            {knowledgeBase.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="section">
          <h2>Aplicar Reglas de Inferencia</h2>
          <div className="rules">
            {rules.map(rule => (
              <label key={rule} className="checkbox">
                <input
                  type="checkbox"
                  checked={selectedRules.includes(rule)}
                  onChange={() => handleRuleChange(rule)}
                />
                {rule}
              </label>
            ))}
          </div>
          <button onClick={applyInference}>Aplicar Reglas</button>

          {newKnowledge.length > 0 && (
            <div>
              <h3>Nuevo Conocimiento Generado</h3>
              <ul>
                {newKnowledge.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="section">
          <h2>Validar Argumento</h2>
          <div className="input-group">
            <textarea
              value={argumentPremises}
              onChange={(e) => setArgumentPremises(e.target.value)}
              placeholder="Ingresa las premisas, una por línea (ej: P -> Q)"
              rows="4"
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              value={argumentConclusion}
              onChange={(e) => setArgumentConclusion(e.target.value)}
              placeholder="Ingresa la conclusión (ej: Q)"
            />
          </div>
          <button onClick={validateArgument}>Validar Argumento</button>

          {validationResult && (
            <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
              <h3>Resultado de la Validación</h3>
              <p>{validationResult.message}</p>
              {validationResult.derived_statements && (
                <div>
                  <h4>Proposiciones Derivadas</h4>
                  <ul>
                    {validationResult.derived_statements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;