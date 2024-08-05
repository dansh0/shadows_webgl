import React, { useState, ChangeEvent } from 'react';

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

interface RotationControlsProps {
    posProps: {
        rotation: Vec3;
        setRotation: Dispatch<SetStateAction<Vec3>>;
        vertical: number;
        setVertical: Dispatch<SetStateAction<Number>>;
        horizontal: number;
        setHorizontal: Dispatch<SetStateAction<Number>>;
    }
    fps: number;
}

const RotationControls: React.FC<RotationControlsProps> = (props) => {
    const posProps = props.posProps;
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const fps = props.fps;

    const handleSliderChange = (axis: 'x' | 'y' | 'z') => (event: ChangeEvent<HTMLInputElement>) => {
        // create copy, set value, trigger event
        const newRotation = { ...posProps.rotation }; 
        newRotation[axis] = parseFloat(event.target.value);
        posProps.setRotation(newRotation);
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`rotation-controls ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="header" onClick={toggleCollapse}>
                <h4 id="ControlsHeader">Controls</h4>
                <span className="carot">{isCollapsed ? '▲' : '▼'}</span>
            </div>
            <div className="controls-content">
                <h5>Light Position</h5>
                <div className="control">
                    <label>Angle: {posProps.rotation.x}°</label>
                    <input
                        type="range"
                        id="x-axis"
                        min="0"
                        max="180"
                        step="5"
                        value={posProps.rotation.x}
                        onChange={handleSliderChange('x')}
                    />
                </div>
                <div className="control">
                    <label>Rot: {posProps.rotation.y}°</label>
                    <input
                        type="range"
                        id="y-axis"
                        min="-180"
                        max="180"
                        step="5"
                        value={posProps.rotation.y}
                        onChange={handleSliderChange('y')}
                    />
                </div>
                <div className="control">
                    <label>Vert: {posProps.vertical}</label>
                    <input
                        type="range"
                        id="vertical"
                        min="-20"
                        max="20"
                        step="0.1"
                        value={posProps.vertical}
                        onChange={
                            (event) => { posProps.setVertical(parseFloat(event.target.value)); }
                        }
                    />
                </div>
                <div className="control">
                    <label>Horiz: {posProps.horizontal}</label>
                    <input
                        type="range"
                        id="horizontal"
                        min="-20"
                        max="20"
                        step="0.1"
                        value={posProps.horizontal}
                        onChange={
                            (event) => { posProps.setHorizontal(parseFloat(event.target.value)); }
                        }
                    />
                </div>
                <h5>Stats</h5>
                <div className="fps">
                    <h6>{fps} FPS</h6>
                </div>
            </div>
        </div>
    );
};

export default RotationControls;