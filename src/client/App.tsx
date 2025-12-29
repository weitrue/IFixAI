import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Settings from './components/Settings';
import Toolbox from './components/Toolbox';
import { Conversation, Message } from './types';
import { ChatWebSocket, WebSocketResponse } from './utils/websocket';
import { api } from './utils/api';
import { extractData } from './utils/response';
import './styles/App.css';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<'gemini' | 'claude' | 'qwen' | 'gpt' | 'cursor'>('cursor');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const wsRef = useRef<ChatWebSocket | null>(null);
  const currentAssistantMessageRef = useRef<Message | null>(null);

  useEffect(() => {
    // Check connection
    fetch(api('api/health'))
      .then(() => setConnectionStatus('connected'))
      .catch(() => setConnectionStatus('disconnected'));

    // Load conversations and restore from URL
    const initializeApp = async () => {
      const loadedConversations = await loadConversations();
      
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get('page');
      const conversationId = urlParams.get('conversation');
      
      // Restore page state (Gems or Settings)
      if (page === 'gems' || page === 'toolbox') {
        setShowToolbox(true);
        setShowSettings(false);
        setCurrentConversation(null);
        updateUrlPage('gems');
      } else if (page === 'settings') {
        setShowSettings(true);
        setShowToolbox(false);
        setCurrentConversation(null);
        updateUrlPage('settings');
      } else if (conversationId) {
        // Restore conversation
        setShowSettings(false);
        setShowToolbox(false);
        // Find the conversation in the loaded list
        const conversation = loadedConversations.find((c: Conversation) => c.id === conversationId);
        if (conversation) {
          // Select the conversation
          await selectConversation(conversation);
        } else {
          // Conversation not found, try to load it from API
          try {
            const response = await fetch(api(`api/conversations/${conversationId}`));
            const result = await response.json();
            const data = extractData(result);
            if (data && data.id) {
              await selectConversation(data);
            } else {
              // Conversation doesn't exist, remove from URL
              updateUrlConversation(null);
            }
          } catch (error) {
            // Failed to load, remove from URL
            console.error('Failed to load conversation from URL:', error);
            updateUrlConversation(null);
          }
        }
      } else {
        // No page or conversation in URL, clear all
        setShowSettings(false);
        setShowToolbox(false);
        updateUrlPage(null);
      }
    };

    initializeApp();

    // Detect mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowSidebar(false);
        setSidebarCollapsed(false);
      } else {
        setShowSidebar(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
      // Create WebSocket connection for this conversation
      connectWebSocket(currentConversation.id);
    } else {
      // Clear messages when no conversation is selected
      setMessages([]);
      // Disconnect WebSocket
      disconnectWebSocket();
    }

    // Cleanup: disconnect WebSocket when component unmounts or conversation changes
    return () => {
      disconnectWebSocket();
    };
  }, [currentConversation?.id]);

  const loadConversations = async () => {
    try {
      const response = await fetch(api('api/conversations'));
      const result = await response.json();
      const data = extractData(result);
      // Ensure data is an array
      if (Array.isArray(data)) {
        setConversations(data);
        return data;
      } else {
        console.error('Invalid conversations data:', data);
        setConversations([]);
        return [];
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
      return [];
    }
  };

  // Update URL with conversation ID
  const updateUrlConversation = (conversationId: string | null) => {
    const url = new URL(window.location.href);
    if (conversationId) {
      url.searchParams.set('conversation', conversationId);
      // Remove page parameter when showing conversation
      url.searchParams.delete('page');
    } else {
      url.searchParams.delete('conversation');
    }
    // Use replaceState to avoid adding to browser history
    window.history.replaceState({}, '', url.toString());
  };

  // Update URL with page (gems/settings)
  const updateUrlPage = (page: string | null) => {
    const url = new URL(window.location.href);
    if (page) {
      url.searchParams.set('page', page);
      // Remove conversation parameter when showing page
      url.searchParams.delete('conversation');
    } else {
      url.searchParams.delete('page');
    }
    // Use replaceState to avoid adding to browser history
    window.history.replaceState({}, '', url.toString());
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(api(`api/conversations/${conversationId}`));
      const result = await response.json();
      const data = extractData(result);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const connectWebSocket = (conversationId: string) => {
    // Disconnect existing connection
    disconnectWebSocket();

    // Create new WebSocket connection
    const ws = new ChatWebSocket(
      conversationId,
      (response: WebSocketResponse) => {
        handleWebSocketMessage(response);
      },
      (error: Error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      }
    );

    wsRef.current = ws;
    ws.connect().catch((error) => {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('disconnected');
    });
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    currentAssistantMessageRef.current = null;
  };

  const handleWebSocketMessage = (response: WebSocketResponse) => {
    switch (response.type) {
      case 'connected':
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        break;

      case 'ack':
        console.log('Message acknowledged');
        break;

      case 'start':
        // Create assistant message placeholder
        if (currentConversation) {
          const assistantMessage: Message = {
            id: `temp-${Date.now()}`,
            conversation_id: currentConversation.id,
            role: 'assistant',
            content: '',
            created_at: Date.now(),
          };
          currentAssistantMessageRef.current = assistantMessage;
          setMessages((prev) => [...prev, assistantMessage]);
        }
        break;

      case 'chunk':
        // Append chunk to assistant message
        if (currentAssistantMessageRef.current && response.content) {
          currentAssistantMessageRef.current.content += response.content;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentAssistantMessageRef.current!.id
                ? { ...currentAssistantMessageRef.current! }
                : msg
            )
          );
        }
        break;

      case 'done':
        // Finalize assistant message
        if (currentAssistantMessageRef.current && response.messageId) {
          currentAssistantMessageRef.current.id = response.messageId;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentAssistantMessageRef.current!.id
                ? { ...currentAssistantMessageRef.current!, id: response.messageId! }
                : msg
            )
          );
          currentAssistantMessageRef.current = null;
          loadConversations(); // Refresh to update timestamp
        }
        break;

      case 'error':
        console.error('WebSocket error:', response.error);
        if (currentConversation) {
          const errorMessage: Message = {
            id: Date.now().toString(),
            conversation_id: currentConversation.id,
            role: 'assistant',
            content: `错误: ${response.error}`,
            created_at: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          currentAssistantMessageRef.current = null;
        }
        break;
    }
  };

  const createNewConversation = async (agentType: 'gemini' | 'claude' | 'qwen' | 'gpt' | 'cursor', model?: string) => {
    try {
      const response = await fetch(api('api/conversations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '新对话',
          agentType,
          model: model || undefined, // Send undefined instead of null
        }),
      });
      const result = await response.json();
      const conversation = extractData(result);
      setConversations([conversation, ...conversations]);
      setCurrentConversation(conversation);
      setSelectedAgent(agentType);
      setSelectedModel(conversation.model || '');
      setMessages([]);
      
      // Update URL with new conversation ID
      updateUrlConversation(conversation.id);
      
      // WebSocket will be connected automatically via useEffect
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    // Close settings and toolbox when selecting a conversation
    setShowSettings(false);
    setShowToolbox(false);
    
    // Set the conversation and agent
    setCurrentConversation(conversation);
    setSelectedAgent(conversation.agent_type as 'gemini' | 'claude' | 'qwen' | 'gpt' | 'cursor');
    
    // Update URL with conversation ID (this will also clear page parameter)
    updateUrlConversation(conversation.id);
    
    // Load messages immediately
    await loadMessages(conversation.id);
    
    // On mobile, close sidebar after selecting conversation
    if (isMobile) {
      setShowSidebar(false);
    }
    
    // Load models for the agent and set the model
    try {
      const response = await fetch(api(`api/models/${conversation.agent_type}`));
      const result = await response.json();
      const data = extractData(result);
      const models = Array.isArray(data) ? data : [];
      if (models.length > 0) {
        // Use conversation model if it exists and is valid, otherwise use default
        const modelExists = models.some((m: any) => m.model_value === conversation.model);
        if (conversation.model && modelExists) {
          setSelectedModel(conversation.model);
        } else {
          const defaultModel = models.find((m: any) => m.is_default === 1) || models[0];
          setSelectedModel(defaultModel.model_value);
          // Update conversation with default model if it doesn't have one
          if (!conversation.model) {
            await fetch(api(`api/conversations/${conversation.id}`), {
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
        const response = await fetch(api(`api/models/${selectedAgent}`));
        const result = await response.json();
        const data = extractData(result);
        const defaultModel = data.find((m: any) => m.is_default === 1) || data[0];
        const modelToUse = selectedModel || defaultModel?.model_value || '';
        
        // Create new conversation
        const convResponse = await fetch(api('api/conversations'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: content.substring(0, 30) || '新对话',
            agentType: selectedAgent,
            model: modelToUse || undefined,
          }),
        });
        const convResult = await convResponse.json();
        const newConversation = extractData(convResult);
        setConversations([newConversation, ...conversations]);
        setCurrentConversation(newConversation);
        setSelectedModel(newConversation.model || modelToUse);
        setMessages([]);
        
        // WebSocket will be connected automatically via useEffect
        // Wait a bit for WebSocket to connect, then send message
        setTimeout(() => {
          if (wsRef.current && wsRef.current.isConnected()) {
            const modelToUseForChat = selectedModel || newConversation.model || modelToUse;
            wsRef.current.sendChatMessage(content, selectedAgent, modelToUseForChat, undefined, imageUrl);
          } else {
            console.warn('WebSocket not connected yet, retrying...');
            setTimeout(() => {
              if (wsRef.current && wsRef.current.isConnected()) {
                const modelToUseForChat = selectedModel || newConversation.model || modelToUse;
                wsRef.current.sendChatMessage(content, selectedAgent, modelToUseForChat, undefined, imageUrl);
              }
            }, 1000);
          }
        }, 500);
        
        // Add user message to UI immediately
        const userMessage: Message = {
          id: Date.now().toString(),
          conversation_id: newConversation.id,
          role: 'user',
          content,
          image_url: imageUrl,
          created_at: Date.now(),
        };
        setMessages([userMessage]);
        
        return;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        alert('创建对话失败，请重试');
        return;
      }
    }
    
    // Use WebSocket to send message if connected
    if (wsRef.current && wsRef.current.isConnected()) {
      // Update conversation model if it has changed
      const modelToUse = selectedModel || currentConversation.model;
      if (modelToUse && modelToUse !== currentConversation.model) {
        try {
          await fetch(api(`api/conversations/${currentConversation.id}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelToUse }),
          });
          setCurrentConversation({ ...currentConversation, model: modelToUse });
        } catch (error) {
          console.error('Failed to update conversation model:', error);
        }
      }

      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        conversation_id: currentConversation.id,
        role: 'user',
        content,
        image_url: imageUrl,
        created_at: Date.now(),
      };
      setMessages([...messages, userMessage]);

      // Send via WebSocket
      wsRef.current.sendChatMessage(
        content,
        selectedAgent,
        modelToUse || currentConversation.model || undefined,
        undefined,
        imageUrl
      );
    } else {
      // Fallback to HTTP if WebSocket is not connected
      console.warn('WebSocket not connected, using HTTP fallback');
      const modelToUse = selectedModel || currentConversation.model;
      
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
        const response = await fetch(api(`api/chat/${currentConversation.id}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            agentType: selectedAgent,
            model: modelToUse,
            imageUrl,
          }),
        });

        const result = await response.json();
        const data = extractData(result);

        if (data && typeof data === 'object' && 'error' in data) {
          throw new Error((data as any).error);
        }

        const assistantMessage: Message = {
          id: data.messageId || Date.now().toString(),
          conversation_id: currentConversation.id,
          role: 'assistant',
          content: data.message || '',
          created_at: Date.now(),
        };

        setMessages([...messages, userMessage, assistantMessage]);
        loadConversations();
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
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await fetch(api(`api/conversations/${id}`), { method: 'DELETE' });
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
        disconnectWebSocket();
        // Clear URL parameter
        updateUrlConversation(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSave = () => {
    if (!currentConversation) {
      alert('请先选择一个对话');
      return;
    }
    // 这里可以实现保存功能，比如导出对话、保存到本地等
    // 目前先显示一个提示
    alert('对话已保存');
  };

  const goHome = () => {
    // Close settings and toolbox when going home
    setShowSettings(false);
    setShowToolbox(false);
    // Clear conversation and messages
    setCurrentConversation(null);
    setMessages([]);
    // Clear URL parameters
    updateUrlConversation(null);
    updateUrlPage(null);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="app">
      {isMobile && showSidebar && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setShowSidebar(false)}
        />
      )}
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onNewConversation={createNewConversation}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
        onOpenSettings={() => {
          setShowSettings(false);
          setShowToolbox(false);
          setShowSettings(true);
          setCurrentConversation(null);
          updateUrlPage('settings');
          if (isMobile) setShowSidebar(false);
        }}
        onOpenToolbox={() => {
          setShowSettings(false);
          setShowToolbox(true);
          setCurrentConversation(null);
          updateUrlPage('gems');
          if (isMobile) setShowSidebar(false);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobile={isMobile}
        showSidebar={showSidebar}
        onCloseSidebar={() => setShowSidebar(false)}
        onSave={handleSave}
        onGoHome={goHome}
      />
      {showSettings ? (
        <Settings onClose={() => {
          setShowSettings(false);
          updateUrlPage(null);
        }} />
      ) : showToolbox ? (
        <Toolbox onClose={() => {
          setShowToolbox(false);
          updateUrlPage(null);
        }} />
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
          isMobile={isMobile}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
        />
      )}
    </div>
  );
}

export default App;

