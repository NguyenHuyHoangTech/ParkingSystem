import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CreditCardOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const BASE_URL = 'http://localhost:8080/api/v1/monthly-tickets';

const MonthlyTicketManagement = () => {
    const [tickets, setTickets] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
        fetchVehicleTypes();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(BASE_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
            message.error('Failed to fetch monthly tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicleTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8080/api/v1/vehicles', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVehicleTypes(res.data);
        } catch (error) {
            console.error('Failed to fetch vehicle types', error);
        }
    };

    const handleAdd = () => {
        setEditingTicket(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingTicket(record);
        form.setFieldsValue({
            licensePlate: record.licensePlate,
            customerName: record.customerName,
            phoneNumber: record.phoneNumber,
            vehicleTypeId: record.vehicleTypeId,
            dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
            status: record.status
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BASE_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Ticket deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to delete ticket', error);
            message.error('Failed to delete ticket');
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('token');
            
            const payload = {
                ...values,
                startDate: values.dateRange[0].format('YYYY-MM-DD'),
                endDate: values.dateRange[1].format('YYYY-MM-DD')
            };
            delete payload.dateRange;

            if (editingTicket) {
                await axios.put(`${BASE_URL}/${editingTicket.ticketId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Ticket updated successfully');
            } else {
                await axios.post(BASE_URL, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Ticket created successfully');
            }
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save ticket', error);
            message.error(error.response?.data?.message || 'Failed to save ticket details');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'ticketId', key: 'ticketId' },
        { title: 'License Plate', dataIndex: 'licensePlate', key: 'licensePlate' },
        { title: 'Customer Name', dataIndex: 'customerName', key: 'customerName' },
        { title: 'Phone', dataIndex: 'phoneNumber', key: 'phoneNumber' },
        { 
            title: 'Vehicle Type', 
            dataIndex: 'vehicleTypeId', 
            key: 'vehicleTypeId',
            render: (typeId) => vehicleTypes.find(v => v.vehicleTypeId === typeId)?.typeName || typeId
        },
        { title: 'Start Date', dataIndex: 'startDate', key: 'startDate' },
        { title: 'End Date', dataIndex: 'endDate', key: 'endDate' },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status',
            render: (status) => {
                let color = status === 'ACTIVE' ? 'green' : (status === 'EXPIRED' ? 'red' : 'orange');
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
                    <Popconfirm title="Are you sure you want to delete this ticket?" onConfirm={() => handleDelete(record.ticketId)}>
                        <Button type="primary" danger icon={<DeleteOutlined />}>Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Content style={{ padding: '24px', minHeight: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={2}><CreditCardOutlined /> Monthly Tickets</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                    Register Monthly Ticket
                </Button>
            </div>
            <Card bordered={false}>
                <Table 
                    columns={columns} 
                    dataSource={tickets} 
                    rowKey="ticketId" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingTicket ? "Edit Monthly Ticket" : "Register Monthly Ticket"}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="licensePlate" label="License Plate" rules={[{ required: true, message: 'Please input license plate' }]}>
                        <Input placeholder="e.g. 51F-123.45" />
                    </Form.Item>
                    <Form.Item name="customerName" label="Customer Name" rules={[{ required: true, message: 'Please input customer name' }]}>
                        <Input placeholder="John Doe" />
                    </Form.Item>
                    <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true, message: 'Please input phone number' }]}>
                        <Input placeholder="0901234567" />
                    </Form.Item>
                    <Form.Item name="vehicleTypeId" label="Vehicle Type" rules={[{ required: true, message: 'Please select vehicle type' }]}>
                        <Select placeholder="Select Vehicle Type">
                            {vehicleTypes.map(v => (
                                <Option key={v.vehicleTypeId} value={v.vehicleTypeId}>{v.typeName}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="dateRange" label="Valid Duration" rules={[{ required: true, message: 'Please select valid duration' }]}>
                        <DatePicker.RangePicker style={{ width: '100%' }} />
                    </Form.Item>
                    {editingTicket && (
                        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                            <Select>
                                <Option value="ACTIVE">ACTIVE</Option>
                                <Option value="EXPIRED">EXPIRED</Option>
                                <Option value="CANCELLED">CANCELLED</Option>
                            </Select>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </Content>
    );
};

export default MonthlyTicketManagement;
