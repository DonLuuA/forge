import React, { useState, useRef } from 'react';
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
}

const REPL: React.FC<Props> = ({ agent, config, onModelChange }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOutput, setCurrentOutput] = useState('');
  const [isSelectingModel, setIsSelectingModel] = useState(false);
  const { exit } = useApp();
  
  const outputRef = useRef('');

  useInput((inputStr, key) => {
    if (key.escape || (key.ctrl && inputStr === 'c')) {
      exit();
    }
    // Keep Ctrl+M as a secondary option, but /model is now primary
    if (key.ctrl && inputStr === 'm') {
      setIsSelectingModel(prev => !prev);
    }
  });

  const handleSubmit = async (value: string) => {
    if (isSelectingModel) return;
    if (!value.trim()) return;

    // Handle /model command
    if (value.startsWith('/model ')) {
      const newModel = value.split(' ')[1];
      if (newModel) {
        onModelChange(newModel);
        setHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM] Core model switched to: ${newModel}` }]);
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

  const handleModelSelect = (item: { label: string; value: string }) => {
    onModelChange(item.value);
    setIsSelectingModel(false);
    setHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM] Core model switched to: ${item.value}` }]);
  };

  const modelOptions = config.providers?.flatMap(p => 
    p.models.map(m => ({ label: `[${p.name.toUpperCase()}] ${m}`, value: m }))
  ) || [];

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header Section - TRUE FORGE AESTHETIC */}
      <Box borderStyle="double" borderColor="orange" paddingX={2} marginBottom={1} flexDirection="column">
        <Box justifyContent="space-between">
          <Text bold color="orange">
            🔥 FORGE ENGINE v1.5.0
          </Text>
          <Box>
            <Text color="yellow" bold>[CORE: </Text>
            <Text color="red" bold>{config.model.toUpperCase()}</Text>
            <Text color="yellow" bold>]</Text>
          </Box>
        </Box>
        <Box marginTop={1} justifyContent="center">
          <Text color="gray">────────────────────────────────────────────────────────────</Text>
        </Box>
        <Box marginTop={1} justifyContent="space-between">
          <Text color="yellow">STATUS: <Text color="green" bold>READY</Text></Text>
          <Text color="orange" bold>TYPE /model [name] TO SWITCH</Text>
        </Box>
      </Box>

      {/* History Section */}
      <Box flexDirection="column" marginBottom={1}>
        <Static items={history}>
          {(msg, i) => (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Box>
                <Text color={msg.role === 'user' ? 'green' : msg.role === 'error' ? 'red' : 'orange'} bold>
                  {msg.role === 'user' ? 'USER> ' : msg.role === 'error' ? 'ERROR> ' : 'FORGE> '}
                </Text>
                <Text color="white">{msg.content}</Text>
              </Box>
            </Box>
          )}
        </Static>
      </Box>

      {/* Model Selection Dropdown */}
      {isSelectingModel && (
        <Box borderStyle="round" borderColor="yellow" padding={1} marginBottom={1} flexDirection="column">
          <Text bold color="yellow">SELECT NEW CORE MODEL:</Text>
          <Box marginTop={1}>
            <SelectInput items={modelOptions} onSelect={handleModelSelect} />
          </Box>
          <Box marginTop={1}>
            <Text color="gray">Press CTRL+M again to cancel</Text>
          </Box>
        </Box>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Box marginBottom={1} flexDirection="column">
          <Box>
            <Text color="orange" bold>
              <Spinner type="dots" /> FORGING RESPONSE...
            </Text>
          </Box>
          <Box marginLeft={2} marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
            <Text color="white">{currentOutput}</Text>
          </Box>
        </Box>
      )}

      {/* Input Section */}
      {!isProcessing && !isSelectingModel && (
        <Box borderStyle="single" borderColor="orange" paddingX={1}>
          <Text color="orange" bold>{'FORGE> '}</Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Awaiting instructions... (Try /model [name])"
          />
        </Box>
      )}

      {/* Footer Section */}
      <Box marginTop={1} justifyContent="center">
        <Text color="gray">ESC: EXIT | /model [name]: SWITCH CORE | FORGE: UNIVERSAL AI ASSISTANT</Text>
      </Box>
    </Box>
  );
};

export const startREPL = (agent: AgentLoop, config: Config, onModelChange: (model: string) => void) => {
  render(<REPL agent={agent} config={config} onModelChange={onModelChange} />);
};
