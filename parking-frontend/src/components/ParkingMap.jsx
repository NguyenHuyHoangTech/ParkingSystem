import React, { useState } from 'react';
import { Tag, Typography, Tooltip, message } from 'antd';
import { CarOutlined, LockOutlined, ToolOutlined, BorderOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ParkingMap = ({ 
  slots = [], 
  structures = [], 
  zones = [],
  cols = 15, 
  rows = 10, 
  editable = false, 
  onSlotMove, 
  onSlotClick, 
  highlightedSlotId,
  onStructureMove,
  onStructureClick,
  onZoneMove,
  onZoneClick
}) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);

  const handleDragStart = (e, item, type) => {
    if (!editable) return;
    setDraggedItem({ ...item, dragType: type });
    e.dataTransfer.setData('type', type);
  };

  const handleDragOver = (e, x, y) => {
    if (!editable) return;
    e.preventDefault(); // allow drop
    if (!hoverTarget || hoverTarget.x !== x || hoverTarget.y !== y) {
      setHoverTarget({ x, y });
    }
  };

  const checkCollision = (targetX, targetY, width, height, ignoreSlotId = null, ignoreStructureId = null) => {
    // Check boundaries
    if (targetX < 0 || targetY < 0 || targetX + width > cols || targetY + height > rows) {
      return true;
    }
    
    // Check entrance/exit
    if ((targetX === 0 && targetY === 0) || (targetX === cols - 1 && targetY === 0)) {
       return true;
    }

    // Check slots
    const isSlotOccupied = slots.find(s => {
      if (s.slotId === ignoreSlotId) return false;
      const sw = s.vehicleType?.gridWidth || 1;
      const sh = s.vehicleType?.gridHeight || 1;
      return (
        targetX < s.posX + sw &&
        targetX + width > s.posX &&
        targetY < s.posY + sh &&
        targetY + height > s.posY
      );
    });

    // Check structures
    const isStructureOccupied = structures.find(st => {
      if (st.structureId === ignoreStructureId) return false;
      return (
        targetX < st.posX + st.width &&
        targetX + width > st.posX &&
        targetY < st.posY + st.height &&
        targetY + height > st.posY
      );
    });

    return isSlotOccupied || isStructureOccupied;
  };

  const handleDrop = (e, targetX, targetY) => {
    if (!editable) return;
    e.preventDefault();
    setHoverTarget(null);
    
    const dragType = e.dataTransfer.getData('type');

    if (dragType === 'slot' && draggedItem?.dragType === 'slot') {
      const width = draggedItem.vehicleType?.gridWidth || 1;
      const height = draggedItem.vehicleType?.gridHeight || 1;

      if (checkCollision(targetX, targetY, width, height, draggedItem.slotId, null)) {
         message.warning("Position already occupied or invalid");
         return;
      }

      if (onSlotMove) {
        onSlotMove(draggedItem.slotId, targetX, targetY);
      }
      setDraggedItem(null);
    } else if (dragType === 'structure' && draggedItem?.dragType === 'structure') {
      if (checkCollision(targetX, targetY, draggedItem.width, draggedItem.height, null, draggedItem.structureId)) {
         message.warning("Position already occupied by a slot or another structure");
         return;
      }
      if (onStructureMove) {
        onStructureMove(draggedItem.structureId, targetX, targetY);
      }
      setDraggedItem(null);
    } else if (dragType === 'zone' && draggedItem?.dragType === 'zone') {
      const width = draggedItem.width || 1;
      const height = draggedItem.height || 1;
      if (targetX < 0 || targetY < 0 || targetX + width > cols || targetY + height > rows) {
         message.warning("Zone position exceeds map boundaries");
         return;
      }
      if (onZoneMove) {
        onZoneMove(draggedItem.zoneId, targetX, targetY);
      }
      setDraggedItem(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#52c41a';
      case 'Occupied': return '#1890ff';
      case 'Booked': return '#faad14';
      case 'Maintenance': return '#f5222d';
      case 'Locked': return '#8c8c8c';
      default: return '#d9d9d9';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Occupied': return <CarOutlined />;
      case 'Maintenance': return <ToolOutlined />;
      case 'Locked': return <LockOutlined />;
      default: return null;
    }
  };

  // Render background grid cells
  const renderBackgroundGrid = () => {
    const grid = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isEntrance = x === 0 && y === 0;
        const isExit = x === cols - 1 && y === 0;
        
        let content = null;
        if (isEntrance) {
          content = <div style={{ background: '#002140', color: '#fff', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>IN</div>;
        } else if (isExit) {
          content = <div style={{ background: '#cf1322', color: '#fff', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>OUT</div>;
        }

        let isHovered = false;
        let hoverColor = 'transparent';
        if (draggedItem && hoverTarget) {
          const width = draggedItem.dragType === 'slot' ? (draggedItem.vehicleType?.gridWidth || 1) : (draggedItem.width || 1);
          const height = draggedItem.dragType === 'slot' ? (draggedItem.vehicleType?.gridHeight || 1) : (draggedItem.height || 1);
          
          if (x >= hoverTarget.x && x < hoverTarget.x + width && y >= hoverTarget.y && y < hoverTarget.y + height) {
            isHovered = true;
            let ignoreSlotId = draggedItem.dragType === 'slot' ? draggedItem.slotId : null;
            let ignoreStructId = draggedItem.dragType === 'structure' ? draggedItem.structureId : null;
            const collides = draggedItem.dragType === 'zone' 
                ? checkCollision(hoverTarget.x, hoverTarget.y, width, height, null, null) // zones don't collide with slots/structures in UI logic, but let's check boundaries
                : checkCollision(hoverTarget.x, hoverTarget.y, width, height, ignoreSlotId, ignoreStructId);

            if (draggedItem.dragType === 'zone') {
               const outOfBounds = (hoverTarget.x < 0 || hoverTarget.y < 0 || hoverTarget.x + width > cols || hoverTarget.y + height > rows);
               hoverColor = outOfBounds ? 'rgba(245, 34, 45, 0.4)' : 'rgba(82, 196, 26, 0.4)';
            } else {
               hoverColor = collides ? 'rgba(245, 34, 45, 0.4)' : 'rgba(82, 196, 26, 0.4)';
            }
          }
        }

        grid.push(
          <div
            key={`bg-${x}-${y}`}
            onDragOver={(e) => handleDragOver(e, x, y)}
            onDrop={(e) => handleDrop(e, x, y)}
            style={{
              width: `${100 / cols}%`,
              height: `${100 / rows}%`,
              left: `${(x / cols) * 100}%`,
              top: `${(y / rows) * 100}%`,
              position: 'absolute',
              border: '1px dashed #e8e8e8',
              backgroundColor: isHovered ? hoverColor : 'transparent',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}
          >
            {content}
          </div>
        );
      }
    }
    return grid;
  };

  // Render Zones
  const renderZones = () => {
    return (zones || []).map(zone => {
      const width = zone.width || 1;
      const height = zone.height || 1;

      return (
        <Tooltip 
          key={`zone-${zone.zoneId}`} 
          title={`${zone.name} (Size: ${width}x${height}) - Allowed types: ${zone.allowedVehicleTypes?.map(t => t.typeName).join(', ') || 'None'}`}
        >
          <div
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, zone, 'zone')}
            onDragEnd={() => setHoverTarget(null)}
            onClick={() => { if (onZoneClick) onZoneClick(zone); }}
            style={{
              position: 'absolute',
              left: `${(zone.posX / cols) * 100}%`,
              top: `${(zone.posY / rows) * 100}%`,
              width: `${(width / cols) * 100}%`,
              height: `${(height / rows) * 100}%`,
              padding: '0.2%',
              boxSizing: 'border-box',
              zIndex: 2
            }}
          >
            <div style={{
              background: 'rgba(245, 34, 45, 0.12)',
              border: '2px dashed #f5222d',
              width: '100%',
              height: '100%',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f5222d',
              cursor: editable ? 'grab' : (onZoneClick ? 'pointer' : 'default'),
              boxShadow: 'inset 0 0 10px rgba(245,34,45,0.2)'
            }}>
              <Text style={{ color: '#cf1322', fontSize: '0.8vw', fontWeight: 'bold', textAlign: 'center' }}>
                {zone.name}
              </Text>
            </div>
          </div>
        </Tooltip>
      );
    });
  };

  // Render Slots
  const renderSlots = () => {
    return slots.map(slot => {
      const isHighlighted = slot.slotId === highlightedSlotId;
      const width = slot.vehicleType?.gridWidth || 1;
      const height = slot.vehicleType?.gridHeight || 1;

      return (
        <Tooltip key={`slot-${slot.slotId}`} title={`${slot.slotName} - ${slot.status}`}>
          <div
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, slot, 'slot')}
            onDragEnd={() => setHoverTarget(null)}
            onClick={() => { if (onSlotClick) onSlotClick(slot); }}
            className={isHighlighted ? 'blinking-slot' : ''}
            style={{
              position: 'absolute',
              left: `${(slot.posX / cols) * 100}%`,
              top: `${(slot.posY / rows) * 100}%`,
              width: `${(width / cols) * 100}%`,
              height: `${(height / rows) * 100}%`,
              padding: '0.2%',
              boxSizing: 'border-box',
              zIndex: 4
            }}
          >
            <div style={{
              background: getStatusColor(slot.status),
              width: '100%',
              height: '100%',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: editable ? 'grab' : (onSlotClick ? 'pointer' : 'default'),
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <Text style={{ color: '#fff', fontSize: '0.8vw', fontWeight: 'bold' }}>{slot.slotName}</Text>
              {getStatusIcon(slot.status)}
            </div>
          </div>
        </Tooltip>
      );
    });
  };

  // Render Structures
  const renderStructures = () => {
    return structures.map(st => {
      return (
        <div
          key={`struct-${st.structureId || st.name}-${st.posX}-${st.posY}`}
          draggable={editable}
          onDragStart={(e) => handleDragStart(e, st, 'structure')}
          onDragEnd={() => setHoverTarget(null)}
          onClick={() => { if (onStructureClick) onStructureClick(st); }}
          style={{
            position: 'absolute',
            left: `${(st.posX / cols) * 100}%`,
            top: `${(st.posY / rows) * 100}%`,
            width: `${(st.width / cols) * 100}%`,
            height: `${(st.height / rows) * 100}%`,
            padding: '0.2%',
            boxSizing: 'border-box',
            zIndex: 3
          }}
        >
          <div style={{
            background: '#595959',
            width: '100%',
            height: '100%',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: editable ? 'grab' : (onStructureClick ? 'pointer' : 'default'),
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
          }}>
            <Text style={{ color: '#fff', fontSize: '0.9vw', fontWeight: 'bold', textAlign: 'center' }}>{st.name}</Text>
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        position: 'relative',
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: `${cols} / ${rows}`,
        border: '2px solid #d9d9d9',
        backgroundColor: '#fff',
        overflow: 'hidden'
      }}>
        {renderBackgroundGrid()}
        {renderZones()}
        {renderStructures()}
        {renderSlots()}
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Tag color="#52c41a">Available</Tag>
        <Tag color="#1890ff">Occupied</Tag>
        <Tag color="#faad14">Booked</Tag>
        <Tag color="#f5222d">Maintenance</Tag>
        <Tag color="#8c8c8c">Locked</Tag>
        <Tag color="#595959" icon={<BorderOutlined />}>Structure</Tag>
        <Tag color="#f5222d" icon={<BorderOutlined />}>Zone (Red Border)</Tag>
      </div>
    </div>
  );
};

export default ParkingMap;

