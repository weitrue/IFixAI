import React, { useState } from 'react';
import '../../styles/components/TextConverter.css';

const TextConverter: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [autoCopy, setAutoCopy] = useState(false);
  const [showNewTextbox, setShowNewTextbox] = useState(false);
  const [addToDictionary, setAddToDictionary] = useState(false);

  // 大小写转换函数
  const convertToUpperCase = () => {
    const result = inputText.toUpperCase();
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const convertToLowerCase = () => {
    const result = inputText.toLowerCase();
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const convertToFirstLetterUpper = () => {
    const result = inputText.replace(/\b\w/g, (char) => char.toUpperCase());
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const convertToFirstLetterLower = () => {
    const result = inputText.replace(/\b\w/g, (char) => char.toLowerCase());
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const convertToSentenceCase = () => {
    const result = inputText.replace(/([.!?:]\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const convertToTitleCase = () => {
    const minorWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'with'];
    const words = inputText.toLowerCase().split(/\s+/);
    const result = words.map((word, index) => {
      if (index === 0 || index === words.length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (minorWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  // 格式转换函数
  const spaceToUnderscore = () => {
    const result = inputText.replace(/\s+/g, '_');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const underscoreToCamelCase = () => {
    const result = inputText.replace(/[_\s]+(.)/g, (_, char) => char.toUpperCase()).replace(/^./, (char) => char.toLowerCase());
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const camelCaseToUnderscore = () => {
    const result = inputText.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const camelCaseToSpace = () => {
    const result = inputText.replace(/([A-Z])/g, ' $1').trim();
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const spaceToHyphen = () => {
    const result = inputText.replace(/\s+/g, '-');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const underscoreToHyphen = () => {
    const result = inputText.replace(/_/g, '-');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const hyphenToUnderscore = () => {
    const result = inputText.replace(/-/g, '_');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const underscoreToSpace = () => {
    const result = inputText.replace(/_/g, ' ');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const underscoreToDot = () => {
    const result = inputText.replace(/_/g, '.');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const dotToUnderscore = () => {
    const result = inputText.replace(/\./g, '_');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const spaceToLineBreak = () => {
    const result = inputText.replace(/\s+/g, '\n');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const lineBreakToSpace = () => {
    const result = inputText.replace(/\n+/g, ' ');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const clearSymbols = () => {
    const result = inputText.replace(/[^\w\s]/g, '');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const clearSpaces = () => {
    const result = inputText.replace(/\s+/g, '');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  const clearLineBreaks = () => {
    const result = inputText.replace(/\n+/g, '');
    setOutputText(result);
    if (autoCopy) copyToClipboard(result);
  };

  // 工具函数
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopy = () => {
    const textToCopy = showNewTextbox ? outputText : inputText;
    copyToClipboard(textToCopy);
  };

  const handleCut = () => {
    copyToClipboard(inputText);
    setInputText('');
    setOutputText('');
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const maxLength = 5000;
  const inputLength = inputText.length;

  return (
    <div className="text-converter">
      <div className="converter-content">
        <div className="converter-title-section">
          <h2>文本转换</h2>
        </div>
        <div className="input-section">
          <textarea
            className="text-input"
            placeholder="请把你你需要转换的内容粘贴在这里"
            value={inputText}
            onChange={(e) => {
              if (e.target.value.length <= maxLength) {
                setInputText(e.target.value);
              }
            }}
            rows={8}
          />
          <div className="char-counter">{inputLength} / {maxLength}</div>
        </div>

        {showNewTextbox && outputText && (
          <div className="output-section">
            <textarea
              className="text-output"
              value={outputText}
              readOnly
              rows={8}
            />
          </div>
        )}

        <div className="buttons-section">
          <div className="button-group">
            <h3 className="button-group-title">大小写转换</h3>
            <div className="button-row">
              <button className="btn-green" onClick={convertToUpperCase}>全大写 AB</button>
              <button className="btn-green" onClick={convertToLowerCase}>全小写 ab</button>
              <button className="btn-green" onClick={convertToFirstLetterUpper}>首字母大写 Aa Bb</button>
              <button className="btn-green" onClick={convertToFirstLetterLower}>首字母小写 aA bB</button>
              <button className="btn-green" onClick={convertToSentenceCase}>句子首字母大写 Aa bb</button>
              <button className="btn-green" onClick={convertToTitleCase}>标题大小写 Title Case</button>
            </div>
          </div>

          <div className="button-group">
            <div className="button-row">
              <button className="btn-orange" onClick={handleCopy}>复制</button>
              <button className="btn-blue" onClick={handleCut}>剪切</button>
              <button className="btn-red" onClick={handleClear}>清空</button>
            </div>
          </div>

          <div className="button-group">
            <h3 className="button-group-title">格式转换</h3>
            <div className="button-row">
              <button className="btn-green" onClick={spaceToUnderscore}>空格→下划线</button>
              <button className="btn-green" onClick={underscoreToCamelCase}>下划线&空格→驼峰</button>
              <button className="btn-green" onClick={camelCaseToUnderscore}>驼峰→下划线</button>
              <button className="btn-green" onClick={camelCaseToSpace}>驼峰→空格</button>
            </div>
            <div className="button-row">
              <button className="btn-green" onClick={spaceToHyphen}>空格→中横线</button>
              <button className="btn-green" onClick={underscoreToHyphen}>下划线→中横线</button>
              <button className="btn-green" onClick={hyphenToUnderscore}>中横线→下划线</button>
              <button className="btn-green" onClick={underscoreToSpace}>下划线→空格</button>
            </div>
            <div className="button-row">
              <button className="btn-green" onClick={underscoreToDot}>下划线→小数点</button>
              <button className="btn-green" onClick={dotToUnderscore}>小数点→下划线</button>
              <button className="btn-green" onClick={spaceToLineBreak}>空格→换行</button>
              <button className="btn-green" onClick={lineBreakToSpace}>换行→空格</button>
            </div>
            <div className="button-row">
              <button className="btn-green" onClick={clearSymbols}>清除符号</button>
              <button className="btn-green" onClick={clearSpaces}>清除空格</button>
              <button className="btn-green" onClick={clearLineBreaks}>清除换行</button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="setting-item">
            <label>转换自动复制结果:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="autoCopy"
                  checked={!autoCopy}
                  onChange={() => setAutoCopy(false)}
                />
                否
              </label>
              <label>
                <input
                  type="radio"
                  name="autoCopy"
                  checked={autoCopy}
                  onChange={() => setAutoCopy(true)}
                />
                是
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label>新文本框显示结果:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="showNewTextbox"
                  checked={!showNewTextbox}
                  onChange={() => setShowNewTextbox(false)}
                />
                否
              </label>
              <label>
                <input
                  type="radio"
                  name="showNewTextbox"
                  checked={showNewTextbox}
                  onChange={() => setShowNewTextbox(true)}
                />
                是
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label>添加原样输出词库:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="addToDictionary"
                  checked={!addToDictionary}
                  onChange={() => setAddToDictionary(false)}
                />
                否
              </label>
              <label>
                <input
                  type="radio"
                  name="addToDictionary"
                  checked={addToDictionary}
                  onChange={() => setAddToDictionary(true)}
                />
                是
              </label>
            </div>
          </div>
        </div>

        <div className="hint-section">
          <div className="hint-icon">●</div>
          <div className="hint-text">
            首字母转大写仅在英文单词前有空格的情况下才有效;每句首字母大写仅在符号".!?:"后的第一个单词有效;"标题大小写"目前的全大写缩写词库还比较少,大家可以反馈提交。
          </div>
        </div>

        <div className="info-section">
          <h3>英文标题大小写格式</h3>
          <p>
            Title case 或 Headline case 是一种大写风格,用于以英文呈现已出版作品或艺术作品的标题,本工具使用APA Style。标题大写格式:所有单词都要是首字母大写,除了不是标题第一个或最后一个单词的次要单词(通常是冠词、短介词和连词)。本工具不大写的次要单词包括:a, an, and, as, at, but, by, for, from, in, nor, of, on, or, the, to, with等。
          </p>
        </div>
      </div>
    </div>
  );
};

export default TextConverter;

