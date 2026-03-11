import React, { useRef, useEffect, useState } from 'react';
import {
  drawCircle,
  drawRect,
  drawArrow,
  drawFreehand,
  drawText,
} from '../utils/drawingUtils';

export default function DrawingCanvas({
  isOpen,
  videoFrame,
  onDrawingComplete,
  onClose,
}) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('circle');
  const [color, setColor] = useState('red');
  const [brushSize, setBrushSize] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [start, setStart] = useState(null);
  const [paths, setPaths] = useState([]); // array of drawing objects
  const [currentPath, setCurrentPath] = useState([]); // freehand

  const [textInput, setTextInput] = useState('');

  const adjustCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !videoFrame) return;
    const rect = videoFrame.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.left = rect.left + 'px';
    canvas.style.top = rect.top + 'px';
  };

  useEffect(() => {
    adjustCanvas();
    window.addEventListener('resize', adjustCanvas);
    return () => window.removeEventListener('resize', adjustCanvas);
  }, [videoFrame]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths.forEach((d) => {
      renderDrawing(ctx, d);
    });
    if (isDrawing && start && tool !== 'freehand') {
      // preview shape
      const mouse = currentPath[currentPath.length - 1];
      if (mouse) {
        const preview = {
          tool_type: tool,
          drawing_data: {},
          position: { x: start.x, y: start.y, width: 0, height: 0 },
        };
        if (tool === 'circle') {
          const r = Math.hypot(mouse.x - start.x, mouse.y - start.y);
          preview.drawing_data = { points: [start], radius: r, color };
          preview.position.width = r * 2;
          preview.position.height = r * 2;
        } else if (tool === 'rectangle') {
          preview.drawing_data = { x: start.x, y: start.y, color };
          preview.position.width = mouse.x - start.x;
          preview.position.height = mouse.y - start.y;
        } else if (tool === 'arrow') {
          preview.drawing_data = { x1: start.x, y1: start.y, x2: mouse.x, y2: mouse.y, color };
          preview.position.width = mouse.x - start.x;
          preview.position.height = mouse.y - start.y;
        }
        renderDrawing(ctx, preview);
      }
    }
  };

  useEffect(() => {
    redraw();
  }, [paths, currentPath]);

  const renderDrawing = (ctx, d) => {
    switch (d.tool_type) {
      case 'circle':
        const c = d.drawing_data;
        drawCircle(ctx, c.points[0].x, c.points[0].y, c.radius, c.color);
        break;
      case 'rectangle':
        const r = d.position;
        drawRect(ctx, r.x, r.y, r.width, r.height, d.drawing_data.color);
        break;
      case 'arrow':
        const a = d.drawing_data;
        drawArrow(ctx, a.x1, a.y1, a.x2, a.y2, a.color);
        break;
      case 'freehand':
        drawFreehand(ctx, d.drawing_data.points, d.drawing_data.color, brushSize);
        break;
      case 'text':
        drawText(ctx, d.position.x, d.position.y, d.drawing_data.text, d.drawing_data.color);
        break;
      default:
        break;
    }
  };

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setStart({ x, y });
    setCurrentPath([{ x, y }]);
  };
  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (tool === 'freehand') {
      setCurrentPath((p) => [...p, { x, y }]);
      setPaths((p) => [...p, { tool_type: 'freehand', drawing_data: { points: currentPath, color }, position: {} }]);
    } else if (tool === 'text') {
      // ignore
    } else {
      setCurrentPath((p) => [...p, { x, y }]);
    }
  };
  const handleMouseUp = (e) => {
    setIsDrawing(false);
    if (!start) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let newDrawing = null;
    if (tool === 'circle') {
      const r = Math.hypot(x - start.x, y - start.y);
      newDrawing = {
        tool_type: 'circle',
        drawing_data: { points: [start], radius: r, color },
        position: { x: start.x - r, y: start.y - r, width: r * 2, height: r * 2 },
      };
    } else if (tool === 'rectangle') {
      newDrawing = {
        tool_type: 'rectangle',
        drawing_data: { color },
        position: { x: start.x, y: start.y, width: x - start.x, height: y - start.y },
      };
    } else if (tool === 'arrow') {
      newDrawing = {
        tool_type: 'arrow',
        drawing_data: { x1: start.x, y1: start.y, x2: x, y2: y, color },
        position: { x: start.x, y: start.y, width: x - start.x, height: y - start.y },
      };
    } else if (tool === 'freehand') {
      newDrawing = {
        tool_type: 'freehand',
        drawing_data: { points: currentPath, color },
        position: {},
      };
    } else if (tool === 'text') {
      // prompt for text
      const txt = prompt('Enter text');
      if (txt) {
        newDrawing = {
          tool_type: 'text',
          drawing_data: { text: txt, color },
          position: { x: start.x, y: start.y },
        };
      }
    }
    if (newDrawing) {
      setPaths((p) => [...p, newDrawing]);
    }
    setStart(null);
    setCurrentPath([]);
  };

  const handleSave = () => {
    onDrawingComplete(paths);
  };

  const handleClear = () => {
    setPaths([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <div className="absolute top-0 right-0 m-4 bg-white p-2 rounded shadow pointer-events-auto">
        <div className="flex space-x-2">
          {['circle','rectangle','arrow','freehand','text'].map(t => (
            <button
              key={t}
              className={`px-2 py-1 border ${tool===t?'bg-gray-200':''}`}
              onClick={() => setTool(t)}
            >{t}</button>
          ))}
        </div>
        <div className="mt-2">
          <label className="block text-xs">Color</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} />
        </div>
        <div className="mt-2">
          <label className="block text-xs">Size</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
          />
        </div>
        <div className="mt-2 flex space-x-2">
          <button className="px-2 py-1 bg-blue-500 text-white" onClick={handleSave}>Save</button>
          <button className="px-2 py-1 bg-gray-300" onClick={onClose}>Cancel</button>
          <button className="px-2 py-1 bg-red-300" onClick={handleClear}>Clear</button>
        </div>
      </div>
    </div>
  );
}
