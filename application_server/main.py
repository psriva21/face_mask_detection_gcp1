import flask
import numpy as np
import pandas as pd
import torchvision
from torchvision import transforms, datasets, models
import torch
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from flask import jsonify, request, render_template, redirect, url_for
from flask_cors import CORS, cross_origin
from PIL import Image
import os

app = flask.Flask(__name__)
app.config['DEBUG'] = True
cors = CORS(app)

device = "cpu"
NO_CLASSES = 4
BASE_FOLDER = './model/model'
MODEL_TYPE = '.pt'

transform = transforms.Compose([transforms.ToTensor(),])

def get_model(no_classes):
    model = torchvision.models.detection.fasterrcnn_mobilenet_v3_large_320_fpn(pretrained=True, progress=False)
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, no_classes)

    return model

@app.route('/', methods = ['GET'])
def home():
    return render_template('index.html')

@app.route('/upload', methods = ['POST'])
@cross_origin()
def upload():
    up_files = request.files.getlist('myfile')
    result = {}
    if up_files is not None and len(up_files) != 0:
        up_file = up_files[0]
        model = get_model(NO_CLASSES)
        model.load_state_dict(torch.load(BASE_FOLDER + MODEL_TYPE, map_location=torch.device('cpu')))
        model.eval()
        model.to(device)
        img = Image.open(up_file).convert("RGB")
        img = transform(img)
        print('Got Image')
        imgs = list([img])
        preds = model(imgs)[0]
        result['boxes'] = preds['boxes'].tolist()
        result['scores'] = preds['scores'].tolist()
        result['labels'] = preds['labels'].tolist()
        print('Got Result')
        print(result)
        del model
        del imgs
        del preds
    result['status_code'] = 200
    return jsonify(result)

if __name__ == "__main__":
    app.run()