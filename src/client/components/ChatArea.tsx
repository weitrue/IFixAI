import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import '../styles/components/ChatArea.css';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  selectedAgent: 'gemini' | 'claude' | 'qwen' | 'gpt';
  selectedModel: string;
  onSendMessage: (content: string, imageUrl?: string) => void;
  onAgentChange: (agent: 'gemini' | 'claude' | 'qwen' | 'gpt') => void;
  onModelChange: (model: string) => void;
  onCreateConversation: (agentType: 'gemini' | 'claude' | 'qwen' | 'gpt', model?: string) => void;
  connectionStatus: 'connected' | 'disconnected';
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  selectedAgent,
  selectedModel,
  onSendMessage,
  onAgentChange,
  onModelChange,
  onCreateConversation,
  connectionStatus,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [currentMode, setCurrentMode] = useState('Thinking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close attach menu when clicking outside
  useEffect(() => {
    if (!showAttachMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (attachMenuRef.current && !attachMenuRef.current.contains(target)) {
        setShowAttachMenu(false);
      }
    };

    // Use setTimeout to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachMenu]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content && !imagePreview) return;
    
    // sendMessage in App.tsx will handle creating conversation if needed
    onSendMessage(content, imagePreview || undefined);
    setInputValue('');
    setImagePreview(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        
        // Check if it's an Excel file
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        
        if (isExcel) {
          // Excel 智能处理
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const arrayBuffer = reader.result as ArrayBuffer;
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              
              // 调用Excel分析API
              const response = await fetch('/api/excel/analyze', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  fileBuffer: base64,
                  questions: '请分析这个Excel文件的结构和内容，并提供简要总结。',
                  agentType: selectedAgent,
                }),
              });
              
              if (response.ok) {
                const data = await response.json();
                // 将分析结果作为消息发送
                const analysisMessage = `📊 Excel文件分析结果：\n\n${data.analysis}`;
                onSendMessage(analysisMessage);
              } else {
                const error = await response.json();
                alert(`Excel分析失败: ${error.error}`);
              }
            } catch (error: any) {
              console.error('Error processing Excel:', error);
              alert(`处理Excel文件时出错: ${error.message}`);
            }
          };
          reader.readAsArrayBuffer(file);
        } else {
          // 非Excel文件，提示用户
          alert('请选择Excel文件（.xlsx 或 .xls）进行智能处理');
        }
      }
      setShowAttachMenu(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    } catch (error: any) {
      console.error('Error selecting file:', error);
      alert(`选择文件时出错: ${error.message}`);
      setShowAttachMenu(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const imageData = reader.result as string;
              setImagePreview(imageData);
              
              // 调用图像识别API（智能图像处理）
              const base64Data = imageData.split(',')[1] || imageData;
              const response = await fetch('/api/image/recognize', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  imageData: base64Data,
                  question: '请详细描述这张图片的内容，包括主要对象、场景、颜色、文字等所有可见信息。',
                }),
              });
              
              if (response.ok) {
                const data = await response.json();
                // 将识别结果作为消息发送，并附带图片
                const recognitionMessage = `🖼️ 图片识别结果：\n\n${data.description}`;
                onSendMessage(recognitionMessage, imageData);
              } else {
                const error = await response.json();
                // 即使识别失败，也显示图片预览
                console.error('Image recognition failed:', error);
              }
            } catch (error: any) {
              console.error('Error processing image:', error);
              // 即使处理失败，也显示图片预览
            }
          };
          reader.onerror = () => {
            console.error('Failed to read file');
            alert('读取图片文件失败');
          };
          reader.readAsDataURL(file);
        } else {
          alert('请选择图片文件');
        }
      }
      setShowAttachMenu(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    } catch (error: any) {
      console.error('Error selecting image:', error);
      alert(`选择图片时出错: ${error.message}`);
      setShowAttachMenu(false);
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (files && files.length > 0) {
        // 智能文件管理 - 整理文件夹
        const fileList = Array.from(files);
        const fileInfo = fileList.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type || 'unknown',
        }));
        
        // 显示文件列表并询问用户想要执行的操作
        const fileListText = fileList.map(f => `- ${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('\n');
        const message = `📁 已选择文件夹，包含 ${fileList.length} 个文件：\n\n${fileListText}\n\n请选择要执行的操作：\n1. 批量重命名\n2. 自动整理分类\n3. 合并文件\n\n或者直接告诉我您想要如何处理这些文件。`;
        
        // 将文件信息作为消息发送，用户可以在聊天中继续操作
        onSendMessage(message);
        
        // 保存文件列表到状态（如果需要）
        // 注意：由于浏览器安全限制，无法直接获取文件路径，只能获取文件名
        console.log('Selected folder with files:', fileInfo);
      }
      setShowAttachMenu(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    } catch (error: any) {
      console.error('Error selecting folder:', error);
      alert(`选择文件夹时出错: ${error.message}`);
      setShowAttachMenu(false);
    }
  };

  const handleUploadFiles = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setShowAttachMenu(false);
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    } catch (error) {
      console.error('Error opening file dialog:', error);
    }
  };

  const handleUploadPhotos = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setShowAttachMenu(false);
      setTimeout(() => {
        imageInputRef.current?.click();
      }, 100);
    } catch (error) {
      console.error('Error opening image dialog:', error);
    }
  };

  const handleUploadFolder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setShowAttachMenu(false);
      setTimeout(() => {
        folderInputRef.current?.click();
      }, 100);
    } catch (error) {
      console.error('Error opening folder dialog:', error);
    }
  };

  const [availableModels, setAvailableModels] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    loadModels();
  }, [selectedAgent, conversation?.id]);

  const loadModels = async () => {
    try {
      const response = await fetch(`/api/models/${selectedAgent}`);
      const data = await response.json();
      setAvailableModels(data.map((m: any) => ({ value: m.model_value, label: m.model_label })));
      
      // Set model based on conversation or default
      if (data.length > 0) {
        if (conversation?.model) {
          // Use conversation's model if it exists and is valid
          const modelExists = data.some((m: any) => m.model_value === conversation.model);
          if (modelExists) {
            onModelChange(conversation.model);
          } else {
            // If conversation model is invalid, use default
            const defaultModel = data.find((m: any) => m.is_default === 1) || data[0];
            onModelChange(defaultModel.model_value);
          }
        } else if (!selectedModel) {
          // No conversation and no selected model, use default
          const defaultModel = data.find((m: any) => m.is_default === 1) || data[0];
          onModelChange(defaultModel.model_value);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const agentNames = {
    gemini: 'Gemini',
    claude: 'Claude',
    qwen: 'Qwen',
    gpt: 'GPT',
  };

  const currentModel = selectedModel || conversation?.model || availableModels[0]?.value || '';

  const handleAgentChange = async (newAgent: 'gemini' | 'claude' | 'qwen' | 'gpt') => {
    onAgentChange(newAgent);
    // Load models for the new agent and set default
    try {
      const response = await fetch(`/api/models/${newAgent}`);
      const data = await response.json();
      if (data.length > 0) {
        const defaultModel = data.find((m: any) => m.is_default === 1) || data[0];
        onModelChange(defaultModel.model_value);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const [isChangingModel, setIsChangingModel] = useState(false);

  const handleModelChange = async (newModel: string) => {
    if (newModel === selectedModel) return;
    
    setIsChangingModel(true);
    onModelChange(newModel);
    
    // If no conversation exists, create one with the selected model
    if (!conversation) {
      onCreateConversation(selectedAgent, newModel);
    } else {
      // Only update the conversation's model when sending a message
      // This allows temporary model switching without immediately saving
      // The model will be saved when the next message is sent
    }
    
    // Remove animation class after animation completes
    setTimeout(() => {
      setIsChangingModel(false);
    }, 600);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!conversation) {
    return (
      <div className="chat-area empty">
        <div className="empty-content">
          <div className="welcome-section">
            <h2>今天有什么安排?</h2>
            <p className="welcome-subtitle">这是一个 AI 助手，可以帮你处理各种任务</p>
          </div>
          <div className="input-container">
            <div className="input-box">
              <div className="input-main">
                <textarea
                  className="message-input"
                  placeholder="Ask IFixAI"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 200)}px`;
                  }}
                  onKeyPress={handleKeyPress}
                  rows={1}
                />
              </div>
              <div className="input-toolbar">
                <div className="input-toolbar-left">
                  <div className="attach-button-wrapper" ref={attachMenuRef}>
                    <button
                      className="toolbar-button attach-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAttachMenu(!showAttachMenu);
                      }}
                      aria-label="添加附件"
                      type="button"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                    {showAttachMenu && (
                      <div className="attach-menu">
                        <button 
                          className="attach-menu-item" 
                          onClick={handleUploadFiles}
                          type="button"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          <span>附件</span>
                        </button>
                        <button 
                          className="attach-menu-item" 
                          onClick={handleUploadPhotos}
                          type="button"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span>照片</span>
                        </button>
                        <button 
                          className="attach-menu-item" 
                          onClick={handleUploadFolder}
                          type="button"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span>文件夹</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="tools-button-wrapper">
                    <button
                      className="toolbar-button tools-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowToolsMenu(!showToolsMenu);
                      }}
                      aria-label="工具"
                      type="button"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                      </svg>
                      <span>Tools</span>
                    </button>
                  </div>
                </div>
                <div className="input-toolbar-right">
                  <div className="mode-selector-wrapper">
                    <button
                      className="toolbar-button mode-selector"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowModeMenu(!showModeMenu);
                      }}
                      type="button"
                    >
                      <span>{currentMode}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>
                  <button className="toolbar-button mic-button" aria-label="语音输入" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              style={{ display: 'none' }}
              onChange={handleFolderSelect}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="agent-selector">
          <select
            value={selectedAgent}
            onChange={(e) => handleAgentChange(e.target.value as 'gemini' | 'claude' | 'qwen' | 'gpt')}
            className="agent-select"
          >
            <option value="gemini">Gemini</option>
            <option value="claude">Claude</option>
            <option value="qwen">Qwen</option>
            <option value="gpt">GPT</option>
          </select>
            {availableModels.length > 0 && (
              <select
                value={selectedModel || conversation?.model || availableModels[0]?.value || ''}
                onChange={(e) => handleModelChange(e.target.value)}
                className={`model-select ${isChangingModel ? 'changing' : ''}`}
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            )}
        </div>
        <div className="chat-header-right">
          <div className={`connection-status ${connectionStatus}`}>
            <span className={`status-dot ${connectionStatus}`}></span>
            <span>{connectionStatus === 'connected' ? '已连接' : '未连接'}</span>
          </div>
          <button className="save-button" aria-label="保存">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">
              {message.image_url && (
                <img src={message.image_url} alt="附件" className="message-image" />
              )}
              <div className="message-text">
                {message.role === 'assistant' ? (
                  <MarkdownRenderer content={message.content} isUser={false} />
                ) : (
                  <MarkdownRenderer content={message.content} isUser={true} />
                )}
              </div>
              <div className="message-time">{formatTime(message.created_at)}</div>
            </div>
          </div>
        ))}
        {imagePreview && (
          <div className="message user">
            <div className="message-content">
              <img src={imagePreview} alt="预览" className="message-image" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-box">
          <div className="input-main">
            <textarea
              className="message-input"
              placeholder="Ask IFixAI"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 200)}px`;
              }}
              onKeyPress={handleKeyPress}
              rows={1}
            />
          </div>
          <div className="input-toolbar">
            <div className="input-toolbar-left">
              <div className="attach-button-wrapper" ref={attachMenuRef}>
                <button
                  className="toolbar-button attach-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAttachMenu(!showAttachMenu);
                  }}
                  aria-label="添加附件"
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                {showAttachMenu && (
                  <div className="attach-menu">
                    <button 
                      className="attach-menu-item" 
                      onClick={handleUploadFiles}
                      type="button"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <span>附件</span>
                    </button>
                    <button 
                      className="attach-menu-item" 
                      onClick={handleUploadPhotos}
                      type="button"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span>照片</span>
                    </button>
                    <button 
                      className="attach-menu-item" 
                      onClick={handleUploadFolder}
                      type="button"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span>文件夹</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="tools-button-wrapper">
                <button
                  className="toolbar-button tools-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowToolsMenu(!showToolsMenu);
                  }}
                  aria-label="工具"
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  </svg>
                  <span>Tools</span>
                </button>
              </div>
            </div>
            <div className="input-toolbar-right">
              <div className="mode-selector-wrapper">
                <button
                  className="toolbar-button mode-selector"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowModeMenu(!showModeMenu);
                  }}
                  type="button"
                >
                  <span>{currentMode}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
              <button className="toolbar-button mic-button" aria-label="语音输入" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          style={{ display: 'none' }}
          onChange={handleFolderSelect}
        />
      </div>
    </div>
  );
};

export default ChatArea;

