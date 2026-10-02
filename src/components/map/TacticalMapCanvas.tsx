'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text, Group } from 'react-konva';
import { useMapStore, MapToken } from '@/stores/useMapStore';
import { tacticalAudio } from '@/lib/audio';
import type Konva from 'konva';

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2200;

export const TacticalMapCanvas: React.FC = () => {
  const {
    stageScale,
    stagePos,
    gridType,
    cellSize,
    cellMeters,
    gridVisible,
    fogEnabled,
    tokens,
    selectedTokenId,
    targetedTokenId,
    setStageScale,
    setStagePos,
    selectToken,
    targetToken,
    updateTokenPosition,
    getTargetingEvaluation,
  } = useMapStore();
  const [windowSize, setWindowSize] = useState({ width: 1400, height: 900 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse wheel zoom centered on pointer
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.08;
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.3, Math.min(2.5, newScale));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Render Grid Lines
  const renderSquareGrid = () => {
    if (!gridVisible) return null;
    const lines = [];

    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += cellSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, CANVAS_HEIGHT]}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += cellSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, CANVAS_WIDTH, y]}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
        />
      );
    }

    return <Group>{lines}</Group>;
  };

  const renderHexGrid = () => {
    if (!gridVisible) return null;
    const hexes = [];
    const r = cellSize * 0.58;
    const h = r * Math.sqrt(3);

    for (let y = 0; y <= CANVAS_HEIGHT; y += h) {
      for (let x = 0; x <= CANVAS_WIDTH; x += r * 3) {
        const offset = (Math.round(x / (r * 1.5)) % 2) * (h / 2);
        const cy = y + offset;
        const pts = [];
        for (let a = 0; a < 6; a++) {
          const angle = (Math.PI / 3) * a;
          pts.push(x + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        hexes.push(
          <Line
            key={`hex-${x}-${y}`}
            points={pts}
            closed
            stroke="rgba(239, 68, 68, 0.08)"
            strokeWidth={1}
          />
        );
      }
    }
    return <Group>{hexes}</Group>;
  };

  // Targeting Trajectory Line
  const shooter = tokens.find((t) => t.id === selectedTokenId);
  const target = tokens.find((t) => t.id === targetedTokenId);
  const targeting = getTargetingEvaluation();

  const getTrajectoryColor = () => {
    if (!targeting) return '#f59e0b';
    if (targeting.isSweetSpot) return '#f59e0b';
    if (targeting.isIdealRange) return '#22c55e';
    return '#ef4444';
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#050508' }}>
      <Stage
        width={windowSize.width}
        height={windowSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        {/* Layer 1: Tactical Grid & Coordinate Map Floor */}
        <Layer>
          {/* Deep tactical background plate */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#08080c"
          />

          {/* Grid lines */}
          {gridType === 'square' ? renderSquareGrid() : renderHexGrid()}

          {/* Tactical radar rings around origin */}
          <Circle
            x={600}
            y={500}
            radius={300}
            stroke="rgba(239, 68, 68, 0.12)"
            strokeWidth={1}
            dash={[8, 8]}
          />
          <Circle
            x={600}
            y={500}
            radius={600}
            stroke="rgba(245, 158, 11, 0.08)"
            strokeWidth={1}
            dash={[12, 12]}
          />
        </Layer>

        {/* Layer 2: Trajectory Line & Distance Evaluation */}
        <Layer>
          {shooter && target && targeting && (
            <Group>
              <Line
                points={[shooter.x, shooter.y, target.x, target.y]}
                stroke={getTrajectoryColor()}
                strokeWidth={targeting.isSweetSpot ? 3.5 : 2}
                dash={targeting.isDisadvantage ? [8, 6] : undefined}
                shadowColor={getTrajectoryColor()}
                shadowBlur={targeting.isSweetSpot ? 16 : 6}
                shadowOpacity={0.8}
              />

              {/* Floating Distance Badge on Midpoint */}
              <Group x={(shooter.x + target.x) / 2} y={(shooter.y + target.y) / 2 - 20}>
                <Rect
                  x={-60}
                  y={-14}
                  width={120}
                  height={26}
                  fill="#0b0b0f"
                  stroke={getTrajectoryColor()}
                  strokeWidth={1.5}
                  cornerRadius={4}
                />
                <Text
                  x={-60}
                  y={-7}
                  width={120}
                  text={`${targeting.distanceMeters}m ${targeting.isSweetSpot ? '★ SS' : ''}`}
                  fill="#ffffff"
                  fontSize={11}
                  fontFamily="JetBrains Mono"
                  fontStyle="bold"
                  align="center"
                />
              </Group>
            </Group>
          )}
        </Layer>

        {/* Layer 3: Interactive Tokens with Drag & Drop */}
        <Layer>
          {tokens.map((token) => {
            const isSelected = token.id === selectedTokenId;
            const isTargeted = token.id === targetedTokenId;
            const radius = (token.sizeInCells * cellSize) / 2 - 4;

            return (
              <Group
                key={token.id}
                x={token.x}
                y={token.y}
                draggable
                onDragEnd={(e) => {
                  const rawX = e.target.x();
                  const rawY = e.target.y();
                  // Snap to closest cell center
                  const snappedX = Math.round(rawX / cellSize) * cellSize + cellSize / 2;
                  const snappedY = Math.round(rawY / cellSize) * cellSize + cellSize / 2;
                  e.target.position({ x: snappedX, y: snappedY });
                  updateTokenPosition(token.id, snappedX, snappedY);
                  tacticalAudio.playSelect();
                }}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (isSelected) {
                    // Clicking self toggles target off
                    targetToken(null);
                  } else if (selectedTokenId) {
                    // If an operator is already selected, clicking another token sets it as TARGET!
                    targetToken(token.id);
                    tacticalAudio.playAlert();
                  } else {
                    // Select as active operator
                    selectToken(token.id);
                    tacticalAudio.playSelect();
                  }
                }}
              >
                {/* Outer Selection Aura / Target Ring */}
                {isSelected && (
                  <Circle
                    radius={radius + 8}
                    stroke="#ef4444"
                    strokeWidth={2}
                    dash={[6, 4]}
                    shadowColor="#ef4444"
                    shadowBlur={12}
                  />
                )}
                {isTargeted && (
                  <Circle
                    radius={radius + 8}
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    shadowColor="#f59e0b"
                    shadowBlur={16}
                  />
                )}

                {/* Main Token Body */}
                <Circle
                  radius={radius}
                  fill="#101016"
                  stroke={token.color}
                  strokeWidth={2.5}
                  shadowColor={token.color}
                  shadowBlur={8}
                />

                {/* Token Monogram Code */}
                <Text
                  x={-radius}
                  y={-7}
                  width={radius * 2}
                  text={token.code}
                  fill="#ffffff"
                  fontSize={14}
                  fontFamily="JetBrains Mono"
                  fontStyle="bold"
                  align="center"
                />

                {/* Name Label */}
                <Rect
                  x={-45}
                  y={radius + 5}
                  width={90}
                  height={15}
                  fill="rgba(0, 0, 0, 0.85)"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth={1}
                />
                <Text
                  x={-45}
                  y={radius + 7}
                  width={90}
                  text={token.name}
                  fill="#fafafa"
                  fontSize={8.5}
                  fontFamily="JetBrains Mono"
                  align="center"
                />

                {/* Health Bar above token */}
                <Rect
                  x={-radius}
                  y={-radius - 10}
                  width={radius * 2}
                  height={4}
                  fill="rgba(255, 255, 255, 0.1)"
                />
                <Rect
                  x={-radius}
                  y={-radius - 10}
                  width={(radius * 2) * (token.hpCurrent / token.hpMax)}
                  height={4}
                  fill={token.hpCurrent / token.hpMax > 0.4 ? '#22c55e' : '#ef4444'}
                />
              </Group>
            );
          })}
        </Layer>

        {/* Layer 4: Progressive Fog of War Mask */}
        {fogEnabled && (
          <Layer listening={false} opacity={0.35}>
            <Rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="#000000"
            />
          </Layer>
        )}
      </Stage>
    </div>
  );
};
