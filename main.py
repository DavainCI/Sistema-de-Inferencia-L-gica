# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import re

app = FastAPI(title="Sistema de Inferencia Lógica")

# Configuración de CORS para permitir React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de datos
class Premise(BaseModel):
    statement: str

class Argument(BaseModel):
    premises: List[str]
    conclusion: str

class InferenceRequest(BaseModel):
    premises: List[str]
    rules: List[str]

# Base de conocimiento y reglas
knowledge_base = []

# Reglas de inferencia
def modus_ponens(premises):
    new_knowledge = []
    for i, premise in enumerate(premises):
        match = re.match(r'(.+)\s*->\s*(.+)', premise)
        if match:
            antecedent, consequent = match.groups()
            antecedent = antecedent.strip()
            consequent = consequent.strip()
            
            if antecedent in premises:
                new_knowledge.append(consequent)
    return new_knowledge

def modus_tollens(premises):
    new_knowledge = []
    for i, premise in enumerate(premises):
        match = re.match(r'(.+)\s*->\s*(.+)', premise)
        if match:
            antecedent, consequent = match.groups()
            antecedent = antecedent.strip()
            consequent = consequent.strip()
            
            # Buscar la negación del consecuente
            negated_consequent = f"~{consequent}" if not consequent.startswith("~") else consequent[1:]
            
            if negated_consequent in premises:
                new_knowledge.append(f"~{antecedent}" if not antecedent.startswith("~") else antecedent[1:])
    return new_knowledge

def hypothetical_syllogism(premises):
    new_knowledge = []
    implications = []
    
    # Recopilar todas las implicaciones
    for premise in premises:
        match = re.match(r'(.+)\s*->\s*(.+)', premise)
        if match:
            antecedent, consequent = match.groups()
            implications.append((antecedent.strip(), consequent.strip()))
    
    # Buscar cadenas de implicaciones
    for i, (ant1, cons1) in enumerate(implications):
        for j, (ant2, cons2) in enumerate(implications):
            if i != j and cons1 == ant2:
                new_knowledge.append(f"{ant1} -> {cons2}")
    
    return new_knowledge

# Diccionario de reglas
inference_rules = {
    "Modus Ponens": modus_ponens,
    "Modus Tollens": modus_tollens,
    "Silogismo Hipotético": hypothetical_syllogism
}

# Endpoints de la API
@app.post("/add_premise")
async def add_premise(premise: Premise):
    knowledge_base.append(premise.statement)
    return {"message": "Premisa añadida", "knowledge_base": knowledge_base}

@app.get("/get_knowledge")
async def get_knowledge():
    return {"knowledge_base": knowledge_base}

@app.post("/clear_knowledge")
async def clear_knowledge():
    knowledge_base.clear()
    return {"message": "Base de conocimiento limpiada"}

@app.post("/apply_inference")
async def apply_inference(request: InferenceRequest):
    all_premises = request.premises.copy()
    new_knowledge = []
    
    for rule_name in request.rules:
        if rule_name in inference_rules:
            rule_func = inference_rules[rule_name]
            result = rule_func(all_premises)
            new_knowledge.extend(result)
            all_premises.extend(result)
    
    # Eliminar duplicados
    new_knowledge = list(set(new_knowledge))
    
    return {"new_knowledge": new_knowledge, "all_knowledge": all_premises}

@app.post("/validate_argument")
async def validate_argument(argument: Argument):
    # Simulamos la validación aplicando las reglas de inferencia
    all_premises = argument.premises.copy()
    max_iterations = 10
    iteration = 0
    
    while iteration < max_iterations:
        iteration += 1
        new_knowledge = []
        
        for rule_name, rule_func in inference_rules.items():
            result = rule_func(all_premises)
            new_knowledge.extend(result)
        
        if not new_knowledge:
            break
            
        all_premises.extend(new_knowledge)
        
        # Si encontramos la conclusión, el argumento es válido
        if argument.conclusion in all_premises:
            return {
                "valid": True,
                "message": "El argumento es válido. La conclusión se derivó de las premisas.",
                "derived_statements": all_premises
            }
    
    return {
        "valid": False,
        "message": "El argumento no es válido. No se pudo derivar la conclusión de las premisas.",
        "derived_statements": all_premises
    }

@app.get("/")
async def root():
    return {"message": "Sistema de Inferencia Lógica API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)