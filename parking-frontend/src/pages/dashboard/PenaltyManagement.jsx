import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Button, Modal, Form, Input, InputNumber, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';

const { Content } = Layout;
const { Title, Text } = Typography;

const PenaltyManagement = () => {
  const [penaltyRules, setPenaltyRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/manager/penalty-rules');
      setPenaltyRules(res.data);
    } catch (error) {
      message.error('Failed to load penalty rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (values) => {
    try {
      if (editingPenalty) {
        await axiosInstance.put(`/manager/penalty-rules/${editingPenalty.ruleId}`, values);
        message.success('Penalty rule updated');
      } else {
        await axiosInstance.post('/manager/penalty-rules', values);
        message.success('Penalty rule added');
      }
      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('Error saving penalty rule');
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      await axiosInstance.delete(`/manager/penalty-rules/${ruleId}`);
      message.success('Penalty rule deleted');
      loadData();
    } catch (error) {
      message.error('Error deleting rule');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'ruleId', key: 'id' },
    {
      title: 'Violation Type', dataIndex: 'ruleType', key: 'ruleType',
      render: (val) => <strong style={{ color: '#cf1322' }}>{val}</strong>
    },
    {
      title: 'Fine Amount (VND)', dataIndex: 'fineAmount', key: 'fine',
      render: (val) => <strong style={{ color: '#f5222d' }}>{val?.toLocaleString()}</strong>
    },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => {
            setEditingPenalty(record);
            form.setFieldsValue(record);
            setIsModalOpen(true);
          }}>Edit</Button>
          <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.ruleId)} />
        </Space>
      )
    }
  ];

  return (
    <Content style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Penalty Management</Title>
          <Text type="secondary">Manage penalty rules and fine amounts</Text>
        </div>
        <Button type="primary" danger icon={<PlusOutlined />} onClick={() => {
          setEditingPenalty(null);
          form.resetFields();
          setIsModalOpen(true);
        }}>
          Add Penalty Rule
        </Button>
      </div>
      
      <Card>
        <Table dataSource={penaltyRules} columns={columns} rowKey="ruleId" loading={loading} />
      </Card>

      <Modal
        title={editingPenalty ? 'Edit penalty rule' : 'Add new penalty rule'}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="ruleType" label="Violation Type Name"
            rules={[{ required: true, message: 'Enter violation type name!' }]}>
            <Input placeholder="e.g. Lost Card, Wrong Floor..." />
          </Form.Item>
          <Form.Item name="fineAmount" label="Fine Amount (VND)"
            rules={[{ required: true, message: 'Enter fine amount!' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Example: 100000" min={0} />
          </Form.Item>
          <Form.Item name="description" label="Detailed Description">
            <Input.TextArea placeholder="Description of this penalty rule..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingPenalty ? 'Update' : 'Add New'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Content>
  );
};

export default PenaltyManagement;
