import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Button, Spin, message, Result } from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;

const BASE_URL = 'http://localhost:8080/api/public';

const MockPaymentGateway = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const txnId = searchParams.get('txnId');
    const amount = searchParams.get('amount');

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'processing', 'success', 'failed'

    // Mock secret key matching the backend
    const SECRET_KEY = "my_super_secret_key_for_webhook_signature";

    const calculateHMac = async (data, key) => {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(key),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", keyMaterial, enc.encode(data));
        return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const processPayment = async (resultStatus) => {
        try {
            setLoading(true);
            setStatus('processing');

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            const gatewayRefId = `VNP${Math.floor(Math.random() * 1000000)}`;
            const rawData = `${txnId}|${gatewayRefId}|${resultStatus}`;
            const checksum = await calculateHMac(rawData, SECRET_KEY);

            // Call Webhook
            await axios.post(`${BASE_URL}/payments/webhook`, {
                transactionId: txnId,
                gatewayReferenceId: gatewayRefId,
                status: resultStatus,
                checksum: checksum
            });

            setStatus(resultStatus === 'SUCCESS' ? 'success' : 'failed');
        } catch (error) {
            console.error(error);
            setStatus('failed');
            message.error('Gateway Error');
        } finally {
            setLoading(false);
        }
    };

    if (!txnId || !amount) {
        return <Result status="error" title="Invalid Request" subTitle="Transaction ID or Amount missing." />;
    }

    if (status === 'success') {
        return (
            <Result
                status="success"
                title="Payment Successful!"
                subTitle={`Transaction ID: ${txnId} has been successfully processed.`}
                extra={[
                    <Button type="primary" key="console" onClick={() => navigate('/user/sessions')}>
                        Return to Dashboard
                    </Button>
                ]}
            />
        );
    }

    if (status === 'failed') {
        return (
            <Result
                status="error"
                title="Payment Failed"
                subTitle="There was an issue processing your payment."
                extra={[
                    <Button type="primary" key="console" onClick={() => navigate('/user/sessions')}>
                        Return to Dashboard
                    </Button>
                ]}
            />
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card style={{ width: 400, textAlign: 'center', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Title level={3}>Secure Payment Gateway</Title>
                    <Text type="secondary">Powered by MockPay</Text>
                    
                    <div style={{ margin: '30px 0' }}>
                        <Text strong style={{ fontSize: 18 }}>Total Amount:</Text>
                        <br/>
                        <Title level={2} style={{ color: '#1890ff', margin: 0 }}>{Number(amount).toLocaleString()} VNĐ</Title>
                    </div>

                    <Spin spinning={loading} tip="Processing transaction...">
                        <Button 
                            type="primary" 
                            size="large" 
                            block 
                            style={{ marginBottom: 16, background: '#52c41a', borderColor: '#52c41a' }}
                            onClick={() => processPayment('SUCCESS')}
                            disabled={loading}
                        >
                            Approve Payment (Success)
                        </Button>
                        <Button 
                            danger 
                            size="large" 
                            block 
                            onClick={() => processPayment('FAILED')}
                            disabled={loading}
                        >
                            Decline Payment (Failed)
                        </Button>
                    </Spin>
                </Card>
            </Content>
        </Layout>
    );
};

export default MockPaymentGateway;
