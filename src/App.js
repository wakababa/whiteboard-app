import React, { useState, useEffect } from "react";
import rough from "roughjs/bundled/rough.esm";
import "./App.css";
import Menu from "./components/Menu";
import {
  adjustElementCoordinates,
  createElement,
  cursorForPosition,
  getElementAtPosition,
  resizedCoordinates
} from "./utils";

const Colors=({onPickColor})=> <input style={{width:45,height:45}} type={"color"} onChange={(e,value)=>onPickColor(e.target.value)} />

function App() {
  const [elements, setElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [points, setPoints] = useState([]);
  const [action, setAction] = useState("none");
  const [toolType, setToolType] = useState("pencil");
  const [selectedElement, setSelectedElement] = useState(null);
  const [color,setColor] = useState("#000")

  const [shapeWidth, setShapeWidth] = useState(1);


  function getMousePosition(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      clientX: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
      clientY: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
  }
  const getCanvas=()=>{
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    return {canvas,context}
  }
  const undo=()=>setElements(elements.slice(0, -1))

  const midPointBtw = (p1, p2) => {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2,
    };
  };

  useEffect(() => {
    const {canvas,context} = getCanvas()
    context.lineCap = "round";
    context.lineJoin = "round";
    context.save();
    const roughCanvas = rough.canvas(canvas);

    elements.forEach(({stroke,index, type, roughElement,strokeColor ,...props}) => {
      if(type === "pencil"){
        context.beginPath();
        props.data.forEach((point, i) => {
          let midPoint = midPointBtw(point.clientX, point.clientY);
          context.strokeStyle =  strokeColor;
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

  const updateElement = (index, x1, y1, x2, y2, toolType,strokeColor,process) => {
    console.log("strokeColor",strokeColor,process)
    const updatedElement = createElement(index, x1, y1, x2, y2, toolType, 1, strokeColor);
    const elementsCopy = [...elements];
    elementsCopy[index] = updatedElement;
    setElements(elementsCopy);
  };

  const handleMouseDown = (e) => {
   const { clientX, clientY }= getMousePosition(document.getElementById("canvas"),e)
   const {context} = getCanvas()

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
    } else {
      const id = elements.length;
      if (toolType === "pencil" || toolType === "brush") {
        setAction("sketching");
        setIsDrawing(true);
       // TODO Here need to be generic
        const newLineWidth = 1;
        const transparency = toolType === "brush" ? "0.1" : "1.0";
        const newEle = {
          clientX,
          clientY,
          color,
          newLineWidth,
          transparency,
        };
        setPoints((state) => [...state, newEle]);

        context.strokeStyle = color;
        context.lineWidth = newLineWidth;
        context.lineCap = 5;
        context.moveTo(clientX, clientY);
        context.beginPath();

      } else {
        setAction("drawing");
        // TODO Here need to be generic
        const newWidth = 1;
        const element = createElement(
            id,
            clientX,
            clientY,
            clientX,
            clientY,
            toolType,
            newWidth,
            color
        );
        setElements((prevState) => [...prevState, element]);
        setSelectedElement(element);
      }
    }
  };

  const handleMouseMove = (e) => {
    const {canvas,context} = getCanvas()
    const { clientX, clientY }= getMousePosition(canvas,e)

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
      let midPoint = midPointBtw(clientX, clientY);
      context.quadraticCurveTo(clientX, clientY, midPoint.x, midPoint.y);
      context.lineTo(clientX, clientY);
      context.stroke();
    }
     else if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 , strokeColor } = elements[index];

      updateElement(index, x1, y1, clientX, clientY, toolType,strokeColor,"sketching-move");
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
          strokeColor,
          "moving"
      );
    } else if (action === "resize") {
      const { id, type, position,strokeColor, ...coordinates } = selectedElement;
      const { x1, y1, x2, y2 } = resizedCoordinates(
          clientX,
          clientY,
          position,
          coordinates
      );
      updateElement(id, x1, y1, x2, y2, type, shapeWidth,strokeColor,"resize");
    }

  };
  const handleMouseUp = () => {
    if (action === "resize") {
      const index = selectedElement.id;
      const { id, type, strokeWidth, strokeColor } = elements[index];
      const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
      updateElement(id, x1, y1, x2, y2, type, strokeColor,"resize");
    } else if (action === "drawing") {
      const index = selectedElement.id;
      const { id, type, strokeWidth ,strokeColor } = elements[index];
      const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
      // TODO GENERIC
      updateElement(id, x1, y1, x2, y2, type, strokeColor,"drawing");
    } else if (action === "sketching") {
      const {canvas,context} = getCanvas()
      context.closePath();
      const element = points;
      setPoints([]);
      setElements((prevState) => [...prevState, {
        type:"pencil",
        data:element,
        strokeColor:color
      }]); //tuple
      setIsDrawing(false);
    }
    setAction("none");
  };

  return (
    <div>

      <div style={{display:"flex",gap:1,backgroundColor:"#ebebeb"}}>
        <Menu toolType={toolType} setToolType={setToolType} />
        <Colors onPickColor={(val)=>setColor(val)} />
        <button onClick={undo}>Undo</button>
      </div>
      <canvas
        style={{backgroundColor:"rgb(249 249 249)"}}
        id="canvas"
        className="App"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
}

export default App;
