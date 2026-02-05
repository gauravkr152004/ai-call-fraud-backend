import sys
import pickle

# Load model
model = pickle.load(open("ml/fraud_model.pkl", "rb"))
vectorizer = pickle.load(open("ml/vectorizer.pkl", "rb"))

# Read text from Node.js
text = sys.argv[1]

X = vectorizer.transform([text])
prediction = model.predict(X)[0]
probability = model.predict_proba(X)[0][1]

status = "Fraud Call" if prediction == 1 else "Real Call"

if probability > 0.75:
    risk = "High"
elif probability > 0.4:
    risk = "Medium"
else:
    risk = "Low"

print(f"{status}|{risk}|{probability}")
