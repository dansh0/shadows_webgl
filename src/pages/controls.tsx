import React, { useState, ChangeEvent } from 'react';

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

interface RotationControlsProps {
    cameraProps: {
        rotation: Vec3;
        setRotation: Dispatch<SetStateAction<Vec3>>;
        height: number;
        setHeight: Dispatch<SetStateAction<Number>>;
        forward: number;
        setForward: Dispatch<SetStateAction<Number>>;
    }
    fps: number;
}

const RotationControls: React.FC<RotationControlsProps> = (props) => {
    const cameraProps = props.cameraProps;
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const fps = props.fps;

    const handleSliderChange = (axis: 'x' | 'y' | 'z') => (event: ChangeEvent<HTMLInputElement>) => {
        // create copy, set value, trigger event
        const newRotation = { ...cameraProps.rotation }; 
        newRotation[axis] = parseFloat(event.target.value);
        cameraProps.setRotation(newRotation);
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
                <h5>Camera</h5>
                <div className="control">
                    <label>Phi: {cameraProps.rotation.x}°</label>
                    <input
                        type="range"
                        id="x-axis"
                        min="0"
                        max="90"
                        step="5"
                        value={cameraProps.rotation.x}
                        onChange={handleSliderChange('x')}
                    />
                </div>
                <div className="control">
                    <label>Theta: {cameraProps.rotation.y}°</label>
                    <input
                        type="range"
                        id="y-axis"
                        min="-180"
                        max="180"
                        step="5"
                        value={cameraProps.rotation.y}
                        onChange={handleSliderChange('y')}
                    />
                </div>
                <div className="control">
                    <label>Height: {cameraProps.height}</label>
                    <input
                        type="range"
                        id="height"
                        min="0"
                        max="5"
                        step="1"
                        value={cameraProps.height}
                        onChange={
                            (event) => { cameraProps.setHeight(parseFloat(event.target.value)); }
                        }
                    />
                </div>
                <div className="control">
                    <label>Forward: {cameraProps.forward}</label>
                    <input
                        type="range"
                        id="forward"
                        min="-10"
                        max="10"
                        step="1"
                        value={cameraProps.forward}
                        onChange={
                            (event) => { cameraProps.setForward(parseFloat(event.target.value)); }
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