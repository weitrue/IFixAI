import React, { useState, useEffect } from 'react';
import { ApiKey } from '../types';
import '../styles/components/Settings.css';

interface SettingsProps {
  onClose: () => void;
}

interface AgentModel {
  id: string;
  agent_type: 'gemini' | 'claude' | 'qwen' | 'gpt';
  model_value: string;
  model_label: string;
  is_default: number;
  is_active: number;
  display_order: number;
  created_at: number;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'api-keys' | 'models'>('api-keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [models, setModels] = useState<AgentModel[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<'gemini' | 'claude' | 'qwen' | 'gpt'>('gemini');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showAddModelForm, setShowAddModelForm] = useState(false);
  const [newModelValue, setNewModelValue] = useState('');
  const [newModelLabel, setNewModelLabel] = useState('');
  const [newModelIsDefault, setNewModelIsDefault] = useState(false);

  useEffect(() => {
    if (activeTab === 'api-keys') {
      loadApiKeys();
    } else {
      loadModels();
    }
  }, [selectedAgent, activeTab]);

  const loadApiKeys = async () => {
    try {
      const response = await fetch(`/api/settings/api-keys/${selectedAgent}`);
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const loadModels = async () => {
    try {
      const response = await fetch(`/api/models/${selectedAgent}`);
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleAddKey = async () => {
    if (!newKeyName.trim() || !newApiKey.trim()) {
      alert('请输入密钥名称和API密钥');
      return;
    }

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: selectedAgent,
          keyName: newKeyName,
          apiKey: newApiKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add API key');
      }

      setNewKeyName('');
      setNewApiKey('');
      setShowAddForm(false);
      loadApiKeys();
    } catch (error: any) {
      alert(`添加失败: ${error.message}`);
    }
  };

  const handleToggleActive = async (id: string, isActive: number) => {
    try {
      await fetch(`/api/settings/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });
      loadApiKeys();
    } catch (error: any) {
      alert(`更新失败: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个API密钥吗？')) return;

    try {
      await fetch(`/api/settings/api-keys/${id}`, {
        method: 'DELETE',
      });
      loadApiKeys();
    } catch (error: any) {
      alert(`删除失败: ${error.message}`);
    }
  };

  const handleAddModel = async () => {
    if (!newModelValue.trim() || !newModelLabel.trim()) {
      alert('请输入模型值和显示名称');
      return;
    }

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: selectedAgent,
          modelValue: newModelValue,
          modelLabel: newModelLabel,
          isDefault: newModelIsDefault,
          displayOrder: models.length,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add model');
      }

      setNewModelValue('');
      setNewModelLabel('');
      setNewModelIsDefault(false);
      setShowAddModelForm(false);
      loadModels();
    } catch (error: any) {
      alert(`添加失败: ${error.message}`);
    }
  };

  const handleToggleModelActive = async (id: string, isActive: number) => {
    try {
      await fetch(`/api/models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });
      loadModels();
    } catch (error: any) {
      alert(`更新失败: ${error.message}`);
    }
  };

  const handleSetDefaultModel = async (id: string) => {
    try {
      await fetch(`/api/models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDefault: true,
        }),
      });
      loadModels();
    } catch (error: any) {
      alert(`设置失败: ${error.message}`);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!window.confirm('确定要删除这个模型吗？')) return;

    try {
      await fetch(`/api/models/${id}`, {
        method: 'DELETE',
      });
      loadModels();
    } catch (error: any) {
      alert(`删除失败: ${error.message}`);
    }
  };

  const agentNames = {
    gemini: 'Gemini',
    claude: 'Claude',
    qwen: 'Qwen Code',
    gpt: 'GPT',
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h2>设置</h2>
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'api-keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-keys')}
          >
            API 密钥
          </button>
          <button
            className={`settings-tab ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            模型管理
          </button>
        </div>

        {activeTab === 'api-keys' && (
          <div className="settings-section">
            <h3>API 密钥管理</h3>
            <p className="section-description">为每个 AI Agent 添加和管理 API 密钥</p>

            <div className="agent-tabs">
            {(['gemini', 'claude', 'qwen', 'gpt'] as const).map((agent) => (
              <button
                key={agent}
                className={`agent-tab ${selectedAgent === agent ? 'active' : ''}`}
                onClick={() => setSelectedAgent(agent)}
              >
                {agentNames[agent]}
              </button>
            ))}
          </div>

          <div className="api-keys-list">
            {apiKeys.map((key) => (
              <div key={key.id} className="api-key-item">
                <div className="api-key-info">
                  <div className="api-key-name">{key.key_name}</div>
                  <div className="api-key-meta">
                    创建于 {new Date(key.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div className="api-key-actions">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={key.is_active === 1}
                      onChange={() => handleToggleActive(key.id, key.is_active)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button
                    className="delete-key-button"
                    onClick={() => handleDelete(key.id)}
                    aria-label="删除"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {!showAddForm && (
              <button className="add-key-button" onClick={() => setShowAddForm(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                添加新的 API 密钥
              </button>
            )}

            {showAddForm && (
              <div className="add-key-form">
                <input
                  type="text"
                  placeholder="密钥名称（例如：主密钥、备用密钥）"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="form-input"
                />
                <input
                  type="password"
                  placeholder="API 密钥"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="form-input"
                />
                <div className="form-actions">
                  <button className="cancel-button" onClick={() => {
                    setShowAddForm(false);
                    setNewKeyName('');
                    setNewApiKey('');
                  }}>
                    取消
                  </button>
                  <button className="save-button" onClick={handleAddKey}>
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {activeTab === 'models' && (
          <div className="settings-section">
            <h3>模型管理</h3>
            <p className="section-description">为每个 AI Agent 配置可用的模型列表</p>

            <div className="agent-tabs">
              {(['gemini', 'claude', 'qwen', 'gpt'] as const).map((agent) => (
                <button
                  key={agent}
                  className={`agent-tab ${selectedAgent === agent ? 'active' : ''}`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  {agentNames[agent]}
                </button>
              ))}
            </div>

            <div className="api-keys-list">
              {models.map((model) => (
                <div key={model.id} className="api-key-item">
                  <div className="api-key-info">
                    <div className="api-key-name">
                      {model.model_label}
                      {model.is_default === 1 && (
                        <span className="default-badge">默认</span>
                      )}
                    </div>
                    <div className="api-key-meta">
                      {model.model_value} • 创建于 {new Date(model.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="api-key-actions">
                    {model.is_default === 0 && (
                      <button
                        className="set-default-button"
                        onClick={() => handleSetDefaultModel(model.id)}
                        title="设为默认"
                      >
                        设为默认
                      </button>
                    )}
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={model.is_active === 1}
                        onChange={() => handleToggleModelActive(model.id, model.is_active)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <button
                      className="delete-key-button"
                      onClick={() => handleDeleteModel(model.id)}
                      aria-label="删除"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {!showAddModelForm && (
                <button className="add-key-button" onClick={() => setShowAddModelForm(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  添加新模型
                </button>
              )}

              {showAddModelForm && (
                <div className="add-key-form">
                  <input
                    type="text"
                    placeholder="模型值（例如：gpt-4o, gemini-pro）"
                    value={newModelValue}
                    onChange={(e) => setNewModelValue(e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="显示名称（例如：GPT-4o, Gemini Pro）"
                    value={newModelLabel}
                    onChange={(e) => setNewModelLabel(e.target.value)}
                    className="form-input"
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newModelIsDefault}
                      onChange={(e) => setNewModelIsDefault(e.target.checked)}
                    />
                    <span>设为默认模型</span>
                  </label>
                  <div className="form-actions">
                    <button className="cancel-button" onClick={() => {
                      setShowAddModelForm(false);
                      setNewModelValue('');
                      setNewModelLabel('');
                      setNewModelIsDefault(false);
                    }}>
                      取消
                    </button>
                    <button className="save-button" onClick={handleAddModel}>
                      保存
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

