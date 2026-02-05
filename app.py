from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import pickle

# Load ML model
model = pickle.load(open("ml/fraud_model.pkl", "rb"))
vectorizer = pickle.load(open("ml/vectorizer.pkl", "rb"))

app = FastAPI()

# ---------- Request Schema ----------
class CallData(BaseModel):
    transcript: str


# ---------- Text Analysis ----------
@app.post("/analyze-call")
def analyze_call(data: CallData):
    text = data.transcript

    X = vectorizer.transform([text])
    prob = model.predict_proba(X)[0][1]
    prediction = model.predict(X)[0]

    status = "Fraud Call" if prediction == 1 else "Real Call"
    risk = "High" if prob > 0.75 else "Medium" if prob > 0.4 else "Low"

    return {
        "status": status,
        "risk_level": risk,
        "probability": float(prob)
    }


# ---------- Audio Upload (Prototype) ----------
@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    # ⚠️ Prototype: No speech-to-text yet
    transcript = "This is a dummy transcript from audio"

    X = vectorizer.transform([transcript])
    prob = model.predict_proba(X)[0][1]
    prediction = model.predict(X)[0]

    status = "Fraud Call" if prediction == 1 else "Real Call"
    risk = "High" if prob > 0.75 else "Medium" if prob > 0.4 else "Low"

    return {
        "transcript": transcript,
        "status": status,
        "risk_level": risk,
        "probability": float(prob)
    }
