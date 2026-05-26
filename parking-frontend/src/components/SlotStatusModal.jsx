import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Checkbox, Button, Alert, Typography } from 'antd';

const { Option } = Select;
const { Text } = Typography;

const SlotStatusModal = ({ open, slot, onClose, onUpdateStatus }) => {
  const [form] = Form.useForm();
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    if (open && slot) {
      form.resetFields();
      setSelectedStatus(null);
    }
  }, [open, slot, form]);

  const handleFinish = (values) => {
    onUpdateStatus(slot.slotId, {
      status: values.status,
      reason: values.reason,
      autoReallocate: values.autoReallocate || false
    });
  };

  if (!slot) return null;

  const isOccupied = slot.status === 'Occupied';
  const isBooked = slot.status === 'Booked';

  return (
    <Modal
      title={`Update Status: ${slot.slotName}`}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      {isOccupied && (
        <Alert
          message="Slot Occupied"
          description="This slot is currently occupied. You cannot change its status until the vehicle checks out or is relocated by staff."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {!isOccupied && (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item label="Current Status">
            <Text strong>{slot.status}</Text>
          </Form.Item>

          <Form.Item
            name="status"
            label="New Status"
            rules={[{ required: true, message: 'Please select a new status' }]}
          >
            <Select 
              placeholder="Select new status"
              onChange={(val) => setSelectedStatus(val)}
            >
              <Option value="Available">Available</Option>
              <Option value="Maintenance">Maintenance</Option>
              <Option value="Locked">Locked</Option>
            </Select>
          </Form.Item>

          {(selectedStatus === 'Maintenance' || selectedStatus === 'Locked') && isBooked && (
            <Alert
              message="Slot is Booked!"
              description="A customer has already booked this slot. You must enable Auto Reallocate to lock it. The system will find an equivalent available slot for the customer."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {(selectedStatus === 'Maintenance' || selectedStatus === 'Locked') && isBooked && (
             <Form.Item 
               name="autoReallocate" 
               valuePropName="checked"
               rules={[
                 {
                   validator: (_, value) =>
                     value ? Promise.resolve() : Promise.reject(new Error('Auto Reallocate must be enabled for booked slots!')),
                 },
               ]}
             >
               <Checkbox><Text strong type="danger">Auto Reallocate (Move Booking to another slot)</Text></Checkbox>
             </Form.Item>
          )}

          {(selectedStatus === 'Maintenance' || selectedStatus === 'Locked' || selectedStatus === 'Available') && selectedStatus !== slot.status && (
            <Form.Item
              name="reason"
              label="Reason for Change"
              rules={[{ required: true, message: 'Reason is required when changing status manually!' }]}
            >
              <Input.TextArea rows={3} placeholder="Example: Fixing broken lights..." />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block disabled={isOccupied}>
              Confirm Update
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default SlotStatusModal;
