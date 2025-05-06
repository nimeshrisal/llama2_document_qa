import React from 'react';
import { Layout, Row, Col } from 'antd';
import UploadPage from './components/uploadPage';
import QAPage from './components/qaPage';

const { Content } = Layout;

const App: React.FC = () => {
  return (
  <Layout style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
    <Content style={{ height: '100%' }}>
      <Row gutter={24} style={{ height: '100%' }}>
        <Col span={8} style={{ height: '100%' }}>
          <div style={{ height: '100%', backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #d9d9d9' }}>
            <UploadPage />
          </div>
        </Col>
        <Col span={16} style={{ height: '100%' }}>
          <div style={{ height: '100%', backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #d9d9d9' }}>
            <QAPage />
          </div>
        </Col>
      </Row>
    </Content>
  </Layout>

  );
};

export default App;
