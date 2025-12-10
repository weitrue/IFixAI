import React, { useState, useEffect } from 'react';
import '../../styles/components/JSONFormatter.css';

const JSONFormatter: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [indentSize, setIndentSize] = useState(2);

  // 验证 JSON 合法性
  const validateJSON = (text: string): { valid: boolean; error?: string; data?: any } => {
    if (!text.trim()) {
      return { valid: false, error: '请输入 JSON 数据' };
    }

    try {
      // 尝试解析 JSON
      const parsed = JSON.parse(text);
      return { valid: true, data: parsed };
    } catch (error: any) {
      // 提取错误信息
      const errorMsg = error.message || 'JSON 格式错误';
      // 尝试提取错误位置
      const match = errorMsg.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1]);
        const lines = text.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return { valid: false, error: `第 ${line} 行，第 ${column} 列：${errorMsg}` };
      }
      return { valid: false, error: errorMsg };
    }
  };

  // 实时验证
  useEffect(() => {
    if (inputText.trim()) {
      const validation = validateJSON(inputText);
      setIsValid(validation.valid);
      setErrorMessage(validation.error || '');
      if (validation.valid && validation.data) {
        // 如果有效，自动格式化
        try {
          setOutputText(JSON.stringify(validation.data, null, indentSize));
        } catch {
          // 忽略格式化错误
        }
      } else {
        setOutputText('');
      }
    } else {
      setIsValid(null);
      setErrorMessage('');
      setOutputText('');
    }
  }, [inputText, indentSize]);

  // 美化 JSON（格式化）
  const formatJSON = () => {
    const validation = validateJSON(inputText);
    if (validation.valid && validation.data) {
      try {
        const formatted = JSON.stringify(validation.data, null, indentSize);
        setOutputText(formatted);
      } catch (error: any) {
        setErrorMessage('格式化失败：' + error.message);
      }
    } else {
      setErrorMessage(validation.error || 'JSON 格式错误，无法格式化');
    }
  };

  // 压缩 JSON（去除所有空格和换行）
  const compressJSON = () => {
    const validation = validateJSON(inputText);
    if (validation.valid && validation.data) {
      try {
        const compressed = JSON.stringify(validation.data);
        setOutputText(compressed);
      } catch (error: any) {
        setErrorMessage('压缩失败：' + error.message);
      }
    } else {
      setErrorMessage(validation.error || 'JSON 格式错误，无法压缩');
    }
  };

  // 去除转义（unescape）
  const unescapeJSON = () => {
    try {
      // 处理转义的 JSON 字符串
      let unescaped = inputText;
      
      // 如果输入是字符串格式的 JSON（带引号），先解析
      if (unescaped.trim().startsWith('"') && unescaped.trim().endsWith('"')) {
        unescaped = JSON.parse(unescaped);
      }
      
      // 尝试解析为 JSON 对象
      const parsed = JSON.parse(unescaped);
      setOutputText(JSON.stringify(parsed, null, indentSize));
      setIsValid(true);
      setErrorMessage('');
    } catch (error: any) {
      // 如果解析失败，尝试直接去除转义字符
      try {
        let result = inputText;
        // 替换常见的转义字符
        result = result.replace(/\\n/g, '\n');
        result = result.replace(/\\t/g, '\t');
        result = result.replace(/\\r/g, '\r');
        result = result.replace(/\\"/g, '"');
        result = result.replace(/\\'/g, "'");
        result = result.replace(/\\\\/g, '\\');
        
        // 验证结果是否为有效 JSON
        const validation = validateJSON(result);
        if (validation.valid) {
          setOutputText(JSON.stringify(validation.data, null, indentSize));
          setIsValid(true);
          setErrorMessage('');
        } else {
          setErrorMessage('去除转义后仍不是有效的 JSON：' + validation.error);
          setIsValid(false);
        }
      } catch (e: any) {
        setErrorMessage('去除转义失败：' + (e.message || '未知错误'));
        setIsValid(false);
      }
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopy = () => {
    const textToCopy = outputText || inputText;
    if (textToCopy) {
      copyToClipboard(textToCopy);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setIsValid(null);
    setErrorMessage('');
  };

  const maxLength = 50000;
  const inputLength = inputText.length;

  return (
    <div className="json-formatter">
      <div className="formatter-content">
        <div className="formatter-title-section">
          <h2>JSON 格式化</h2>
        </div>

        <div className="input-section">
          <div className="input-header">
            <label>输入 JSON 数据</label>
            <div className="validation-status">
              {isValid === true && (
                <span className="status-valid">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  有效 JSON
                </span>
              )}
              {isValid === false && (
                <span className="status-invalid">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  无效 JSON
                </span>
              )}
            </div>
          </div>
          <textarea
            className={`text-input ${isValid === false ? 'input-error' : ''} ${isValid === true ? 'input-valid' : ''}`}
            placeholder='请输入 JSON 数据，例如：{"name": "example", "value": 123}'
            value={inputText}
            onChange={(e) => {
              const newValue = e.target.value;
              // 允许输入，但限制最大长度
              if (newValue.length <= maxLength) {
                setInputText(newValue);
              } else {
                // 如果超过限制，截取前 maxLength 个字符
                setInputText(newValue.substring(0, maxLength));
              }
            }}
            rows={12}
          />
          {errorMessage && isValid === false && (
            <div className="error-message">{errorMessage}</div>
          )}
          <div className="char-counter">{inputLength} / {maxLength}</div>
        </div>

        <div className="button-group">
          <h3 className="button-group-title">操作</h3>
          <div className="button-row">
            <button className="btn-green" onClick={formatJSON} disabled={!isValid}>
              美化格式化
            </button>
            <button className="btn-green" onClick={compressJSON} disabled={!isValid}>
              压缩
            </button>
            <button className="btn-green" onClick={unescapeJSON}>
              去除转义
            </button>
            <button className="btn-orange" onClick={handleCopy} disabled={!outputText && !inputText}>
              复制
            </button>
            <button className="btn-red" onClick={handleClear}>
              清空
            </button>
          </div>
        </div>

        <div className="settings-section">
          <label className="settings-label">
            缩进大小：
            <select 
              value={indentSize} 
              onChange={(e) => setIndentSize(Number(e.target.value))}
              className="indent-select"
            >
              <option value={2}>2 空格</option>
              <option value={4}>4 空格</option>
              <option value={8}>8 空格</option>
              <option value={1}>1 空格</option>
            </select>
          </label>
        </div>

        {outputText && (
          <div className="output-section">
            <div className="output-header">
              <label>格式化结果</label>
              <button className="copy-button-small" onClick={() => copyToClipboard(outputText)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                复制
              </button>
            </div>
            <textarea
              className="text-output"
              value={outputText}
              readOnly
              rows={12}
            />
            <div className="char-counter">{outputText.length} 字符</div>
          </div>
        )}

        <div className="hint-section">
          <div className="hint-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            使用提示
          </div>
          <ul className="hint-list">
            <li>输入框会实时验证 JSON 的合法性</li>
            <li>点击"美化格式化"可以格式化 JSON（添加缩进和换行）</li>
            <li>点击"压缩"可以去除所有空格和换行，压缩 JSON</li>
            <li>点击"去除转义"可以处理转义的 JSON 字符串</li>
            <li>可以调整缩进大小来改变格式化后的缩进</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JSONFormatter;

