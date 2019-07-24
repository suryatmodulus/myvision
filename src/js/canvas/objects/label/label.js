import labelProperies from './properties';

let canvas = null;
// be careful about this as we will need to look into doing this for multiple
const labelObjects = {};

function addLabelRef(labelObj, id) {
  labelObjects[id] = labelObj;
}

function getLabelById(id) {
  return labelObjects[id];
}

function removeLabel(id) {
  canvas.remove(labelObjects[id]);
  delete labelObjects[id];
}

function setPolygonLabelOffsetProps(polygon, point) {
  polygon.labelOffsetLeft = polygon.left
    - (point.x - labelProperies.offsetCoordinates.left);
  polygon.labelOffsetTop = polygon.top
    - (point.y - labelProperies.offsetCoordinates.top);
}

function changeObjectLabelText(id, text) {
  labelObjects[id].text = text;
  canvas.renderAll();
}

function setLabelsVisibilityProperty(state) {
  Object.keys(labelObjects).forEach((label) => {
    labelObjects[label].visible = state;
  });
  canvas.renderAll();
}

function assignCanvasForLabelManipulation(canvasObj) {
  canvas = canvasObj;
}

export {
  setPolygonLabelOffsetProps, getLabelById, addLabelRef,
  setLabelsVisibilityProperty, removeLabel, changeObjectLabelText,
  assignCanvasForLabelManipulation,
};
