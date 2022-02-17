import React, {useState} from "react";

export default function Menu({toolType,setToolType}) {
    const menus = [
        {
            name: "Select",
            title: "select",
            icon: null
        },
        {
            name: "Pencil",
            title: "pencil",
            icon: null
        },
        {
            name: "Line",
            title: "line",
            icon: null
        },
        {
            name: "Rectangle",
            title: "rectangle",
            icon: null
        }

    ]
    const [selected, setSelected] = useState(toolType)

    return (
        <div style={{display: "flex", flexDirection: "row"}}>
            {
                menus.map(m =>
                    <button
                        onClick={() => {
                            setSelected(m.title)
                            setToolType(m.title)
                        }}
                        style={{
                            border: "1px solid black",
                            justifyContent: "center",
                            alignItems: "center",
                            display: "flex",
                            padding: 5,
                            margin: 1,
                            backgroundColor: selected === m.title ? "#f65b5b" : "#fff"
                        }}>
                        {m.name}
                    </button>)
            }
        </div>
    );
}
