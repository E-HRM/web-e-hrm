"use client";

import { useState } from "react";
import { Form, Input, Checkbox, Button, Typography, App as AntdApp } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Text } = Typography;

export default function LoginForm({ onFinish }) {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);

  return (
    <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Email is required" },
          { type: "email", message: "Invalid email" },
        ]}
      >
        <Input size="large" placeholder="Input email" prefix={<MailOutlined />} />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Password is required" }]}
      >
        <Input.Password size="large" placeholder="Password" prefix={<LockOutlined />} />
      </Form.Item>

      <Form.Item valuePropName="checked" className="mb-2">
        <Checkbox>
          I agree to the{" "}
          <Link href="#" className="underline">Terms of Service</Link>{" "}
          and{" "}
          <Link href="#" className="underline">Privacy Policy</Link>.
        </Checkbox>
      </Form.Item>

      <Button type="primary" htmlType="submit" block loading={loading}>
        Login
      </Button>

      <div className="text-center mt-3">
        <Text type="secondary">
          Forgot Password?{" "}
          {/* Route = /auth/resetpass because folder is app/(view)/auth/resetpass */}
          <Link href="/auth/resetpass" className="text-emerald-700">
            Reset Password
          </Link>
        </Text>
      </div>
    </Form>
  );
}
