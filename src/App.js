import React, { useState, useEffect } from "react";
import "./App.css";
import Swatch from "./components/swatch";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();
export const cursorForPosition = (position) => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};
export const resizedCoordinates = (clientX, clientY, position, coordinates) => {
  const { x1, y1, x2, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return null;
  }
};
export function createElement(id, x1, y1, x2, y2, type, width, strokeColor) {
  let roughElement = null;
  //console.log("calling create element....");
  switch (type) {
    case "line":
      roughElement = generator.line(x1, y1, x2, y2, {
        stroke: strokeColor,
        strokeWidth: width,
      });
      break;
    case "rectangle":
      roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
        stroke: strokeColor,
        strokeWidth: width,
      });
      break;
    case "circle":
      roughElement = generator.circle(
          x1,
          y1,
          2 * Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
          {
            stroke: strokeColor,
            strokeWidth: width,
          }
      );
      break;
    case "triangle":
      roughElement = generator.linearPath(
          [
            [x1, y1],
            [x2, y2],
            [x1, y2],
            [x1, y1],
          ],
          {
            stroke: strokeColor,
            strokeWidth: width,
          }
      );
      break;
    default:
      generator.line(0, 0, 0, 0);
  }

  return {
    id,
    x1,
    y1,
    x2,
    y2,
    type,
    roughElement,
    width,
    strokeColor,
  };
}
const midPointBtw = (p1, p2) => {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2,
  };
};

export const adjustElementCoordinates = (element) => {
  const { type, x1, y1, x2, y2 } = element;
  if (x1 < x2 || (x1 === x2 && y1 < y2)) {
    return { x1, y1, x2, y2 };
  } else {
    return { x1: x2, y1: y2, x2: x1, y2: y1 };
  }
};
const nearPoint = (x, y, x1, y1, name) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};
const distance = (a, b) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const positionWithinElement = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;
  if (type === "rectangle") {
    const topLeft = nearPoint(x, y, x1, y1, "tl");
    const topRight = nearPoint(x, y, x2, y1, "tr");
    const bottomLeft = nearPoint(x, y, x1, y2, "bl");
    const bottomRight = nearPoint(x, y, x2, y2, "br");
    const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    return topLeft || inside || topRight || bottomLeft || bottomRight;
  } else {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    const start = nearPoint(x, y, x1, y1, "start");
    const end = nearPoint(x, y, x2, y2, "end");
    const inside = Math.abs(offset) < 1 ? "inside" : null;
    return start || end || inside;
  }
};
export const getElementAtPosition = (x, y, elements) => {
  return elements
      .map((ele) => ({
        ...ele,
        position: positionWithinElement(x, y, ele),
      }))
      .find((ele) => ele.position !== null);
};



function App() {
  const [elements, setElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [points, setPoints] = useState([]);
  const [action, setAction] = useState("none");
  const [toolType, setToolType] = useState("pencil");
  const [selectedElement, setSelectedElement] = useState(null);
  const [colorWidth, setColorWidth] = useState({
    hex: "#000",
    hsv: {},
    rgb: {},
  });
  const [width, setWidth] = useState(1);
  const [popped, setPopped] = useState(false);
  const [shapeWidth, setShapeWidth] = useState(1);


  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      clientX: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
      clientY: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
  }

  const undo=()=>setElements(elements.slice(0, -1))


  const colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
  useEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";

    context.save();



    const roughCanvas = rough.canvas(canvas);



    elements.forEach(({stroke,index, type, roughElement ,...props}) => {
      if(type === "pencil"){
        context.beginPath();
        props.data.forEach((point, i) => {
          var midPoint = midPointBtw(point.clientX, point.clientY);
          context.strokeStyle = colorArray[index];
          context.quadraticCurveTo(
              point.clientX,
              point.clientY,
              midPoint.x,
              midPoint.y
          );
          context.lineTo(point.clientX, point.clientY);
          context.stroke();
        });
        context.closePath();
        context.save();
      }else{
        context.globalAlpha = "1";
        roughCanvas.draw(roughElement);
      }
    });

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);

  const updateElement = (index, x1, y1, x2, y2, toolType) => {
    const updatedElement = createElement(index, x1, y1, x2, y2, toolType, 1, "#000");
    const elementsCopy = [...elements];
    elementsCopy[index] = updatedElement;
    setElements(elementsCopy);
  };

  const handleMouseDown = (e) => {
    console.log(toolType);

   const { clientX, clientY }= getMousePos(document.getElementById("canvas"),e)

    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    const id = elements.length;

    if (toolType === "select") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({ ...element, offsetX, offsetY });
        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resize");
        }
      }
    } else if (toolType === "eraser") {
      setAction("erasing");

/*
      checkPresent(clientX, clientY);
*/
    } else {
      const id = elements.length;
      if (toolType === "pencil" || toolType === "brush") {
        setAction("sketching");
        setIsDrawing(true);
       // TODO Here need to be generic
        const newColour = "black";
        const newLineWidth = 1;
        const transparency = toolType === "brush" ? "0.1" : "1.0";
        const newEle = {
          clientX,
          clientY,
          newColour,
          newLineWidth,
          transparency,
        };
        setPoints((state) => [...state, newEle]);

        context.strokeStyle = newColour;
        context.lineWidth = newLineWidth;
        context.lineCap = 5;
        context.moveTo(clientX, clientY);
        context.beginPath();
      } else {
        setAction("drawing");
        // TODO Here need to be generic
        const newColour = "black";
        const newWidth = 1;
        const element = createElement(
            id,
            clientX,
            clientY,
            clientX,
            clientY,
            toolType,
            newWidth,
            newColour
        );

        setElements((prevState) => [...prevState, element]);
        setSelectedElement(element);
      }
    }
  };

  const handleMouseMove = (e) => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const { clientX, clientY }= getMousePos(canvas,e)

    if (toolType === "select") {
      const element = getElementAtPosition(clientX, clientY, elements);
      e.target.style.cursor = element
          ? cursorForPosition(element.position)
          : "default";
    }
     if (action === "sketching") {
      if (!isDrawing) return;
      const transparency = points[points.length - 1].transparency;
      const newEle = { clientX, clientY, transparency };

      setPoints((state) => [...state, newEle]);
      var midPoint = midPointBtw(clientX, clientY);
      context.quadraticCurveTo(clientX, clientY, midPoint.x, midPoint.y);
      context.lineTo(clientX, clientY);
      context.stroke();
    } else if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];

      updateElement(index, x1, y1, clientX, clientY, toolType);
    }
    else if (action === "moving") {
      const {
        id,
        x1,
        x2,
        y1,
        y2,
        type,
        offsetX,
        offsetY,
        shapeWidth,
        strokeColor,
      } = selectedElement;
      const offsetWidth = x2 - x1;
      const offsetHeight = y2 - y1;
      const newX = clientX - offsetX;
      const newY = clientY - offsetY;

      updateElement(
          id,
          newX,
          newY,
          newX + offsetWidth,
          newY + offsetHeight,
          type,
          shapeWidth,
          strokeColor
      );
    } else if (action === "resize") {
      const { id, type, position, ...coordinates } = selectedElement;
      const { x1, y1, x2, y2 } = resizedCoordinates(
          clientX,
          clientY,
          position,
          coordinates
      );
      updateElement(id, x1, y1, x2, y2, type, shapeWidth, colorWidth.hex);
    }

  };
  const handleMouseUp = () => {
    if (action === "resize") {
      const index = selectedElement.id;
      const { id, type, strokeWidth, strokeColor } = elements[index];
      const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
      updateElement(id, x1, y1, x2, y2, type, strokeWidth, strokeColor);
    } else if (action === "drawing") {
      const index = selectedElement.id;
      const { id, type, strokeWidth } = elements[index];
      const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
      // TODO GENERIC
      updateElement(id, x1, y1, x2, y2, type, strokeWidth, "#000");
    } else if (action === "sketching") {
      const canvas = document.getElementById("canvas");
      const context = canvas.getContext("2d");
      context.closePath();
      const element = points;
      setPoints([]);
      setElements((prevState) => [...prevState, {
        type:"pencil",
        data:element
      }]); //tuple
      setIsDrawing(false);
    }
    setAction("none");
  };


  return (
    <div>
      <div>
        <Swatch setToolType={setToolType} />
      </div>
      <div>
        <button onClick={undo}>Undo</button>
      </div>
      <canvas
        id="canvas"
        className="App"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        Canvas
      </canvas>
    </div>
  );
}

export default App;
