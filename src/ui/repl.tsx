import React, { useState, useRef, useEffect } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { AgentLoop } from '../agent/loop.js';
import { Config } from '../types/index.js';

interface Props {
  agent: AgentLoop;
  config: Config;
  onModelChange: (model: string) => void;
  onKeyUpdate: (provider: string, key: string) => void;
}

const REPL: React.FC<Props> = ({ agent, config, onModelChange, onKeyUpdate }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOutput, setCurrentOutput] = useState('');
  const [isSelectingModel, setIsSelectingModel] = useState(false);
  const [isPromptingKey, setIsPromptingKey] = useState(false);
  const [pendingProvider, setPendingProvider] = useState('');
  const [terminalHeight, setTerminalHeight] = useState(process.stdout.rows || 30);
  const { exit } = useApp();
  
  const outputRef = useRef('');

  useEffect(() => {
    const handleResize = () => setTerminalHeight(process.stdout.rows || 30);
    process.stdout.on('resize', handleResize);
    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  useInput((inputStr, key) => {
    if (key.escape || (key.ctrl && inputStr === 'c')) {
      exit();
    }
    if (key.ctrl && inputStr === 'm') {
      setIsSelectingModel(prev => !prev);
    }
  });

  const handleSubmit = async (value: string) => {
    if (isSelectingModel) return;
    
    if (isPromptingKey) {
      onKeyUpdate(pendingProvider, value);
      setIsPromptingKey(false);
      setPendingProvider('');
      setInput('');
      setHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM] API Key updated for ${pendingProvider}. Forge is now active.` }]);
      return;
    }

    if (!value.trim()) return;

    if (value.startsWith('/model ')) {
      const newModel = value.split(' ')[1];
      if (newModel) {
        handleModelSwitch(newModel);
        setInput('');
        return;
      }
    }
    
    setInput('');
    setHistory(prev => [...prev, { role: 'user', content: value }]);
    setIsProcessing(true);
    setCurrentOutput('');
    outputRef.current = '';

    try {
      await agent.run(value, (update) => {
        outputRef.current += update;
        setCurrentOutput(outputRef.current);
      });
      
      const finalOutput = outputRef.current;
      setHistory(prev => [...prev, { role: 'assistant', content: finalOutput }]);
    } catch (error: any) {
      setHistory(prev => [...prev, { role: 'error', content: error.message }]);
    } finally {
      setIsProcessing(false);
      setCurrentOutput('');
      outputRef.current = '';
    }
  };

  const handleModelSwitch = (modelName: string) => {
    const provider = config.providers?.find(p => p.models.includes(modelName));
    if (provider) {
      onModelChange(modelName);
      if (provider.name !== 'Ollama' && !provider.apiKey) {
        setIsPromptingKey(true);
        setPendingProvider(provider.name);
        setHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM] Switching to ${provider.name}. Please provide your API Key:` }]);
      } else {
        setHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM] Forge core switched to: ${modelName}` }]);
      }
    } else {
      setHistory(prev => [...prev, { role: 'error', content: `Model "${modelName}" not found in registry.` }]);
    }
  };

  const handleModelSelect = (item: { label: string; value: string }) => {
    setIsSelectingModel(false);
    handleModelSwitch(item.value);
  };

  const bronzeColor = "#CD7F32";
  const getCoreColor = () => {
    const provider = config.providers?.find(p => p.isActive);
    switch (provider?.name) {
      case 'Ollama': return 'yellow';
      case 'Gemini': return 'cyan';
      case 'OpenAI': return 'green';
      case 'Groq': return 'magenta';
      default: return 'white';
    }
  };

  const coreColor = getCoreColor();
  const modelOptions = config.providers?.flatMap(p => 
    p.models.map(m => ({ label: `[${p.name.toUpperCase()}] ${m}`, value: m }))
  ) || [];

  // STRICT LAYOUT DIMENSIONS
  const headerHeight = 10;
  const footerHeight = 4;
  const chatHeight = Math.max(5, terminalHeight - headerHeight - footerHeight - 2);
  
  // Sliding window: show only the last N messages that fit
  const maxMessagesPerView = Math.floor(chatHeight / 2);
  const visibleHistory = history.slice(-maxMessagesPerView);

  return (
    <Box flexDirection="column" height={terminalHeight} width="100%">
      {/* OPEN FORGE CLI HEADER */}
      <Box borderStyle="double" borderColor={bronzeColor} paddingX={2} paddingY={0} flexDirection="column" flexShrink={0}>
        <Box justifyContent="space-between" width="100%">
          <Box flexDirection="column">
            <Text bold color={bronzeColor}>
              ┌────────────────────────────────────────┐
            </Text>
            <Text bold color={bronzeColor}>
              │  ⚒  OPEN FORGE v2.5.0 - CAPABLE AGENT  │
            </Text>
            <Text bold color={bronzeColor}>
              └────────────────────────────────────────┘
            </Text>
          </Box>
          <Box flexDirection="column" alignItems="flex-end">
            <Box>
              <Text color="gray">CORE: </Text>
              <Text color={coreColor} bold>{config.model}</Text>
            </Box>
            <Box>
              <Text color="gray">STATUS: </Text>
              <Text color="green" bold>READY</Text>
            </Box>
          </Box>
        </Box>
        <Box marginTop={0} justifyContent="space-between">
          <Box>
            <Text color="cyan" bold>👐 HANDS: </Text>
            <Text color="white">ENABLED </Text>
            <Text color="magenta" bold>👁 VISION: </Text>
            <Text color="white">ACTIVE</Text>
          </Box>
          <Box>
            <Text color="gray" dimColor>CTRL+M to switch models</Text>
          </Box>
        </Box>
      </Box>

      {/* CHAT VIEWPORT */}
      <Box flexDirection="column" height={chatHeight} paddingX={2} paddingY={1} overflow="hidden">
        {visibleHistory.length === 0 && !isProcessing && (
          <Box flexDirection="column" alignItems="center" justifyContent="center" height="100%">
            <Text color="gray" italic>The forge is cold. Enter a command to begin crafting...</Text>
          </Box>
        )}
        
        {visibleHistory.map((msg, i) => (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Box>
              <Text color={msg.role === 'user' ? 'green' : msg.role === 'error' ? 'red' : coreColor} bold>
                {msg.role === 'user' ? 'USER ❯ ' : msg.role === 'error' ? 'ERROR ✗ ' : 'FORGE ◆ '}
              </Text>
            </Box>
            <Box paddingLeft={2}>
              <Text color="white">{msg.content}</Text>
            </Box>
          </Box>
        ))}

        {isProcessing && (
          <Box flexDirection="column" marginTop={1}>
            <Text color={coreColor} bold>
              <Spinner type="dots" /> FORGING...
            </Text>
            <Box paddingLeft={2}>
              <Text color="gray">{currentOutput}</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* FOOTER - INPUT AREA */}
      <Box borderStyle="round" borderColor={bronzeColor} paddingX={2} paddingY={0} flexShrink={0} height={footerHeight}>
        {isSelectingModel ? (
          <Box flexDirection="column" width="100%">
            <Text bold color="yellow">SELECT MODEL (CTRL+M to cancel):</Text>
            <SelectInput items={modelOptions} onSelect={handleModelSelect} />
          </Box>
        ) : (
          <Box width="100%">
            <Text color={coreColor} bold>{isPromptingKey ? 'KEY> ' : 'FORGE> '}</Text>
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder={isPromptingKey ? `Enter ${pendingProvider} API Key...` : "What shall we build today?"}
              mask={isPromptingKey ? "*" : undefined}
            />
          </Box>
        )}
      </Box>

      {/* QUICK HELP */}
      <Box justifyContent="center" flexShrink={0} marginBottom={0}>
        <Text color="gray" dimColor>ESC: EXIT | CTRL+M: MODELS | /model [name]: QUICK SWITCH</Text>
      </Box>
    </Box>
  );
};

export const startREPL = (agent: AgentLoop, config: Config, onModelChange: (model: string) => void, onKeyUpdate: (provider: string, key: string) => void) => {
  render(<REPL agent={agent} config={config} onModelChange={onModelChange} onKeyUpdate={onKeyUpdate} />);
};
