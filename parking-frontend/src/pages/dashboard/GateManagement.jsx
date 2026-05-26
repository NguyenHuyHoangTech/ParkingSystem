import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GatewayOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const BASE_URL = 'http://localhost:8080/api/v1/gates';

const GateManagement = () => {
    const [gates, setGates] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingGate, setEditingGate] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const gatesRes = await axios.get(BASE_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGates(gatesRes.data);

            // Fetch buildings for the dropdown
            const buildingsRes = await axios.get('http://localhost:8080/api/v1/buildings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBuildings(buildingsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
            message.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingGate(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingGate(record);
        form.setFieldsValue({
            gateName: record.gateName,
            gateType: record.gateType,
            buildingId: record.buildingId
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BASE_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Gate deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to delete gate', error);
            message.error('Failed to delete gate');
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('token');
            if (editingGate) {
                await axios.put(`${BASE_URL}/${editingGate.gateId}`, values, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Gate updated successfully');
            } else {
                await axios.post(BASE_URL, values, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Gate added successfully');
            }
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save gate', error);
            message.error('Failed to save gate details');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'gateId', key: 'gateId' },
        { title: 'Gate Name', dataIndex: 'gateName', key: 'gateName' },
        { title: 'Type', dataIndex: 'gateType', key: 'gateType' },
        { 
            title: 'Building', 
            dataIndex: 'buildingId', 
            key: 'buildingId',
            render: (buildingId) => buildings.find(b => b.buildingId === buildingId)?.buildingName || buildingId
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
                    <Popconfirm title="Are you sure you want to delete this gate?" onConfirm={() => handleDelete(record.gateId)}>
                        <Button type="primary" danger icon={<DeleteOutlined />}>Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Content style={{ padding: '24px', minHeight: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={2}><GatewayOutlined /> Gate Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                    Add New Gate
                </Button>
            </div>
            <Card bordered={false}>
                <Table 
                    columns={columns} 
                    dataSource={gates} 
                    rowKey="gateId" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingGate ? "Edit Gate" : "Add Gate"}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="gateName" label="Gate Name" rules={[{ required: true, message: 'Please input the gate name' }]}>
                        <Input placeholder="e.g. Main Entry Gate" />
                    </Form.Item>
                    <Form.Item name="gateType" label="Gate Type" rules={[{ required: true, message: 'Please select gate type' }]}>
                        <Select placeholder="Select Type">
                            <Option value="IN">IN</Option>
                            <Option value="OUT">OUT</Option>
                            <Option value="BOTH">BOTH</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="buildingId" label="Building" rules={[{ required: true, message: 'Please select a building' }]}>
                        <Select placeholder="Select Building">
                            {buildings.map(b => (
                                <Option key={b.buildingId} value={b.buildingId}>{b.buildingName}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </Content>
    );
};

export default GateManagement;
