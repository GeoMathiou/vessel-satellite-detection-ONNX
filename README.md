# Ship Detection App

A simple browser app that detects ships in satellite imagery using an ONNX-exported YOLOv5 model.

## Live Demo

Check out a quick walkthrough of the site:

[![Watch the demo video](https://img.youtube.com/vi/MBDnOt4wJqg/0.jpg)](https://youtu.be/MBDnOt4wJqg)


## Prerequisites

- Git
- Node.js (v16+) & npm
- Angular CLI (v13+)
- Modern browser (Chrome/Firefox/Edge)

## Setup & Run

```bash
git clone <repo-url>
cd ship-detection-app
npm install        # installs dependencies
npx ng serve --open  # uses project’s local Angular CLI
```

The app will open at `http://localhost:4200/`.

## Configuration

- **Copernicus API** *(optional)*: copy `src/environments/environment.ts.example` to `environment.ts` and add your credentials. Without it, use local test images.

## Local Test Images

In the UI, choose **Test Image** and pick any sample (`test1.png`, `test2.jpg`, etc.) to see detections.

## (Optional) Retrain Model

If you'd like to retrain or fine‑tune the YOLOv5 model and generate a fresh ONNX file, follow these steps:

1. **Clone the YOLOv5 repo**

   ```bash
   git clone https://github.com/ultralytics/yolov5.git
   cd yolov5
   ```

2. **Prepare the LEVIR‑Ship dataset**

   ```bash
   git clone https://github.com/WindVChen/LEVIR-Ship.git
   ```

   Follow the instructions in `LEVIR-Ship/README.md` to organize images and labels.

3. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Train & export to ONNX**

   ```bash
   python train.py --data LEVIR-Ship/data/levir-ship.yaml --cfg yolov5s.yaml --epochs 100
   python export.py --weights runs/train/exp/weights/best.pt --include onnx
   ```

---

