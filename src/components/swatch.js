import React from "react";

export default function Swatch({ setToolType }) {
  return (
    <div>
      <div className="row">
        <div className="col-md-12">
          <div>
              <button
                  title="Select"
                  onClick={() => {
                      setToolType("select");
                  }}
              >
                  Select
              </button>
            <button
              title="Pencil"
              onClick={() => {
                setToolType("pencil");
              }}
            >
              Pencil
            </button>
            <button
              title="Line"
              onClick={() => {
                setToolType("line");
              }}
            >
              Line
            </button>
              <button
                  title="Rectangl"
                  onClick={() => {
                      setToolType("rectangle");
                  }}
              >
                  Rectangle
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
