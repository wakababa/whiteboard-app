import rough from "roughjs/bundled/rough.esm";
const generator = rough.generator();

// Check position of mouse on resize && move
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
// Move drawings coordinates by mouse positions
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
// Create Element by Rough library
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

// Adjust to new Coordinates for Resize or Use  for drawing
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


// Position check every corner
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

export const colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
