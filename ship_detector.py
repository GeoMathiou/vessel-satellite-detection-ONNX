import torch
from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io

app = FastAPI()

# Load your trained model (ship.pt) into a YOLOv5 “custom” model
model = torch.hub.load(
    'ultralytics/yolov5', 
    'custom', 
    path='ship.pt',      # adjust path as needed
    force_reload=False
)

@app.post('/detect')
async def detect(file: UploadFile = File(...)):
    img_bytes = await file.read()
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    results = model(img, size=640, conf=0.44, iou=0.45)  # choose your size/conf
    return results.pandas().xyxy[0].to_dict(orient='records')
