import React, { useState, useRef } from 'react';
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
}

const REPL: React.FC<Props> = ({ agent, config, onModelChange }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOutput, setCurrentOutput] = useState('');
  const [isSelectingModel, setIsSelectingModel] = useState(false);
  const { exit } = useApp();
  
  // Ref to store the latest output to prevent state closure issues
  const outputRef = useRef('');

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      exit();
    }
    if (key.ctrl && input === 'm') {
      setIsSelectingModel(!isSelectingModel);
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    
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
      
      // After run completes, add the final output to history
      setHistory(prev => [...prev, { role: 'assistant', content: outputRef.current }]);
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
  };

  const modelOptions = config.providers?.flatMap(p => 
    p.models.map(m => ({ label: `${p.name}: ${m}`, value: m }))
  ) || [];

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header Section - Forge Theme */}
      <Box borderStyle="double" borderColor="orange" paddingX={2} marginBottom={1} flexDirection="column">
        <Box justifyContent="space-between">
          <Text bold color="orange">
            FORGE ENGINE v1.2.2 🔥
          </Text>
          <Text color="yellow" bold>
            [STATUS: ONLINE]
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">CORE: </Text>
          <Text color="red" bold>{config.model}</Text>
          <Text color="gray"> | </Text>
          <Text color="yellow">Ctrl+M to switch models</Text>
        </Box>
      </Box>

      {/* History Section */}
      <Box flexDirection="column" marginBottom={1}>
        {history.map((msg, i) => (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Box>
              <Text color={msg.role === 'user' ? 'green' : msg.role === 'error' ? 'red' : 'white'} bold>
                {msg.role === 'user' ? 'forge> ' : msg.role === 'error' ? 'ERROR: ' : 'ASSISTANT: '}
              </Text>
              <Text color="white">
                {msg.content}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Model Selection Dropdown */}
      {isSelectingModel && (
        <Box borderStyle="single" borderColor="yellow" padding={1} marginBottom={1} flexDirection="column">
          <Text bold color="yellow">SELECT CORE MODEL:</Text>
          <SelectInput items={modelOptions} onSelect={handleModelSelect} />
        </Box>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Box marginBottom={1} flexDirection="column">
          <Box>
            <Text color="orange">
              <Spinner type="dots" /> FORGING RESPONSE...
            </Text>
          </Box>
          <Box marginLeft={2} marginTop={1}>
            <Text color="white">{currentOutput}</Text>
          </Box>
        </Box>
      )}

      {/* Input Section */}
      {!isProcessing && !isSelectingModel && (
        <Box>
          <Text color="orange" bold>{'forge> '}</Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Enter prompt..."
          />
        </Box>
      )}

      {/* Footer Section */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">ESC/CTRL+C: EXIT | CTRL+M: SWITCH CORE | FORGE: UNIVERSAL AI ASSISTANT</Text>
      </Box>
    </Box>
  );
};

export const startREPL = (agent: AgentLoop, config: Config, onModelChange: (model: string) => void) => {
  render(<REPL agent={agent} config={config} onModelChange={onModelChange} />);
};
