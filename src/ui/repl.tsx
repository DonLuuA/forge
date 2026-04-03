import React, { useState, useRef, useEffect } from 'react';
import { render, Text, Box, useInput, useApp, Static } from 'ink';
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
      setHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM] API Key updated for ${pendingProvider}. Core is now active.` }]);
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
        setHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM] Core model switched to: ${modelName}` }]);
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
      case 'Ollama': return 'orange';
      case 'Gemini': return 'blue';
      case 'OpenAI': return 'green';
      case 'Groq': return 'magenta';
      default: return bronzeColor;
    }
  };

  const coreColor = getCoreColor();
  const modelOptions = config.providers?.flatMap(p => 
    p.models.map(m => ({ label: `[${p.name.toUpperCase()}] ${m}`, value: m }))
  ) || [];

  // Strictly manage the chat viewport height to prevent header push
  const headerHeight = 10;
  const footerHeight = 6;
  const chatHeight = terminalHeight - headerHeight - footerHeight;
  const visibleHistory = history.slice(-Math.max(1, Math.floor(chatHeight / 2)));

  return (
    <Box flexDirection="column" height={terminalHeight} width="100%">
      {/* FIXED HEADER - MACHINED BRONZE DASHBOARD */}
      <Box borderStyle="double" borderColor={bronzeColor} paddingX={2} flexDirection="column" flexShrink={0} height={headerHeight}>
        <Box justifyContent="space-between">
          <Box flexDirection="column">
            <Text bold color={bronzeColor}>
              {"  ▓▓▓▓▓▓ ▓▓▓▓  ▓▓▓▓▓   ▓▓▓▓▓ ▓▓▓▓▓▓ "}
            </Text>
            <Text bold color={bronzeColor}>
              {" ▓▓      ▓▓  ▓▓ ▓▓  ▓▓ ▓▓     ▓▓     "}
            </Text>
            <Text bold color={bronzeColor}>
              {" ▓▓▓▓▓   ▓▓  ▓▓ ▓▓▓▓▓  ▓▓ ▓▓▓ ▓▓▓▓▓  "}
            </Text>
            <Text bold color={bronzeColor}>
              {" ▓▓      ▓▓  ▓▓ ▓▓  ▓▓ ▓▓  ▓▓ ▓▓     "}
            </Text>
            <Text bold color={bronzeColor}>
              {" ▓▓       ▓▓▓▓  ▓▓  ▓▓  ▓▓▓▓▓ ▓▓▓▓▓▓ v2.1.0 🔥"}
            </Text>
          </Box>
          <Box flexDirection="column" alignItems="flex-end">
            <Box>
              <Text color="yellow" bold>[CORE: </Text>
              <Text color={coreColor} bold>{config.model.toUpperCase()}</Text>
              <Text color="yellow" bold>]</Text>
            </Box>
            <Box marginTop={1}>
              <Text color="yellow">STATUS: <Text color="green" bold>ONLINE</Text></Text>
            </Box>
            <Box marginTop={1}>
              <Text color={bronzeColor} bold>TYPE /model [name] TO SWITCH</Text>
            </Box>
          </Box>
        </Box>
        <Box marginTop={1} justifyContent="center">
          <Text color="gray">▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒</Text>
        </Box>
      </Box>

      {/* SCROLLABLE CHAT VIEWPORT (STRICT HEIGHT) */}
      <Box flexDirection="column" flexGrow={1} paddingX={2} marginTop={1} height={chatHeight} overflow="hidden">
        <Static items={visibleHistory}>
          {(msg, i) => (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Box>
                <Text color={msg.role === 'user' ? 'green' : msg.role === 'error' ? 'red' : coreColor} bold>
                  {msg.role === 'user' ? 'USER> ' : msg.role === 'error' ? 'ERROR> ' : 'FORGE> '}
                </Text>
                <Text color="white">{msg.content}</Text>
              </Box>
            </Box>
          )}
        </Static>

        {isProcessing && (
          <Box flexDirection="column" marginTop={1}>
            <Box>
              <Text color={coreColor} bold>
                <Spinner type="dots" /> FORGING RESPONSE...
              </Text>
            </Box>
            <Box marginLeft={2} marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
              <Text color="white">{currentOutput}</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* FIXED FOOTER - INPUT AREA */}
      <Box borderStyle="single" borderColor={bronzeColor} paddingX={1} flexShrink={0} height={footerHeight} marginTop={1}>
        {isSelectingModel ? (
          <Box flexDirection="column">
            <Text bold color="yellow">SELECT NEW CORE MODEL (GROQ/GEMINI/OPENAI):</Text>
            <SelectInput items={modelOptions} onSelect={handleModelSelect} />
          </Box>
        ) : (
          <Box>
            <Text color={coreColor} bold>{isPromptingKey ? 'KEY> ' : 'FORGE> '}</Text>
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder={isPromptingKey ? `Enter ${pendingProvider} API Key...` : "Awaiting instructions..."}
              mask={isPromptingKey ? "*" : undefined}
            />
          </Box>
        )}
      </Box>
      
      <Box justifyContent="center" flexShrink={0}>
        <Text color="gray">ESC: EXIT | /model [name]: SWITCH CORE | CTRL+M: MENU</Text>
      </Box>
    </Box>
  );
};

export const startREPL = (agent: AgentLoop, config: Config, onModelChange: (model: string) => void, onKeyUpdate: (provider: string, key: string) => void) => {
  render(<REPL agent={agent} config={config} onModelChange={onModelChange} onKeyUpdate={onKeyUpdate} />);
};
