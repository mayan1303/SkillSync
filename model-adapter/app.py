"""Wrap YOUR trained chatbot so the app can call it.  Run:  pip install fastapi uvicorn && uvicorn app:app --port 9000
Then put the URL in a file:  echo "http://localhost:9000/chat" > ../.bot-url   (start.sh picks it up)
The app POSTs {"message", "history":[{"role","content"}], "context": "<data facts + app guide>", "role": "STUDENT|RECRUITER|COURSE_AGENCY"}
and expects {"reply": "..."}.  If this server is down or errors, the app automatically falls back to Claude/Gemini, then to built-in data answers."""
from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()
class Req(BaseModel):
    message: str
    history: list = []
    context: str = ""
    role: str = ""
def my_model_answer(message: str, history: list, context: str) -> str:
    # TODO: replace with a call to your trained model (load it once at startup, then predict here).
    return "Your model is connected, but my_model_answer() still needs your model code."
@app.post("/chat")
def chat(r: Req):
    return {"reply": my_model_answer(r.message, r.history, r.context)}
