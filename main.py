from fastapi import FastAPI
import numpy as np
XOR_KEY = bytes.fromhex("4b6579")

app = FastAPI()

@app.get("/crypto")
def crypto(text: str = "test"):
    encrypted = bytes([b ^ XOR_KEY[i % len(XOR_KEY)] for i, b in enumerate(text.encode())])
    return {"input": text, "xor_output": encrypted.decode("latin-1"), "status": "OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
