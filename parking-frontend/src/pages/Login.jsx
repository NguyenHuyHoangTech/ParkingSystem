import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal } from 'antd';
import { UserOutlined, LockOutlined, CarOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotForm] = Form.useForm();
  const [resetForm] = Form.useForm();
  
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Gọi trực tiếp đến AuthController của Spring Boot
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username: values.username,
        password: values.password
      });

      const { token, role, username, accountId } = response.data;

      // Lưu trữ thông tin đăng nhập vào localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      if (accountId) localStorage.setItem('accountId', accountId.toString());

      message.success(`Welcome back, ${username}!`);

      // Smart routing based on Role
      const normalizedRole = role.replace('ROLE_', '');
      if (normalizedRole === 'ADMIN') {
        navigate('/admin');
      } else if (normalizedRole === 'MANAGER') {
        navigate('/manager');
      } else if (normalizedRole === 'STAFF') {
        navigate('/staff');
      } else {
        navigate('/user');
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Invalid username or password';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values) => {
    setForgotLoading(true);
    try {
      await axios.post('http://localhost:8080/api/auth/forgot-password', {
        email: values.email
      });
      message.success('OTP sent to your email!');
      setForgotEmail(values.email);
      setForgotStep(2);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    setForgotLoading(true);
    try {
      await axios.post('http://localhost:8080/api/auth/reset-password', {
        email: forgotEmail,
        otp: values.otp,
        newPassword: values.newPassword
      });
      message.success('Password reset successfully! Please log in.');
      setIsForgotModalVisible(false);
      setForgotStep(1);
      forgotForm.resetFields();
      resetForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
    }}>
      <Card
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8.5px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <CarOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#111' }}>
            PARKING SYSTEM
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Log in to continue smart operations
          </Text>
        </div>

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Username"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Password"
              disabled={loading}
            />
          </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                borderRadius: 8,
                background: 'linear-gradient(90deg, #1890ff 0%, #001529 100%)',
                border: 'none',
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                marginTop: 8
              }}
            >
              Login
            </Button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a onClick={() => setIsForgotModalVisible(true)}>Forgot Password?</a>
          </div>
        </Form>
      </Card>

      <Modal
        title={forgotStep === 1 ? "Forgot Password" : "Reset Password"}
        open={isForgotModalVisible}
        onCancel={() => {
          setIsForgotModalVisible(false);
          setForgotStep(1);
          forgotForm.resetFields();
          resetForm.resetFields();
        }}
        footer={null}
      >
        {forgotStep === 1 ? (
          <Form form={forgotForm} onFinish={handleForgotPassword} layout="vertical">
            <Form.Item
              name="email"
              label="Enter your email or username"
              rules={[{ required: true, message: 'Please input your email/username!' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email / Username" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={forgotLoading} block>
              Send OTP
            </Button>
          </Form>
        ) : (
          <Form form={resetForm} onFinish={handleResetPassword} layout="vertical">
            <Form.Item
              name="otp"
              label="OTP Code"
              rules={[{ required: true, message: 'Please input the OTP sent to your email!' }]}
            >
              <Input prefix={<KeyOutlined />} placeholder="6-digit OTP" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[{ required: true, message: 'Please input your new password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={forgotLoading} block>
              Reset Password
            </Button>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Login;
