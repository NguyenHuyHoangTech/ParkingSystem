import React from 'react';
import { Card, Col, Row, Empty } from 'antd';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ChartsSection = ({ trafficData, revenueData, loading }) => {
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
                <Card title="Traffic Trend (Entries vs Exits)" loading={loading}>
                    {trafficData && trafficData.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart
                                    data={trafficData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="entries" stroke="#1890ff" name="Entries" activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="exits" stroke="#faad14" name="Exits" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <Empty description="No traffic data in this period" />
                    )}
                </Card>
            </Col>

            <Col xs={24} lg={12}>
                <Card title="Revenue Distribution by Vehicle Type" loading={loading}>
                    {revenueData && revenueData.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={revenueData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {revenueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <Empty description="No revenue data in this period" />
                    )}
                </Card>
            </Col>
        </Row>
    );
};

export default ChartsSection;
