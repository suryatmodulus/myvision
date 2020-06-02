import { getScrollbarWidth } from '../../../globalStyling/style';
import scrollIntoViewIfNeeded from '../../../utils/tableUtils';
import {
  setCaretPositionOnDiv, getCaretPositionOnDiv, getDefaultFont, isVerticalScrollPresent,
} from '../../../utils/elementCaretUtils';
import { preprocessPastedText, preprocessLabelText } from '../../../utils/textProcessingUtils';
import { getDelta } from '../../../globalStyling/elementDimensions/manager';

let editingActive = false;
let activeTextRow = null;
let activeTextElement = null;
let displayingRedEditButton = false;
let maxWidthStyleAppended = false;
let overflowScrollWidth = 0;
let objectNames = null;
const TABLE_MAX_WIDTH = 352 / getDelta();

let generatedLabelsParentElement = null;
let generatedLabelsTableElement = null;
let generatedLabelsOuterContainerElement = null;
let submitButtonElement = null;
let descriptionElement = null;

function displayHighlightedDefaultEditLabelButton(element) {
  if (activeTextElement !== element && !element.classList.contains('activeLabelEditIcon')) {
    if (!editingActive) {
      element.style.backgroundColor = '#f7f7f7';
      element.childNodes[1].style.display = 'none';
      element.childNodes[3].style.display = '';
    } else if (element !== activeTextRow) {
      element.childNodes[1].style.display = 'none';
      element.childNodes[3].style.display = '';
    }
  }
}

function displayGreyedDefaultEditLabelButton(element) {
  if (activeTextElement !== element && !element.classList.contains('activeLabelEditIcon')) {
    if (!editingActive) {
      element.childNodes[1].style.display = '';
      element.childNodes[3].style.display = 'none';
      element.style.backgroundColor = '';
    } else if (element !== activeTextRow) {
      element.childNodes[1].style.display = '';
      element.childNodes[3].style.display = 'none';
    }
  }
}

function scrollHorizontallyToAppropriateWidth(text) {
  let myCanvas = document.createElement('canvas');
  const context = myCanvas.getContext('2d');
  context.font = getDefaultFont(activeTextElement);
  const metrics = context.measureText(text);
  let originalParentMaxWidth = 337 / getDelta();
  if (isVerticalScrollPresent(generatedLabelsParentElement)) {
    originalParentMaxWidth -= overflowScrollWidth;
  }
  if (metrics.width > originalParentMaxWidth) {
    generatedLabelsParentElement.scrollLeft = metrics.width - 312 / getDelta();
  } else {
    generatedLabelsParentElement.scrollLeft = 0;
  }
  myCanvas = null;
}

function MLLabelTextPaste(event) {
  event.stopPropagation();
  event.preventDefault();
  const clipboardData = event.clipboardData || window.clipboardData;
  const pastedData = clipboardData.getData('Text');
  const caretOnPaste = getCaretPositionOnDiv(activeTextElement, true);
  const caretPositionEnd = caretOnPaste.position;
  const caretPositionStart = caretPositionEnd - caretOnPaste.highlightRangeOnPaste;
  const preprocessedPastedData = preprocessPastedText(pastedData);
  activeTextElement.innerHTML = activeTextElement.innerHTML.slice(0, caretPositionStart)
   + preprocessedPastedData + activeTextElement.innerHTML.slice(caretPositionEnd);
  setCaretPositionOnDiv(caretPositionStart + preprocessedPastedData.length, activeTextElement,
    false, scrollHorizontallyToAppropriateWidth);
}

function updateGeneratedLabelsElementWidth() {
  generatedLabelsParentElement.style.width = `${activeTextRow.clientWidth + overflowScrollWidth}px`;
  if (!maxWidthStyleAppended
      && parseInt(generatedLabelsParentElement.style.width, 10) > TABLE_MAX_WIDTH) {
    generatedLabelsParentElement.style.maxWidth = `${TABLE_MAX_WIDTH}px`;
    generatedLabelsParentElement.style.overflowX = 'auto';
    maxWidthStyleAppended = true;
  } else if (maxWidthStyleAppended
      && parseInt(generatedLabelsParentElement.style.width, 10) < TABLE_MAX_WIDTH) {
    generatedLabelsParentElement.style.maxWidth = '';
    generatedLabelsParentElement.style.overflowX = 'hidden';
    maxWidthStyleAppended = false;
  }
}

function changeEditedLabelText(text) {
  activeTextElement.innerHTML = text;
  window.setTimeout(() => {
    updateGeneratedLabelsElementWidth();
  }, 1);
}

function setEditingStateToFalse() {
  setTimeout(() => {
    editingActive = false;
    activeTextRow = null;
    activeTextElement = null;
  }, 1);
}

function stopEditingActiveTextElement() {
  activeTextElement.contentEditable = false;
  activeTextRow.style.backgroundColor = '';
  activeTextRow.childNodes[1].style.display = '';
  if (displayingRedEditButton) {
    activeTextRow.childNodes[7].style.display = 'none';
    displayingRedEditButton = false;
  } else {
    activeTextRow.childNodes[5].style.display = 'none';
  }
  activeTextRow.style.cursor = 'pointer';
  setEditingStateToFalse();
}

function getLastDigitFromText(text) {
  if (text.match(/\d+$/)) {
    return text.match(/\d+$/)[0];
  }
  return -1;
}

function isElementIdNotTheGeneratedLabelsElementId(element) {
  if (element.id.startsWith('MLLabel')) {
    const elementIdNumber = getLastDigitFromText(element.id);
    const activeTextElementIdNumber = getLastDigitFromText(activeTextElement.id);
    return elementIdNumber !== activeTextElementIdNumber;
  }
  return true;
}

function isElementNotTheCurrentlyActiveTextRow(element) {
  return activeTextRow && activeTextRow !== element;
}

function isElementNotTheCurrentlyActiveTextElement(element) {
  return activeTextElement && activeTextElement !== element;
}

function canChangeRowToStopEdit(element) {
  if (isElementNotTheCurrentlyActiveTextElement(element)
    && isElementNotTheCurrentlyActiveTextRow(element)
    && isElementIdNotTheGeneratedLabelsElementId(element)) {
    return true;
  }
  return false;
}

function setTextElementContentToEditable() {
  activeTextElement.contentEditable = true;
}

function setElementStyleToActive(element) {
  element.style.backgroundColor = '#f7f7f7';
  setTextElementContentToEditable();
  element.childNodes[5].style.display = '';
  element.childNodes[1].style.display = 'none';
  element.childNodes[3].style.display = 'none';
  element.style.cursor = 'auto';
}

function setActiveElementProperties(element) {
  activeTextRow = element;
  activeTextElement = element.childNodes[9];
}

function changeRowToEdit(element) {
  if (element !== activeTextRow) {
    const textElement = element.childNodes[9];
    setActiveElementProperties(element);
    setElementStyleToActive(element);
    scrollIntoViewIfNeeded(textElement, generatedLabelsParentElement);
    setCaretPositionOnDiv(textElement.innerHTML.length, textElement, false,
      scrollHorizontallyToAppropriateWidth);
    editingActive = true;
  }
}

function displayRedEditButtonIfActiveTextEmpty() {
  const preprocessedText = preprocessLabelText(activeTextElement.innerHTML);
  if (preprocessedText === '') {
    activeTextRow.childNodes[5].style.display = 'none';
    activeTextRow.childNodes[7].style.display = '';
    displayingRedEditButton = true;
  } else if (displayingRedEditButton) {
    activeTextRow.childNodes[5].style.display = '';
    activeTextRow.childNodes[7].style.display = 'none';
    displayingRedEditButton = false;
  }
}

function updateGeneratedLabelsParentElementWidthOnStartup() {
  activeTextRow = generatedLabelsTableElement.childNodes[1].childNodes[0].childNodes[0];
  updateGeneratedLabelsElementWidth();
  activeTextRow = null;
}

function calculateContainerDivHeight() {
  const numberOfRows = Object.keys(objectNames).length;
  const baseHeight = numberOfRows > 1 ? 104 : 114;
  const numberOfVisibleRows = numberOfRows > 5 ? 5 : numberOfRows;
  const newNameHeight = baseHeight / getDelta() + numberOfVisibleRows * 10;
  return `${newNameHeight}px`;
}

function changeElementsToVisible() {
  generatedLabelsOuterContainerElement.style.display = '';
  generatedLabelsOuterContainerElement.style.height = calculateContainerDivHeight();
}

function changeElementsToMoveListUpwards() {
  submitButtonElement.style.marginTop = `${2 / getDelta()}px`;
  submitButtonElement.style.marginBottom = `${6 / getDelta()}px`;
  descriptionElement.style.marginBottom = `${6 / getDelta()}px`;
}

function resetElementsToMoveListToDefaultPosition() {
  submitButtonElement.style.marginTop = '';
  submitButtonElement.style.marginBottom = '';
  descriptionElement.style.marginBottom = '';
}

function createLabelElementMarkup(labelText, id) {
  return `
    <div class="machine-learning-modal-generated-labels-row" onClick="editMachineLearningLabel(this)" onMouseEnter="displayMachineLearningModalEditLabelButton(this)" onMouseLeave="hideMachineLearningModalEditLabelButton(this)">
      <img class="defaultLabelEditIcon machine-learning-modal-generated-labels-edit-icon" src="edit-disabled.svg" alt="edit">
      <img id="MLLabelHighlightedEditButton${id}" class="defaultLabelEditIcon machine-learning-modal-generated-labels-edit-icon" style="display: none" src="edit.svg" alt="edit">
      <img id="MLLabelActiveEditButton${id}" class="defaultLabelEditIcon machine-learning-modal-generated-labels-edit-icon reverse-icon" style="display: none" src="edit-blue.svg" alt="edit">
      <img id="MLLabelDisabledEditButton${id}" class="defaultLabelEditIcon machine-learning-modal-generated-labels-edit-icon reverse-icon" style="display: none" src="edit-red.svg" alt="edit">
      <div id="MLLabelText${id}" class="machine-learning-modal-generated-labels-input" spellcheck="false" onkeydown="MLLabelTextKeyDown(event)" onpaste="MLLabelTextPaste(event)">${labelText}</div>
    </div>
  `;
}

// fix for chrome where upon clicking on a row to edit, the row height
// would get smaller
function triggerContentEditableOnce(cell) {
  const textInput = cell.childNodes[1].childNodes[9];
  textInput.contentEditable = true;
  setTimeout(() => {
    textInput.contentEditable = false;
  });
}

function populateGeneratedLabelsTable() {
  let index = 0;
  Object.keys(objectNames).forEach((key) => {
    const newNameRow = generatedLabelsTableElement.insertRow(-1);
    const cell = newNameRow.insertCell(0);
    cell.innerHTML = createLabelElementMarkup(objectNames[key].pendingName, index);
    index += 1;
    triggerContentEditableOnce(cell);
  });
  if (index > 4) {
    changeElementsToMoveListUpwards();
  } else {
    resetElementsToMoveListToDefaultPosition();
  }
}

function changeModalDescription() {
  descriptionElement.innerHTML = 'The following names were automatically assigned to the generated objects, you can edit them below:';
}

function displayDescription() {
  descriptionElement.style.display = '';
}

function setLocalVariables() {
  overflowScrollWidth = getScrollbarWidth();
}

function displayViewElements(objectNamesArg) {
  objectNames = objectNamesArg;
  setLocalVariables();
  changeModalDescription();
  displayDescription();
  populateGeneratedLabelsTable();
  changeElementsToVisible();
  updateGeneratedLabelsParentElementWidthOnStartup();
}

function removeGeneratedLabelsTableRows() {
  const newtbody = document.createElement('tbody');
  if (generatedLabelsTableElement.childNodes[1]) {
    generatedLabelsTableElement.replaceChild(newtbody, generatedLabelsTableElement.childNodes[1]);
  }
}

function hideGeneratedLabelsViewAssets() {
  generatedLabelsOuterContainerElement.style.display = 'none';
  removeGeneratedLabelsTableRows();
}

function assignGeneratedLabelsViewLocalVariables() {
  descriptionElement = document.getElementById('machine-learning-modal-description');
  generatedLabelsParentElement = document.getElementById('machine-learning-modal-generated-labels');
  submitButtonElement = document.getElementById('machine-learning-modal-generated-labels-submit-button');
  generatedLabelsTableElement = document.getElementById('machine-learning-modal-generated-labels-table');
  generatedLabelsOuterContainerElement = document.getElementById('machine-learning-modal-generated-labels-outer-container');
}

export {
  scrollHorizontallyToAppropriateWidth, displayViewElements,
  displayGreyedDefaultEditLabelButton, changeEditedLabelText,
  assignGeneratedLabelsViewLocalVariables, canChangeRowToStopEdit,
  hideGeneratedLabelsViewAssets, changeRowToEdit, MLLabelTextPaste,
  stopEditingActiveTextElement, displayRedEditButtonIfActiveTextEmpty,
  updateGeneratedLabelsElementWidth, displayHighlightedDefaultEditLabelButton,
};
