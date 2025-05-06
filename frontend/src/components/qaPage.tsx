import React, { useState, useRef, useEffect } from 'react';
import { Input, Typography, Spin, message, Button } from 'antd';
import { UserOutlined, RobotOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

interface Message {
  type: 'question' | 'answer';
  content: string;
  loading?: boolean;
}

const QAPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue;
    setInputValue('');

    setMessages(prev => [
      ...prev,
      { type: 'question', content: question },
      { type: 'answer', content: '', loading: true }
    ]);

    setIsLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:8000/ask',
        { question },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          type: 'answer',
          content: response.data.answer || "Sorry, I couldn't find an answer.",
          loading: false
        };
        return newMessages;
      });
    } catch (error) {
      console.error('Full error:', error); // Log full error for debugging
      
      let errorMessage = "An unexpected error occurred";
      
      // Check if this is an Axios error with response
      if (axios.isAxiosError(error) && error.response) {
        // Extract the detailed message from backend (FastAPI puts it in 'detail')
        errorMessage = error.response.data?.detail || 
                      error.response.statusText || 
                      `Request failed with status ${error.response.status}`;
        
        if (error.response.status === 500 && 
            errorMessage.includes('No documents found')) {
          errorMessage = "Please upload documents first before asking questions.";
        }
      } 
      message.error(errorMessage);
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          type: 'answer',
          content: errorMessage,
          loading: false
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    message.info('Chat cleared');
  };

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography.Title level={3}> Chat with Document</Typography.Title>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button
          icon={<DeleteOutlined />}
          onClick={clearMessages}
          disabled={messages.length === 0}
          danger
        >
          Clear Chat
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', paddingRight: '8px' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                padding: '12px 16px',
                backgroundColor: msg.type === 'question' ? '#f5f5f5' : '#e6f7ff',
                width: 'fit-content',
                maxWidth: '80%',
              }}
            >
              {msg.loading ? (
                <Spin size="small" />
              ) : (
                <Text>
                  {msg.type === 'question' ? (
                    <UserOutlined style={{ color: '#1890ff' }} />
                  ) : (
                    <RobotOutlined style={{ color: '#52c41a' }} />
                  )}
                  <span style={{ marginLeft: 8 }}>{msg.content}</span>
                </Text>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Ask a question about your documents..."
          disabled={isLoading}
          style={{ flex: 1 }}
        />
        <SendOutlined
          onClick={handleSend}
          style={{
            fontSize: 22,
            color: isLoading ? '#d9d9d9' : '#1890ff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transform: 'rotate(-45deg)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e =>
            !isLoading && (e.currentTarget.style.transform = 'scale(1.2) rotate(-45deg)')
          }
          onMouseLeave={e => (e.currentTarget.style.transform = 'rotate(-45deg)')}
        />
      </div>
    </div>
  );
};

export default QAPage;
