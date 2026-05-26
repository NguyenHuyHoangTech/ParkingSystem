import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Tag, Button, Space, Input, message, Modal, Form, Select } from 'antd';
import { SearchOutlined, UserAddOutlined, LockOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const BASE_URL = 'http://localhost:8080/api/admin/users';
const BUILDINGS_URL = 'http://localhost:8080/api/admin/buildings';

const AdminUsersList = () => {
    const [users, setUsers] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    
    // Modal states
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isSuspendModalVisible, setIsSuspendModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [targetUser, setTargetUser] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [form] = Form.useForm();
    const [roleSelected, setRoleSelected] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchBuildings();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(BASE_URL, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error(error);
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchBuildings = async () => {
        try {
            const response = await axios.get(BUILDINGS_URL, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setBuildings(response.data);
        } catch (error) {
            console.error("Could not fetch buildings", error);
        }
    };

    const handleSaveUser = async (values) => {
        try {
            if (editingUser) {
                // Update Relocation
                await axios.put(`${BASE_URL}/${editingUser.accountId}`, {
                    fullName: values.fullName,
                    phoneNumber: values.phoneNumber,
                    buildingId: values.buildingId
                }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                message.success('User updated successfully');
            } else {
                // Create
                await axios.post(BASE_URL, values, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                message.success('User created successfully');
            }
            setIsModalVisible(false);
            fetchUsers();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Error saving user');
        }
    };

    const handleSuspend = async () => {
        try {
            await axios.post(`${BASE_URL}/${targetUser.accountId}/suspend`, { reason: suspendReason }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            message.success('User suspended successfully. They have been logged out.');
            setIsSuspendModalVisible(false);
            setSuspendReason('');
            fetchUsers();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Error suspending user');
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        setRoleSelected(null);
        setIsModalVisible(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            email: user.email || user.username,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role
        });
        setRoleSelected(user.role);
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Account ID',
            dataIndex: 'accountId',
            key: 'accountId',
        },
        {
            title: 'Email (Username)',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Full Name',
            dataIndex: 'fullName',
            key: 'fullName',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={role === 'ADMIN' ? 'red' : role === 'MANAGER' ? 'purple' : role === 'STAFF' ? 'blue' : 'green'}>
                    {role}
                </Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Banned' ? 'error' : 'success'}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                        Edit
                    </Button>
                    <Button 
                        type="link" 
                        danger 
                        icon={<LockOutlined />} 
                        disabled={record.status === 'Banned'}
                        onClick={() => {
                            setTargetUser(record);
                            setIsSuspendModalVisible(true);
                        }}
                    >
                        Suspend
                    </Button>
                </Space>
            )
        }
    ];

    const filteredUsers = users.filter(u => 
        (u.username || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (u.phoneNumber || '').includes(searchText)
    );

    return (
        <Content style={{ padding: '24px' }}>
            <Card title="User Management" bordered={false}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <Input 
                        placeholder="Search by email or phone" 
                        prefix={<SearchOutlined />} 
                        style={{ width: 300 }}
                        onChange={e => setSearchText(e.target.value)}
                    />
                    <Button type="primary" icon={<UserAddOutlined />} onClick={openCreateModal}>
                        Create User
                    </Button>
                </div>
                
                <Table 
                    columns={columns} 
                    dataSource={filteredUsers} 
                    rowKey="accountId" 
                    loading={loading} 
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                title={editingUser ? "Edit User & Relocate" : "Create New User"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSaveUser}>
                    <Form.Item name="email" label="Email" rules={[{ required: !editingUser, type: 'email' }]}>
                        <Input disabled={!!editingUser} />
                    </Form.Item>
                    <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="role" label="Role" rules={[{ required: !editingUser }]}>
                        <Select disabled={!!editingUser} onChange={setRoleSelected}>
                            <Option value="ADMIN">System Admin</Option>
                            <Option value="MANAGER">Facility Manager</Option>
                            <Option value="STAFF">Parking Staff</Option>
                            <Option value="USER">Customer / Driver</Option>
                        </Select>
                    </Form.Item>

                    {(roleSelected === 'STAFF' || roleSelected === 'MANAGER') && (
                        <Form.Item name="buildingId" label="Assigned Building" rules={[{ required: true, message: 'Please select a building' }]}>
                            <Select placeholder="Select a facility">
                                {buildings.map(b => (
                                    <Option key={b.buildingId} value={b.buildingId}>{b.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>Save User</Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Suspend Modal */}
            <Modal
                title={<><LockOutlined /> Suspend Account</>}
                open={isSuspendModalVisible}
                onOk={handleSuspend}
                onCancel={() => setIsSuspendModalVisible(false)}
                okText="Suspend Immediately"
                okButtonProps={{ danger: true, disabled: !suspendReason }}
            >
                <Text>Are you sure you want to suspend <b>{targetUser?.username}</b>? Their active sessions will be terminated immediately.</Text>
                <div style={{ marginTop: 16 }}>
                    <Text strong>Reason:</Text>
                    <Input.TextArea 
                        rows={3} 
                        placeholder="E.g. Violation of parking policy"
                        value={suspendReason}
                        onChange={e => setSuspendReason(e.target.value)}
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>
        </Content>
    );
};

export default AdminUsersList;
