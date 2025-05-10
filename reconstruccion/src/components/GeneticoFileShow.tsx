import React from 'react';
import './AlgoritmosGeneticos.css';


interface GeneticoFileShowProps {
    modCellsize?: number;
    matrix: number[][];
}

const GeneticoFileShow: React.FC<GeneticoFileShowProps> = ({ matrix, modCellsize=2 }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && matrix && matrix.length > 0 && matrix[0] && matrix[0].length > 0) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const cellSize = modCellsize; // Size of each cell
                canvas.width = matrix[0].length * cellSize;
                canvas.height = matrix.length * cellSize;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                matrix.forEach((row, rowIndex) => {
                    row.forEach((cell, cellIndex) => {
                        ctx.fillStyle = cell === 1 ? 'black' : 'white';
                        ctx.fillRect(cellIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
                    });
                });
            }
        } else if (canvas) {
            // Handle empty matrix case
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = 100;
                canvas.height = 100;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw "No data" text
                ctx.fillStyle = '#888888';
                ctx.textAlign = 'center';
                ctx.font = '12px Arial';
                ctx.fillText('No data available', 50, 50);
            }
        }
    }, [matrix]);

    return (
        <div>
            <h3>Matrix:</h3>
            <canvas ref={canvasRef} />
        </div>
    );
};

export default GeneticoFileShow;