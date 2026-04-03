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
  const { exit } = useApp();
  
  const outputRef = useRef('');

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
    }
  };

  const handleModelSelect = (item: { label: string; value: string }) => {
    setIsSelectingModel(false);
    handleModelSwitch(item.value);
  };

  const getFireColor = () => {
    const provider = config.providers?.find(p => p.isActive);
    switch (provider?.name) {
      case 'Ollama': return 'orange';
      case 'Gemini': return 'blue';
      case 'OpenAI': return 'green';
      default: return 'red';
    }
  };

  const fireColor = getFireColor();
  const modelOptions = config.providers?.flatMap(p => 
    p.models.map(m => ({ label: `[${p.name.toUpperCase()}] ${m}`, value: m }))
  ) || [];

  return (
    <Box flexDirection="column" height="100%">
      {/* FIXED HEADER - FORGE DASHBOARD */}
      <Box borderStyle="double" borderColor={fireColor} paddingX={2} flexDirection="column" flexShrink={0}>
        <Box justifyContent="space-between">
          <Box flexDirection="column">
            <Text bold color={fireColor}>
              {"  ______ ____  _____   _____ ______ "}
            </Text>
            <Text bold color={fireColor}>
              {" |  ____/ __ \\|  __ \\ / ____|  ____|"}
            </Text>
            <Text bold color={fireColor}>
              {" | |__ | |  | | |__) | |  __| |__   "}
            </Text>
            <Text bold color={fireColor}>
              {" |  __|| |  | |  _  /| | |_ |  __|  "}
            </Text>
            <Text bold color={fireColor}>
              {" | |   | |__| | | \\ \\| |__| | |____ "}
            </Text>
            <Text bold color={fireColor}>
              {" |_|    \\____/|_|  \\_\\\\_____|______| v1.7.0 🔥"}
            </Text>
          </Box>
          <Box flexDirection="column" alignItems="flex-end">
            <Box>
              <Text color="yellow" bold>[CORE: </Text>
              <Text color={fireColor} bold>{config.model.toUpperCase()}</Text>
              <Text color="yellow" bold>]</Text>
            </Box>
            <Box marginTop={1}>
              <Text color="yellow">STATUS: <Text color="green" bold>ONLINE</Text></Text>
            </Box>
            <Box marginTop={1}>
              <Text color={fireColor} bold>TYPE /model [name] TO SWITCH</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* SCROLLABLE CHAT AREA */}
      <Box flexDirection="column" flexGrow={1} paddingX={2} marginTop={1}>
        <Static items={history}>
          {(msg, i) => (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Box>
                <Text color={msg.role === 'user' ? 'green' : msg.role === 'error' ? 'red' : fireColor} bold>
                  {msg.role === 'user' ? 'USER> ' : msg.role === 'error' ? 'ERROR> ' : 'FORGE> '}
                </Text>
                <Text color="white">{msg.content}</Text>
              </Box>
            </Box>
          )}
        </Static>

        {/* Processing Indicator */}
        {isProcessing && (
          <Box flexDirection="column" marginTop={1}>
            <Box>
              <Text color={fireColor} bold>
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
      <Box borderStyle="single" borderColor={fireColor} paddingX={1} flexShrink={0} marginTop={1}>
        {isSelectingModel ? (
          <Box flexDirection="column">
            <Text bold color="yellow">SELECT NEW CORE MODEL:</Text>
            <SelectInput items={modelOptions} onSelect={handleModelSelect} />
          </Box>
        ) : (
          <Box>
            <Text color={fireColor} bold>{isPromptingKey ? 'KEY> ' : 'FORGE> '}</Text>
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
