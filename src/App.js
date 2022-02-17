import React, { useState, useEffect } from "react";
import rough from "roughjs/bundled/rough.esm";
import "./App.css";
import Swatch from "./components/swatch";
import {
  adjustElementCoordinates,
  createElement,
  cursorForPosition,
  getElementAtPosition,
  resizedCoordinates
} from "./utils";




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

  const midPointBtw = (p1, p2) => {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2,
    };
  };
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
