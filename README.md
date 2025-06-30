# SatelliteImageIdentification

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.16.

## Training:

Train was made with command:
python train.py \
  --img 640 \
  --batch 8 \
  --epochs 50 \
  --data ../data/ships.yaml \
  --cfg models/yolov5s.yaml \
  --weights yolov5s.pt \
  --hyp ../data/hyps/low-hyp.yaml \
  --device 0 \
  --workers 2

--img 640 – input image size of 640×640

--batch 8 – batch size of 8 (fits in 6 GB VRAM)

--epochs 50 – train for 50 epochs

--data ../data/ships.yaml – your dataset config (train/val paths)

--cfg models/yolov5s.yaml – YOLOv5s architecture

--weights yolov5s.pt – start from the COCO-pretrained YOLOv5s checkpoint

--hyp ../data/hyps/low-hyp.yaml – your custom hyperparameters (lr0 = 0.001, mosaic = 0, etc.)

--device 0 – use GPU 0 (your GTX 1660 Ti)

--workers 2 – two data‐loading workers (to keep the GPU fed)

## Notes

--Added in train.py -> os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

## Export to ONNX

python export.py \
  --weights ../ship.pt \
  --img 640 \
  --batch 1 \
  --include onnx