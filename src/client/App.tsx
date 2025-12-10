import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Settings from './components/Settings';
import { Conversation, Message, ApiKey } from './types';
import './styles/App.css';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<'gemini' | 'claude' | 'qwen' | 'gpt'>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    // Check connection
    fetch('/api/health')
      .then(() => setConnectionStatus('connected'))
      .catch(() => setConnectionStatus('disconnected'));

    // Load conversations
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewConversation = async (agentType: 'gemini' | 'claude' | 'qwen' | 'gpt', model?: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '新对话',
          agentType,
          model: model || null,
        }),
      });
      const conversation = await response.json();
      setConversations([conversation, ...conversations]);
      setCurrentConversation(conversation);
      setSelectedAgent(agentType);
      setSelectedModel(conversation.model || '');
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setSelectedAgent(conversation.agent_type as 'gemini' | 'claude' | 'qwen' | 'gpt');
    // Load models for the agent and set the model
    try {
      const response = await fetch(`/api/models/${conversation.agent_type}`);
      const data = await response.json();
      if (data.length > 0) {
        // Use conversation model if it exists and is valid, otherwise use default
        const modelExists = data.some((m: any) => m.model_value === conversation.model);
        if (conversation.model && modelExists) {
          setSelectedModel(conversation.model);
        } else {
          const defaultModel = data.find((m: any) => m.is_default === 1) || data[0];
          setSelectedModel(defaultModel.model_value);
          // Update conversation with default model if it doesn't have one
          if (!conversation.model) {
            await fetch(`/api/conversations/${conversation.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: defaultModel.model_value }),
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      setSelectedModel(conversation.model || '');
    }
  };

  const sendMessage = async (content: string, imageUrl?: string) => {
    // If no conversation and no content, return early
    if (!content.trim() && !imageUrl) return;
    
    // If no conversation exists, create one first
    if (!currentConversation) {
      try {
        // Get default model for the selected agent
        const response = await fetch(`/api/models/${selectedAgent}`);
        const data = await response.json();
        const defaultModel = data.find((m: any) => m.is_default === 1) || data[0];
        const modelToUse = selectedModel || defaultModel?.model_value || '';
        
        // Create new conversation
        const convResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: content.substring(0, 30) || '新对话',
            agentType: selectedAgent,
            model: modelToUse,
          }),
        });
        const newConversation = await convResponse.json();
        setConversations([newConversation, ...conversations]);
        setCurrentConversation(newConversation);
        setSelectedModel(newConversation.model || modelToUse);
        setMessages([]);
        
        // Now we have a conversation, continue with sending message
        // Use the new conversation for sending
        const conversationToUse = newConversation;
        
        // Update conversation model if needed
        const modelToUseForChat = selectedModel || conversationToUse.model || modelToUse;
        if (modelToUseForChat && modelToUseForChat !== conversationToUse.model) {
          try {
            await fetch(`/api/conversations/${conversationToUse.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: modelToUseForChat }),
            });
            setCurrentConversation({ ...conversationToUse, model: modelToUseForChat });
          } catch (error) {
            console.error('Failed to update conversation model:', error);
          }
        }

        const userMessage: Message = {
          id: Date.now().toString(),
          conversation_id: conversationToUse.id,
          role: 'user',
          content,
          image_url: imageUrl,
          created_at: Date.now(),
        };

        setMessages([userMessage]);

        try {
          const chatResponse = await fetch(`/api/chat/${conversationToUse.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: content,
              agentType: selectedAgent,
              model: modelToUseForChat,
              imageUrl,
            }),
          });

          const data = await chatResponse.json();

          if (data.error) {
            throw new Error(data.error);
          }

          const assistantMessage: Message = {
            id: data.messageId,
            conversation_id: conversationToUse.id,
            role: 'assistant',
            content: data.message,
            created_at: Date.now(),
          };

          setMessages([userMessage, assistantMessage]);
          loadConversations();
        } catch (error: any) {
          console.error('Failed to send message:', error);
          const errorMessage: Message = {
            id: Date.now().toString(),
            conversation_id: conversationToUse.id,
            role: 'assistant',
            content: `错误: ${error.message}`,
            created_at: Date.now(),
          };
          setMessages([userMessage, errorMessage]);
        }
        
        return;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        alert('创建对话失败，请重试');
        return;
      }
    }
    
    // Original logic for when conversation exists
    if (!content.trim() && !imageUrl) return;

    // Update conversation model if it has changed
    const modelToUse = selectedModel || currentConversation.model;
    if (modelToUse && modelToUse !== currentConversation.model) {
      try {
        await fetch(`/api/conversations/${currentConversation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelToUse }),
        });
        // Update local conversation state
        setCurrentConversation({ ...currentConversation, model: modelToUse });
      } catch (error) {
        console.error('Failed to update conversation model:', error);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: currentConversation.id,
      role: 'user',
      content,
      image_url: imageUrl,
      created_at: Date.now(),
    };

    setMessages([...messages, userMessage]);

    try {
      const response = await fetch(`/api/chat/${currentConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          agentType: selectedAgent,
          model: modelToUse,
          imageUrl,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: data.messageId,
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: data.message,
        created_at: Date.now(),
      };

      setMessages([...messages, userMessage, assistantMessage]);
      loadConversations(); // Refresh to update timestamp
    } catch (error: any) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: `错误: ${error.message}`,
        created_at: Date.now(),
      };
      setMessages([...messages, userMessage, errorMessage]);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onNewConversation={createNewConversation}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
        onOpenSettings={() => setShowSettings(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      {showSettings ? (
        <Settings onClose={() => setShowSettings(false)} />
      ) : (
        <ChatArea
          conversation={currentConversation}
          messages={messages}
          selectedAgent={selectedAgent}
          selectedModel={selectedModel}
          onSendMessage={sendMessage}
          onAgentChange={setSelectedAgent}
          onModelChange={setSelectedModel}
          onCreateConversation={createNewConversation}
          connectionStatus={connectionStatus}
        />
      )}
    </div>
  );
}

export default App;

