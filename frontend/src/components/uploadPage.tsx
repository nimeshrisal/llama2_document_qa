import React, { useState } from 'react';
import { Upload, Button, Typography, Spin, Descriptions, message, Alert } from 'antd';
import { UploadOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const UploadPage: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexReady, setIndexReady] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    uid: string;
    name: string;
    size: number;
    type: string;
    url?: string;
    formattedSize?: string;
  } | null>(null);


  const handleChange = (info: { file: UploadFile; fileList: UploadFile[] }) => {
    setFileList(info.fileList.map(file => ({
      ...file,
      formattedSize: formatFileSize(file.size || 0)
    })));
    setIndexReady(false);
  };

  const handleRemove = () => {
    setFileList([]);
    setUploadedFile(null);
    setIndexReady(false);
  };

  const handleClearAll = async () => {
    try {
      await axios.delete('http://localhost:8000/delete');
      message.success('All files and index cleared.');
      setFileList([]);
      setUploadedFile(null);
      setIndexReady(false);
    } catch (error) {
      message.error('Failed to clear files/index.');
      console.error('Clear error:', error);
    }
  };

  const handleUploadAndIndex = async () => {
    if (fileList.length === 0) {
      message.warning('Please select a file first!');
      return;
    }

    const file = fileList[0];
    const formData = new FormData();
    formData.append('file', file.originFileObj as File);

    setUploading(true);

    try {
      const uploadResponse = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (uploadResponse.data.status === 'success') {
        message.success('File uploaded successfully!');
        setUploadedFile({
          uid: file.uid,
          name: file.name || 'Unknown',
          size: file.size || 0,
          type: file.type || 'Unknown',
          url: uploadResponse.data.file_path,
          formattedSize: formatFileSize(file.size || 0)
        });

        setIndexing(true);
        try {
          const indexResponse = await axios.post('http://localhost:8000/index');
          if (indexResponse.data.status === 'success') {
            message.success('Document indexed successfully!');
            setIndexReady(true);
          }
        } catch (indexError) {
          message.error('Indexing failed. Please try again.');
          console.error('Indexing error:', indexError);
        } finally {
          setIndexing(false);
        }
      }
    } catch (uploadError) {
      message.error('Upload failed. Please try again.');
      console.error('Upload error:', uploadError);
    } finally {
      setUploading(false);
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = (bytes / Math.pow(k, i)).toFixed(2);
    return `${size} ${sizes[i]}`;
  };

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Title level={3}>Upload Document</Title>

      <Paragraph style={{ fontSize: '16px', color: '#595959', maxWidth: 720, marginBottom: 24 }}>
        Welcome! This system allows you to upload your document and automatically index it so you can interact with the content. 
        Supported formats include <Text code>.pdf</Text>, <Text code>.doc</Text>, <Text code>.docx</Text>, and <Text code>.txt</Text>. 
        Once uploaded and indexed, you'll be able to ask questions about the document in real time.
      </Paragraph>

      <Upload
        beforeUpload={() => false}
        onChange={handleChange}
        fileList={fileList}
        maxCount={1}
        accept=".pdf,.doc,.docx,.txt"
        disabled={uploading || indexing || uploadedFile !== null }
        itemRender={(originNode, file) => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px',
              border: '1px solid #f0f0f0',
              borderRadius: '4px',
              marginTop: '8px'
            }}
          >
            <div>
              <span>{file.name}</span>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {(file as any).formattedSize || formatFileSize(file.size || 0)}
              </Text>
            </div>
            <Button
              type="text"
              danger
              size="small"
              onClick={handleRemove}
              disabled={uploading || indexing || uploadedFile !== null}
            >
              Remove
            </Button>
          </div>
        )}
      >
        <Button icon={<UploadOutlined />} disabled={uploading || indexing}>
          Select File
        </Button>
      </Upload>

      {fileList.length > 0 && !uploadedFile && (
        <Button
          type="primary"
          onClick={handleUploadAndIndex}
          disabled={uploading || indexing}
          loading={uploading}
          style={{ marginTop: 16 }}
        >
          {uploading ? 'Uploading...' : 'Upload & Index'}
        </Button>
      )}

      {/* ✅ Show only after upload */}
      {uploadedFile && (
        <Button
          danger
          type="default"
          icon={<DeleteOutlined />}
          onClick={handleClearAll}
          disabled={uploading || indexing} 
          style={{ marginTop: 16 }}
        >
          Clear All
        </Button>
      )}

      {(uploading || indexing) && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Spin tip={uploading ? 'Uploading your file...' : 'Indexing document...'} size="large">
            <div style={{ padding: '50px', background: 'rgba(0, 0, 0, 0.05)', borderRadius: '4px' }} />
          </Spin>
        </div>
      )}

      {!uploading && !indexing && uploadedFile && (
        <>
          <Descriptions
            title="Uploaded File Details"
            bordered
            column={1}
            size="small"
            style={{ marginTop: 24 }}
          >
            <Descriptions.Item label="File Name">{uploadedFile.name}</Descriptions.Item>
            <Descriptions.Item label="Extension">
              {getFileExtension(uploadedFile.name)}
            </Descriptions.Item>
            <Descriptions.Item label="Type">{uploadedFile.type}</Descriptions.Item>
            <Descriptions.Item label="Size">
              {uploadedFile.formattedSize}
            </Descriptions.Item>
          </Descriptions>

          {indexReady && (
            <Alert
              message="Ready to chat with your document!"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginTop: 16 }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default UploadPage;
