import React, { useState } from 'react';
import TextConverter from './toolbox/TextConverter';
import '../styles/components/Toolbox.css';

interface ToolboxProps {
  onClose: () => void;
}

const Toolbox: React.FC<ToolboxProps> = ({ onClose }) => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const tools = [
    {
      id: 'code-formatter',
      name: '代码格式化',
      icon: '💻',
      description: '格式化各种编程语言代码',
    },
    {
      id: 'text-converter',
      name: '文本转换',
      icon: '📝',
      description: '大小写转换、编码转换等',
    },
    {
      id: 'image-processor',
      name: '图片处理',
      icon: '🖼️',
      description: '图片压缩、格式转换',
    },
    {
      id: 'data-analyzer',
      name: '数据分析',
      icon: '📊',
      description: '数据可视化和分析工具',
    },
    {
      id: 'api-tester',
      name: 'API 测试',
      icon: '🔌',
      description: '测试和调试 API 接口',
    },
    {
      id: 'json-formatter',
      name: 'JSON 格式化',
      icon: '📄',
      description: 'JSON 格式化、验证和美化',
    },
  ];

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
  };

  const handleBack = () => {
    setSelectedTool(null);
  };

  // 如果选择了文本转换工具，直接显示该工具
  if (selectedTool === 'text-converter') {
    return (
      <div className="toolbox">
        <div className="toolbox-header">
          <button className="back-button" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>返回</span>
          </button>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="toolbox-tool-content">
          <TextConverter />
        </div>
      </div>
    );
  }

  return (
    <div className="toolbox">
      <div className="toolbox-header">
        <h2>Gems</h2>
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="toolbox-content">
        <p className="toolbox-description">
          这里提供各种实用工具，帮助您更高效地完成工作
        </p>

        <div className="tools-grid">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={`tool-item tool-item-${tool.id}`}
              onClick={() => handleToolClick(tool.id)}
            >
              <div className="tool-background"></div>
              <div className="tool-icon">{tool.icon}</div>
              <div className="tool-info">
                <h3 className="tool-name">{tool.name}</h3>
                <p className="tool-description">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toolbox;

