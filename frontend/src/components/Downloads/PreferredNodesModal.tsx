import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, theme } from 'antd';
import OrderedListOutlined from '@ant-design/icons/lib/icons/OrderedListOutlined';
import HolderOutlined from '@ant-design/icons/lib/icons/HolderOutlined';
import { useAtom } from 'jotai';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { nodePreferencesAtom } from '../../common/atoms';

interface PreferredNodesModalProps {
  show: boolean;
  hide: () => void;
  availableNodes: string[];
}

interface SortableItemProps {
  id: string;
  node: string;
  index: number;
}

const SortableItem = ({ id, node, index }: SortableItemProps): React.ReactElement => {
  const { token } = theme.useToken();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '12px 16px',
    marginBottom: '8px',
    backgroundColor: isDragging ? token.colorBgTextHover : token.colorBgContainer,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: '6px',
    cursor: 'move',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <HolderOutlined style={{ color: token.colorTextTertiary, fontSize: '16px' }} />
      <span style={{ fontWeight: 500, color: token.colorPrimary }}>{index + 1}.</span>
      <span style={{ fontSize: '14px', color: token.colorText }}>{node}</span>
    </div>
  );
};

const PreferredNodesModal = ({
  show,
  hide,
  availableNodes,
}: PreferredNodesModalProps): React.ReactElement => {
  const [preferredNodes, setPreferredNodes] = useAtom<string[]>(nodePreferencesAtom);
  const [localNodes, setLocalNodes] = useState<string[]>([]);

  // Initialize local state when modal opens or availableNodes change
  useEffect(() => {
    if (show) {
      if (preferredNodes.length === 0) {
        // No preferences yet, use available nodes
        setLocalNodes(availableNodes);
      } else {
        // Merge preferences with available nodes:
        // 1. Keep preferred nodes that are still available (in their original order)
        // 2. Add new nodes that weren't in the preferred list at the end
        const availableSet = new Set(availableNodes);
        const stillAvailable = preferredNodes.filter((node) => availableSet.has(node));
        const newNodes = availableNodes.filter((node) => !preferredNodes.includes(node));
        setLocalNodes([...stillAvailable, ...newNodes]);
      }
    }
  }, [show, availableNodes, preferredNodes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalNodes((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleApply = () => {
    setPreferredNodes(localNodes);
    hide();
  };

  const handleCancel = () => {
    hide();
  };

  return (
    <Modal
      title={
        <>
          <OrderedListOutlined /> Set Node Preferences
        </>
      }
      onCancel={hide}
      open={show}
      footer={null}
      width={600}
    >
      <div data-testid="preferredNodesModalForm">
        <Card>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            Drag and drop to set your preferred order for download nodes. When multiple nodes are
            available, the system will use your preferred order to select which node to download
            from.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={localNodes} strategy={verticalListSortingStrategy}>
                {localNodes.map((node, index) => (
                  <SortableItem key={node} id={node} node={node} index={index} />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} data-testid="cancelButton">
              Cancel
            </Button>
            <Button type="primary" onClick={handleApply} data-testid="applyButton">
              Apply
            </Button>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default PreferredNodesModal;
