import React from 'react';
import { Conversation } from '../types';
import '../styles/components/Sidebar.css';

interface SidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onNewConversation: (agentType: 'gemini' | 'claude' | 'qwen' | 'gpt') => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  onOpenToolbox?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  showSidebar?: boolean;
  onCloseSidebar?: () => void;
  onSave?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenToolbox,
  collapsed,
  onToggleCollapse,
  isMobile = false,
  showSidebar = true,
  onCloseSidebar,
  onSave,
}) => {
  const handleNewConversation = () => {
    // Default to Gemini for new conversations
    onNewConversation('gemini');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${isMobile && !showSidebar ? 'hidden' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="logo">
            <span className="logo-text">IFixAI</span>
          </div>
        )}
        {isMobile && onCloseSidebar && (
          <button className="close-sidebar-button" onClick={onCloseSidebar} aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        {!isMobile && (
          <button className="menu-button" onClick={onToggleCollapse} aria-label={collapsed ? "展开" : "收起"}>
            {collapsed ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            )}
          </button>
        )}
      </div>

      <button className="new-conversation-button" onClick={handleNewConversation} title={collapsed ? "发起新对话" : ""}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        {!collapsed && <span>发起新对话</span>}
      </button>

      {onOpenToolbox && (
        <button 
          className="toolbox-button" 
          onClick={onOpenToolbox} 
          title={collapsed ? "Gems" : ""}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          </svg>
          {!collapsed && <span>Gems</span>}
        </button>
      )}

      <div className="conversations-section">
        {!collapsed && <h3 className="section-title">近期对话</h3>}
        <div className="conversations-list">
          {conversations.map(conversation => (
            <div
              key={conversation.id}
              className={`conversation-item ${currentConversation?.id === conversation.id ? 'active' : ''}`}
              onClick={() => onSelectConversation(conversation)}
              title={collapsed ? conversation.title : ''}
            >
              <svg
                className="conversation-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {!collapsed && (
                <>
                  <div className="conversation-content">
                    <div className="conversation-title">{conversation.title}</div>
                    <div className="conversation-meta">{formatDate(conversation.updated_at)}</div>
                  </div>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('确定要删除这个对话吗？')) {
                        onDeleteConversation(conversation.id);
                      }
                    }}
                    aria-label="删除对话"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
          {conversations.length === 0 && !collapsed && (
            <div className="empty-state">暂无对话</div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        {isMobile && onSave && (
          <button 
            className="sidebar-save-button" 
            onClick={onSave} 
            title={collapsed ? "保存" : ""}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            {!collapsed && <span>保存对话</span>}
          </button>
        )}
        <button className="settings-button" onClick={onOpenSettings} title={collapsed ? "设置和帮助" : ""}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
          </svg>
          {!collapsed && <span>设置和帮助</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

